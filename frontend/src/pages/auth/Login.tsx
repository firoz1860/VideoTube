import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle, CheckCircle, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { API_URL } from '../../lib/api';
import Logo from '../../components/common/Logo';

interface LoginLocationState { message?: string }

declare global {
  interface Window {
    google?: {
      accounts: { id: {
        initialize: (o: { client_id: string; callback: (r: { credential?: string }) => void }) => void;
        renderButton: (el: HTMLElement, o: { theme?: string; size?: string; width?: string; text?: string; shape?: string }) => void;
        prompt: () => void;
      }};
    };
  }
}

const ENV_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DASHBOARD_PATH = '/';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [showPw, setShowPw]         = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError]           = useState('');
  const [isLoading, setIsLoading]   = useState(false);
  const [googleClientId, setGoogleClientId] = useState(ENV_GOOGLE_CLIENT_ID);

  const navigate       = useNavigate();
  const location       = useLocation();
  const locationState  = location.state as LoginLocationState | null;
  const googleRef      = useRef<HTMLDivElement | null>(null);
  const isGoogleInit   = useRef(false);
  const { login, loginWithGoogle } = useAuth();
  const { resolvedTheme } = useTheme();
  const isLight = resolvedTheme === 'light';

  /* ── Google credential handler ── */
  const handleGoogleCredential = useCallback(async (r: { credential?: string }) => {
    if (!r.credential) { setError('Google login failed. Missing credential.'); return; }
    setError(''); setIsLoading(true);
    try {
      await loginWithGoogle(r.credential);
      navigate(DASHBOARD_PATH, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Google login failed');
    } finally { setIsLoading(false); }
  }, [loginWithGoogle, navigate]);

  /* ── Load Google client ID from backend if not in env ── */
  useEffect(() => {
    if (ENV_GOOGLE_CLIENT_ID) return;
    let mounted = true;
    void fetch(`${API_URL}/users/google-config`, { credentials: 'include' })
      .then((r) => r.json())
      .then((p) => { if (mounted) setGoogleClientId(p?.data?.clientId || ''); })
      .catch(() => { if (mounted) setGoogleClientId(''); });
    return () => { mounted = false; };
  }, []);

  /* ── Render Google button ── */
  useEffect(() => {
    if (!googleClientId || !googleRef.current) return;
    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google || !googleRef.current || isGoogleInit.current) return;
      window.google.accounts.id.initialize({ client_id: googleClientId, callback: handleGoogleCredential });
      googleRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleRef.current, { theme: 'outline', size: 'large', width: '360', text: 'signin_with', shape: 'rectangular' });
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

  /* ── Form submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setIsLoading(true);
    try {
      await login(identifier, password);
      navigate(DASHBOARD_PATH, { replace: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid email, username, or password');
    } finally { setIsLoading(false); }
  };

  /* ── Theme tokens ── */
  const pageBg  = isLight
    ? 'radial-gradient(ellipse at 30% 0%,rgba(237,233,254,0.9),transparent 55%), radial-gradient(ellipse at 70% 100%,rgba(221,214,254,0.7),transparent 55%), #F5F3FF'
    : 'radial-gradient(ellipse at 30% 0%,rgba(109,40,217,0.18),transparent 55%), radial-gradient(ellipse at 70% 100%,rgba(88,28,135,0.12),transparent 55%), #0F1729';
  const card    = isLight ? '#ffffff' : 'rgb(17 24 39)';
  const cardBdr = isLight ? 'rgba(221,214,254,0.8)' : 'rgba(51,65,85,0.5)';
  const textPri = isLight ? '#0f172a' : '#f8fafc';
  const textMut = isLight ? '#64748b' : '#94a3b8';
  const divBg   = isLight ? '#ffffff' : 'rgb(17 24 39)';
  const inputBg = isLight ? '#faf9ff' : 'rgba(15,23,42,0.8)';
  const inputBdr= isLight ? 'rgba(221,214,254,0.9)' : 'rgba(71,85,105,0.6)';

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: pageBg }}>
      <div className="w-full max-w-md" style={{ animation: 'fadeInUp 0.35s ease both' }}>

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
            <h1 className="text-xl font-bold text-white mt-1">Welcome back</h1>
            <p className="text-purple-200 text-sm mt-1">Sign in to your VidTube account</p>
          </div>

          {/* Body */}
          <div className="px-7 py-6 space-y-4">

            {/* Success toast */}
            {locationState?.message && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', color: '#16a34a' }}>
                <CheckCircle size={15} className="shrink-0" /> {locationState.message}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', color: '#dc2626' }}>
                <AlertCircle size={15} className="shrink-0" /> {error}
              </div>
            )}

            {/* Google button */}
            {googleClientId ? (
              <div className="flex justify-center"><div ref={googleRef} /></div>
            ) : (
              <p className="text-center text-xs" style={{ color: textMut }}>
                Google sign-in not configured — add VITE_GOOGLE_CLIENT_ID
              </p>
            )}

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: cardBdr }} />
              <span className="text-xs px-2" style={{ color: textMut, background: divBg }}>or continue with email</span>
              <div className="flex-1 h-px" style={{ background: cardBdr }} />
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {/* Identifier */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textMut }}>
                  Email or Username
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b5cf6' }} />
                  <input type="text" placeholder="you@example.com" value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)} required autoComplete="username"
                    style={{
                      width: '100%', padding: '11px 14px 11px 38px', borderRadius: '12px', fontSize: '14px',
                      background: inputBg, border: `1.5px solid ${inputBdr}`, color: textPri, outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = inputBdr; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: textMut }}>
                  Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8b5cf6' }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={password}
                    onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"
                    style={{
                      width: '100%', padding: '11px 42px 11px 38px', borderRadius: '12px', fontSize: '14px',
                      background: inputBg, border: `1.5px solid ${inputBdr}`, color: textPri, outline: 'none',
                      transition: 'border-color 0.2s, box-shadow 0.2s',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = inputBdr; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: textMut }}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: textMut }}>
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded accent-purple-600" />
                  Remember me
                </label>
                <Link to="/support" className="text-sm font-medium text-purple-500 hover:text-purple-400 transition-colors">
                  Forgot password?
                </Link>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm text-white transition-all active:scale-[0.98]"
                style={{
                  background: isLoading ? '#6d28d9aa' : 'linear-gradient(135deg,#7c3aed,#5b21b6)',
                  boxShadow: isLoading ? 'none' : '0 8px 20px rgba(109,40,217,0.35)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                }}>
                {isLoading ? <><Loader2 size={16} className="animate-spin" /> Signing In…</> : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-7 py-4 text-center text-sm border-t" style={{ borderColor: cardBdr, color: textMut }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-purple-500 hover:text-purple-400 transition-colors">
              Create one free
            </Link>
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-5">
          <Link to="/" className="text-sm transition-colors hover:text-purple-400" style={{ color: textMut }}>
            ← Back to VidTube
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
