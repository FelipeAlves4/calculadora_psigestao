import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api, User } from './api';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  sessionNotice: string;
  refreshUser: () => Promise<User | null>;
  signIn: (email: string, password: string, remember: boolean) => Promise<User>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');
  const hadUser = useRef(false);

  const refreshUser = useCallback(async () => {
    try {
      const response = await api<{ user: User }>('/api/auth/me');
      setUser(response.user);
      hadUser.current = true;
      return response.user;
    } catch {
      setUser(null);
      if (hadUser.current) setSessionNotice('Sua sessão expirou. Entre novamente para continuar.');
      hadUser.current = false;
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const interval = window.setInterval(() => void refreshUser(), 30_000);
    const revalidate = () => void refreshUser();
    window.addEventListener('focus', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
    };
  }, [refreshUser]);

  const signIn = useCallback(async (email: string, password: string, remember: boolean) => {
    const response = await api<{ user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, remember }),
    });
    setUser(response.user);
    hadUser.current = true;
    setSessionNotice('');
    return response.user;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST', body: '{}' });
    } finally {
      setUser(null);
      hadUser.current = false;
      setSessionNotice('');
    }
  }, []);

  const value = useMemo(() => ({ user, loading, sessionNotice, refreshUser, signIn, signOut }), [user, loading, sessionNotice, refreshUser, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
};
