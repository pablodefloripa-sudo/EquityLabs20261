import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { User, Session } from '@supabase/supabase-js';

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

    // THEN handle OAuth code exchange (PKCE) + get initial session
    const init = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get('code');

        // If we returned from an OAuth provider, finalize the sign-in by exchanging the code.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            // Avoid logging tokens/codes; keep it minimal.
            console.error('OAuth code exchange failed');
          }

          // Clean up URL (remove code/state) after processing.
          url.searchParams.delete('code');
          url.searchParams.delete('state');
          const nextUrl = `${url.pathname}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ''}${url.hash}`;
          window.history.replaceState({}, document.title, nextUrl);
        }
      } finally {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;
        setAuthState({
          user: session?.user ?? null,
          session,
          isLoading: false,
        });
      }
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
        emailRedirectTo: window.location.origin,
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
