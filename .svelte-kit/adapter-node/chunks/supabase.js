import { createBrowserClient } from "@supabase/ssr";
import { a as public_env } from "./shared-server.js";
createBrowserClient(
  public_env.PUBLIC_SUPABASE_URL,
  public_env.PUBLIC_SUPABASE_ANON_KEY
);
