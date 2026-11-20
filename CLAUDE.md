@AGENTS.md

# Jarvinho: reglas del proyecto

Asistente personal de IA (PWA y Telegram, con un mismo backend). La spec completa está en [docs/SPEC.md](docs/SPEC.md).

## Antes de cada tarea
- Leé `docs/SPEC.md` antes de empezar cualquier tarea.
- Trabajá por etapas (Semana 1, 2, 3), paso a paso, y esperá confirmación del usuario entre pasos.
- Next.js de este repo es una versión nueva: antes de escribir código de Next, consultá `node_modules/next/dist/docs/` (ver AGENTS.md).

## Stack
- TypeScript estricto (`strict: true`), sin `any` implícitos.
- Next.js App Router (`src/app`), Tailwind CSS y shadcn/ui (`src/components/ui`).
- Backend: route handlers de Next.js en Vercel (`src/app/api/*`).
- Supabase: Postgres, Auth con magic link y pg_cron + pg_net.
- IA: API de Anthropic con tool use. Sonnet para el chat y Haiku para clasificar o resumir.

## Seguridad (no negociable)
- Nunca commitear secretos ni escribir claves reales en el código. Toda variable nueva va a `.env.example` con el valor vacío; los valores reales van en `.env.local` y en Vercel.
- Toda acción hacia terceros (enviar mails, mensajes, etc.) se crea como `pending_action` y espera aprobación por botón en Telegram o en la PWA. Nada irreversible sin aprobación.
- Un solo usuario: la PWA solo acepta el email autorizado (`ALLOWED_EMAIL`) y el bot solo responde al `TELEGRAM_CHAT_ID` autorizado.
- Los endpoints `/api/jobs/*` exigen `CRON_SECRET`, y el webhook de Telegram valida su secret token.
- Sin datos de Awin.

## Base de datos
- Todo cambio de base de datos se hace como migración de Supabase (`supabase/migrations/`), nunca a mano en el dashboard.
- Todas las tablas tienen RLS activado: solo el dueño accede.

## Git
- Commits pequeños, uno por funcionalidad.
- El repo es público (portfolio): revisá el diff antes de cada commit.
