# Unificación outer → inner

## Fuente canónica

`EquityLabs20261/` (este directorio) es la única fuente de verdad del producto.

## Qué se unificó (2026-07-19)

| Origen outer | Destino inner | Estado |
|--------------|---------------|--------|
| `src/pages/OAuthConsent.tsx` | `src/pages/OAuthConsent.tsx` | Portado |
| `src/pages/BusinessBuilderWelcome.tsx` | `src/pages/BusinessBuilderWelcome.tsx` | Portado |
| Rutas `/oauth/consent`, `/business-builder` | `src/App.tsx` | Registradas |
| `public/audio/*.wav` | `public/audio/` | Portado |
| `diagnostico` + `_shared` | (ya existían en inner) | Conservados |
| `.gitignore` + `.env.example` | reforzados | Listo |

## Rutas unificadas

| Path | Auth | Página |
|------|------|--------|
| `/landing` | no | Landing |
| `/auth` | no | Auth |
| `/reset-password` | no | ResetPassword |
| `/suscripciones` | no | Suscripciones |
| `/diagnostico` | no | Diagnostico |
| `/oauth/consent` | no | OAuthConsent |
| `/business-builder` | sí | BusinessBuilderWelcome |
| `/` y `/dashboard` | sí | Index (ProjectDashboard) |

## Qué quedó fuera a propósito

- Copia outer completa (marcada `DEPRECATED.md` un nivel arriba).  
- Dependencia `@supabase/ssr` del outer (inner ya usa client runtime propio).  
- Secrets: ver `docs/SECRETS_ROTATION.md`.

## Cómo trabajar desde ahora

```bash
cd "C:\Users\pablo\Desktop\EQUITYLABS CODEX\EquityLabs20261-main\EquityLabs20261"
npm ci
# configurar .env.local desde .env.example
npm run dev
```
