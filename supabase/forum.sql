-- =============================================================
-- MittPsyke – Forum MVP
-- Kör detta i Supabase SQL Editor
-- =============================================================

-- Forum categories (samtalsrum) – administreras, ej användarskapade
CREATE TABLE IF NOT EXISTS public.forum_categories (
  id         TEXT        PRIMARY KEY,           -- slug, t.ex. 'angest-och-oro'
  name       TEXT        NOT NULL,
  description TEXT       NOT NULL,
  icon       TEXT        NOT NULL DEFAULT '💬',
  sort_order INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forum threads (trådar)
CREATE TABLE IF NOT EXISTS public.forum_threads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id   TEXT        NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  user_id       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL CHECK (char_length(trim(title)) BETWEEN 3 AND 200),
  body          TEXT        NOT NULL CHECK (char_length(trim(body)) >= 10),
  is_anonymous  BOOLEAN     NOT NULL DEFAULT false,
  display_name  TEXT,              -- snapshot av profilnamn vid skapandet
  reply_count   INTEGER     NOT NULL DEFAULT 0,
  last_reply_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_hidden     BOOLEAN     NOT NULL DEFAULT false,
  is_pinned     BOOLEAN     NOT NULL DEFAULT false,
  deleted_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forum replies (svar i trådar)
CREATE TABLE IF NOT EXISTS public.forum_replies (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID        NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  body         TEXT        NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 2000),
  is_anonymous BOOLEAN     NOT NULL DEFAULT false,
  display_name TEXT,
  is_hidden    BOOLEAN     NOT NULL DEFAULT false,
  deleted_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Forum reports (rapporter om innehåll)
CREATE TABLE IF NOT EXISTS public.forum_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  thread_id   UUID        REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  reply_id    UUID        REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  reason      TEXT        NOT NULL,
  details     TEXT,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT forum_reports_one_target CHECK (
    (thread_id IS NOT NULL AND reply_id IS NULL) OR
    (thread_id IS NULL     AND reply_id IS NOT NULL)
  )
);

-- ============================================================
-- Index
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_forum_threads_category_created
  ON public.forum_threads(category_id, created_at DESC)
  WHERE deleted_at IS NULL AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_forum_threads_user
  ON public.forum_threads(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_forum_replies_thread
  ON public.forum_replies(thread_id, created_at ASC)
  WHERE deleted_at IS NULL AND is_hidden = false;

CREATE INDEX IF NOT EXISTS idx_forum_replies_user
  ON public.forum_replies(user_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_replies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_reports     ENABLE ROW LEVEL SECURITY;

-- Kategorier: publik läsning, ingen skrivning för användare
CREATE POLICY "forum_categories_public_select"
  ON public.forum_categories FOR SELECT USING (true);

-- Trådar: publik läsning av synliga trådar
CREATE POLICY "forum_threads_public_select"
  ON public.forum_threads FOR SELECT
  USING (deleted_at IS NULL AND is_hidden = false);

-- Trådar: inloggade användare kan skapa
CREATE POLICY "forum_threads_authenticated_insert"
  ON public.forum_threads FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Trådar: ägaren kan uppdatera (redigera/radera)
CREATE POLICY "forum_threads_owner_update"
  ON public.forum_threads FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Svar: publik läsning av synliga svar
CREATE POLICY "forum_replies_public_select"
  ON public.forum_replies FOR SELECT
  USING (deleted_at IS NULL AND is_hidden = false);

-- Svar: inloggade användare kan skapa
CREATE POLICY "forum_replies_authenticated_insert"
  ON public.forum_replies FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Svar: ägaren kan uppdatera (redigera/radera)
CREATE POLICY "forum_replies_owner_update"
  ON public.forum_replies FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL)
  WITH CHECK (auth.uid() = user_id);

-- Rapporter: inloggade användare kan skapa, ingen läsning
CREATE POLICY "forum_reports_authenticated_insert"
  ON public.forum_reports FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = reporter_id);

-- ============================================================
-- Seed: Samtalsrum
-- ============================================================

INSERT INTO public.forum_categories (id, name, description, icon, sort_order) VALUES
  ('angest-och-oro',               'Ångest och oro',              'Ett rum för dig som brottas med ångest, oro eller rastlöshet. Dela din upplevelse och hitta igenkänning.',         '🌊', 1),
  ('nedstamdhet-och-tunga-dagar',  'Nedstämdhet och tunga dagar', 'Här kan du dela hur det är när tillvaron känns tung. Du behöver inte ha svar – bara närvaro.',                   '🌧', 2),
  ('stress-och-utmattning',        'Stress och utmattning',       'För dig som är trött på att vara trött. Dela vad stress gör med dig och lyssna på andras erfarenheter.',           '🔋', 3),
  ('somn-och-nattankar',           'Sömn och nattankar',          'Nätterna kan vara långa. Dela tankar som håller dig vaken eller hur sömnsvårigheter påverkar dig.',                '🌙', 4),
  ('relationer-och-ensamhet',      'Relationer och ensamhet',     'Om längtan efter kontakt, svårigheter i relationer eller känslan av att vara ensam.',                             '🤝', 5),
  ('sjalvkansla-och-sjalvkritik',  'Självkänsla och självkritik', 'För tankar om att inte räcka till, inre kritik och resan mot att vara snällare mot sig själv.',                   '🌱', 6),
  ('trauma-och-svara-upplevelser', 'Trauma och svåra upplevelser','Ett varsamt rum för dig som bär på svåra minnen eller upplevelser. Dela i din egen takt.',                        '🕊', 7),
  ('framsteg-och-ljusglimtar',     'Framsteg och ljusglimtar',    'Dela det som gått bättre, stora som små. Igenkänning och hopp är också en del av hälsa.',                         '✨', 8)
ON CONFLICT (id) DO NOTHING;
