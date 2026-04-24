import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../lib/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';

interface LoginLocationState {
  message?: string;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              width?: string;
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const ENV_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DASHBOARD_PATH = '/';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(ENV_GOOGLE_CLIENT_ID);

  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const isGoogleInitialized = useRef(false);
  const { login, loginWithGoogle } = useAuth();

  const handleGoogleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError('Google login failed. Missing credential.');
        return;
      }

      setError('');
      setIsLoading(true);
      try {
        await loginWithGoogle(response.credential);
        navigate(DASHBOARD_PATH, { replace: true });
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : 'Google login failed');
      } finally {
        setIsLoading(false);
      }
    },
    [loginWithGoogle, navigate]
  );

  useEffect(() => {
    if (ENV_GOOGLE_CLIENT_ID) {
      return;
    }

    let isMounted = true;

    void fetch(`${API_URL}/users/google-config`, {
      credentials: 'include',
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unable to load Google auth config');
        }
        return response.json();
      })
      .then((payload) => {
        if (isMounted) {
          setGoogleClientId(payload?.data?.clientId || '');
        }
      })
      .catch(() => {
        if (isMounted) {
          setGoogleClientId('');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) {
      return;
    }

    let isCancelled = false;

    const initializeGoogle = () => {
      if (isCancelled || !window.google || !googleButtonRef.current || isGoogleInitialized.current) {
        return;
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '360',
        text: 'signin_with',
        shape: 'rectangular',
      });

      isGoogleInitialized.current = true;
    };

    if (window.google) {
      initializeGoogle();
      return () => {
        isCancelled = true;
      };
    }

    const existingScript = document.getElementById('google-identity-client') as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogle, { once: true });
      return () => {
        isCancelled = true;
      };
    }

    const script = document.createElement('script');
    script.id = 'google-identity-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);

    return () => {
      isCancelled = true;
    };
  }, [googleClientId, handleGoogleCredential]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(identifier, password);
      navigate(DASHBOARD_PATH, { replace: true });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Invalid email, username, or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-slate-800 p-8 rounded-lg shadow-lg max-w-md w-full">
        <button
          type="button"
          onClick={() => navigate(DASHBOARD_PATH, { replace: true })}
          className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white mb-6"
        >
          <ArrowLeft size={16} />
          <span>Back to dashboard</span>
        </button>

        <div className="text-center mb-6">
          <Logo className="justify-center mb-4" />
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-gray-400">Sign in to your account</p>
        </div>

        {locationState?.message && (
          <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-lg mb-4">
            {locationState.message}
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-4 flex justify-center">
          {googleClientId ? (
            <div ref={googleButtonRef} />
          ) : (
            <p className="text-xs text-gray-400">Google login not configured. Add `GOOGLE_CLIENT_ID` in backend `.env`.</p>
          )}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-800 px-2 text-gray-400">or continue with password</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email or Username</label>
              <Input
                type="text"
                placeholder="your@email.com or johndoe"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                icon={<Mail size={18} />}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={18} />}
                autoComplete={rememberMe ? 'current-password' : 'off'}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <label htmlFor="remember-me" className="flex items-center text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                />
                <span className="ml-2">Remember me</span>
              </label>

              <Link to="/support" className="text-sm text-purple-500 hover:underline">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-purple-500 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

