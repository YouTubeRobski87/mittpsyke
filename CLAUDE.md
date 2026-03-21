# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MittPsyke is a Swedish mental wellbeing web platform offering AI-based conversational support, personal journaling, and progress tracking. Live at https://www.mittpsyke.se.

## Commands

```bash
npm run dev        # Start dev server at http://localhost:5173
npm run build      # Production build (Vercel adapter)
npm run preview    # Preview production build locally
npm run check      # Type-check (svelte-kit sync + svelte-check)
```

No test or lint commands are configured.

## Architecture

**Stack:** SvelteKit 2 + Svelte 5, TailwindCSS 4, TypeScript, Supabase (PostgreSQL + Auth), OpenAI API (gpt-4o-mini), Vercel deployment, Capacitor (Android).

**Adapter selection** (`svelte.config.js`): Uses `@sveltejs/adapter-vercel` in production (Node.js 22.x) and `adapter-node` on Windows locally.

### Core Data Flow

**Chat** (`src/routes/api/chat/+server.ts` — ~880 lines):
- Crisis detection (regex, 20+ Swedish/Norwegian patterns) runs first; returns hotline response immediately without calling OpenAI
- Authenticated users → `conversations` + `messages` tables
- Guests → `guest_conversations` + `guest_messages` tables (via Supabase service role)
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
- `SUPABASE_SERVICE_ROLE_KEY` — Server-side (guest conversations)
- `ANTHROPIC_API_KEY` — Anthropic integration
- `GA_MEASUREMENT_ID` — Google Analytics

## Regler

- Kommentarer i koden skrivs på svenska
- Använd aldrig `any` i TypeScript — använd explicita typer eller `unknown`
- Kör `npm run build` innan du markerar en uppgift som klar
- Committa aldrig `.env.local` (innehåller hemliga nycklar)

## Safety-Critical Code

The crisis detection logic in `src/routes/api/chat/+server.ts` and `src/lib/ai/safety.ts` handles real user safety. Changes to crisis keyword patterns or the safety response flow require extra care — the server-side check is authoritative and must always run before any OpenAI API call.
