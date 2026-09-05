# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MittPsyke is a Swedish mental wellbeing web platform offering AI-based conversational support, personal journaling, and progress tracking. Live at https://www.mittpsyke.se.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build (Node adapter, deployed on Render)
npm run preview    # Preview production build locally
npm run check      # Type-check (svelte-kit sync + svelte-check)
```

`npm run test` kör Vitest (`src/**/*.test.ts`). Det körs automatiskt som `prebuild`,
så `npm run build` misslyckas om något test faller. Ingen linter är konfigurerad.

Innehållsvalideringen ligger i testerna: `src/lib/server/article-content.test.ts`
kontrollerar frontmatter, metadata, interna länkar och JSON-LD för varje
markdown-artikel, och `src/routes/blogg/blog-index.test.ts` kör den riktiga
`/blogg`-laddaren och kontrollerar att varje publicerad artikel syns i indexet.

## Architecture

**Stack:** SvelteKit 2 + Svelte 5, TailwindCSS 4, TypeScript, Supabase (PostgreSQL + Auth), OpenAI API (gpt-4o-mini), Render deployment, Capacitor (Android).

**Adapter** (`svelte.config.js`): Uses `@sveltejs/adapter-node`. Production runs on Render as a Node web service (`node build`).

### Auth Flow

`src/hooks.server.ts` initializes a Supabase server client on every request and stores it as `locals.supabase`. `src/routes/+layout.server.ts` calls `locals.supabase.auth.getSession()` and passes the session to all pages. Client components access session from the layout data.

### Core Data Flow

**Chat** (`src/routes/api/chat/+server.ts` — ~810 lines):
- Crisis detection (regex, 20+ Swedish/Norwegian patterns) runs first; returns hotline response immediately without calling OpenAI
- Authenticated users → `conversations` + `messages` tables
- Guests → ingen serverlagring alls. Gästsvar returneras med `conversationId: null` och samtalet
  finns bara i den öppna chattvyn. Samtycket är en HMAC-signerad HttpOnly-cookie
  (`src/lib/server/anonymous-chat-consent.ts`), inte en klientheader. Tabellerna
  `guest_conversations`/`guest_messages` finns kvar för äldre rader och töms av
  `/api/cron/guest-cleanup` (24h), men skrivs inte längre av chatten
- Loads last 20 messages as context; max message length 2000 chars

**Diary** (`src/routes/api/diary/`): CRUD + analytics endpoints (heatmap, streak, mood timeline, AI insights). All tables use Supabase RLS — users access only their own rows.

**Community** (`src/routes/api/community/`): Users can share diary entries publicly with anonymous display. Report/moderation system included.

### Key Directories

- `src/routes/api/` — All server endpoints (chat, diary, community, account, retell voice)
- `src/routes/chat/[category]/` — Chat UI; categories A=anxiety, B=depression, E=trauma
- `src/routes/dagbok/` — Diary/journaling UI
- `src/routes/framsteg/` — Progress tracking UI
- `src/lib/components/` — Reusable Svelte components (ChatWindow, MoodChart, ActivityHeatmap, etc.)
- `src/lib/ai/safety.ts` — Client-side crisis detection (mirrors server patterns for instant UI feedback)
- `src/lib/supabase.ts` — Supabase client initialization
- `src/lib/types.ts` — Shared TypeScript interfaces
- `src/hooks.server.ts` — Security headers (CSP, HSTS, X-Frame-Options) + Supabase SSR auth on every request
- `supabase/` — SQL migration files for all tables + RLS policies
- `android/` — Capacitor Android build output

### SEO Content Pages

80+ Swedish-language content routes under `src/routes/` covering mental health topics (ångest, depression, trauma, etc.) following a pillar-cluster SEO model documented in `FINAL_SEO_ARCHITECTURE.md`.

## Environment Variables

Required in `.env`:
- `OPENAI_API_KEY` — Chat completions (gpt-4o-mini)
- `PUBLIC_SUPABASE_URL` + `PUBLIC_SUPABASE_ANON_KEY` — Client-side Supabase
- `SUPABASE_URL` + `SUPABASE_ANON_KEY` — Server-side Supabase (private, used in hooks)
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side (guest conversations, bypasses RLS)
- `ANTHROPIC_API_KEY` — Anthropic integration
- `ADMIN_USER_IDS` — Valfri. Kommaseparerade user-id:n som får adminbehörighet
  (`/admin`, `/admin/stories`, `/admin/radar`). Serverkontrollerad källa, sätts i
  Render. Behörighet får aldrig läsas ur `user_metadata` — användaren kan skriva
  det fältet själv via `supabase.auth.updateUser()`
- `PUBLIC_GA_MEASUREMENT_ID` — Google Analytics 4 (mätnings-ID, `G-…`). Läses klientsidan i `src/lib/analytics.ts`; utan den är `ANALYTICS_ENABLED` falskt och gtag laddas aldrig

## Svelte 5 Runes

This project uses Svelte 5 runes throughout: `$state()` for reactive state, `$derived()` for computed values, `$effect()` for side effects. Avoid Svelte 4 patterns (`let x = ...` with `$: ...` reactivity).

## Regler

- Kommentarer i koden skrivs på svenska
- Använd aldrig `any` i TypeScript — använd explicita typer eller `unknown`
- Kör `npm run build` innan du markerar en uppgift som klar
- Committa aldrig `.env.local` (innehåller hemliga nycklar)

## Safety-Critical Code

The crisis detection logic in `src/routes/api/chat/+server.ts` and `src/lib/ai/safety.ts` handles real user safety. Changes to crisis keyword patterns or the safety response flow require extra care — the server-side check is authoritative and must always run before any OpenAI API call.
