import React, { useEffect, useRef, useState } from 'react';
import {
  HelpCircle, Mail, Phone, MessageSquare, Send, Bot,
  User, ChevronDown, Loader2, AlertCircle, CheckCircle,
  Sparkles, BellOff, Trash2, Check,
} from 'lucide-react';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useTheme } from '../../context/ThemeContext';

// ─── EmailJS via REST (no npm package) ───────────────────────────────────────
const EJS_SERVICE  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined;
const EJS_TEMPLATE = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
const EJS_KEY      = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined;

async function sendViaEmailJS(params: Record<string, string>): Promise<void> {
  if (!EJS_SERVICE || !EJS_TEMPLATE || !EJS_KEY) {
    throw new Error('EmailJS not configured. Add the three VITE_EMAILJS_* vars to your .env.');
  }
  const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id:      EJS_SERVICE,
      template_id:     EJS_TEMPLATE,
      user_id:         EJS_KEY,
      template_params: params,   // keys must match {{variables}} in your EmailJS template
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`EmailJS ${res.status}: ${body}`);
  }
}

// ─── Gemini AI ────────────────────────────────────────────────────────────────
const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_URL = GEMINI_KEY
  ? `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`
  : '';

const SYSTEM_PROMPT =
  "You are VidTube's friendly AI support assistant. VidTube is a YouTube-like MERN-stack video platform. " +
  "Help users with: uploading videos, managing channel, subscriptions, playlists, watch history, " +
  "account settings, profile/avatar updates, password changes, and troubleshooting. " +
  "Be concise, warm, and use bullet points for lists.";

interface GPart   { text: string }
interface GMsg    { role: 'user' | 'model'; parts: GPart[] }
interface ChatMsg { role: 'user' | 'bot'; text: string; ts: number }

