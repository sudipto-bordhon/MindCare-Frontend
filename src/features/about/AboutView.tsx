import React, { useEffect, useState } from 'react';
import { Download, GraduationCap, Link2, Phone, UserRound } from 'lucide-react';
import { ABOUT_TEAM_MEMBER_IDS } from '../../data/initialData';
import { AboutTeamMember, Language } from '../../types';
import { SOCIAL_LINK_PLATFORMS } from '../../utils/socialLinks';
import { apiUrl } from '../../utils/api';

interface AboutViewProps {
  language: Language;
}

const EMPTY_TEAM_MEMBERS: AboutTeamMember[] = ABOUT_TEAM_MEMBER_IDS.map(id => ({
  id,
  name: '',
  phone: '',
  position: '',
  university: '',
  imageUrl: '',
  cvUrl: '',
  socialLinks: { facebook: '', linkedin: '', instagram: '', twitter: '' },
}));

const SOCIAL_LINK_LABELS = {
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  twitter: 'Twitter',
} as const;

export const AboutView: React.FC<AboutViewProps> = ({ language }) => {
  const isBn = language === 'bn';
  const [members, setMembers] = useState<AboutTeamMember[]>(EMPTY_TEAM_MEMBERS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    const loadMembers = async () => {
      try {
        const response = await fetch(apiUrl('/api/about/team'), { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load About profiles.');
        const savedMembers = Array.isArray(data.members) ? data.members as AboutTeamMember[] : [];
        setMembers(savedMembers);
        setLoadError('');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(isBn
          ? 'About-এর তথ্য লোড করা যায়নি। পরে আবার চেষ্টা করুন।'
          : 'About profiles could not be loaded. Please try again later.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadMembers();
    return () => controller.abort();
  }, [isBn]);

  return (
    <div className="mx-auto max-w-6xl space-y-9 pb-12">
      <header className="mx-auto max-w-2xl pb-1 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-400">
          MindCare
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          {isBn ? 'আমাদের সম্পর্কে' : 'About us'}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {isBn
            ? 'আমাদের টিমের সঙ্গে পরিচিত হোন—মানসিক সুস্থতার সহায়ক অভিজ্ঞতা ও সেবায় যারা কাজ করছেন।'
            : 'Meet the people behind MindCare and the experience and care they bring to mental wellness.'}
        </p>
        <div className="mx-auto mt-5 h-1 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" aria-hidden="true" />
      </header>

      {loadError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {loadError}
        </p>
      )}

      <section aria-label={isBn ? 'MindCare টিমের সদস্য' : 'MindCare team members'} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {members.length === 0 && !loading && (
          <p className="col-span-full rounded-2xl border border-dashed border-slate-300 py-12 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isBn ? 'বর্তমানে কোনো টিম প্রোফাইল প্রকাশিত নেই।' : 'There are no team profiles to show right now.'}
          </p>
        )}
        {members.map((member, index) => {
          const hasProfile = Boolean(member.name || member.phone || member.position || member.university || member.imageUrl
            || member.cvUrl || SOCIAL_LINK_PLATFORMS.some(platform => member.socialLinks?.[platform]));
          return (
            <article key={member.id} className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/10 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-emerald-800">
              <div className="relative h-24 bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-700">
                <div className="absolute -right-7 -top-10 h-28 w-28 rounded-full border border-white/20" aria-hidden="true" />
                <div className="absolute -bottom-12 -left-5 h-24 w-24 rounded-full border border-white/20" aria-hidden="true" />
                <div className="absolute left-1/2 top-6 flex h-36 w-32 -translate-x-1/2 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-emerald-50 shadow-lg dark:border-slate-800 dark:bg-slate-700">
                  {member.imageUrl ? (
                    <img
                      src={apiUrl(member.imageUrl)}
                      alt={member.name || (member.id === 'member-3' ? 'Honorable Sir' : `Team member ${index + 1}`)}
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <UserRound className="h-14 w-14 text-emerald-700 dark:text-emerald-300" aria-hidden="true" />
                  )}
                </div>
              </div>
              <div className="flex flex-1 flex-col items-center px-6 pb-6 pt-20 text-center">
                <h2 className="max-w-full break-words text-xl font-bold leading-snug text-slate-900 dark:text-white">
                  {member.name || (member.id === 'member-3'
                    ? (isBn ? 'সম্মানিত স্যার' : 'Honorable Sir')
                    : (isBn ? `টিম সদস্য ${index + 1}` : `Team member ${index + 1}`))}
                </h2>
                {member.position ? (
                  <p className="mt-2 max-w-full break-words rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold leading-relaxed text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">{member.position}</p>
                ) : !hasProfile && (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {isBn ? 'প্রোফাইল শিগগির যোগ করা হবে' : 'Profile details coming soon'}
                  </p>
                )}
                {member.university && (
                  <div className="mt-5 flex w-full items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-left dark:border-slate-700 dark:bg-slate-700/40">
                    <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
                    <span className="break-words text-sm leading-5 text-slate-700 dark:text-slate-200">{member.university}</span>
                  </div>
                )}
                {SOCIAL_LINK_PLATFORMS.some(platform => member.socialLinks?.[platform]) && (
                  <nav aria-label={isBn ? `${member.name || 'টিম সদস্য'}-এর সামাজিক যোগাযোগ` : `${member.name || 'Team member'} social links`} className="mt-5 flex flex-wrap justify-center gap-2">
                    {SOCIAL_LINK_PLATFORMS.map(platform => member.socialLinks?.[platform] && (
                      <a
                        key={platform}
                        href={member.socialLinks[platform]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={SOCIAL_LINK_LABELS[platform]}
                        title={SOCIAL_LINK_LABELS[platform]}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-emerald-800 dark:hover:bg-slate-700 dark:hover:text-emerald-300"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        {SOCIAL_LINK_LABELS[platform]}
                      </a>
                    ))}
                  </nav>
                )}
                {(member.cvUrl || member.phone) && (
                  <div className="mt-auto flex w-full flex-col gap-2 pt-6 sm:flex-row">
                    {member.cvUrl && (
                      <a
                        href={apiUrl(member.cvUrl)}
                        download
                        className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      >
                        <Download className="h-4 w-4" />
                        {isBn ? 'CV ডাউনলোড' : 'Download CV'}
                      </a>
                    )}
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 dark:border-slate-600 dark:text-slate-200 dark:hover:border-emerald-800 dark:hover:bg-slate-700 dark:hover:text-emerald-300">
                        <Phone className="h-4 w-4" />
                        {isBn ? 'যোগাযোগ' : 'Contact'}
                      </a>
                    )}
                  </div>
                )}
                {loading && !hasProfile && (
                  <p className="mt-4 text-xs text-slate-400">{isBn ? 'লোড হচ্ছে...' : 'Loading...'}</p>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
};
