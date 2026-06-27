-- Función para capturar y persistir tokens de Google OAuth
CREATE OR REPLACE FUNCTION public.handle_google_oauth_tokens()
RETURNS TRIGGER AS $$
DECLARE
  provider_token TEXT;
  provider_refresh_token TEXT;
  google_scopes TEXT[];
BEGIN
  -- Obtener tokens del raw_app_meta_data
  provider_token := NEW.raw_app_meta_data->>'provider_token';
  provider_refresh_token := NEW.raw_app_meta_data->>'provider_refresh_token';
  
  -- Solo procesar si hay un provider_token y el provider es google
  IF provider_token IS NOT NULL AND (NEW.raw_app_meta_data->>'provider') = 'google' THEN
    -- Definir los scopes que esperamos
    google_scopes := ARRAY['gmail.readonly', 'gmail.send', 'drive.readonly', 'calendar', 'spreadsheets'];
    
    -- Upsert en user_integrations para cada servicio de Google
    -- Gmail
    INSERT INTO public.user_integrations (user_id, provider, is_connected, access_token_encrypted, refresh_token_encrypted, scopes, connected_at)
    VALUES (NEW.id, 'gmail', TRUE, provider_token, provider_refresh_token, ARRAY['gmail.readonly', 'gmail.send'], NOW())
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET 
      is_connected = TRUE,
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
      scopes = EXCLUDED.scopes,
      connected_at = NOW();
    
    -- Drive
    INSERT INTO public.user_integrations (user_id, provider, is_connected, access_token_encrypted, refresh_token_encrypted, scopes, connected_at)
    VALUES (NEW.id, 'drive', TRUE, provider_token, provider_refresh_token, ARRAY['drive.readonly'], NOW())
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET 
      is_connected = TRUE,
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
      scopes = EXCLUDED.scopes,
      connected_at = NOW();
    
    -- Calendar
    INSERT INTO public.user_integrations (user_id, provider, is_connected, access_token_encrypted, refresh_token_encrypted, scopes, connected_at)
    VALUES (NEW.id, 'calendar', TRUE, provider_token, provider_refresh_token, ARRAY['calendar'], NOW())
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET 
      is_connected = TRUE,
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
      scopes = EXCLUDED.scopes,
      connected_at = NOW();
    
    -- Sheets
    INSERT INTO public.user_integrations (user_id, provider, is_connected, access_token_encrypted, refresh_token_encrypted, scopes, connected_at)
    VALUES (NEW.id, 'sheets', TRUE, provider_token, provider_refresh_token, ARRAY['spreadsheets'], NOW())
    ON CONFLICT (user_id, provider) 
    DO UPDATE SET 
      is_connected = TRUE,
      access_token_encrypted = EXCLUDED.access_token_encrypted,
      refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
      scopes = EXCLUDED.scopes,
      connected_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Agregar unique constraint para evitar duplicados
ALTER TABLE public.user_integrations 
ADD CONSTRAINT user_integrations_user_provider_unique 
UNIQUE (user_id, provider);

-- Crear trigger en auth.users (requiere permisos especiales, verificar si funciona)
-- NOTA: Este trigger puede no funcionar directamente en Supabase Cloud
-- La alternativa es manejar los tokens en el frontend después del callback
DROP TRIGGER IF EXISTS on_auth_user_google_oauth ON auth.users;
CREATE TRIGGER on_auth_user_google_oauth
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_google_oauth_tokens();