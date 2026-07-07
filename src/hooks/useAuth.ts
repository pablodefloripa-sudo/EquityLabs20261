import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { User, Session } from '@supabase/supabase-js';
import { buildAuthRedirectUrl } from '@/lib/auth-redirect';

interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!isMounted) return;
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
        });
      }
    );

    // Then read the initial session state.
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!isMounted) return;
      setAuthState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      });
    };

    init();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: buildAuthRedirectUrl('/auth'),
      },
    });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return {
    user: authState.user,
    session: authState.session,
    isLoading: authState.isLoading,
    isAuthenticated: !!authState.session,
    signIn,
    signUp,
    signOut,
  };
};
