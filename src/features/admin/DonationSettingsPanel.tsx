import React, { useEffect, useState } from 'react';
import { CheckCircle, Clock, Heart, RefreshCw } from 'lucide-react';
import type { Language, User } from '../../types';
import { apiUrl } from '../../utils/api';

interface DonationSettingsPanelProps {
  currentUser: User | null;
  language: Language;
  isActive: boolean;
}

interface DonationSettingsChange {
  adminId: string;
  adminName: string;
  adminEmail: string;
  previousBkashNumber: string;
  bkashNumber: string;
  previousEnabled: boolean;
  enabled: boolean;
  changedAt: string;
}

function isDonationSettingsChange(value: unknown): value is DonationSettingsChange {
  if (typeof value !== 'object' || value === null) return false;
  const change = value as Record<string, unknown>;
  return typeof change.adminId === 'string'
    && typeof change.adminName === 'string'
    && typeof change.adminEmail === 'string'
    && typeof change.previousBkashNumber === 'string'
    && typeof change.bkashNumber === 'string'
    && typeof change.previousEnabled === 'boolean'
    && typeof change.enabled === 'boolean'
    && typeof change.changedAt === 'string'
    && !Number.isNaN(Date.parse(change.changedAt));
}

export const DonationSettingsPanel: React.FC<DonationSettingsPanelProps> = ({
  currentUser,
  language,
  isActive,
}) => {
  const isBn = language === 'bn';
  const [bkashNumber, setBkashNumber] = useState('01795398332');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [changeHistory, setChangeHistory] = useState<DonationSettingsChange[]>([]);

  useEffect(() => {
    const adminToken = currentUser?.adminToken;
    if (!adminToken) return;
    const controller = new AbortController();
    const loadSettings = async () => {
      setLoading(true);
      try {
        const response = await fetch(apiUrl('/api/admin/donation-settings'), {
          headers: { 'x-admin-token': adminToken },
          signal: controller.signal,
        });
        const data = await response.json() as {
          bkashNumber?: unknown;
          enabled?: unknown;
          changeHistory?: unknown;
          error?: unknown;
        };
        if (!response.ok) {
          throw new Error(typeof data.error === 'string' ? data.error : 'Donation settings could not be loaded.');
        }
        if (typeof data.bkashNumber !== 'string'
          || typeof data.enabled !== 'boolean'
          || !Array.isArray(data.changeHistory)
          || !data.changeHistory.every(isDonationSettingsChange)) {
          throw new Error('The donation settings response was invalid.');
        }
        setBkashNumber(data.bkashNumber);
        setEnabled(data.enabled);
        setChangeHistory(data.changeHistory);
        setError('');
      } catch (loadError) {
        if (loadError instanceof DOMException && loadError.name === 'AbortError') return;
        setError(loadError instanceof Error
          ? loadError.message
          : (isBn ? 'ডোনেশন সেটিংস লোড করা যায়নি।' : 'Donation settings could not be loaded.'));
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    void loadSettings();
    return () => controller.abort();
  }, [currentUser?.adminToken, isBn]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    const adminToken = currentUser?.adminToken;
    if (!adminToken) {
      setError(isBn ? 'অ্যাডমিন অনুমতি পাওয়া যায়নি।' : 'Admin authorization is unavailable.');
      return;
    }

    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch(apiUrl('/api/admin/donation-settings'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ bkashNumber, enabled }),
      });
      const data = await response.json() as {
        bkashNumber?: unknown;
        enabled?: unknown;
        changeHistory?: unknown;
        error?: unknown;
      };
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Donation settings could not be saved.');
      }
      if (typeof data.bkashNumber !== 'string'
        || typeof data.enabled !== 'boolean'
        || !Array.isArray(data.changeHistory)
        || !data.changeHistory.every(isDonationSettingsChange)) {
        throw new Error('The saved donation settings response was invalid.');
      }
      setBkashNumber(data.bkashNumber);
      setEnabled(data.enabled);
      setChangeHistory(data.changeHistory);
      setSaved(true);
    } catch (saveError) {
      setError(saveError instanceof Error
        ? saveError.message
        : (isBn ? 'ডোনেশন সেটিংস সংরক্ষণ করা যায়নি।' : 'Donation settings could not be saved.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section hidden={!isActive} className="space-y-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-pink-700 dark:text-pink-400">
          {isBn ? 'ডোনেশন পরিচালনা' : 'Donation management'}
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isBn ? 'bKash ডোনেশন সেটিংস' : 'bKash donation settings'}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {isBn
            ? 'লগইন প্যানেলের ডোনেশন বাটনের নম্বর পরিবর্তন করুন অথবা বাটনটি চালু/বন্ধ করুন।'
            : 'Change the bKash number shown by the login panel donation button, or turn the button on or off.'}
        </p>
      </header>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200">
          <CheckCircle className="h-4 w-4" />
          {isBn ? 'ডোনেশন সেটিংস সংরক্ষণ করা হয়েছে।' : 'Donation settings saved.'}
        </p>
      )}

      <form onSubmit={event => void handleSave(event)} className="max-w-2xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-6">
        <label className="block space-y-2">
          <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
            {isBn ? 'bKash নম্বর' : 'bKash number'}
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={20}
            required
            value={bkashNumber}
            onChange={event => {
              setBkashNumber(event.target.value);
              setError('');
              setSaved(false);
            }}
            disabled={loading || saving}
            placeholder="017XXXXXXXX"
            className="admin-input w-full bg-white dark:bg-slate-800"
            dir="ltr"
          />
          <span className="block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {isBn
              ? 'বাংলাদেশি bKash নম্বর দিন। সংরক্ষণের পর Donate বাটনটি এই নম্বরে Send Money চালু করবে।'
              : 'Enter a Bangladesh bKash number. After saving, the Donate button will open Send Money for this number.'}
          </span>
        </label>

        <label className="flex items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <input
            type="checkbox"
            checked={enabled}
            onChange={event => {
              setEnabled(event.target.checked);
              setSaved(false);
            }}
            disabled={loading || saving}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
              {isBn ? 'Donate বাটন চালু রাখুন' : 'Show the Donate button'}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {isBn ? 'বন্ধ করলে login প্যানেলে ডোনেশন লেখা ও বাটন দেখা যাবে না।' : 'When disabled, the donation message and button are hidden from the login panel.'}
            </span>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || saving || !bkashNumber.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-pink-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-pink-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-700 disabled:cursor-wait disabled:opacity-60 dark:bg-pink-600 dark:hover:bg-pink-500"
        >
          {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Heart className="h-4 w-4" />}
          {saving
            ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
            : (isBn ? 'ডোনেশন সেটিংস সংরক্ষণ করুন' : 'Save donation settings')}
        </button>
      </form>

      <section className="max-w-2xl space-y-3" aria-labelledby="donation-history-heading">
        <div>
          <h3 id="donation-history-heading" className="text-lg font-bold text-slate-900 dark:text-white">
            {isBn ? 'পরিবর্তনের ইতিহাস' : 'Change history'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {isBn ? 'কোন অ্যাডমিন কখন নম্বর বা বাটনের অবস্থা বদলেছেন।' : 'Records of which admin changed the number or button status, and when.'}
          </p>
        </div>
        {changeHistory.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            {isBn ? 'এখনো কোনো পরিবর্তনের রেকর্ড নেই।' : 'No changes have been recorded yet.'}
          </p>
        ) : (
          <ol className="space-y-3">
            {[...changeHistory].reverse().map((change, index) => (
              <li key={`${change.adminId}-${change.changedAt}-${index}`} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-pink-600 dark:text-pink-400" />
                  <div className="min-w-0 space-y-1">
                    <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
                      {change.adminName}
                    </p>
                    <p className="break-all text-xs text-slate-500 dark:text-slate-400">{change.adminEmail}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(change.changedAt).toLocaleString(isBn ? 'bn-BD' : 'en-US')}
                    </p>
                    <p className="break-all text-xs leading-relaxed text-slate-700 dark:text-slate-300" dir="ltr">
                      {change.previousBkashNumber} → {change.bkashNumber}
                    </p>
                    {change.previousEnabled !== change.enabled && (
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {isBn
                          ? `বাটন ${change.previousEnabled ? 'চালু' : 'বন্ধ'} থেকে ${change.enabled ? 'চালু' : 'বন্ধ'} হয়েছে।`
                          : `Button changed from ${change.previousEnabled ? 'enabled' : 'disabled'} to ${change.enabled ? 'enabled' : 'disabled'}.`}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </section>
  );
};
