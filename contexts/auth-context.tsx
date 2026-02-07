import { createContext, useContext, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/auth-store';

interface AuthContextValue {
  isInitialized: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  isInitialized: false,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, setIsInitialized, fetchProfile, fetchAttorneyProfile, session, isInitialized } = useAuthStore();

  useEffect(() => {
    const loadProfile = async (userId: string) => {
      await fetchProfile(userId);
      const profile = useAuthStore.getState().profile;
      if (profile?.role === 'attorney') {
        fetchAttorneyProfile(userId);
      }
    };

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        loadProfile(currentSession.user.id);
      }
      setIsInitialized(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) {
        loadProfile(newSession.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setIsInitialized, fetchProfile, fetchAttorneyProfile]);

  return (
    <AuthContext.Provider
      value={{
        isInitialized,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
