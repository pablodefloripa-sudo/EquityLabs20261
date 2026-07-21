# EQuityLabs2026

EQuityLabs es una app web de operacion multiagente construida con React, Vite y Supabase.
Combina una landing comercial, autenticacion, suscripciones, un dashboard privado de trabajo y varias Edge Functions para chat, diagnostico y herramientas AI.

> **Fuente canónica:** este directorio (`EquityLabs20261/`).  
> La carpeta padre outer está **deprecada** — ver `../DEPRECATED.md`.  
> Unificación: [`docs/UNIFICATION.md`](./docs/UNIFICATION.md) · Rotación de secretos: [`docs/SECRETS_ROTATION.md`](./docs/SECRETS_ROTATION.md)

## Que hace el proyecto

### Frontend

- `/landing`: entrada comercial del producto.
- `/auth`: login y signup con email y Google.
- `/reset-password`: recuperacion de acceso.
- `/suscripciones`: seleccion de planes y redireccion a Stripe.
- `/diagnostico`: diagnostico estrategico guiado.
- `/oauth/consent`: pantalla de consentimiento OAuth.
- `/business-builder`: welcome del agente Business Builder (auth).
- `/dashboard` y `/`: dashboard protegido con chat, agentes, proyectos e integraciones.

### Backend / Supabase

- `ai-chat`: chat principal con routing por plan y por agente.
- `diagnostico`: diagnostico estrategico estructurado.
- `tools-ai`: utilidades de research, reportes y briefs.
- `generate-image`: generacion de imagenes.
- `gmail-actions`, `google-calendar`, `google-drive`, `google-sheets`: integraciones Google.

## Como correrlo

### App web

1. Instalar dependencias:

```bash
npm ci
```

2. Crear `/.env.local` a partir de [`.env.example`](./.env.example) y completar variables.

3. Levantar desarrollo:

```bash
npm run dev
```

4. Build de produccion:

```bash
npm run build
```

5. Preview local del build:

```bash
npm run preview
```

### Edge Functions

1. Crear `supabase/functions/.env` a partir de [`supabase/functions/.env.example`](./supabase/functions/.env.example).
2. Completar secretos server-side.
3. Si Docker local funciona, servir funciones:

```bash
supabase functions serve --no-verify-jwt
```

4. Deploy remoto sin Docker:

```bash
supabase functions deploy <nombre> --use-api --no-verify-jwt
```

## Secretos que necesita

### Frontend (`.env.local`)

Requeridos para usar backend real:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` o `VITE_SUPABASE_ANON_KEY`
- `VITE_AUTH_REDIRECT_ORIGIN`

Utiles segun funcionalidad:

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_STRIPE_CHECKOUT_TACTICAL`
- `VITE_STRIPE_CHECKOUT_PREMIUM`
- `VITE_STRIPE_CHECKOUT_MASTERMIND`
- `VITE_STRIPE_CHECKOUT_ENTERPRISE`
- `VITE_STRIPE_CHECKOUT_ALLIANCE`

### Backend (`supabase/functions/.env` o secretos de Supabase)

Base:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_PUBLISHABLE_KEY`

AI:

- `OPENROUTER_API_KEY`
  - proveedor preferido para `diagnostico`, `ai-chat`, `tools-ai` y `generate-image`.
- `LOVABLE_API_KEY`
  - fallback legacy opcional para `ai-chat`, `tools-ai` y `generate-image` si OpenRouter no esta disponible.
- `GOOGLE_FREE_API_KEY` o `GOOGLE_API_KEY`
  - fallback / free-tier segun funcion.
- `OPENROUTER_HTTP_REFERER`
  - opcional, recomendado para atribucion en OpenRouter.
- `OPENROUTER_FALLBACK_MODEL`
  - opcional, fallback para chat pago cuando un slug viejo no existe en OpenRouter.
- `FREE_GOOGLE_MODEL`
- `FREE_AI_DAILY_LIMIT`

Google OAuth:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

## Que quedo funcionando hoy

Estado validado el viernes 17 de julio de 2026:

- `npm run build`: funciona.
- `diagnostico` remoto: funciona.
- `diagnostico` remoto usa AI real via OpenRouter.
- `ai-chat`, `tools-ai` y `generate-image`: quedaron desplegadas remoto y activas en Supabase.
- El flujo `/diagnostico` ya no depende de una function inexistente.
- `ai-chat` y `tools-ai` ahora prefieren `OPENROUTER_API_KEY` y solo usan `LOVABLE_API_KEY` como fallback.
- `generate-image` ahora usa el endpoint de imagenes de OpenRouter y devuelve el modelo real al frontend.

### Estado remoto validado

Proyecto Supabase enlazado:

- `otgxdmouuaqdpgrpzlul`

Funciones activas verificadas en remoto:

- `ai-chat`
- `tools-ai`
- `diagnostico`
- `generate-image`

### Pendientes o no validados end-to-end en esta corrida

- `ai-chat`, `tools-ai`, `generate-image` y funciones Google quedaron desplegadas, pero no se invocaron con una sesion de usuario real en esta sesion.
- Docker local esta fallando en esta maquina, por eso no quedo validado `supabase functions serve`.
- `npm run lint` todavia tenia errores preexistentes fuera de este arreglo.

## Notas utiles

- El runtime de Supabase del frontend tiene un fallback para no romper la UI cuando faltan variables, pero para usar el backend real hay que completar envs.
- Si una API key fue pegada manualmente durante pruebas, conviene rotarla despues.
