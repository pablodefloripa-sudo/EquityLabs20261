# Rotación de secretos — EquityLabs

Fecha de preparación local: 2026-07-19.

## Por qué rotar

Hay archivos `.env` locales con valores reales (frontend + Edge Functions).  
Un blob histórico de `.env` en git solo tenía placeholders vacíos, pero **los secretos en disco se consideran expuestos** si la carpeta del Desktop se compartió, se subió a un zip, o se sincronizó a la nube.

Backup local (fuera del repo, no commitear):

`C:\Users\pablo\Desktop\EQUITYLABS CODEX\.secrets-backup-DO-NOT-SHARE\`

Usalo solo como referencia mientras rotás. **Borrarlo** cuando las keys nuevas estén en Supabase + `.env.local`.

---

## Inventario de secretos a rotar

| Secreto | Dónde se usa | Dónde rotar |
|---------|--------------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API → reset service_role si aplica / rotar JWT secret del proyecto |
| `VITE_SUPABASE_ANON_KEY` / publishable | Frontend | Mismo panel API (anon/publishable) |
| `OPENROUTER_API_KEY` | ai-chat, tools-ai, diagnostico, generate-image | [OpenRouter Keys](https://openrouter.ai/keys) → revoke + create |
| `GOOGLE_CLIENT_SECRET` (+ Client ID si hace falta) | OAuth Google functions | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth client → reset secret |
| `GOOGLE_FREE_API_KEY` / `GOOGLE_API_KEY` | Free-tier Gemini | Google AI Studio / Cloud → restrict or regenerate |
| `LOVABLE_API_KEY` | Fallback legacy AI | Panel Lovable / gateway → regenerate |
| `STRIPE_SECRET_KEY` | Pagos server-side | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) → roll secret key |
| Checkout URLs `VITE_STRIPE_CHECKOUT_*` | Frontend | Stripe Payment Links (regenerar si se filtraron) |

**No es un secreto** (sí puede ir al frontend): `VITE_SUPABASE_URL`, `VITE_GOOGLE_CLIENT_ID`, URLs públicas de checkout.

---

## Procedimiento recomendado (orden)

### 1. OpenRouter
1. Entrá a https://openrouter.ai/keys  
2. Revocá la key actual.  
3. Creá una nueva.  
4. Guardala en **Supabase Secrets** como `OPENROUTER_API_KEY`.

### 2. Supabase
1. Dashboard del proyecto (`otgxdmouuaqdpgrpzlul` según README).  
2. Settings → API: copiá URL + anon/publishable **nuevos** si rotaste JWT.  
3. Edge Functions → Secrets: actualizá:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_PUBLISHABLE_KEY`
   - `OPENROUTER_API_KEY`
   - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
   - `STRIPE_SECRET_KEY`
   - opcionales: `LOVABLE_API_KEY`, `GOOGLE_FREE_API_KEY`, `OPENROUTER_HTTP_REFERER`, `FREE_AI_DAILY_LIMIT`
4. Redeploy de functions después de cambiar secrets:
   ```bash
   supabase functions deploy ai-chat --use-api
   supabase functions deploy tools-ai --use-api
   supabase functions deploy diagnostico --use-api
   supabase functions deploy generate-image --use-api
   supabase functions deploy gmail-actions --use-api
   supabase functions deploy google-calendar --use-api
   supabase functions deploy google-drive --use-api
   supabase functions deploy google-sheets --use-api
   ```

### 3. Google OAuth
1. Cloud Console → Credentials → OAuth 2.0 Client.  
2. Reset client secret.  
3. Confirmá redirect URIs de Supabase Auth.  
4. Actualizá secret en Supabase + `VITE_GOOGLE_CLIENT_ID` en frontend si cambió el ID.

### 4. Stripe
1. Developers → API keys → Roll secret key.  
2. Actualizá `STRIPE_SECRET_KEY` en Supabase.  
3. Si los Payment Links eran públicos y sospechosos, regenerá links y actualizá `VITE_STRIPE_CHECKOUT_*`.

### 5. Lovable / Google free (si los usás)
Regenerá y actualizá solo en secrets de servidor.

### 6. Local
En la carpeta canónica del proyecto:

```bash
cd "C:\Users\pablo\Desktop\EQUITYLABS CODEX\EquityLabs20261-main\EquityLabs20261"
copy .env.example .env.local
# editar .env.local con SOLO valores VITE_*
copy supabase\functions\.env.example supabase\functions\.env
# editar supabase\functions\.env con secretos server (solo local CLI)
```

Luego borrá el backup:

```powershell
Remove-Item -Recurse -Force "C:\Users\pablo\Desktop\EQUITYLABS CODEX\.secrets-backup-DO-NOT-SHARE"
```

### 7. Verificación
- Login en `/auth`  
- Un mensaje en el dashboard (ai-chat)  
- `/diagnostico` con una corrida corta  
- (Opcional) una acción Google si tenés OAuth configurado  

---

## Reglas permanentes

1. Nunca commitear `.env`, `.env.local`, `supabase/functions/.env`.  
2. Frontend = solo `VITE_*` públicos.  
3. `SERVICE_ROLE` y `*_SECRET*` solo en Supabase Secrets o `.env` local de functions.  
4. Después de rotar, **invalidá** las keys viejas (no dejes las dos vivas).  
5. Si el repo es público o se filtró un zip, rotá **todo** el inventario de arriba.
