import { createClient } from "@supabase/supabase-js";
import { a as public_env } from "./shared-server.js";
createClient(
  public_env.PUBLIC_SUPABASE_URL,
  public_env.PUBLIC_SUPABASE_ANON_KEY
);
