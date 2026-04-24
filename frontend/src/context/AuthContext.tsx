import { createContext, useCallback, useContext, useEffect, useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { API_URL } from '../lib/api';

interface BackendUser {
  _id?: string;
  id?: string;
  fullName?: string;
  name?: string;
  username?: string;
  avatar?: string;
  email?: string;
  coverImage?: string;
  subscribers?: number;
  subscriberCount?: number;
}

export interface AuthUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  email?: string;
  coverImage?: string;
  subscribers?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  register: (
    fullName: string,
    username: string,
    email: string,
    password: string,
    avatar?: File,
    coverImage?: File
  ) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  user: AuthUser | null;
  setUser: Dispatch<SetStateAction<AuthUser | null>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const normalizeUser = (user: BackendUser): AuthUser | null => {
  const id = user._id || user.id || '';

  if (!id) {
    return null;
  }

  return {
    id,
    name: user.fullName || user.name || 'User',
    username: user.username || '',
    avatar: user.avatar || '',
    email: user.email,
    coverImage: user.coverImage,
    subscribers: user.subscribers ?? user.subscriberCount ?? 0,
  };
};

const getErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const payload = await response.json();
    return payload.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
};

const fetchCurrentUser = async () => {
  const response = await fetch(`${API_URL}/users/current-user`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to fetch current user'));
  }

  const payload = await response.json();
  const user = normalizeUser(payload.data || {});

  if (!user) {
    throw new Error('Current user payload is missing an id');
  }

  return user;
};

const refreshSession = async () => {
  const response = await fetch(`${API_URL}/users/refresh-token`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Session refresh failed'));
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  const checkAuth = useCallback(async () => {
    setIsLoading(true);

    try {
      const currentUser = await fetchCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
    } catch {
      try {
        await refreshSession();
        const currentUser = await fetchCurrentUser();
        setUser(currentUser);
        setIsAuthenticated(true);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);

    try {
      const trimmedIdentifier = identifier.trim();
      const isEmail = trimmedIdentifier.includes('@');
      const response = await fetch(`${API_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(
          isEmail ? { email: trimmedIdentifier, password } : { username: trimmedIdentifier, password }
        ),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Invalid login credentials'));
      }

      const payload = await response.json();
      const nextUser = normalizeUser(payload.data || {});

      if (!nextUser) {
        throw new Error('Login response did not include a valid user id');
      }

      setUser(nextUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/google-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Google login failed'));
      }

      const payload = await response.json();
      const nextUser = normalizeUser(payload.data || {});

      if (!nextUser) {
        throw new Error('Google login response did not include a valid user id');
      }

      setUser(nextUser);
      setIsAuthenticated(true);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    fullName: string,
    username: string,
    email: string,
    password: string,
    avatar?: File,
    coverImage?: File
  ) => {
    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);

    if (avatar) {
      formData.append('avatar', avatar);
    }

    if (coverImage) {
      formData.append('coverImage', coverImage);
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/users/register`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Registration failed'));
      }

      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/users/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, isLoading, login, loginWithGoogle, register, logout, checkAuth, user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
