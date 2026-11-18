import React, { useEffect, useState } from 'react';
import { CheckCircle, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import type { Language, User } from '../../types';
import { apiUrl } from '../../utils/api';

type AIProvider = 'gemini' | 'openai';

interface AdminAIKeyInfo {
  id: string;
  masked: string;
  source: 'admin' | 'environment';
}

interface AdminAIProviderSettings {
  keys: AdminAIKeyInfo[];
  useEnvironmentKeys: boolean;
  environmentConfigured: boolean;
  activeKeyId: string | null;
  preferredKeyId: string | null;
}

interface AdminCustomAIProvider {
  id: string;
  name: string;
  keys: Array<{ id: string; masked: string }>;
  integration: 'openrouter' | null;
  model: string;
  enabledForAI: boolean;
  preferredKeyId: string | null;
  activeKeyId: string | null;
}

interface AdminCustomAIProviderDraft {
  model: string;
  enabledForAI: boolean;
}

type AdminAIProviders = Record<AIProvider, AdminAIProviderSettings> & {
  customProviders: AdminCustomAIProvider[];
};

interface AIKeysPanelProps {
  currentUser: User | null;
  language: Language;
  isActive: boolean;
}

export const AIKeysPanel: React.FC<AIKeysPanelProps> = ({ currentUser, language, isActive }) => {
  const isBn = language === 'bn';
  const adminHeaders = {
    'Content-Type': 'application/json',
    'x-admin-token': currentUser?.adminToken || '',
  };

  const [aiKeyProviders, setAIKeyProviders] = useState<AdminAIProviders>({
    gemini: { keys: [], useEnvironmentKeys: true, environmentConfigured: false, activeKeyId: null, preferredKeyId: null },
    openai: { keys: [], useEnvironmentKeys: true, environmentConfigured: false, activeKeyId: null, preferredKeyId: null },
    customProviders: [],
  });
  const [aiKeyInputs, setAIKeyInputs] = useState<Record<AIProvider, string>>({ gemini: '', openai: '' });
  const [aiKeysLoading, setAIKeysLoading] = useState(false);
  const [aiKeysSaving, setAIKeysSaving] = useState<AIProvider | null>(null);
  const [aiKeysError, setAIKeysError] = useState('');
  const [aiKeysSaved, setAIKeysSaved] = useState<AIProvider | null>(null);
  const [editingAdminKeyId, setEditingAdminKeyId] = useState<string | null>(null);
  const [adminKeyDraft, setAdminKeyDraft] = useState('');
  const [customProviderForm, setCustomProviderForm] = useState({
    name: 'OpenRouter',
    keys: '',
    model: '',
    enabledForAI: true,
  });
  const [customProviderKeyInputs, setCustomProviderKeyInputs] = useState<Record<string, string>>({});
  const [customProviderSettingsDrafts, setCustomProviderSettingsDrafts] = useState<Record<string, AdminCustomAIProviderDraft>>({});
  const [customProviderSaving, setCustomProviderSaving] = useState<string | null>(null);
  const [customProviderSaved, setCustomProviderSaved] = useState('');
  const [editingCustomProviderId, setEditingCustomProviderId] = useState<string | null>(null);
  const [customProviderNameDraft, setCustomProviderNameDraft] = useState('');
  const [editingCustomKeyId, setEditingCustomKeyId] = useState<string | null>(null);
  const [customKeyDraft, setCustomKeyDraft] = useState('');

  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'super_admin') return;
    const controller = new AbortController();
    const loadAIKeySettings = async () => {
      setAIKeysLoading(true);
      try {
        const response = await fetch(apiUrl('/api/admin/ai-keys'), {
          headers: adminHeaders,
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load AI key settings.');
        if (!data.providers?.gemini || !data.providers?.openai || !Array.isArray(data.providers?.customProviders)) {
          throw new Error('The AI key settings response was invalid.');
        }
        setAIKeyProviders(data.providers as AdminAIProviders);
        setCustomProviderSettingsDrafts(Object.fromEntries(
          data.providers.customProviders.map((provider: AdminCustomAIProvider) => [provider.id, {
            model: provider.model,
            enabledForAI: provider.enabledForAI,
          }]),
        ));
        setAIKeysError('');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setAIKeysError(error instanceof Error
          ? error.message
          : (isBn ? 'AI key settings লোড করা যায়নি।' : 'Unable to load AI key settings.'));
      } finally {
        if (!controller.signal.aborted) setAIKeysLoading(false);
      }
    };

    void loadAIKeySettings();
    return () => controller.abort();
  }, [currentUser?.role, currentUser?.adminToken, isBn]);

  const addAIProviderKeys = async (provider: AIProvider) => {
    const keys = aiKeyInputs[provider].split(/[\r\n,]+/).map(key => key.trim()).filter(Boolean);
    if (keys.length === 0) {
      setAIKeysError(isBn ? 'কমপক্ষে একটি API key দিন।' : 'Enter at least one API key.');
      return;
    }
    setAIKeysSaving(provider);
    setAIKeysError('');
    setAIKeysSaved(null);
    try {
      const response = await fetch(apiUrl('/api/admin/ai-keys'), {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ provider, keys }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save AI keys.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setAIKeyInputs(previous => ({ ...previous, [provider]: '' }));
      setAIKeysSaved(provider);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'API key সংরক্ষণ করা যায়নি।' : 'Unable to save API keys.'));
    } finally {
      setAIKeysSaving(null);
    }
  };

  const updateAIEnvironmentKeySetting = async (provider: AIProvider, enabled: boolean) => {
    setAIKeysSaving(provider);
    setAIKeysError('');
    setAIKeysSaved(null);
    try {
      const response = await fetch(apiUrl('/api/admin/ai-keys'), {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ provider, useEnvironmentKeys: enabled }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update environment key setting.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setAIKeysSaved(provider);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'Environment key সেটিং পরিবর্তন করা যায়নি।' : 'Unable to update environment key setting.'));
    } finally {
      setAIKeysSaving(null);
    }
  };

  const setPreferredAIProviderKey = async (provider: AIProvider, key: AdminAIKeyInfo) => {
    setAIKeysSaving(provider);
    setAIKeysError('');
    setAIKeysSaved(null);
    try {
      const response = await fetch(apiUrl('/api/admin/ai-keys'), {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ provider, preferredKeyId: key.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to change the preferred API key.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setAIKeysSaved(provider);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'সক্রিয় API key বদলানো যায়নি।' : 'Unable to change the preferred API key.'));
    } finally {
      setAIKeysSaving(null);
    }
  };

  const setPreferredCustomAIProviderKey = async (providerId: string, keyId: string) => {
    setCustomProviderSaving(providerId);
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/custom/${encodeURIComponent(providerId)}/preferred-key`), {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ keyId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to choose the preferred OpenRouter key.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setCustomProviderSaved(providerId);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'OpenRouter-এর পছন্দের key বদলানো যায়নি।' : 'Unable to choose the preferred OpenRouter key.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  const saveCustomProviderSettings = async (provider: AdminCustomAIProvider) => {
    const draft = customProviderSettingsDrafts[provider.id] || {
      model: provider.model,
      enabledForAI: provider.enabledForAI,
    };
    setCustomProviderSaving(provider.id);
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/custom/${encodeURIComponent(provider.id)}`), {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ model: draft.model, enabledForAI: draft.enabledForAI }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update OpenRouter settings.');
      const providers = data.providers as AdminAIProviders;
      setAIKeyProviders(providers);
      setCustomProviderSettingsDrafts(Object.fromEntries(
        providers.customProviders.map(item => [item.id, { model: item.model, enabledForAI: item.enabledForAI }]),
      ));
      setCustomProviderSaved(provider.id);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'Chatbot-এর OpenRouter সেটিং সংরক্ষণ করা যায়নি।' : 'Unable to save chatbot OpenRouter settings.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  const replaceAIProviderKey = async (provider: AIProvider, keyId: string) => {
    const key = adminKeyDraft.trim();
    if (!key) {
      setAIKeysError(isBn ? 'নতুন API key দিন।' : 'Enter the replacement API key.');
      return;
    }
    setAIKeysSaving(provider);
    setAIKeysError('');
    setAIKeysSaved(null);
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/${provider}/${encodeURIComponent(keyId)}`), {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to replace the API key.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setEditingAdminKeyId(null);
      setAdminKeyDraft('');
      setAIKeysSaved(provider);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'API key বদলানো যায়নি।' : 'Unable to replace the API key.'));
    } finally {
      setAIKeysSaving(null);
    }
  };

  const deleteAIProviderKey = async (provider: AIProvider, key: AdminAIKeyInfo) => {
    if (!window.confirm(isBn ? 'এই API key মুছে ফেলবেন?' : 'Remove this API key?')) return;
    setAIKeysSaving(provider);
    setAIKeysError('');
    setAIKeysSaved(null);
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/${provider}/${encodeURIComponent(key.id)}`), {
        method: 'DELETE',
        headers: adminHeaders,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to remove the API key.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setAIKeysSaved(provider);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'API key মুছে ফেলা যায়নি।' : 'Unable to remove the API key.'));
    } finally {
      setAIKeysSaving(null);
    }
  };

  const createCustomAIProvider = async (event: React.FormEvent) => {
    event.preventDefault();
    const keys = customProviderForm.keys.split(/[\r\n,]+/).map(key => key.trim()).filter(Boolean);
    if (!customProviderForm.name.trim() || keys.length === 0) {
      setAIKeysError(isBn ? 'Provider-এর নাম ও কমপক্ষে একটি API key দিন।' : 'Enter a provider name and at least one API key.');
      return;
    }
    if (customProviderForm.enabledForAI && !customProviderForm.model.trim()) {
      setAIKeysError(isBn ? 'OpenRouter chatbot চালাতে model ID দিন।' : 'Enter a model ID to use OpenRouter in the chatbot.');
      return;
    }
    setCustomProviderSaving('new');
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl('/api/admin/ai-keys/custom'), {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({
          name: customProviderForm.name,
          keys,
          model: customProviderForm.model,
          enabledForAI: customProviderForm.enabledForAI,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to add custom provider.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setCustomProviderSettingsDrafts(Object.fromEntries(
        data.providers.customProviders.map((provider: AdminCustomAIProvider) => [provider.id, {
          model: provider.model,
          enabledForAI: provider.enabledForAI,
        }]),
      ));
      setCustomProviderForm({ name: 'OpenRouter', keys: '', model: '', enabledForAI: true });
      setCustomProviderSaved('new');
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'Provider যোগ করা যায়নি।' : 'Unable to add custom provider.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  const addCustomProviderKeys = async (providerId: string) => {
    const keys = (customProviderKeyInputs[providerId] || '').split(/[\r\n,]+/).map(key => key.trim()).filter(Boolean);
    if (keys.length === 0) {
      setAIKeysError(isBn ? 'কমপক্ষে একটি API key দিন।' : 'Enter at least one API key.');
      return;
    }
    setCustomProviderSaving(providerId);
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/custom/${encodeURIComponent(providerId)}/keys`), {
        method: 'POST',
        headers: adminHeaders,
        body: JSON.stringify({ keys }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to add provider keys.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setCustomProviderKeyInputs(previous => ({ ...previous, [providerId]: '' }));
      setCustomProviderSaved(providerId);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'API key যোগ করা যায়নি।' : 'Unable to add provider keys.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  const saveCustomProviderName = async (providerId: string) => {
    const name = customProviderNameDraft.trim();
    if (!name) {
      setAIKeysError(isBn ? 'Provider-এর নাম দিন।' : 'Enter a provider name.');
      return;
    }
    setCustomProviderSaving(providerId);
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/custom/${encodeURIComponent(providerId)}`), {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to update provider name.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setEditingCustomProviderId(null);
      setCustomProviderSaved(providerId);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'Provider-এর নাম বদলানো যায়নি।' : 'Unable to update provider name.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  const deleteCustomProvider = async (provider: AdminCustomAIProvider) => {
    if (!window.confirm(isBn ? `${provider.name} provider ও এর সব key মুছে ফেলবেন?` : `Remove ${provider.name} and all its keys?`)) return;
    setCustomProviderSaving(provider.id);
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/custom/${encodeURIComponent(provider.id)}`), {
        method: 'DELETE',
        headers: adminHeaders,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to remove provider.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setCustomProviderKeyInputs(previous => {
        const remaining = { ...previous };
        delete remaining[provider.id];
        return remaining;
      });
      setCustomProviderSaved(provider.id);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'Provider মুছে ফেলা যায়নি।' : 'Unable to remove provider.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  const replaceCustomProviderKey = async (providerId: string, keyId: string) => {
    const key = customKeyDraft.trim();
    if (!key) {
      setAIKeysError(isBn ? 'নতুন API key দিন।' : 'Enter the replacement API key.');
      return;
    }
    setCustomProviderSaving(providerId);
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/custom/${encodeURIComponent(providerId)}/keys/${encodeURIComponent(keyId)}`), {
        method: 'PATCH',
        headers: adminHeaders,
        body: JSON.stringify({ key }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to replace API key.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setEditingCustomKeyId(null);
      setCustomKeyDraft('');
      setCustomProviderSaved(providerId);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'API key বদলানো যায়নি।' : 'Unable to replace API key.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  const deleteCustomProviderKey = async (providerId: string, keyId: string) => {
    if (!window.confirm(isBn ? 'এই API key মুছে ফেলবেন?' : 'Remove this API key?')) return;
    setCustomProviderSaving(providerId);
    setAIKeysError('');
    setCustomProviderSaved('');
    try {
      const response = await fetch(apiUrl(`/api/admin/ai-keys/custom/${encodeURIComponent(providerId)}/keys/${encodeURIComponent(keyId)}`), {
        method: 'DELETE',
        headers: adminHeaders,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to remove API key.');
      setAIKeyProviders(data.providers as AdminAIProviders);
      setCustomProviderSaved(providerId);
    } catch (error) {
      setAIKeysError(error instanceof Error
        ? error.message
        : (isBn ? 'API key মুছে ফেলা যায়নি।' : 'Unable to remove API key.'));
    } finally {
      setCustomProviderSaving(null);
    }
  };

  return (
    <div className="space-y-6" hidden={!isActive}>
      <div className="rounded-3xl border border-indigo-100 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-7">
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {isBn ? 'একাধিক API key পরিচালনা' : 'Manage multiple API keys'}
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {isBn
            ? 'একাধিক key যোগ করুন এবং “এখন ব্যবহার” দিয়ে পছন্দের key বাছুন। limit বা অন্য error হলে key-টি সাময়িক বিরতিতে যাবে, পরের key ও অন্য provider চেষ্টা হবে। সফল key cache-এ রাখা হয়। সম্পূর্ণ key আর দেখানো হয় না; database-এ encryption করা থাকে।'
            : 'Add multiple keys and choose one with “Use this key”. A key that hits a quota or other error is temporarily cooled down, then the next key and other provider are tried. Successful keys are cached. Full keys are never shown again and are encrypted in the database.'}
        </p>
      </div>

      {aiKeysError && (
        <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">
          {aiKeysError}
        </p>
      )}
      {aiKeysLoading && (
        <p role="status" className="text-sm text-slate-500 dark:text-slate-400">
          {isBn ? 'API key সেটিংস লোড হচ্ছে...' : 'Loading API key settings...'}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        {([
          ['gemini', 'Google Gemini'],
          ['openai', 'OpenAI'],
        ] as const).map(([provider, providerLabel]) => {
          const settings = aiKeyProviders[provider];
          return (
            <section key={provider} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{providerLabel}</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {isBn ? `${settings.keys.length}টি key কনফিগার করা` : `${settings.keys.length} key(s) configured`}
                  </p>
                </div>
                {(settings.activeKeyId || settings.preferredKeyId) && (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                    <CheckCircle className="h-3 w-3" />
                    {isBn ? 'পছন্দের key আগে, ব্যর্থ হলে fallback' : 'Preferred key first, with fallback'}
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {settings.keys.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-500 dark:border-slate-700">
                    {isBn ? 'কোনো key যোগ করা হয়নি।' : 'No keys configured yet.'}
                  </p>
                ) : settings.keys.map(key => {
                  const environmentKeyDisabled = key.source === 'environment' && !settings.useEnvironmentKeys;
                  return (
                    <div key={key.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3 py-2.5 ${environmentKeyDisabled ? 'border-slate-100 opacity-50 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700'}`}>
                      {editingAdminKeyId === key.id ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <input
                            type="password"
                            value={adminKeyDraft}
                            onChange={event => setAdminKeyDraft(event.target.value)}
                            autoComplete="new-password"
                            placeholder={isBn ? 'নতুন API key লিখুন' : 'Enter replacement API key'}
                            className="admin-input min-w-0 flex-1 bg-white font-mono text-xs dark:bg-slate-900"
                          />
                          <button type="button" onClick={() => void replaceAIProviderKey(provider, key.id)} disabled={aiKeysSaving !== null} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                            {isBn ? 'বদলান' : 'Replace'}
                          </button>
                          <button type="button" onClick={() => { setEditingAdminKeyId(null); setAdminKeyDraft(''); }} disabled={aiKeysSaving !== null} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
                            {isBn ? 'বাতিল' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="min-w-0">
                            <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{key.masked}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {key.source === 'environment'
                                ? (isBn ? '.env থেকে' : 'From backend environment')
                                : (isBn ? 'Admin Panel থেকে' : 'Added in Admin Panel')}
                              {settings.preferredKeyId === key.id && ` · ${isBn ? 'পছন্দের key' : 'preferred key'}`}
                              {settings.activeKeyId === key.id && ` · ${isBn ? 'সর্বশেষ সফল' : 'last successful'}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {settings.preferredKeyId !== key.id && (
                              <button
                                type="button"
                                onClick={() => void setPreferredAIProviderKey(provider, key)}
                                disabled={aiKeysSaving !== null || environmentKeyDisabled}
                                className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                              >
                                {isBn ? 'এখন ব্যবহার' : 'Use this key'}
                              </button>
                            )}
                            {key.source === 'admin' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => { setEditingAdminKeyId(key.id); setAdminKeyDraft(''); }}
                                  disabled={aiKeysSaving !== null}
                                  className="rounded-lg p-2 text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                                  aria-label={isBn ? 'API key বদলান' : 'Replace API key'}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteAIProviderKey(provider, key)}
                                  disabled={aiKeysSaving !== null}
                                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/40"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  {isBn ? 'মুছুন' : 'Remove'}
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <label className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.useEnvironmentKeys}
                  disabled={aiKeysSaving !== null || !settings.environmentConfigured}
                  onChange={event => void updateAIEnvironmentKeySetting(provider, event.target.checked)}
                  className="mt-0.5 accent-emerald-600"
                />
                <span>
                  {isBn ? 'backend .env-এর key-গুলো fallback হিসেবে ব্যবহার করুন' : 'Use backend .env keys as fallback'}
                  {!settings.environmentConfigured && (
                    <span className="mt-0.5 block text-[10px] text-slate-400">
                      {isBn ? 'backend .env-এ এই provider-এর key পাওয়া যায়নি।' : 'No key for this provider was found in backend .env.'}
                    </span>
                  )}
                </span>
              </label>

              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {isBn ? 'নতুন API key (প্রতি লাইনে একটি)' : 'New API keys (one per line)'}
                </span>
                <textarea
                  value={aiKeyInputs[provider]}
                  onChange={event => setAIKeyInputs(previous => ({ ...previous, [provider]: event.target.value }))}
                  rows={3}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder={isBn ? 'প্রতি লাইনে একটি key পেস্ট করুন' : 'Paste one key per line'}
                  className="admin-input w-full resize-y bg-white font-mono text-xs dark:bg-slate-900"
                />
                <span className="block text-[10px] text-slate-400">
                  {isBn ? 'একবারে সর্বোচ্চ ১০টি যোগ করা যাবে; full key পুনরায় দেখানো হবে না।' : 'Add up to 10 at once. Full keys cannot be viewed again.'}
                </span>
              </label>
              <button
                type="button"
                onClick={() => void addAIProviderKeys(provider)}
                disabled={aiKeysSaving !== null || !aiKeyInputs[provider].trim()}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {aiKeysSaving === provider ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {aiKeysSaving === provider
                  ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                  : (isBn ? 'Key যোগ ও সংরক্ষণ' : 'Add and save keys')}
              </button>
              {aiKeysSaved === provider && (
                <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                  {isBn ? 'সেটিংস সংরক্ষিত হয়েছে।' : 'Settings saved successfully.'}
                </p>
              )}
            </section>
          );
        })}
      </div>

      <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-7">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isBn ? 'অন্যান্য AI provider-এর key' : 'Other AI provider keys'}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            {isBn
              ? 'OpenRouter-compatible API key, model ID ও chatbot ব্যবহার সেট করুন। OpenRouter-এর Models catalog থেকে model ID নিন; integration চালু না করলে provider-এর key শুধু সংরক্ষিত থাকবে।'
              : 'Configure an OpenRouter-compatible API key, model ID, and chatbot usage. Get a model ID from OpenRouter’s model catalog; providers stay key-only until chatbot usage is enabled.'}
          </p>
        </div>

        <form onSubmit={event => void createCustomAIProvider(event)} className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900/50">
          <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={customProviderForm.enabledForAI}
              onChange={event => setCustomProviderForm(previous => ({ ...previous, enabledForAI: event.target.checked }))}
              className="mt-0.5 accent-emerald-600"
            />
            <span>{isBn ? 'OpenRouter দিয়ে chatbot-এ ব্যবহার করুন' : 'Use with chatbot through OpenRouter'}</span>
          </label>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[minmax(12rem,0.7fr)_minmax(12rem,0.7fr)_minmax(16rem,1.3fr)_auto] md:items-end">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'Provider-এর নাম' : 'Provider name'}</span>
              <input
                value={customProviderForm.name}
                onChange={event => setCustomProviderForm(previous => ({ ...previous, name: event.target.value }))}
                maxLength={60}
                placeholder="OpenRouter"
                className="admin-input w-full bg-white dark:bg-slate-800"
              />
            </label>
            {customProviderForm.enabledForAI && (
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'OpenRouter model ID' : 'OpenRouter model ID'}</span>
                <input
                  value={customProviderForm.model}
                  onChange={event => setCustomProviderForm(previous => ({ ...previous, model: event.target.value }))}
                  maxLength={120}
                  placeholder="provider/model:free"
                  className="admin-input w-full bg-white dark:bg-slate-800"
                />
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{isBn ? 'এক বা একাধিক API key' : 'One or more API keys'}</span>
              <textarea
                value={customProviderForm.keys}
                onChange={event => setCustomProviderForm(previous => ({ ...previous, keys: event.target.value }))}
                rows={2}
                autoComplete="off"
                spellCheck={false}
                placeholder={isBn ? 'প্রতি লাইনে একটি key' : 'One key per line'}
                className="admin-input w-full resize-y bg-white font-mono text-xs dark:bg-slate-800"
              />
            </label>
            <button
              type="submit"
              disabled={customProviderSaving !== null || !customProviderForm.name.trim() || !customProviderForm.keys.trim() || (customProviderForm.enabledForAI && !customProviderForm.model.trim())}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {customProviderSaving === 'new' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {isBn ? 'Provider যোগ করুন' : 'Add provider'}
            </button>
          </div>
          {customProviderForm.enabledForAI && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              {isBn ? 'Base URL: https://openrouter.ai/api/v1/chat/completions · model ID OpenRouter Models catalog থেকে নিন.' : 'Endpoint: https://openrouter.ai/api/v1/chat/completions · copy the model ID from the OpenRouter Models catalog.'}
              {' '}<a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="font-semibold text-indigo-600 underline dark:text-indigo-300">OpenRouter Models</a>
            </p>
          )}
        </form>

        {aiKeyProviders.customProviders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-200 py-7 text-center text-xs text-slate-500 dark:border-slate-700">
            {isBn ? 'এখনও কোনো custom provider যোগ করা হয়নি।' : 'No custom providers have been added.'}
          </p>
        ) : (
          <div className="space-y-4">
            {aiKeyProviders.customProviders.map(provider => (
              <article key={provider.id} className="space-y-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {editingCustomProviderId === provider.id ? (
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <input
                        value={customProviderNameDraft}
                        onChange={event => setCustomProviderNameDraft(event.target.value)}
                        maxLength={60}
                        className="admin-input min-w-0 flex-1 bg-white dark:bg-slate-900"
                        aria-label={isBn ? 'Provider-এর নতুন নাম' : 'New provider name'}
                      />
                      <button type="button" onClick={() => void saveCustomProviderName(provider.id)} disabled={customProviderSaving !== null} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                        {isBn ? 'সংরক্ষণ' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setEditingCustomProviderId(null)} disabled={customProviderSaving !== null} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
                        {isBn ? 'বাতিল' : 'Cancel'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex min-w-0 items-center gap-2">
                      <h4 className="truncate text-sm font-bold text-slate-900 dark:text-white">{provider.name}</h4>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700 dark:text-slate-300">
                        {provider.keys.length} {isBn ? 'টি key' : 'key(s)'}
                      </span>
                      {provider.enabledForAI && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">{isBn ? 'Chatbot চালু' : 'Chatbot enabled'}</span>}
                    </div>
                  )}
                  <div className="flex shrink-0 items-center gap-1">
                    {editingCustomProviderId !== provider.id && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCustomProviderId(provider.id);
                          setCustomProviderNameDraft(provider.name);
                        }}
                        disabled={customProviderSaving !== null}
                        className="rounded-lg p-2 text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                        aria-label={isBn ? 'Provider-এর নাম সম্পাদনা' : 'Edit provider name'}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteCustomProvider(provider)}
                      disabled={customProviderSaving !== null}
                      className="rounded-lg p-2 text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/40"
                      aria-label={isBn ? `${provider.name} মুছুন` : `Remove ${provider.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-900/50 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <div className="space-y-2">
                    <label className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={(customProviderSettingsDrafts[provider.id] || provider).enabledForAI}
                        onChange={event => setCustomProviderSettingsDrafts(previous => ({
                          ...previous,
                          [provider.id]: {
                            ...(previous[provider.id] || { model: provider.model, enabledForAI: provider.enabledForAI }),
                            enabledForAI: event.target.checked,
                          },
                        }))}
                        className="mt-0.5 accent-emerald-600"
                      />
                      <span>{isBn ? 'OpenRouter দিয়ে chatbot-এ ব্যবহার করুন' : 'Use with chatbot through OpenRouter'}</span>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">{isBn ? 'OpenRouter model ID' : 'OpenRouter model ID'}</span>
                      <input
                        value={(customProviderSettingsDrafts[provider.id] || provider).model}
                        onChange={event => setCustomProviderSettingsDrafts(previous => ({
                          ...previous,
                          [provider.id]: {
                            ...(previous[provider.id] || { model: provider.model, enabledForAI: provider.enabledForAI }),
                            model: event.target.value,
                          },
                        }))}
                        maxLength={120}
                        placeholder="provider/model:free"
                        className="admin-input w-full bg-white text-xs dark:bg-slate-800"
                      />
                      <a href="https://openrouter.ai/models" target="_blank" rel="noreferrer" className="inline-block text-[10px] font-semibold text-indigo-600 underline dark:text-indigo-300">
                        {isBn ? 'OpenRouter Models catalog' : 'OpenRouter Models catalog'}
                      </a>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={() => void saveCustomProviderSettings(provider)}
                    disabled={customProviderSaving !== null || ((customProviderSettingsDrafts[provider.id] || provider).enabledForAI && !(customProviderSettingsDrafts[provider.id] || provider).model.trim())}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBn ? 'Chatbot সেটিং সংরক্ষণ' : 'Save chatbot settings'}
                  </button>
                </div>

                <div className="space-y-2">
                  {provider.keys.map(key => (
                    <div key={key.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-700">
                      {editingCustomKeyId === key.id ? (
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <input
                            type="password"
                            value={customKeyDraft}
                            onChange={event => setCustomKeyDraft(event.target.value)}
                            autoComplete="new-password"
                            placeholder={isBn ? 'নতুন key লিখুন' : 'Enter replacement key'}
                            className="admin-input min-w-0 flex-1 bg-white font-mono text-xs dark:bg-slate-900"
                          />
                          <button type="button" onClick={() => void replaceCustomProviderKey(provider.id, key.id)} disabled={customProviderSaving !== null} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                            {isBn ? 'বদলান' : 'Replace'}
                          </button>
                          <button type="button" onClick={() => { setEditingCustomKeyId(null); setCustomKeyDraft(''); }} disabled={customProviderSaving !== null} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300">
                            {isBn ? 'বাতিল' : 'Cancel'}
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">{key.masked}</p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              {isBn ? 'গোপন রাখা হয়েছে' : 'Secret value hidden'}
                              {provider.preferredKeyId === key.id && ` · ${isBn ? 'পছন্দের key' : 'preferred key'}`}
                              {provider.activeKeyId === key.id && ` · ${isBn ? 'সর্বশেষ সফল' : 'last successful'}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            {provider.enabledForAI && provider.preferredKeyId !== key.id && (
                              <button
                                type="button"
                                onClick={() => void setPreferredCustomAIProviderKey(provider.id, key.id)}
                                disabled={customProviderSaving !== null}
                                className="rounded-lg px-2.5 py-2 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                              >
                                {isBn ? 'এখন ব্যবহার' : 'Use this key'}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => { setEditingCustomKeyId(key.id); setCustomKeyDraft(''); }}
                              disabled={customProviderSaving !== null}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              {isBn ? 'সম্পাদনা' : 'Edit'}
                            </button>
                            <button
                              type="button"
                              onClick={() => void deleteCustomProviderKey(provider.id, key.id)}
                              disabled={customProviderSaving !== null}
                              className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:hover:bg-rose-950/40"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              {isBn ? 'মুছুন' : 'Remove'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{isBn ? 'আরও key যোগ করুন (প্রতি লাইনে একটি)' : 'Add more keys (one per line)'}</span>
                    <textarea
                      value={customProviderKeyInputs[provider.id] || ''}
                      onChange={event => setCustomProviderKeyInputs(previous => ({ ...previous, [provider.id]: event.target.value }))}
                      rows={2}
                      autoComplete="off"
                      spellCheck={false}
                      className="admin-input w-full resize-y bg-white font-mono text-xs dark:bg-slate-900"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void addCustomProviderKeys(provider.id)}
                    disabled={customProviderSaving !== null || !(customProviderKeyInputs[provider.id] || '').trim()}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isBn ? 'Key যোগ করুন' : 'Add keys'}
                  </button>
                </div>
                {customProviderSaved === provider.id && (
                  <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    {isBn ? 'পরিবর্তন সংরক্ষিত হয়েছে।' : 'Changes saved successfully.'}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        {customProviderSaved === 'new' && (
          <p role="status" className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {isBn ? 'Custom provider যোগ হয়েছে।' : 'Custom provider added successfully.'}
          </p>
        )}
      </section>
    </div>
  );
};
