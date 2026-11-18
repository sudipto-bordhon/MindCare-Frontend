import React, { useEffect, useState } from 'react';
import { Phone, HeartHandshake, ShieldAlert, X } from 'lucide-react';
import { CrisisHelpline, Language } from '../types';
import { INITIAL_CRISIS_HELPLINES } from '../data/crisisHelplines';
import { apiUrl } from '../utils/api';

interface CrisisModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const CrisisModal: React.FC<CrisisModalProps> = ({ isOpen, onClose, language }) => {
  const isBn = language === 'bn';
  const [helplines, setHelplines] = useState<CrisisHelpline[]>(INITIAL_CRISIS_HELPLINES);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const controller = new AbortController();
    const loadHelplines = async () => {
      try {
        const response = await fetch(apiUrl('/api/crisis-helplines'), { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load crisis helplines.');
        if (!Array.isArray(data.helplines)) throw new Error('The crisis helpline response was invalid.');
        setHelplines(data.helplines as CrisisHelpline[]);
        setLoadError('');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setHelplines(INITIAL_CRISIS_HELPLINES);
        setLoadError(isBn
          ? 'হালনাগাদ হেল্পলাইন লোড করা যায়নি; প্রাথমিক নম্বরগুলো দেখানো হচ্ছে।'
          : 'Updated helplines could not be loaded; showing the default contacts.');
      }
    };

    void loadHelplines();
    return () => controller.abort();
  }, [isOpen, isBn]);

  if (!isOpen) return null;

  const helplineStyles = [
    'bg-emerald-50 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border-emerald-200 dark:border-emerald-800',
    'bg-blue-50 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border-blue-200 dark:border-blue-800',
    'bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700/80 border-slate-200 dark:border-slate-700',
    'bg-rose-50 hover:bg-rose-100/80 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border-rose-200 dark:border-rose-800',
  ];
  const badgeStyles = [
    'bg-emerald-600',
    'bg-blue-600',
    'bg-slate-800 dark:bg-slate-600',
    'bg-rose-600',
  ];
  const titleStyles = [
    'text-emerald-950 dark:text-emerald-100',
    'text-blue-950 dark:text-blue-100',
    'text-slate-900 dark:text-slate-100',
    'text-rose-950 dark:text-rose-100',
  ];
  const descriptionStyles = [
    'text-emerald-700 dark:text-emerald-300',
    'text-blue-700 dark:text-blue-300',
    'text-slate-600 dark:text-slate-400',
    'text-rose-700 dark:text-rose-300',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-rose-200 dark:border-rose-900 overflow-hidden flex flex-col">
        {/* Urgent header */}
        <div className="bg-rose-500 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
            <div>
              <h3 className="font-bold text-lg">
                {isBn ? 'আপনার পাশে আমরা আছি • জরুরি সহায়তা' : 'You Are Not Alone • Immediate Crisis Support'}
              </h3>
              <p className="text-xs text-rose-100">
                {isBn ? 'অনুগ্রহ করে একা থাকবেন না, মানুষের সহায়তা এখনই প্রস্তুত' : 'Please connect with someone who can support you right now'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-rose-100 hover:text-white p-1 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-slate-700 dark:text-slate-200 overflow-y-auto overscroll-contain">
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl p-4 text-sm flex gap-3">
            <HeartHandshake className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-200">
                {isBn 
                  ? 'কঠিন অনুভূতিগুলোর মধ্য দিয়ে একা একা যাওয়া খুবই কষ্টকর। পেশাদার মানসিক স্বাস্থ্য কর্মী বা কোনো বিশ্বস্ত আপনজনের সাথে কথা বললে তাৎক্ষণিক স্বস্তি মিলতে পারে।'
                  : 'Navigating overwhelming distress alone is painful. Speaking with a compassionate professional or someone you trust can bring grounding and relief.'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isBn ? 'বাংলাদেশ জরুরি হেল্পলাইন (সরাসরি কলযোগ্য)' : 'Bangladesh Crisis & Emergency Helplines'}
            </h4>
            {loadError && (
              <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                {loadError}
              </p>
            )}
            {helplines.map((helpline, index) => {
              const styleIndex = index % helplineStyles.length;
              const phoneLink = helpline.phone.replace(/[^\d+]/g, '');
              return (
                <a
                  key={helpline.id}
                  href={`tel:${phoneLink}`}
                  className={`group flex items-center justify-between gap-3 rounded-xl border p-3.5 transition ${helplineStyles[styleIndex]}`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${badgeStyles[styleIndex]}`}>
                      {index === 1 ? <HeartHandshake className="h-5 w-5" /> : <Phone className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className={`break-words text-sm font-semibold ${titleStyles[styleIndex]}`}>
                        {isBn ? helpline.nameBn || helpline.nameEn : helpline.nameEn || helpline.nameBn}
                      </div>
                      {(isBn ? helpline.descriptionBn || helpline.descriptionEn : helpline.descriptionEn || helpline.descriptionBn) && (
                        <div className={`mt-0.5 break-words text-xs ${descriptionStyles[styleIndex]}`}>
                          {isBn ? helpline.descriptionBn || helpline.descriptionEn : helpline.descriptionEn || helpline.descriptionBn}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium text-white transition-transform group-hover:scale-105 ${badgeStyles[styleIndex]}`}>
                    {isBn ? `কল করুন: ${helpline.phone}` : `Call: ${helpline.phone}`}
                  </span>
                </a>
              );
            })}
            {helplines.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-300 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {isBn ? 'এই মুহূর্তে কোনো হেল্পলাইন প্রকাশিত নেই।' : 'No helplines are currently published.'}
              </p>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {isBn ? 'মাইন্ডকেয়ার সুরক্ষা প্রোটোকল' : 'MindCare Safety Governance'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            {isBn ? 'বন্ধ করুন' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
};
