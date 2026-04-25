import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ImageIcon, AlertCircle, Eye, EyeOff, Loader2, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { API_URL } from '../../lib/api';
import Logo from '../../components/common/Logo';

declare global {
  interface Window {
    google?: {
      accounts: { id: {
        initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
        renderButton: (el: HTMLElement, o: { theme?: string; size?: string; width?: string; text?: string; shape?: string }) => void;
      }};
    };
  }
}

const ENV_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DASHBOARD_PATH = '/';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: '',
    avatar: null as File | null, coverImage: null as File | null,
  });
  const [showPw, setShowPw]             = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError]               = useState('');
  const [isLoading, setIsLoading]       = useState(false);
  const [googleClientId, setGoogleClientId] = useState(ENV_GOOGLE_CLIENT_ID);

  const navigate      = useNavigate();
  const googleRef     = useRef<HTMLDivElement | null>(null);
  const isGoogleInit  = useRef(false);
  const { register, loginWithGoogle } = useAuth();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  /* ── Google credential ── */
  const handleGoogleCredential = useCallback(async (r: { credential?: string }) => {
    if (!r.credential) { setError('Google signup failed.'); return; }
    setError(''); setIsLoading(true);
    try {
      await loginWithGoogle(r.credential);
      navigate(DASHBOARD_PATH, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google signup failed');
    } finally { setIsLoading(false); }
  }, [loginWithGoogle, navigate]);

  useEffect(() => {
    if (ENV_GOOGLE_CLIENT_ID) return;
    let mounted = true;
    void fetch(`${API_URL}/users/google-config`, { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => { if (mounted) setGoogleClientId(p?.data?.clientId || ''); })
      .catch(() => { if (mounted) setGoogleClientId(''); });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleRef.current) return;
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google || !googleRef.current || isGoogleInit.current) return;
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
      googleRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleRef.current, { theme: 'outline', size: 'large', width: '360', text: 'signup_with', shape: 'rectangular' });
      isGoogleInit.current = true;
    };
    if (window.google) { init(); return () => { cancelled = true; }; }
    const existing = document.getElementById('google-identity-client') as HTMLScriptElement | null;
    if (existing) { existing.addEventListener('load', init, { once: true }); return () => { cancelled = true; }; }
    const s = document.createElement('script');
    s.id = 'google-identity-client'; s.src = 'https://accounts.google.com/gsi/client';
    s.async = true; s.defer = true; s.onload = init;
    document.body.appendChild(s);
    return () => { cancelled = true; };
  }, [googleClientId, handleGoogleCredential]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); return; }
    if (!termsAccepted) { setError('Please accept the Terms and Privacy Policy'); return; }
    setIsLoading(true);
    try {
      await register(formData.fullName, formData.username, formData.email, formData.password,
        formData.avatar ?? undefined, formData.coverImage ?? undefined);
      navigate('/login', { replace: true, state: { message: 'Account created! Sign in to continue.' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed. Please try again.');
    } finally { setIsLoading(false); }
  };

  /* ── theme tokens ── */
  const pageBg  = isLight
    ? 'radial-gradient(ellipse at 30% 0%,rgba(237,233,254,0.9),transparent 55%), radial-gradient(ellipse at 70% 100%,rgba(221,214,254,0.7),transparent 55%), #F5F3FF'
    : 'radial-gradient(ellipse at 30% 0%,rgba(109,40,217,0.18),transparent 55%), radial-gradient(ellipse at 70% 100%,rgba(88,28,135,0.12),transparent 55%), #0F1729';
  const card    = isLight ? '#ffffff' : 'rgb(17 24 39)';
  const cardBdr = isLight ? 'rgba(221,214,254,0.8)' : 'rgba(51,65,85,0.5)';
  const textPri = isLight ? '#0f172a' : '#f8fafc';
  const textMut = isLight ? '#64748b' : '#94a3b8';
  const inputBg = isLight ? '#faf9ff' : 'rgba(15,23,42,0.8)';
  const inputBdr= isLight ? 'rgba(221,214,254,0.9)' : 'rgba(71,85,105,0.6)';
  const divBg   = card;

  const inputStyle = {
    width: '100%', padding: '11px 14px 11px 38px', borderRadius: '12px', fontSize: '14px',
    background: inputBg, border: `1.5px solid ${inputBdr}`, color: textPri, outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#7c3aed';
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)';
  };
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = inputBdr;
    e.currentTarget.style.boxShadow = 'none';
  };

  const FileBtn = ({ label, value, field }: { label: string; value: File | null; field: 'avatar' | 'coverImage' }) => (
    <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all hover:border-purple-400"
      style={{ border: `1.5px dashed ${value ? '#7c3aed' : inputBdr}`, background: inputBg }}>
      <Upload size={14} style={{ color: value ? '#7c3aed' : textMut, flexShrink: 0 }} />
      <span className="text-sm truncate" style={{ color: value ? textPri : textMut }}>
        {value ? value.name : label}
      </span>
      <input type="file" accept="image/*" className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setFormData((p) => ({ ...p, [field]: f }));
        }} />
    </label>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: pageBg }}>
      <div className="w-full max-w-lg" style={{ animation: 'fadeInUp 0.35s ease both' }}>

        {/* Card */}
        <div className="rounded-3xl overflow-hidden" style={{
          background: card, border: `1px solid ${cardBdr}`,
          boxShadow: isLight
            ? '0 24px 64px rgba(109,40,217,0.14), 0 8px 24px rgba(0,0,0,0.06)'
            : '0 24px 64px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.35)',
        }}>

          {/* Gradient header */}
          <div className="px-8 pt-8 pb-6 text-center"
            style={{ background: 'linear-gradient(135deg,#7c3aed 0%,#5b21b6 100%)' }}>
            <Logo className="justify-center mb-3" />
            <h1 className="text-xl font-bold text-white mt-1">Create your account</h1>
            <p className="text-purple-200 text-sm mt-1">Join the VidTube community today</p>
          </div>

          {/* Body */}
          <div className="px-7 py-6 space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}

            {/* Google */}
            {googleClientId
              ? <div className="flex justify-center"><div ref={googleRef} /></div>
              : <p className="text-center text-xs" style={{ color: textMut }}>Google sign-up not configured</p>}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: cardBdr }} />
              <span className="text-xs px-2" style={{ color: textMut, background: divBg }}>or register with email</span>
              <div className="flex-1 h-px" style={{ background: cardBdr }} />
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {/* Row: Full name + Username */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textMut }}>Full Name *</label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b5cf6' }} />
                    <input type="text" name="fullName" placeholder="Jane Doe" value={formData.fullName}
                      onChange={handleChange} required autoComplete="name"
                      style={{ ...inputStyle }} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textMut }}>Username *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold pointer-events-none" style={{ color: '#8b5cf6' }}>@</span>
                    <input type="text" name="username" placeholder="janedoe" value={formData.username}
                      onChange={handleChange} required autoComplete="username"
                      style={{ ...inputStyle }} onFocus={onFocus} onBlur={onBlur} />
                  </div>
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textMut }}>Email *</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b5cf6' }} />
                  <input type="email" name="email" placeholder="you@example.com" value={formData.email}
                    onChange={handleChange} required autoComplete="email"
                    style={{ ...inputStyle }} onFocus={onFocus} onBlur={onBlur} />
                </div>
              </div>

              {/* Row: Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textMut }}>Password *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b5cf6' }} />
                    <input type={showPw ? 'text' : 'password'} name="password" placeholder="Min 8 chars" value={formData.password}
                      onChange={handleChange} required autoComplete="new-password"
                      style={{ ...inputStyle, paddingRight: '42px' }} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: textMut }}>
                      {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textMut }}>Confirm *</label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b5cf6' }} />
                    <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" placeholder="Repeat password" value={formData.confirmPassword}
                      onChange={handleChange} required autoComplete="new-password"
                      style={{ ...inputStyle, paddingRight: '42px' }} onFocus={onFocus} onBlur={onBlur} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: textMut }}>
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Optional images */}
              <div>
                <label className="block text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: textMut }}>
                  Profile Images (optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <FileBtn label="Choose avatar…" value={formData.avatar} field="avatar" />
                  <FileBtn label="Choose cover…" value={formData.coverImage} field="coverImage" />
                </div>
              </div>

              {/* Terms */}
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-purple-600 shrink-0" />
                <span className="text-sm leading-snug" style={{ color: textMut }}>
                  I agree to the{' '}
                  <Link to="/terms" className="text-purple-500 hover:underline font-medium">Terms of Service</Link>
                  {' '}and{' '}
                  <Link to="/privacy" className="text-purple-500 hover:underline font-medium">Privacy Policy</Link>
                </span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                style={{
                  background: isLoading ? '#6d28d9aa' : 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                  boxShadow: isLoading ? 'none' : '0 8px 20px rgba(109,40,217,0.35)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}>
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Creating account…</> : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 text-center text-sm border-t" style={{ borderColor: cardBdr, color: textMut }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-purple-500 hover:text-purple-400 transition-colors">
              Sign in
            </Link>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link to="/" className="text-sm transition-colors hover:text-purple-400" style={{ color: textMut }}>
            ← Back to VidTube
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