async function askGemini(history: GMsg[], userText: string): Promise<string> {
  if (!GEMINI_URL) throw new Error('NO_KEY');
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
      contents: [...history, { role: 'user', parts: [{ text: userText }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: { message?: string } };
    throw new Error(err?.error?.message ?? `Gemini ${res.status}`);
  }
  const data = await res.json() as { candidates?: { content?: { parts?: { text: string }[] } }[] };
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';
}

// ─── FAQ data ─────────────────────────────────────────────────────────────────
const FAQ = [
  { q: 'How do I upload a video?', a: "Click the Upload icon in the navbar or go to My Content → Upload Video. Max 50 MB. Supported: MP4, WebM, OGG." },
  { q: 'How do I change my channel name or avatar?', a: 'Settings → Channel Info for username · Settings → Personal Info for name and profile picture.' },
  { q: 'Why are my old videos not playing?', a: 'Videos uploaded while running locally (localhost) have broken URLs in production. Re-upload them — new uploads go to Cloudinary.' },
  { q: 'How do I enable push notifications?', a: "Click the 🔔 bell in the navbar → click Allow when prompted. You'll then get browser notifications for new videos from subscribed channels." },
  { q: 'How do I reset my password?', a: 'Settings → Password. Enter your current password and choose a new one (minimum 8 characters).' },
  { q: 'Why am I getting an Unauthorized error?', a: 'Your session expired. Sign out and sign back in. On Render, set NODE_ENV=production so cookies use Secure + SameSite=None.' },
];

// ─── Component ────────────────────────────────────────────────────────────────
const Support: React.FC = () => {
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'contact'>('chat');

  /* Contact form */
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [formError, setFormError] = useState('');

  /* Chat */
  const [messages, setMessages] = useState<ChatMsg[]>([{
    role: 'bot',
    text: "👋 Hi! I'm VidTube's AI assistant. Ask me anything about the platform uploads, account settings, troubleshooting, and more!",
    ts: Date.now(),
  }]);
  const [history, setHistory] = useState<GMsg[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatError, setChatError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput('');
    setChatError('');
    setMessages((p) => [...p, { role: 'user', text, ts: Date.now() }]);
    setIsTyping(true);
    try {
      const reply = await askGemini(history, text);
      setHistory((p) => [...p, { role: 'user', parts: [{ text }] }, { role: 'model', parts: [{ text: reply }] }]);
      setMessages((p) => [...p, { role: 'bot', text: reply, ts: Date.now() }]);
    } catch (e) {
      const msg = e instanceof Error && e.message === 'NO_KEY'
        ? 'Add VITE_GEMINI_API_KEY to your .env to enable AI.'
        : e instanceof Error ? e.message : 'Failed to get a response.';
      setChatError(msg);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    setFormError('');
    try {
      // Pass ONLY variables that exist in your EmailJS template
      await sendViaEmailJS({
        from_name:  form.name,
        from_email: form.email,
        phone:      form.phone || 'Not provided',
        subject:    form.subject,
        message:    form.message,
      });
      setFormStatus('sent');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      setTimeout(() => setFormStatus('idle'), 5000);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Failed to send.');
      setFormStatus('error');
    }
  };

  /* ── theme tokens ── */
  const surface  = isLight ? '#ffffff' : 'rgb(22 32 50)';
  const surface2 = isLight ? 'rgb(245 243 255)' : 'rgb(15 23 42)';
  const border   = isLight ? 'rgb(221 214 254)' : 'rgba(51,65,85,0.6)';
  const textPri  = isLight ? '#0f172a' : '#f8fafc';
  const textMut  = isLight ? '#475569' : '#94a3b8';
  const textFnt  = isLight ? '#94a3b8' : '#475569';
  const hover    = isLight ? 'rgb(245 243 255)' : 'rgba(30,41,59,0.7)';
  const userBub  = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
  const botBub   = isLight ? '#f5f3ff' : 'rgba(30,41,59,0.9)';
  const botText  = isLight ? '#1e1b4b' : '#e2e8f0';

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2.5 rounded-xl" style={{ background: 'rgba(124,58,237,0.12)' }}>
          <HelpCircle className="w-5 h-5 text-purple-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Support Center</h1>
          <p className="text-sm mt-0.5" style={{ color: textMut }}>Get help, answers, and contact our team</p>
        </div>
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { href: 'mailto:danishahmedpro@gmail.com', Icon: Mail,     title: 'Email Us',    sub: 'danishahmedpro@gmail.com', note: 'Reply within 24 hrs' },
          { href: 'tel:+15551234567',           Icon: Phone,    title: 'Call Us',     sub: '+91 9315742128',   note: 'Mon–Fri · 9AM–6PM'  },
        ].map(({ href, Icon, title, sub, note }) => (
          <a key={href} href={href}
            className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 group"
            style={{ background: surface, border: `1px solid ${border}`, boxShadow: isLight ? '0 2px 8px rgba(109,40,217,0.06)' : 'none' }}>
            <div className="p-3 rounded-xl transition-colors" style={{ background: 'rgba(124,58,237,0.1)' }}>
              <Icon className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: textPri }}>{title}</p>
              <p className="text-xs mt-0.5" style={{ color: textMut }}>{sub}</p>
              <p className="text-xs mt-0.5" style={{ color: textFnt }}>{note}</p>
            </div>
          </a>
        ))}

        <button onClick={() => setActiveTab('chat')}
          className="flex items-center gap-4 p-5 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 group text-left"
          style={{ background: surface, border: `1px solid ${border}`, boxShadow: isLight ? '0 2px 8px rgba(109,40,217,0.06)' : 'none' }}>
          <div className="p-3 rounded-xl" style={{ background: 'rgba(124,58,237,0.1)' }}>
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: textPri }}>AI Live Chat</p>
            <p className="text-xs mt-0.5" style={{ color: textMut }}>Powered by Gemini</p>
            <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: '#4ade80' }}>
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" style={{ animation: 'bounce 2s ease-in-out infinite' }} />
              Online 24 / 7
            </p>
          </div>
        </button>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── FAQ ── */}
        <div>
          <h2 className="text-lg font-bold mb-4">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <div key={i} className="rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: surface, border: `1px solid ${openFaq === i ? 'rgba(124,58,237,0.4)' : border}` }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3.5 text-left gap-4 transition-colors"
                  style={{ color: textPri }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = hover)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span className="font-medium text-sm">{item.q}</span>
                  <span className="shrink-0 text-purple-400 transition-transform duration-300"
                    style={{ display: 'inline-block', transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0)' }}>
                    <ChevronDown size={16} />
                  </span>
                </button>
                <div style={{
                  maxHeight: openFaq === i ? '160px' : '0px',
                  opacity: openFaq === i ? 1 : 0,
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease, opacity 0.25s ease',
                }}>
                  <p className="px-4 pb-4 text-sm leading-relaxed" style={{ color: textMut, borderTop: `1px solid ${border}`, paddingTop: '12px' }}>
                    {item.a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right panel ── */}
        <div>
          {/* Tab bar */}
          <div className="flex p-1 rounded-2xl mb-4 gap-1" style={{ background: surface2, border: `1px solid ${border}` }}>
            {(['chat', 'contact'] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={activeTab === tab
                  ? { background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', boxShadow: '0 4px 12px rgba(109,40,217,0.35)' }
                  : { color: textMut }}>
                {tab === 'chat' ? <><Sparkles size={14} /> AI Chat</> : <><MessageSquare size={14} /> Contact Form</>}
              </button>
            ))}
          </div>

          {/* ── CHAT PANEL ── */}
          {activeTab === 'chat' && (
            <div className="flex flex-col rounded-2xl overflow-hidden" style={{
              height: '500px', background: surface, border: `1px solid ${border}`,
              boxShadow: isLight ? '0 4px 20px rgba(109,40,217,0.08)' : '0 4px 20px rgba(0,0,0,0.3)',
            }}>
              {/* Chat header */}
              <div className="flex items-center justify-between px-4 py-3.5" style={{
                background: isLight ? 'linear-gradient(135deg,rgba(124,58,237,0.08),rgba(109,40,217,0.04))' : 'rgba(15,23,42,0.9)',
                borderBottom: `1px solid ${border}`,
              }}>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                      <Bot size={16} className="text-white" />
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2"
                      style={{ borderColor: surface }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm" style={{ color: textPri }}>VidTube AI</p>
                    {/* <p className="text-xs" style={{ color: '#4ade80' }}>● Online · Gemini 2.0 Flash</p> */}
                  </div>
                </div>
                {messages.length > 1 && (
                  <button onClick={() => {
                    setMessages([messages[0]]);
                    setHistory([]);
                    setChatError('');
                  }}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
                    style={{ color: textFnt }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = hover)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    title="Clear chat">
                    <Trash2 size={11} /> Clear
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex items-end gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    style={{ animation: 'fadeInUp 0.25s ease both' }}>

                    {/* Avatar */}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mb-1"
                      style={{ background: msg.role === 'bot' ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : (isLight ? '#e2d9f3' : '#334155') }}>
                      {msg.role === 'bot'
                        ? <Bot size={13} className="text-white" />
                        : <User size={13} style={{ color: isLight ? '#6d28d9' : '#94a3b8' }} />}
                    </div>

                    {/* Bubble */}
                    <div style={{
                      maxWidth: '78%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'bot' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                      background: msg.role === 'user' ? userBub : botBub,
                      color: msg.role === 'user' ? '#fff' : botText,
                      fontSize: '13px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap',
                      boxShadow: msg.role === 'bot'
                        ? (isLight ? '0 2px 8px rgba(109,40,217,0.08)' : '0 2px 8px rgba(0,0,0,0.2)')
                        : '0 4px 12px rgba(109,40,217,0.3)',
                      border: msg.role === 'bot' ? `1px solid ${isLight ? 'rgba(124,58,237,0.15)' : 'rgba(51,65,85,0.6)'}` : 'none',
                    }}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex items-end gap-2" style={{ animation: 'fadeInUp 0.2s ease both' }}>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#5b21b6)' }}>
                      <Bot size={13} className="text-white" />
                    </div>
                    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-bl-sm"
                      style={{ background: botBub, border: `1px solid ${isLight ? 'rgba(124,58,237,0.15)' : 'rgba(51,65,85,0.6)'}` }}>
                      {[0, 0.18, 0.36].map((delay, d) => (
                        <span key={d} className="w-2.5 h-2.5 rounded-full block"
                          style={{ background: '#8b5cf6', animation: `bounce 1.1s ease-in-out ${delay}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                {chatError && (
                  <div className="flex items-center gap-2 text-xs px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                    <AlertCircle size={13} className="shrink-0" /> {chatError}
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input bar */}
              <div className="px-3 pb-3 pt-2.5" style={{ borderTop: `1px solid ${border}` }}>
                {!GEMINI_KEY && (
                  <p className="text-center mb-2 text-xs flex items-center justify-center gap-1.5" style={{ color: '#f59e0b' }}>
                    <BellOff size={11} /> Add <code style={{ background: isLight ? '#e2e8f0' : '#1e293b', padding: '1px 4px', borderRadius: '4px' }}>VITE_GEMINI_API_KEY</code> to .env
                  </p>
                )}
                <div className="flex gap-2">
                  <input ref={inputRef} type="text"
                    placeholder="Ask anything about VidTube…"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                    disabled={isTyping}
                    style={{
                      flex: 1, padding: '10px 14px', borderRadius: '14px', fontSize: '13px',
                      background: isLight ? 'rgb(245 243 255)' : 'rgba(15,23,42,0.8)',
                      border: `1px solid ${border}`, color: textPri,
                      outline: 'none', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#7c3aed')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = border)}
                  />
                  <button onClick={() => void sendMessage()} disabled={isTyping || !input.trim()}
                    style={{
                      padding: '10px 14px', borderRadius: '14px',
                      background: input.trim() && !isTyping ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : (isLight ? 'rgb(237 233 254)' : '#1e293b'),
                      color: input.trim() && !isTyping ? '#fff' : textFnt,
                      transition: 'all 0.2s', cursor: input.trim() && !isTyping ? 'pointer' : 'not-allowed',
                      border: 'none',
                    }}>
                    {isTyping ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
                  </button>
                </div>
                <p className="text-center mt-2 text-xs" style={{ color: textFnt }}>
                  Powered by Google Gemini 2.0 Flash
                </p>
              </div>
            </div>
          )}

          {/* ── CONTACT FORM ── */}
          {activeTab === 'contact' && (
            <div className="rounded-2xl p-5 sm:p-6" style={{ background: surface, border: `1px solid ${border}` }}>
              {formStatus === 'sent' ? (
                <div className="text-center py-12" style={{ animation: 'fadeInUp 0.3s ease both' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.3)' }}>
                    <CheckCircle size={30} style={{ color: '#22c55e' }} />
                  </div>
                  <h3 className="font-bold text-lg mb-2" style={{ color: textPri }}>Message Sent!</h3>
                  <p className="text-sm" style={{ color: textMut }}>We'll reply within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={(e) => void handleContact(e)} className="space-y-4">
                  {formStatus === 'error' && formError && (
                    <div className="flex items-start gap-2 text-sm px-3 py-3 rounded-xl"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                      <AlertCircle size={15} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Send failed</p>
                        <p className="text-xs mt-0.5 opacity-80">{formError}</p>
                        <p className="text-xs mt-1 opacity-70">Ensure your EmailJS template has: from_name, from_email, phone, subject, message</p>
                      </div>
                    </div>
                  )}

                  {!EJS_SERVICE && (
                    <div className="text-xs px-3 py-2.5 rounded-xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                      ⚠️ Add VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID and VITE_EMAILJS_PUBLIC_KEY to your .env
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textFnt }}>Full Name *</label>
                      <Input type="text" placeholder="Jane Doe" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textFnt }}>Email *</label>
                      <Input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textFnt }}>Phone (optional)</label>
                      <Input type="tel" placeholder="+1 (555) 000-0000" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textFnt }}>Subject *</label>
                      <Input type="text" placeholder="e.g. Upload issue" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} required />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textFnt }}>Message *</label>
                    <textarea value={form.message} onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                      placeholder="Describe your issue…" rows={5} required
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '13px', resize: 'none',
                        background: isLight ? 'rgb(245 243 255)' : 'rgba(15,23,42,0.6)',
                        border: `1px solid ${border}`, color: textPri, outline: 'none', transition: 'border-color 0.2s',
                      }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = '#7c3aed')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = border)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={formStatus === 'sending'}>
                      {formStatus === 'sending'
                        ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Sending…</span>
                        : <span className="flex items-center gap-2"><Send size={14} />Send Message</span>}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Support;
