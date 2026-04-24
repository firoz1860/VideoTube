import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User, ImageIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../lib/api';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Logo from '../../components/common/Logo';

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
        };
      };
    };
  }
}

const ENV_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const DASHBOARD_PATH = '/';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null as File | null,
    coverImage: null as File | null,
  });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleClientId, setGoogleClientId] = useState(ENV_GOOGLE_CLIENT_ID);

  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement | null>(null);
  const isGoogleInitialized = useRef(false);
  const { register, loginWithGoogle } = useAuth();

  const handleGoogleCredential = useCallback(
    async (response: { credential?: string }) => {
      if (!response.credential) {
        setError('Google signup failed. Missing credential.');
        return;
      }

      setError('');
      setIsLoading(true);
      try {
        await loginWithGoogle(response.credential);
        navigate(DASHBOARD_PATH, { replace: true });
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : 'Google signup failed');
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
        text: 'signup_with',
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      [field]: file,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the terms and privacy policy');
      return;
    }

    setIsLoading(true);

    try {
      await register(
        formData.fullName,
        formData.username,
        formData.email,
        formData.password,
        formData.avatar ?? undefined,
        formData.coverImage ?? undefined
      );

      navigate('/login', {
        replace: true,
        state: {
          message: 'Account created successfully. Sign in to continue.',
        },
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Registration failed. Please try again.');
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
          <h1 className="text-2xl font-bold">Create an account</h1>
          <p className="text-gray-400">Join the VidTube community</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="mb-4 flex justify-center">
          {googleClientId ? (
            <div ref={googleButtonRef} />
          ) : (
            <p className="text-xs text-gray-400">Google signup not configured. Add `GOOGLE_CLIENT_ID` in backend `.env`.</p>
          )}
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-slate-800 px-2 text-gray-400">or create with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                icon={<User size={18} />}
                autoComplete="name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <Input
                type="text"
                placeholder="johndoe"
                name="username"
                value={formData.username}
                onChange={handleChange}
                icon={<User size={18} />}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                name="email"
                value={formData.email}
                onChange={handleChange}
                icon={<Mail size={18} />}
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                placeholder="Create a password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                icon={<Lock size={18} />}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <Input
                type="password"
                placeholder="Confirm your password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                icon={<Lock size={18} />}
                autoComplete="new-password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Avatar</label>
              <label className="flex items-center gap-3 bg-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-600">
                <ImageIcon size={18} />
                <span>{formData.avatar?.name || 'Choose avatar image (optional)'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'avatar')} className="hidden" />
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Cover Image</label>
              <label className="flex items-center gap-3 bg-slate-700 px-4 py-2 rounded-lg cursor-pointer hover:bg-slate-600">
                <ImageIcon size={18} />
                <span>{formData.coverImage?.name || 'Choose cover image (optional)'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'coverImage')} className="hidden" />
              </label>
            </div>

            <label htmlFor="terms" className="flex items-start text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                id="terms"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="h-4 w-4 mt-0.5 rounded border-gray-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
              />
              <span className="ml-2 block">
                I agree to the{' '}
                <Link to="/terms" className="text-purple-500 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-purple-500 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-500 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

