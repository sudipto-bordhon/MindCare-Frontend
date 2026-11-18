import React, { useEffect, useState } from 'react';
import { CheckCircle, FileText, Pencil, Plus, RefreshCw, Trash2, Users, X } from 'lucide-react';
import type { AboutTeamMember, CrisisHelpline, Language, User } from '../../types';
import { ABOUT_TEAM_MEMBER_IDS } from '../../data/initialData';
import { INITIAL_CRISIS_HELPLINES } from '../../data/crisisHelplines';
import { SOCIAL_LINK_PLATFORMS } from '../../utils/socialLinks';
import { apiUrl } from '../../utils/api';

interface AdminSupportPanelsProps {
  currentUser: User | null;
  language: Language;
  isAboutActive: boolean;
  isCrisisActive: boolean;
}

export const AdminSupportPanels: React.FC<AdminSupportPanelsProps> = ({
  currentUser,
  language,
  isAboutActive,
  isCrisisActive,
}) => {
  const isBn = language === 'bn';
  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-admin-token': currentUser?.adminToken || '',
  };

  const [aboutTeamMembers, setAboutTeamMembers] = useState<AboutTeamMember[]>(ABOUT_TEAM_MEMBER_IDS.map(id => ({
    id, name: '', phone: '', position: '', university: '', imageUrl: '', cvUrl: '',
    socialLinks: { facebook: '', linkedin: '', instagram: '', twitter: '' },
  })));
  const [aboutTeamFiles, setAboutTeamFiles] = useState<Record<string, File | null>>({});
  const [aboutTeamCvFiles, setAboutTeamCvFiles] = useState<Record<string, File | null>>({});
  const [aboutTeamLoading, setAboutTeamLoading] = useState(false);
  const [aboutTeamSavingId, setAboutTeamSavingId] = useState<string | null>(null);
  const [aboutTeamAdding, setAboutTeamAdding] = useState(false);
  const [aboutTeamDeletingId, setAboutTeamDeletingId] = useState<string | null>(null);
  const [editingAboutTeamId, setEditingAboutTeamId] = useState<string | null>(null);
  const [aboutTeamEditingSnapshot, setAboutTeamEditingSnapshot] = useState<AboutTeamMember | null>(null);
  const [aboutTeamError, setAboutTeamError] = useState('');
  const [aboutTeamSuccessId, setAboutTeamSuccessId] = useState('');
  const [crisisHelplines, setCrisisHelplines] = useState<CrisisHelpline[]>(INITIAL_CRISIS_HELPLINES);
  const [crisisHelplinesLoading, setCrisisHelplinesLoading] = useState(false);
  const [crisisHelplinesReady, setCrisisHelplinesReady] = useState(false);
  const [crisisHelplinesSaving, setCrisisHelplinesSaving] = useState(false);
  const [editingCrisisHelplineId, setEditingCrisisHelplineId] = useState<string | null>(null);
  const [crisisHelplineEditingSnapshot, setCrisisHelplineEditingSnapshot] = useState<CrisisHelpline | null>(null);
  const [crisisHelplinesError, setCrisisHelplinesError] = useState('');
  const [crisisHelplinesSaved, setCrisisHelplinesSaved] = useState(false);

  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') return;
    const controller = new AbortController();
    const loadAboutTeam = async () => {
      setAboutTeamLoading(true);
      try {
        const response = await fetch(apiUrl('/api/admin/about-team'), {
          headers: adminHeaders,
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load About profiles.');
        const savedMembers = Array.isArray(data.members) ? data.members as AboutTeamMember[] : [];
        setAboutTeamMembers(savedMembers);
        setAboutTeamError('');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setAboutTeamError(error instanceof Error
          ? error.message
          : (isBn ? 'About-এর তথ্য লোড করা যায়নি।' : 'Unable to load About profiles.'));
      } finally {
        if (!controller.signal.aborted) setAboutTeamLoading(false);
      }
    };

    void loadAboutTeam();
    return () => controller.abort();
  }, [currentUser?.role, currentUser?.adminToken, isBn]);

  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') return;
    const controller = new AbortController();
    const loadCrisisHelplines = async () => {
      setCrisisHelplinesReady(false);
      setCrisisHelplinesLoading(true);
      try {
        const response = await fetch(apiUrl('/api/admin/crisis-helplines'), {
          headers: adminHeaders,
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load crisis helplines.');
        if (!Array.isArray(data.helplines)) throw new Error('The crisis helpline response was invalid.');
        setCrisisHelplines(data.helplines as CrisisHelpline[]);
        setCrisisHelplinesReady(true);
        setCrisisHelplinesError('');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setCrisisHelplinesError(error instanceof Error
          ? error.message
          : (isBn ? 'জরুরি হেল্পলাইন লোড করা যায়নি।' : 'Unable to load crisis helplines.'));
      } finally {
        if (!controller.signal.aborted) setCrisisHelplinesLoading(false);
      }
    };

    void loadCrisisHelplines();
    return () => controller.abort();
  }, [currentUser?.role, currentUser?.adminToken, isBn]);

  const updateCrisisHelpline = (id: string, field: keyof Omit<CrisisHelpline, 'id'>, value: string) => {
    setCrisisHelplines(previous => previous.map(item => item.id === id ? { ...item, [field]: value } : item));
    setCrisisHelplinesError('');
    setCrisisHelplinesSaved(false);
  };

  const addCrisisHelpline = () => {
    if (editingCrisisHelplineId) return;
    if (crisisHelplines.length >= 50) {
      setCrisisHelplinesError(isBn ? 'সর্বোচ্চ ৫০টি হেল্পলাইন যোগ করা যাবে।' : 'You can add up to 50 helplines.');
      return;
    }
    const newHelpline: CrisisHelpline = {
      id: `helpline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      nameEn: '',
      nameBn: '',
      descriptionEn: '',
      descriptionBn: '',
      phone: '',
    };
    setCrisisHelplines(previous => [...previous, newHelpline]);
    setEditingCrisisHelplineId(newHelpline.id);
    setCrisisHelplineEditingSnapshot(null);
    setCrisisHelplinesError('');
    setCrisisHelplinesSaved(false);
  };

  const startCrisisHelplineEdit = (helpline: CrisisHelpline) => {
    if (editingCrisisHelplineId) return;
    setEditingCrisisHelplineId(helpline.id);
    setCrisisHelplineEditingSnapshot({ ...helpline });
    setCrisisHelplinesError('');
    setCrisisHelplinesSaved(false);
  };

  const cancelCrisisHelplineEdit = (id: string) => {
    if (crisisHelplineEditingSnapshot) {
      setCrisisHelplines(previous => previous.map(item => (
        item.id === id ? crisisHelplineEditingSnapshot : item
      )));
    } else {
      setCrisisHelplines(previous => previous.filter(item => item.id !== id));
    }
    setEditingCrisisHelplineId(null);
    setCrisisHelplineEditingSnapshot(null);
  };

  const deleteCrisisHelpline = (id: string) => {
    setCrisisHelplines(previous => previous.filter(item => item.id !== id));
    if (editingCrisisHelplineId === id) {
      setEditingCrisisHelplineId(null);
      setCrisisHelplineEditingSnapshot(null);
    }
    setCrisisHelplinesError('');
    setCrisisHelplinesSaved(false);
  };

  const saveCrisisHelplines = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!crisisHelplinesReady) return;
    if (crisisHelplines.length === 0) {
      setCrisisHelplinesError(isBn
        ? 'কমপক্ষে একটি হেল্পলাইন রাখতে হবে।'
        : 'Keep at least one crisis helpline available.');
      return;
    }
    setCrisisHelplinesSaving(true);
    setCrisisHelplinesError('');
    setCrisisHelplinesSaved(false);
    try {
      const response = await fetch(apiUrl('/api/admin/crisis-helplines'), {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({ helplines: crisisHelplines }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save crisis helplines.');
      setCrisisHelplines(data.helplines as CrisisHelpline[]);
      setEditingCrisisHelplineId(null);
      setCrisisHelplineEditingSnapshot(null);
      setCrisisHelplinesSaved(true);
    } catch (error) {
      setCrisisHelplinesError(error instanceof Error
        ? error.message
        : (isBn ? 'হেল্পলাইন সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' : 'Unable to save helplines. Please try again.'));
    } finally {
      setCrisisHelplinesSaving(false);
    }
  };

  const startAboutTeamEdit = (member: AboutTeamMember) => {
    setAboutTeamEditingSnapshot(member);
    setEditingAboutTeamId(member.id);
    setAboutTeamFiles(previous => ({ ...previous, [member.id]: null }));
    setAboutTeamCvFiles(previous => ({ ...previous, [member.id]: null }));
    setAboutTeamError('');
    setAboutTeamSuccessId('');
    const fileInput = document.getElementById(`about-team-image-${member.id}`);
    if (fileInput instanceof HTMLInputElement) fileInput.value = '';
    const cvInput = document.getElementById(`about-team-cv-${member.id}`);
    if (cvInput instanceof HTMLInputElement) cvInput.value = '';
  };

  const cancelAboutTeamEdit = (memberId: string) => {
    if (aboutTeamEditingSnapshot?.id === memberId) {
      setAboutTeamMembers(previous => previous.map(member => (
        member.id === memberId ? aboutTeamEditingSnapshot : member
      )));
    }
    setAboutTeamFiles(previous => ({ ...previous, [memberId]: null }));
    setAboutTeamCvFiles(previous => ({ ...previous, [memberId]: null }));
    setAboutTeamEditingSnapshot(null);
    setEditingAboutTeamId(null);
    const fileInput = document.getElementById(`about-team-image-${memberId}`);
    if (fileInput instanceof HTMLInputElement) fileInput.value = '';
    const cvInput = document.getElementById(`about-team-cv-${memberId}`);
    if (cvInput instanceof HTMLInputElement) cvInput.value = '';
  };

  const handleSaveAboutTeamMember = async (event: React.FormEvent, memberId: string) => {
    event.preventDefault();
    if (editingAboutTeamId !== memberId) return;
    const member = aboutTeamMembers.find(item => item.id === memberId);
    if (!member) return;
    setAboutTeamError('');
    setAboutTeamSuccessId('');

    const name = member.name.trim();
    const phone = member.phone.trim();
    const file = aboutTeamFiles[memberId] || null;
    const cvFile = aboutTeamCvFiles[memberId] || null;

    let imageContentType = '';
    if (file) {
      const extension = file.name.split('.').pop()?.toLowerCase() || '';
      const extensionTypes: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        webp: 'image/webp',
      };
      imageContentType = file.type || extensionTypes[extension] || '';
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(imageContentType)) {
        setAboutTeamError(isBn
          ? 'JPG, PNG অথবা WebP ছবি বেছে নিন।'
          : 'Choose a JPG, PNG, or WebP image.');
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setAboutTeamError(isBn ? 'ছবির আকার সর্বোচ্চ ২ MB হতে পারবে।' : 'Profile images must be 2 MB or smaller.');
        return;
      }
    }
    if (cvFile) {
      if (cvFile.type && cvFile.type !== 'application/pdf') {
        setAboutTeamError(isBn ? 'একটি PDF CV ফাইল বেছে নিন।' : 'Choose a PDF CV file.');
        return;
      }
      if (!cvFile.name.toLowerCase().endsWith('.pdf')) {
        setAboutTeamError(isBn ? 'CV ফাইলের ধরন PDF হতে হবে।' : 'The CV file must be a PDF.');
        return;
      }
      if (cvFile.size > 10 * 1024 * 1024) {
        setAboutTeamError(isBn ? 'CV ফাইল সর্বোচ্চ ১০ MB হতে পারবে।' : 'CV files must be 10 MB or smaller.');
        return;
      }
    }

    setAboutTeamSavingId(memberId);
    try {
      let imageBase64: string | undefined;
      let cvBase64: string | undefined;
      if (file) {
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Unable to read the selected image.'));
          reader.onerror = () => reject(new Error('Unable to read the selected image.'));
          reader.readAsDataURL(file);
        });
        imageBase64 = imageDataUrl.split(',')[1];
        if (!imageBase64) throw new Error('The selected image is invalid.');
      }
      if (cvFile) {
        const cvDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => typeof reader.result === 'string'
            ? resolve(reader.result)
            : reject(new Error('Unable to read the selected CV.'));
          reader.onerror = () => reject(new Error('Unable to read the selected CV.'));
          reader.readAsDataURL(cvFile);
        });
        cvBase64 = cvDataUrl.split(',')[1];
        if (!cvBase64) throw new Error('The selected CV is invalid.');
      }

      const response = await fetch(apiUrl('/api/admin/about-team'), {
        method: 'PUT',
        headers: adminHeaders,
        body: JSON.stringify({
          id: memberId,
          name,
          phone,
          position: member.position.trim(),
          university: member.university.trim(),
          socialLinks: member.socialLinks,
          ...(file ? { imageContentType, imageBase64 } : {}),
          ...(cvFile ? { cvContentType: 'application/pdf', cvFileName: cvFile.name, cvBase64 } : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save the profile.');
      setAboutTeamMembers(previous => previous.map(item => item.id === memberId ? data.member as AboutTeamMember : item));
      setAboutTeamFiles(previous => ({ ...previous, [memberId]: null }));
      setAboutTeamCvFiles(previous => ({ ...previous, [memberId]: null }));
      setAboutTeamSuccessId(memberId);
      setEditingAboutTeamId(null);
      setAboutTeamEditingSnapshot(null);
      const fileInput = document.getElementById(`about-team-image-${memberId}`);
      if (fileInput instanceof HTMLInputElement) fileInput.value = '';
      const cvInput = document.getElementById(`about-team-cv-${memberId}`);
      if (cvInput instanceof HTMLInputElement) cvInput.value = '';
    } catch (error) {
      setAboutTeamError(error instanceof Error
        ? error.message
        : (isBn ? 'প্রোফাইল সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।' : 'The profile could not be saved. Please try again.'));
    } finally {
      setAboutTeamSavingId(null);
    }
  };

  const handleAddAboutTeamMember = async () => {
    setAboutTeamError('');
    setAboutTeamAdding(true);
    try {
      const response = await fetch(apiUrl('/api/admin/about-team'), {
        method: 'POST',
        headers: adminHeaders,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to add a team card.');
      setAboutTeamMembers(previous => [...previous, data.member as AboutTeamMember]);
      setAboutTeamEditingSnapshot(data.member as AboutTeamMember);
      setEditingAboutTeamId((data.member as AboutTeamMember).id);
    } catch (error) {
      setAboutTeamError(error instanceof Error
        ? error.message
        : (isBn ? 'নতুন কার্ড যোগ করা যায়নি। আবার চেষ্টা করুন।' : 'The new card could not be added. Please try again.'));
    } finally {
      setAboutTeamAdding(false);
    }
  };

  const handleDeleteAboutTeamMember = async (memberId: string) => {
    const member = aboutTeamMembers.find(item => item.id === memberId);
    if (!member || !window.confirm(isBn
      ? `${member.name || 'এই'} কার্ডটি মুছে ফেলবেন?`
      : `Delete the ${member.name || 'selected'} profile card?`)) return;

    setAboutTeamError('');
    setAboutTeamDeletingId(memberId);
    try {
      const response = await fetch(apiUrl('/api/admin/about-team'), {
        method: 'DELETE',
        headers: adminHeaders,
        body: JSON.stringify({ id: memberId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to delete the team card.');
      setAboutTeamMembers(previous => previous.filter(item => item.id !== memberId));
      setAboutTeamFiles(previous => {
        const remaining = { ...previous };
        delete remaining[memberId];
        return remaining;
      });
      setAboutTeamCvFiles(previous => {
        const remaining = { ...previous };
        delete remaining[memberId];
        return remaining;
      });
      if (aboutTeamSuccessId === memberId) setAboutTeamSuccessId('');
      if (editingAboutTeamId === memberId) {
        setEditingAboutTeamId(null);
        setAboutTeamEditingSnapshot(null);
      }
    } catch (error) {
      setAboutTeamError(error instanceof Error
        ? error.message
        : (isBn ? 'কার্ডটি মুছে ফেলা যায়নি। আবার চেষ্টা করুন।' : 'The card could not be deleted. Please try again.'));
    } finally {
      setAboutTeamDeletingId(null);
    }
  };

    return (
    <>
      {isCrisisActive && (
        <form onSubmit={event => void saveCrisisHelplines(event)} className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-rose-700 dark:text-rose-400">
                {isBn ? 'Crisis Support বোতাম' : 'Crisis Support button'}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isBn ? 'জরুরি হেল্পলাইন পরিচালনা' : 'Manage crisis helplines'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'নাম, ফোন নম্বর ও বর্ণনা বদলান, নতুন হেল্পলাইন যোগ করুন বা মুছুন। পরিবর্তনগুলো Crisis Support-এর “Bangladesh Crisis & Emergency Helplines” অংশে দেখা যাবে। অন্তত একটি হেল্পলাইন রাখতে হবে।'
                  : 'Edit names, phone numbers, and descriptions; add or remove contacts. Changes appear in the Crisis Support “Bangladesh Crisis & Emergency Helplines” section. Keep at least one helpline available.'}
              </p>
            </div>
            <button
              type="button"
              onClick={addCrisisHelpline}
              disabled={!crisisHelplinesReady || crisisHelplinesLoading || crisisHelplinesSaving || Boolean(editingCrisisHelplineId) || crisisHelplines.length >= 50}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-rose-600 dark:hover:bg-rose-500"
            >
              <Plus className="h-4 w-4" />
              {isBn ? 'নতুন হেল্পলাইন যোগ করুন' : 'Add a helpline'}
            </button>
          </div>

          {crisisHelplinesError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
              {crisisHelplinesError}
            </p>
          )}
          {crisisHelplinesSaved && (
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
              {isBn ? 'হেল্পলাইনগুলো সংরক্ষণ করা হয়েছে।' : 'Crisis helplines have been saved.'}
            </p>
          )}
          {crisisHelplinesLoading && (
            <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
              {isBn ? 'হেল্পলাইন লোড হচ্ছে...' : 'Loading helplines...'}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {crisisHelplines.map((helpline, index) => {
              const isEditing = editingCrisisHelplineId === helpline.id;
              return (
              <article key={helpline.id} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {isBn ? `হেল্পলাইন ${index + 1}` : `Helpline ${index + 1}`}
                  </h3>
                  <div className="flex items-center gap-1">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => cancelCrisisHelplineEdit(helpline.id)}
                        disabled={crisisHelplinesSaving}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        <X className="h-4 w-4" />
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startCrisisHelplineEdit(helpline)}
                        disabled={!crisisHelplinesReady || Boolean(editingCrisisHelplineId) || crisisHelplinesSaving || crisisHelplinesLoading}
                        aria-label={isBn ? `হেল্পলাইন ${index + 1} সম্পাদনা করুন` : `Edit helpline ${index + 1}`}
                        className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                      >
                        <Pencil className="h-4 w-4" />
                        {isBn ? 'সম্পাদনা' : 'Edit'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteCrisisHelpline(helpline.id)}
                      disabled={!crisisHelplinesReady || crisisHelplinesSaving || crisisHelplinesLoading}
                      aria-label={isBn ? `হেল্পলাইন ${index + 1} মুছুন` : `Delete helpline ${index + 1}`}
                      className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="h-4 w-4" />
                      {isBn ? 'মুছুন' : 'Delete'}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'নাম (English)' : 'Name (English)'}</span>
                    <input
                      maxLength={120}
                      value={helpline.nameEn}
                      disabled={!isEditing || !crisisHelplinesReady || crisisHelplinesSaving || crisisHelplinesLoading}
                      onChange={event => updateCrisisHelpline(helpline.id, 'nameEn', event.target.value)}
                      className="admin-input w-full bg-white dark:bg-slate-800"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'নাম (বাংলা)' : 'Name (Bangla)'}</span>
                    <input
                      maxLength={120}
                      value={helpline.nameBn}
                      disabled={!isEditing || !crisisHelplinesReady || crisisHelplinesSaving || crisisHelplinesLoading}
                      onChange={event => updateCrisisHelpline(helpline.id, 'nameBn', event.target.value)}
                      className="admin-input w-full bg-white dark:bg-slate-800"
                      lang="bn"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'বর্ণনা (English)' : 'Description (English)'}</span>
                    <textarea
                      maxLength={240}
                      rows={2}
                      value={helpline.descriptionEn}
                      disabled={!isEditing || !crisisHelplinesReady || crisisHelplinesSaving || crisisHelplinesLoading}
                      onChange={event => updateCrisisHelpline(helpline.id, 'descriptionEn', event.target.value)}
                      className="admin-input w-full resize-y bg-white dark:bg-slate-800"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'বর্ণনা (বাংলা)' : 'Description (Bangla)'}</span>
                    <textarea
                      maxLength={240}
                      rows={2}
                      value={helpline.descriptionBn}
                      disabled={!isEditing || !crisisHelplinesReady || crisisHelplinesSaving || crisisHelplinesLoading}
                      onChange={event => updateCrisisHelpline(helpline.id, 'descriptionBn', event.target.value)}
                      className="admin-input w-full resize-y bg-white dark:bg-slate-800"
                      lang="bn"
                    />
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'ফোন নম্বর' : 'Phone number'}</span>
                  <input
                    type="tel"
                    required
                    maxLength={30}
                    value={helpline.phone}
                    disabled={!isEditing || !crisisHelplinesReady || crisisHelplinesSaving || crisisHelplinesLoading}
                    onChange={event => updateCrisisHelpline(helpline.id, 'phone', event.target.value)}
                    className="admin-input w-full bg-white dark:bg-slate-800"
                    placeholder="+880 1XXX-XXXXXX"
                    dir="ltr"
                  />
                </label>
              </article>
              );
            })}
            {crisisHelplines.length === 0 && !crisisHelplinesLoading && (
              <p className="col-span-full rounded-2xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {isBn ? 'সংরক্ষণের জন্য অন্তত একটি হেল্পলাইন যোগ করুন।' : 'Add at least one helpline before saving.'}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={!crisisHelplinesReady || crisisHelplinesLoading || crisisHelplinesSaving || crisisHelplines.length === 0}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-rose-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-wait disabled:opacity-60 dark:bg-rose-600 dark:hover:bg-rose-500"
          >
            {crisisHelplinesSaving && <RefreshCw className="h-4 w-4 animate-spin" />}
            {crisisHelplinesSaving
              ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
              : (isBn ? 'সব পরিবর্তন সংরক্ষণ করুন' : 'Save all changes')}
          </button>
        </form>
      )}

      {isAboutActive && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">
                {isBn ? 'পাবলিক About পেজ' : 'Public About page'}
              </p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {isBn ? 'টিম কার্ড পরিচালনা' : 'Manage team cards'}
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {isBn
                  ? 'ছবি, নাম, ফোন, পদবি, বিশ্ববিদ্যালয় ও Facebook, LinkedIn, Instagram, Twitter-এর লিংক—সব তথ্য ঐচ্ছিক। সংরক্ষিত তথ্য About পেজে প্রকাশিত হবে।'
                  : 'Picture, name, phone, position, university, and Facebook, LinkedIn, Instagram, and Twitter links are optional. Saved profiles appear on the public About page.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleAddAboutTeamMember()}
              disabled={aboutTeamAdding || aboutTeamLoading || editingAboutTeamId !== null || aboutTeamSavingId !== null}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {aboutTeamAdding ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {aboutTeamAdding
                ? (isBn ? 'যোগ হচ্ছে...' : 'Adding...')
                : (isBn ? 'আরও কার্ড যোগ করুন' : 'Add another card')}
            </button>
          </div>

          {aboutTeamError && (
            <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
              {aboutTeamError}
            </p>
          )}

          {aboutTeamLoading && (
            <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
              {isBn ? 'টিমের প্রোফাইল লোড হচ্ছে...' : 'Loading team profiles...'}
            </p>
          )}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {aboutTeamMembers.map((member, index) => {
              const isEditing = editingAboutTeamId === member.id;
              return (
              <form key={member.id} onSubmit={event => void handleSaveAboutTeamMember(event, member.id)} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-center justify-end gap-3">
                  <div className="flex items-center gap-2">
                    {aboutTeamSuccessId === member.id && (
                      <span role="status" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        <CheckCircle className="h-4 w-4" />
                        {isBn ? 'সংরক্ষিত' : 'Saved'}
                      </span>
                    )}
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => cancelAboutTeamEdit(member.id)}
                        disabled={aboutTeamSavingId === member.id}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startAboutTeamEdit(member)}
                        disabled={editingAboutTeamId !== null || aboutTeamSavingId !== null || aboutTeamDeletingId !== null}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-indigo-700 transition hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {isBn ? 'সম্পাদনা' : 'Edit'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDeleteAboutTeamMember(member.id)}
                      disabled={aboutTeamDeletingId === member.id || aboutTeamSavingId === member.id || (isEditing && aboutTeamSavingId !== null)}
                      aria-label={isBn ? `${member.name || `সদস্য ${index + 1}`} কার্ড মুছুন` : `Delete ${member.name || `team member ${index + 1}`} card`}
                      className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600 disabled:cursor-wait disabled:opacity-50 dark:hover:bg-rose-950/40"
                    >
                      {aboutTeamDeletingId === member.id
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {member.imageUrl ? (
                    <img src={apiUrl(member.imageUrl)} alt="" className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-emerald-100 dark:ring-slate-600" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700" aria-hidden="true">
                      <Users className="h-6 w-6" />
                    </div>
                  )}
                  <label className="min-w-0 flex-1 space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isBn ? 'ছবি' : 'Picture'} <span className="font-normal text-slate-400">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                    </span>
                    <input
                      id={`about-team-image-${member.id}`}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={event => {
                        setAboutTeamFiles(previous => ({ ...previous, [member.id]: event.target.files?.[0] || null }));
                        setAboutTeamError('');
                        setAboutTeamSuccessId('');
                      }}
                      disabled={!isEditing}
                      className="block w-full min-w-0 cursor-pointer text-xs text-slate-500 file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-50 file:px-2.5 file:py-2 file:text-[10px] file:font-semibold file:text-emerald-700 dark:file:bg-emerald-950/50 dark:file:text-emerald-300"
                    />
                    {aboutTeamFiles[member.id] && (
                      <span className="block truncate text-[10px] text-slate-500">{aboutTeamFiles[member.id]?.name}</span>
                    )}
                    <span className="block text-[10px] text-slate-400">{isBn ? 'ঐচ্ছিক • JPG, PNG, WebP • সর্বোচ্চ ২ MB' : 'Optional • JPG, PNG, WebP • 2 MB max'}</span>
                  </label>
                </div>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isBn ? 'নাম' : 'Name'} <span className="font-normal text-slate-400">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </span>
                  <input
                    maxLength={100}
                    value={member.name}
                    disabled={!isEditing}
                    onChange={event => {
                      setAboutTeamMembers(previous => previous.map(item => item.id === member.id ? { ...item, name: event.target.value } : item));
                      setAboutTeamSuccessId('');
                    }}
                    className="admin-input w-full bg-white dark:bg-slate-800"
                    placeholder={isBn ? 'পুরো নাম' : 'Full name'}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isBn ? 'ফোন নম্বর' : 'Phone number'} <span className="font-normal text-slate-400">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </span>
                  <input
                    type="tel"
                    maxLength={30}
                    value={member.phone}
                    disabled={!isEditing}
                    onChange={event => {
                      setAboutTeamMembers(previous => previous.map(item => item.id === member.id ? { ...item, phone: event.target.value } : item));
                      setAboutTeamSuccessId('');
                    }}
                    className="admin-input w-full bg-white dark:bg-slate-800"
                    placeholder="+880 1XXX-XXXXXX"
                    dir="ltr"
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {member.id === 'member-3'
                      ? (isBn ? 'স্যারের পদবি' : 'Sir’s position')
                      : (isBn ? 'কাজের পদ' : 'Work position')}
                    {' '}
                    <span className="font-normal text-slate-400">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </span>
                  <input
                    maxLength={100}
                    value={member.position}
                    disabled={!isEditing}
                    onChange={event => {
                      setAboutTeamMembers(previous => previous.map(item => item.id === member.id ? { ...item, position: event.target.value } : item));
                      setAboutTeamSuccessId('');
                    }}
                    className="admin-input w-full bg-white dark:bg-slate-800"
                    placeholder={member.id === 'member-3'
                      ? (isBn ? 'যেমন: অধ্যাপক / উপদেষ্টা' : 'e.g. Professor / Advisor')
                      : (isBn ? 'যেমন: Frontend Developer' : 'e.g. Frontend Developer')}
                  />
                </label>

                <label className="block space-y-1.5">
                  <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'বিশ্ববিদ্যালয়' : 'University'} <span className="font-normal text-slate-400">({isBn ? 'ঐচ্ছিক' : 'optional'})</span></span>
                  <input
                    maxLength={120}
                    value={member.university}
                    disabled={!isEditing}
                    onChange={event => {
                      setAboutTeamMembers(previous => previous.map(item => item.id === member.id ? { ...item, university: event.target.value } : item));
                      setAboutTeamSuccessId('');
                    }}
                    className="admin-input w-full bg-white dark:bg-slate-800"
                    placeholder={isBn ? 'বিশ্ববিদ্যালয়ের নাম' : 'University name'}
                  />
                </label>

                <fieldset className="space-y-3">
                  <legend className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {isBn ? 'সামাজিক যোগাযোগের লিংক' : 'Social account links'}
                    <span className="ml-1 font-normal text-slate-400">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                  </legend>
                  {SOCIAL_LINK_PLATFORMS.map(platform => (
                    <label key={platform} className="block space-y-1.5">
                      <span className="block text-xs font-medium capitalize text-slate-600 dark:text-slate-400">
                        {platform === 'linkedin' ? 'LinkedIn' : platform === 'twitter' ? 'Twitter' : platform[0].toUpperCase() + platform.slice(1)}
                      </span>
                      <input
                        type="url"
                        maxLength={500}
                        value={member.socialLinks?.[platform] || ''}
                        disabled={!isEditing}
                        onChange={event => {
                          setAboutTeamMembers(previous => previous.map(item => item.id === member.id
                            ? { ...item, socialLinks: { ...item.socialLinks, [platform]: event.target.value } }
                            : item));
                          setAboutTeamSuccessId('');
                        }}
                        className="admin-input w-full bg-white dark:bg-slate-800"
                        placeholder={`https://${platform === 'twitter' ? 'x.com' : platform + '.com'}/username`}
                        dir="ltr"
                      />
                    </label>
                  ))}
                </fieldset>

                {isEditing && (
                  <label className="block space-y-2 rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-700">
                    <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isBn ? 'CV (PDF)' : 'CV (PDF)'} <span className="font-normal text-slate-400">({isBn ? 'ঐচ্ছিক' : 'optional'})</span>
                    </span>
                    {member.cvUrl && (
                      <a
                        href={apiUrl(member.cvUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                      >
                        <FileText className="h-4 w-4" />
                        {isBn ? 'বর্তমান CV দেখুন' : 'View current CV'}
                      </a>
                    )}
                    <input
                      id={`about-team-cv-${member.id}`}
                      type="file"
                      accept="application/pdf,.pdf"
                      onChange={event => {
                        setAboutTeamCvFiles(previous => ({ ...previous, [member.id]: event.target.files?.[0] || null }));
                        setAboutTeamError('');
                        setAboutTeamSuccessId('');
                      }}
                      disabled={!isEditing}
                      className="block w-full cursor-pointer text-xs text-slate-500 file:mr-2 file:cursor-pointer file:rounded-lg file:border-0 file:bg-emerald-50 file:px-2.5 file:py-2 file:text-[10px] file:font-semibold file:text-emerald-700 dark:file:bg-emerald-950/50 dark:file:text-emerald-300"
                    />
                    {aboutTeamCvFiles[member.id] && (
                      <span className="block truncate text-[10px] text-slate-500">{aboutTeamCvFiles[member.id]?.name}</span>
                    )}
                    <span className="block text-[10px] text-slate-400">
                      {isBn ? 'ঐচ্ছিক • PDF • সর্বোচ্চ ১০ MB; নতুন ফাইল দিলে বর্তমান CV বদলে যাবে।' : 'Optional • PDF • 10 MB max; uploading a new file replaces the current CV.'}
                    </span>
                  </label>
                )}

                {isEditing && (
                  <button
                    type="submit"
                    disabled={aboutTeamLoading || aboutTeamSavingId === member.id || aboutTeamDeletingId === member.id}
                    aria-busy={aboutTeamSavingId === member.id}
                    className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-wait disabled:opacity-60 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                  >
                    {aboutTeamSavingId === member.id && <RefreshCw className="h-4 w-4 animate-spin" />}
                    {aboutTeamSavingId === member.id
                      ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                      : (isBn ? 'প্রোফাইল সংরক্ষণ' : 'Save profile')}
                  </button>
                )}
              </form>
              );
            })}
          </div>
        </div>
      )}

    </>
  );
};
