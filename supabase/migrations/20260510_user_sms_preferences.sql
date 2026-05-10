-- ============================================================
-- MittPsyke: Frivilliga SMS-uppdateringar
-- Kör detta i Supabase SQL Editor
-- Idempotent – säker att köra flera gånger
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_sms_preferences (
  user_id        UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number   TEXT,
  sms_opt_in     BOOLEAN     NOT NULL DEFAULT false,
  sms_opt_in_at  TIMESTAMPTZ,
  sms_opt_out_at TIMESTAMPTZ,
  phone_verified BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_sms_preferences_opt_in
  ON public.user_sms_preferences(sms_opt_in)
  WHERE sms_opt_in = true;

CREATE OR REPLACE FUNCTION public.set_user_sms_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_user_sms_preferences_updated_at ON public.user_sms_preferences;
CREATE TRIGGER set_user_sms_preferences_updated_at
  BEFORE UPDATE ON public.user_sms_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.set_user_sms_preferences_updated_at();

ALTER TABLE public.user_sms_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "usp_select_own" ON public.user_sms_preferences;
DROP POLICY IF EXISTS "usp_insert_own" ON public.user_sms_preferences;
DROP POLICY IF EXISTS "usp_update_own" ON public.user_sms_preferences;

CREATE POLICY "usp_select_own" ON public.user_sms_preferences
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "usp_insert_own" ON public.user_sms_preferences
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "usp_update_own" ON public.user_sms_preferences
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
