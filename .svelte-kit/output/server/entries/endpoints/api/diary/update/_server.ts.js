import { json } from "@sveltejs/kit";
import { createClient } from "@supabase/supabase-js";
import { p as private_env, a as public_env } from "../../../../../chunks/shared-server.js";
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
  if (typeof body.text !== "string" || body.text.trim().length === 0) {
    return { ok: false, error: 'Field "text" is required and must be a non-empty string.' };
  }
  if (body.mood !== void 0 && body.mood !== null && typeof body.mood !== "string") {
    return { ok: false, error: 'Field "mood" must be a string or null.' };
  }
  if (body.tags !== void 0 && body.tags !== null) {
    if (!Array.isArray(body.tags) || body.tags.some((tag) => typeof tag !== "string")) {
      return { ok: false, error: 'Field "tags" must be an array of strings or null.' };
    }
  }
  return {
    ok: true,
    data: {
      id,
      text: body.text.trim(),
      mood: body.mood ?? null,
      tags: body.tags ?? null
    }
  };
}
const PUT = async ({ request }) => {
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
  const { data: updated, error: updateError } = await supabase.from("diary").update({
    text: validated.data.text,
    mood: validated.data.mood,
    tags: validated.data.tags
  }).eq("id", validated.data.id).eq("user_id", user.id).select("id, user_id, text, mood, tags, created_at").maybeSingle();
  if (updateError) {
    console.error("Failed to update diary entry:", updateError);
    if (updateError.code === "42501") {
      return errorResponse("Not allowed to update diary entry.", 403);
    }
    return errorResponse(updateError.message ?? "Could not update note.", 500);
  }
  if (!updated) {
    return errorResponse("Entry not found.", 404);
  }
  const response = {
    success: true,
    diary: updated
  };
  return json(response, { status: 200 });
};
export {
  PUT
};
