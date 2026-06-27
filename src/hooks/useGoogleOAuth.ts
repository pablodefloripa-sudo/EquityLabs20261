import { useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/runtime-client';
import { useToast } from '@/hooks/use-toast';

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
].join(' ');

interface UseGoogleOAuthReturn {
  connectGoogle: () => Promise<void>;
  handleOAuthCallback: () => Promise<void>;
}

export const useGoogleOAuth = (): UseGoogleOAuthReturn => {
  const { toast } = useToast();

  // Función para iniciar OAuth con Google
  const connectGoogle = useCallback(async () => {
    try {
      // IMPORTANT: redirect to a public route so the OAuth callback can complete
      // before any authenticated-route guards run.
      const redirectUrl = `${window.location.origin}/auth`;
      
      // Detectar si estamos en dominio custom
      const isCustomDomain =
        !window.location.hostname.includes('lovable.app') &&
        !window.location.hostname.includes('lovableproject.com');

      if (isCustomDomain) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            skipBrowserRedirect: true,
            scopes: GOOGLE_SCOPES,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
        }
      } else {
        // Para dominios lovable.app
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: redirectUrl,
            scopes: GOOGLE_SCOPES,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error connecting to Google:', error);
      toast({
        title: 'Error de conexión',
        description: 'No se pudo conectar con Google. Intentá de nuevo.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Manejar callback después del OAuth
  const handleOAuthCallback = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) throw error;
      
      if (session?.provider_token) {
        console.log('✅ Google OAuth tokens received');
        
        // Guardar tokens en user_integrations manualmente (backup al trigger)
        const providers = ['gmail', 'drive', 'calendar', 'sheets'];
        const scopesMap: Record<string, string[]> = {
          gmail: ['gmail.readonly', 'gmail.send'],
          drive: ['drive.readonly'],
          calendar: ['calendar'],
          sheets: ['spreadsheets'],
        };

        for (const provider of providers) {
          const { error: upsertError } = await supabase
            .from('user_integrations')
            .upsert({
              user_id: session.user.id,
              provider,
              is_connected: true,
              access_token_encrypted: session.provider_token,
              refresh_token_encrypted: session.provider_refresh_token || null,
              scopes: scopesMap[provider],
              connected_at: new Date().toISOString(),
            }, {
              onConflict: 'user_id,provider',
            });

          if (upsertError) {
            console.error(`Error saving ${provider} integration:`, upsertError);
          }
        }

        toast({
          title: '✅ Google conectado',
          description: 'Gmail, Drive, Calendar y Sheets están listos.',
        });
      }
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
    }
  }, [toast]);

  // Verificar si venimos de un callback OAuth al montar
  useEffect(() => {
    const checkOAuthCallback = async () => {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const queryParams = new URLSearchParams(window.location.search);
      
      // Verificar si hay tokens en la URL (callback de OAuth)
      if (hashParams.get('access_token') || queryParams.get('code')) {
        await handleOAuthCallback();
        
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    };

    checkOAuthCallback();
  }, [handleOAuthCallback]);

  return { connectGoogle, handleOAuthCallback };
};
