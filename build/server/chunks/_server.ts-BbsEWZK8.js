import { j as json } from './index-CoD1IJuy.js';
import { createClient } from '@supabase/supabase-js';
import { b as private_env, p as public_env } from './shared-server-DaWdgxVh.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
function errorResponse(message, status) {
  const body = { success: false, error: message };
  return json(body, { status });
}
function getAccessToken(authorizationHeader) {
  if (!authorizationHeader) return null;
  const [scheme, token] = authorizationHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token?.trim()) {
    return null;
  }
  return token.trim();
}
function validateBody(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Invalid request body." };
  }
  const body = input;
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id || !UUID_REGEX.test(id)) {
    return { ok: false, error: 'Field "id" is required and must be a valid UUID.' };
  }
  return {
    ok: true,
    data: { id }
  };
}
const DELETE = async ({ request }) => {
  let parsedBody;
  try {
    parsedBody = await request.json();
  } catch {
    return errorResponse("Invalid JSON body.", 400);
  }
  const validated = validateBody(parsedBody);
  if (!validated.ok) {
    return errorResponse(validated.error, 400);
  }
  const token = getAccessToken(request.headers.get("authorization"));
  if (!token) {
    return errorResponse("Missing or invalid Authorization header.", 401);
  }
  const supabaseUrl = private_env.SUPABASE_URL || public_env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = private_env.SUPABASE_ANON_KEY || public_env.PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_ANON_KEY.");
    return errorResponse("Server configuration error.", 500);
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return errorResponse("Unauthorized.", 401);
  }
  const { data: deleted, error: deleteError } = await supabase.from("diary").delete().eq("id", validated.data.id).eq("user_id", user.id).select("id").maybeSingle();
  if (deleteError) {
    console.error("Failed to delete diary entry:", deleteError);
    if (deleteError.code === "42501") {
      return errorResponse("Not allowed to delete diary entry.", 403);
    }
    return errorResponse(deleteError.message ?? "Could not delete note.", 500);
  }
  if (!deleted) {
    return errorResponse("Entry not found.", 404);
  }
  const response = { success: true };
  return json(response, { status: 200 });
};

export { DELETE };
//# sourceMappingURL=_server.ts-BbsEWZK8.js.map
