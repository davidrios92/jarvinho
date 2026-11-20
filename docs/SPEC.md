# Jarvinho — Especificación del MVP

Nov 19, 2026 · @Emanuel

## Visión y alcance del MVP

Jarvinho es un asistente personal de IA para la vida personal y los negocios paralelos. No usa datos de Awin. Tiene dos caras sobre un mismo backend: una **PWA** para conversar, ver y gestionar, y **Telegram** para los avisos proactivos y las aprobaciones rápidas. El repo es público en GitHub y funciona como pieza de portfolio.

**Funciones del MVP**

1. **Chat en la PWA:** texto y audio de entrada (transcripción), con historial y memoria.
2. **Briefing matutino por Telegram:** agenda del día (Google Calendar) y mails importantes (Gmail), con link a la PWA.
3. **Agente de prospectos de factoring:** detecta respuestas de prospectos, avisa por Telegram y propone el follow-up para aprobar con un botón.

**Fuera del MVP (fase 2):** respuesta por voz (TTS), voice orb, web push en iPhone, agentes inmobiliario y de noticias de IA, uso por clientes.

## Stack y arquitectura

**Stack**

- **Frontend:** Next.js (App Router), Tailwind y shadcn/ui, como PWA (manifest + service worker). Hosting en Vercel.
- **Backend:** API routes de Next.js en Vercel.
- **Base de datos y auth:** Supabase (Postgres; Auth con magic link solo para Emanuel; pg\_cron + pg\_net para tareas programadas).
- **IA:** API de Anthropic con tool use. Sonnet para el chat; Haiku para clasificar y resumir.
- **Transcripción:** API de transcripción de OpenAI.
- **Avisos:** Telegram Bot API, con webhook en Vercel.
- **Integraciones:** Gmail y Google Calendar vía Google OAuth; prospectos desde la planilla Prospectos Factoring (Google Sheets).

**Flujos**

- **Chat:** la PWA llama a /api/chat; el agente (Claude + tools) responde en streaming y guarda mensajes y memoria en Supabase.
- **Audio:** la PWA graba con MediaRecorder, /api/transcribe devuelve el texto y entra al chat.
- **Tareas programadas:** pg\_cron en Supabase llama a /api/jobs/\* (protegido con CRON\_SECRET); el agente arma el briefing o revisa prospectos y manda el aviso a Telegram con un link a la PWA.
- **Telegram entrante:** /api/telegram recibe mensajes y botones, valida que el chat\_id sea el de Emanuel y usa el mismo agente.

## Modelo de datos y herramientas del agente

**Tablas en Supabase** (todas con RLS: solo el dueño accede)

- **conversations / messages:** historial del chat (rol, contenido, canal: pwa o telegram).
- **memories:** hechos durables sobre Emanuel y sus proyectos, editables desde la PWA.
- **agents:** nombre, horario, activo/pausado, última ejecución.
- **agent\_runs:** estado, resultado y error de cada ejecución.
- **notifications:** canal, texto, link a la PWA, enviado o no.
- **pending\_actions:** acciones que esperan aprobación (por ejemplo, un follow-up a enviar).
- **integrations:** tokens de OAuth de Google, cifrados.

**Herramientas (tools) del agente**

- get\_calendar\_events: eventos de un rango de fechas.
- search\_gmail y get\_email: buscar y leer mails.
- read\_prospects y update\_prospect\_status: leer y actualizar la planilla de prospectos.
- draft\_email: crear un borrador; nunca enviar sin aprobación.
- save\_memory y search\_memory: guardar y consultar memoria.
- send\_telegram: mandar un aviso con link y botones.

## Seguridad

- **Nada irreversible sin aprobación:** enviar mails o mensajes a terceros siempre pasa por un botón de aprobación en Telegram o en la PWA.
- **Secretos fuera del repo:** variables de entorno en Vercel, un .env.example en el repo y .env en .gitignore.
- **Un solo usuario:** el bot responde solo al chat\_id autorizado y la PWA solo al email de Emanuel.
- **Endpoints protegidos:** las tareas programadas exigen CRON\_SECRET; el webhook de Telegram valida su secret token.
- **Gasto controlado:** límite mensual en la consola de Anthropic y alerta por Telegram al 80%.
- **Sin datos de Awin.**

## Plan por etapas

**Semana 1: base funcionando**

- Repo en GitHub, Next.js como PWA instalable en el iPhone, deploy en Vercel.
- Supabase: tablas, RLS y login con magic link.
- Chat de texto con Claude e historial.

**Semana 2: canales e integraciones**

- Audio de entrada con transcripción.
- Memoria (guardar, consultar, editar desde la PWA).
- Bot de Telegram: envío de avisos y webhook de entrada.
- Google OAuth con las tools de Calendar y Gmail.

**Semana 3: lo proactivo**

- Briefing matutino con pg\_cron.
- Agente de prospectos de factoring con aprobación por botón.
- Panel simple de agentes y ejecuciones en la PWA.
- README con capturas para el portfolio.

**Fase 2:** respuesta por voz (TTS), voice orb, web push, agentes inmobiliario y de noticias de IA.

## Checklist previo y cómo arrancar en Claude Code

**Antes de la primera sesión**

- [x] Cuentas de GitHub, Vercel y Supabase.
- [x] API key de Anthropic, con límite de gasto configurado.
- [x] Bot de Telegram creado con @BotFather (token) y tu chat\_id.
- [x] API key de OpenAI para la transcripción.
- [x] Proyecto en Google Cloud con las APIs de Gmail y Calendar y la pantalla de consentimiento OAuth en modo prueba, con tu email como usuario de prueba.
- [x] Confirmar que los prospectos salen de la planilla Prospectos Factoring.

**Primera sesión en Claude Code**

1. Crea una carpeta vacía llamada jarvinho y abre Claude Code ahí.
2. Pega este documento (o expórtalo como Markdown) y pídele que lo guarde como docs/SPEC.md y que cree un CLAUDE.md con las reglas del proyecto.
3. Pídele solo la Semana 1, paso a paso, y prueba cada paso antes de seguir.

**Reglas sugeridas para el CLAUDE.md**

- Leer docs/SPEC.md antes de cada tarea.
- TypeScript estricto, Next.js App Router, shadcn/ui.
- Nunca commitear secretos; toda clave nueva va a .env.example.
- Toda acción hacia terceros se crea como pending\_action y espera aprobación.
- Cambios de base de datos siempre como migraciones de Supabase.
- Commits pequeños, uno por funcionalidad.
