import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Trash2, 
  Settings2, 
  Plus,
  MessageCircle,
} from 'lucide-react';
import { ChatMessage, ConsentSettings, Language, User } from '../../types';
import { translations } from '../../data/translations';
import { getOfflineWellnessResponse } from '../../utils/offlineWellnessResponses';
import { apiUrl } from '../../utils/api';

interface AIAssistantViewProps {
  currentUser: User | null;
  consent: ConsentSettings;
  onUpdateConsent: (updated: Partial<ConsentSettings>) => void;
  language: Language;
  onOpenCrisis: () => void;
  onRequireAuth: () => void;
}

interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: ChatMessage[];
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  currentUser,
  consent,
  onUpdateConsent,
  language,
  onOpenCrisis,
  onRequireAuth,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const storageKey = currentUser ? `mindcare_chat_${currentUser.id}` : null;
  const sessionsKey = currentUser ? `mindcare_chat_sessions_${currentUser.id}` : null;
  const welcomeMessage = (): ChatMessage => ({
    id: 'msg_welcome',
    role: 'assistant',
    content: isBn
      ? `নমস্কার / আসসালামু আলাইকুম! আমি মাইন্ডকেয়ারের ওয়েলনেস চ্যাটবট। আমি কোনো ডাক্তার নই, তবে আপনার মনের কথা মনোযোগ দিয়ে শুনে মন শান্ত করতে এবং মানসিক চাপ কমাতে সাহায্য করতে পারি। আজ আপনি কেমন বোধ করছেন?`
      : `Hello! I am your MindCare wellness chatbot. I am here to listen with empathy, guide you through low-risk calming practices, and support your self-care. (Please note: I am a chatbot, not a medical clinician). How is your heart and mind feeling today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'welcome_prompt'
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (!storageKey) return [welcomeMessage()];
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) return [welcomeMessage()];
      const parsed = JSON.parse(saved) as { savedAt: number; messages: ChatMessage[] };
      return Date.now() - parsed.savedAt <= 48 * 60 * 60 * 1000 && Array.isArray(parsed.messages)
        ? parsed.messages
        : [welcomeMessage()];
    } catch {
      return [welcomeMessage()];
    }
  });
  const [chatSessions, setChatSessions] = useState<ChatSession[]>(() => {
    if (!currentUser) return [];
    try {
      const saved = localStorage.getItem(`mindcare_chat_sessions_${currentUser.id}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      const legacy = localStorage.getItem(`mindcare_chat_${currentUser.id}`);
      if (legacy) {
        const parsed = JSON.parse(legacy);
        if (Array.isArray(parsed.messages)) {
          return [{ id: `chat_${Date.now()}`, title: isBn ? 'নতুন কথোপকথন' : 'New conversation', updatedAt: parsed.savedAt || Date.now(), messages: parsed.messages }];
        }
      }
    } catch {
      return [];
    }
    return [];
  });
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [showConsentBar, setShowConsentBar] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!storageKey) return;
    localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), messages }));
  }, [messages, storageKey]);

  useEffect(() => {
    if (!sessionsKey) return;
    setChatSessions(previous => {
      const activeId = activeChatId || previous[0]?.id || `chat_${Date.now()}`;
      const existing = previous.find(session => session.id === activeId);
      const updatedSession: ChatSession = {
        id: activeId,
        title: existing?.title || (() => {
          const firstUserMessage = messages.find(message => message.role === 'user');
          if (!firstUserMessage) return isBn ? 'নতুন কথোপকথন' : 'New conversation';
          const title = firstUserMessage.content.replace(/\s+/g, ' ').trim();
          return title.length > 38 ? `${title.slice(0, 38)}…` : title;
        })(),
        updatedAt: Date.now(),
        messages,
      };
      const updated = existing
        ? previous.map(session => session.id === activeId ? updatedSession : session)
        : [updatedSession, ...previous];
      localStorage.setItem(sessionsKey, JSON.stringify(updated));
      return updated;
    });
  }, [messages, sessionsKey, activeChatId, isBn]);

  useEffect(() => {
    if (!activeChatId && chatSessions.length) {
      setActiveChatId(chatSessions[0].id);
      setMessages(chatSessions[0].messages);
    }
  }, [activeChatId, chatSessions]);

  const createNewChat = () => {
    const newSession: ChatSession = {
      id: `chat_${Date.now()}`,
      title: isBn ? 'নতুন কথোপকথন' : 'New conversation',
      updatedAt: Date.now(),
      messages: [welcomeMessage()],
    };
    setChatSessions(previous => [newSession, ...previous]);
    setActiveChatId(newSession.id);
    setMessages(newSession.messages);
    setInput('');
  };

  const openChat = (session: ChatSession) => {
    setActiveChatId(session.id);
    setMessages(session.messages);
    setInput('');
  };

  const getSessionTitle = (session: ChatSession) => {
    const firstUserMessage = session.messages.find(message => message.role === 'user');
    if (!firstUserMessage) return session.title;
    const title = firstUserMessage.content.replace(/\s+/g, ' ').trim();
    return title.length > 38 ? `${title.slice(0, 38)}…` : title;
  };

  const handleSend = async (textToSend?: string) => {
    const userText = (textToSend || input).trim();
    if (!userText || loading) return;
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    const chatId = activeChatId || `chat_${Date.now()}`;
    if (!activeChatId) setActiveChatId(chatId);

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatSessions(previous => previous.map(session => {
      if (session.id !== chatId) return session;
      return { ...session, title: getSessionTitle({ ...session, messages: [...session.messages, userMessage] }), updatedAt: Date.now() };
    }));
    setInput('');
    setLoading(true);

    // Send only user-generated turns in conversation history (exclude greeting card)
    const filteredHistory = consent.aiMemoryConsent
      ? messages.filter((m) => m.id !== 'msg_welcome' && m.id !== 'msg_cleared')
      : [];

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const response = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userText,
          history: filteredHistory,
          language,
          ageBand: currentUser?.ageBand || 'adult',
          memoryConsent: consent.aiMemoryConsent,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const replyContent = data?.reply || (isBn
        ? 'আমি আপনার কথা মনোযোগ দিয়ে শুনেছি। নিজেকে কিছুটা সময় দিন এবং গভীর শ্বাস নিন।'
        : 'Thank you for sharing your thoughts. Take a slow, gentle breath.');

      const assistantMessage: ChatMessage = {
        id: 'msg_' + Date.now() + '_res',
        role: 'assistant',
        content: replyContent,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCrisis: !!data?.isCrisis,
        source: data?.source || 'assistant',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (data?.isCrisis) {
        onOpenCrisis();
      }
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      const errorDetail = err instanceof Error
        ? err.name === 'AbortError' ? 'Client request timed out' : err.message
        : 'Unknown client request error';
      console.warn('Chat request notice:', errorDetail);
      const offlineResponse = getOfflineWellnessResponse(userText, language, currentUser?.ageBand || 'adult');
      const errorMessage: ChatMessage = {
        id: 'msg_err_' + Date.now(),
        role: 'assistant',
        content: offlineResponse.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCrisis: offlineResponse.isCrisis,
        source: offlineResponse.isCrisis ? 'offline_crisis_protocol' : 'offline_wellness_faq',
      };
      setMessages((prev) => [...prev, errorMessage]);
      if (offlineResponse.isCrisis) onOpenCrisis();
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (storageKey) localStorage.removeItem(storageKey);
    setMessages([
      {
        id: 'msg_cleared',
        role: 'assistant',
        content: isBn ? 'কথোপকথন সফলভাবে রিসেট করা হয়েছে। কীভাবে আপনাকে সহায়তা করতে পারি?' : 'Conversation context cleared. How can I support you right now?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
    ]);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-16">
      <header className="relative isolate overflow-hidden rounded-[2rem] bg-gradient-to-br from-violet-700 via-indigo-700 to-emerald-700 p-6 text-white shadow-xl shadow-indigo-950/10 sm:p-8">
        <div aria-hidden="true" className="absolute -right-16 -top-28 -z-10 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
        <div aria-hidden="true" className="absolute -bottom-36 left-1/3 -z-10 h-72 w-72 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/15 shadow-lg backdrop-blur">
              <Bot className="h-7 w-7" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{t.ai.title}</h1>
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white/90">
                  {t.ai.disclaimerBadge}
                </span>
              </div>
              <p className="mt-1 max-w-2xl text-xs leading-relaxed text-white/75 sm:text-sm">{t.ai.subtitle}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setShowConsentBar(!showConsentBar)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2.5 text-xs font-semibold text-white transition hover:bg-white/20"
              title={isBn ? 'গোপনীয়তা ও চ্যাট মেমোরি নিয়ন্ত্রণ' : 'Privacy and chatbot memory controls'}
              aria-expanded={showConsentBar}
            >
              <Settings2 className="h-4 w-4" />
              <span>{isBn ? 'গোপনীয়তা' : 'Privacy'}</span>
            </button>
            <button
              type="button"
              onClick={() => currentUser ? handleClearHistory() : onRequireAuth()}
              className="rounded-xl border border-white/20 bg-white/10 p-2.5 text-white/85 transition hover:border-rose-200/40 hover:bg-rose-500/20 hover:text-white"
              title={isBn ? 'চ্যাটের ইতিহাস মুছুন' : 'Clear chat history'}
              aria-label={isBn ? 'চ্যাটের ইতিহাস মুছুন' : 'Clear chat history'}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {showConsentBar && (
          <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-white/15 bg-slate-950/15 p-4 text-xs backdrop-blur-sm">
            <div>
              <span className="font-bold text-white">{t.ai.memoryConsentLabel}</span>
              <p className="mt-1 text-[11px] leading-relaxed text-white/70">
                {isBn ? 'চ্যাটবটকে সাম্প্রতিক কথোপকথনের সূত্র মনে রাখার অনুমতি দিন।' : 'Send prior turns in this session to maintain conversation continuity.'}
              </p>
            </div>
            <input
              type="checkbox"
              checked={consent.aiMemoryConsent}
              onChange={(e) => {
                if (!currentUser) {
                  onRequireAuth();
                  return;
                }
                onUpdateConsent({ aiMemoryConsent: e.target.checked });
              }}
              className="h-5 w-5 shrink-0 cursor-pointer accent-emerald-400"
              aria-label={t.ai.memoryConsentLabel}
            />
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:sticky lg:top-5">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300">
                <MessageCircle className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">{isBn ? 'কথোপকথন' : 'Conversations'}</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">{isBn ? 'আপনার সাম্প্রতিক চ্যাট' : 'Your recent chats'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={createNewChat}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700"
              title={isBn ? 'নতুন চ্যাট' : 'New chat'}
              aria-label={isBn ? 'নতুন চ্যাট' : 'New chat'}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 lg:max-h-[65vh] lg:flex-col lg:overflow-x-hidden lg:overflow-y-auto">
            {chatSessions.map(session => (
              <button
                type="button"
                key={session.id}
                onClick={() => openChat(session)}
                aria-current={session.id === activeChatId ? 'page' : undefined}
                className={`w-52 shrink-0 rounded-2xl border px-3.5 py-3 text-left transition lg:w-full ${
                  session.id === activeChatId
                    ? 'border-violet-200 bg-violet-50 shadow-sm dark:border-violet-800 dark:bg-violet-950/40'
                    : 'border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`block truncate text-xs font-bold ${
                  session.id === activeChatId ? 'text-violet-800 dark:text-violet-200' : 'text-slate-700 dark:text-slate-200'
                }`}>{getSessionTitle(session)}</span>
                <span className="mt-1.5 block text-[10px] text-slate-400 dark:text-slate-500">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
            {!chatSessions.length && (
              <p className="w-56 shrink-0 rounded-2xl bg-slate-50 px-3.5 py-4 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-900/50 dark:text-slate-400 lg:w-full">
                {isBn ? 'প্রথম বার্তা পাঠালে এখানে আপনার চ্যাট দেখা যাবে।' : 'Your chats will appear here after you send your first message.'}
              </p>
            )}
          </div>
        </aside>

        <main className="min-w-0 space-y-4">
          <section className="flex h-[min(62vh,680px)] min-h-[420px] flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5 dark:border-slate-700 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-indigo-100 text-violet-700 dark:from-violet-950 dark:to-indigo-950 dark:text-violet-300">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-800" />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">{isBn ? 'আপনার কথোপকথন' : 'Your conversation'}</h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{isBn ? 'নিরাপদে কথা বলুন, আমি শুনছি' : 'A calm space to talk things through'}</p>
                </div>
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 sm:inline-flex">
                <ShieldCheck className="h-3.5 w-3.5" />
                {isBn ? 'ব্যক্তিগত' : 'Private'}
              </span>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white p-4 dark:from-slate-900/50 dark:to-slate-800 sm:p-6">
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div key={m.id} className={`flex items-end gap-2.5 sm:gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    {!isUser && (
                      <div className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3.5 text-xs leading-relaxed shadow-sm sm:max-w-[78%] sm:text-sm ${
                      isUser
                        ? 'rounded-br-md bg-gradient-to-br from-emerald-600 to-teal-600 text-white'
                        : m.isCrisis
                          ? 'rounded-bl-md border border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-100'
                          : 'rounded-bl-md border border-slate-100 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-100'
                    }`}>
                      <div className="whitespace-pre-wrap">{m.content}</div>
                      <div className={`mt-2 flex items-center justify-between gap-4 text-[10px] ${
                        isUser ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'
                      }`}>
                        <span>{m.timestamp}</span>
                        {!isUser && m.source && (
                          <span>
                            {m.source === 'openai-gpt-4o-mini' || m.source === 'gemini-3.1-flash-lite' || m.source === 'gemini-3.8-flash'
                              ? 'Chatbot'
                              : m.source === 'wellness_scope_guard' ? 'MindCare Scope' : 'MindCare Engine'}
                          </span>
                        )}
                      </div>
                    </div>
                    {isUser && (
                      <div className="mb-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                        {currentUser?.name?.charAt(0).toUpperCase() || (isBn ? 'আ' : 'Y')}
                      </div>
                    )}
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-end gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-sm">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-slate-100 bg-white px-4 py-3.5 shadow-sm dark:border-slate-700 dark:bg-slate-700" aria-label={isBn ? 'উত্তর তৈরি হচ্ছে' : 'Preparing a response'}>
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:0.2s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500 [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-5">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" />
              <span>{isBn ? 'কথা শুরু করতে একটি বিষয় বেছে নিন' : 'Not sure what to say? Start with one of these'}</span>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {t.ai.quickPills.map((pill, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(pill)}
                  disabled={loading}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[11px] font-medium leading-relaxed text-slate-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-violet-700 dark:hover:bg-violet-950/40 dark:hover:text-violet-200 sm:text-xs"
                >
                  {pill}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 transition focus-within:border-violet-300 focus-within:ring-4 focus-within:ring-violet-500/10 dark:border-slate-700 dark:bg-slate-900/60 dark:focus-within:border-violet-700"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t.ai.placeholder}
                aria-label={t.ai.placeholder}
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-xs text-slate-900 outline-none placeholder:text-slate-400 dark:text-white sm:text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-violet-600/20 transition hover:from-violet-700 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 sm:px-5"
              >
                <span>{t.ai.send}</span>
                <Send className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] leading-relaxed text-slate-400 dark:text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{t.ai.safetyNotice}</span>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
