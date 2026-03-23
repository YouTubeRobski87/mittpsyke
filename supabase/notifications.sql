-- ============================================================
-- MittPsyke: Följ tråd, Notiser, Följ kategori
-- Kör detta i Supabase SQL Editor
-- Idempotent – säker att köra flera gånger
-- ============================================================

-- ──────────────────────────────────────────────
-- 1. Följ tråd
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_thread_follows (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id  UUID        NOT NULL REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_thread_follows_unique UNIQUE (user_id, thread_id)
);

CREATE INDEX IF NOT EXISTS idx_user_thread_follows_user   ON public.user_thread_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_thread_follows_thread ON public.user_thread_follows(thread_id);

ALTER TABLE public.user_thread_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "utf_select_own" ON public.user_thread_follows;
DROP POLICY IF EXISTS "utf_insert_own" ON public.user_thread_follows;
DROP POLICY IF EXISTS "utf_delete_own" ON public.user_thread_follows;

CREATE POLICY "utf_select_own" ON public.user_thread_follows
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "utf_insert_own" ON public.user_thread_follows
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "utf_delete_own" ON public.user_thread_follows
  FOR DELETE USING (user_id = auth.uid());

-- ──────────────────────────────────────────────
-- 2. Notiser
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          TEXT        NOT NULL,                         -- 'forum_reply' | 'forum_new_thread'
  title         TEXT        NOT NULL,
  body          TEXT        NOT NULL DEFAULT '',
  link          TEXT        NOT NULL DEFAULT '',
  is_read       BOOLEAN     NOT NULL DEFAULT false,
  actor_user_id UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  thread_id     UUID        REFERENCES public.forum_threads(id) ON DELETE CASCADE,
  reply_id      UUID        REFERENCES public.forum_replies(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index för snabb hämtning av olästa notiser per användare
CREATE INDEX IF NOT EXISTS idx_notifications_user_read
  ON public.notifications(user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own"  ON public.notifications;
DROP POLICY IF EXISTS "notif_update_own"  ON public.notifications;
DROP POLICY IF EXISTS "notif_delete_own"  ON public.notifications;

-- Användare kan bara se sina egna notiser
CREATE POLICY "notif_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());

-- Användare kan uppdatera (markera som läst) sina egna notiser
CREATE POLICY "notif_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Användare kan radera sina egna notiser
CREATE POLICY "notif_delete_own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());

-- INSERT är blockerat för vanliga användare.
-- Service role (backend) kringgår RLS och skriver notiser direkt.

-- ──────────────────────────────────────────────
-- 3. Följ kategori
-- ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_category_follows (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id TEXT        NOT NULL REFERENCES public.forum_categories(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_category_follows_unique UNIQUE (user_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_user_category_follows_user     ON public.user_category_follows(user_id);
CREATE INDEX IF NOT EXISTS idx_user_category_follows_category ON public.user_category_follows(category_id);

ALTER TABLE public.user_category_follows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ucf_select_own" ON public.user_category_follows;
DROP POLICY IF EXISTS "ucf_insert_own" ON public.user_category_follows;
DROP POLICY IF EXISTS "ucf_delete_own" ON public.user_category_follows;

CREATE POLICY "ucf_select_own" ON public.user_category_follows
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "ucf_insert_own" ON public.user_category_follows
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "ucf_delete_own" ON public.user_category_follows
  FOR DELETE USING (user_id = auth.uid());
