import { json } from "@sveltejs/kit";
import { createClient } from "@supabase/supabase-js";
import { b as private_env, p as public_env } from "../../../../../chunks/shared-server.js";
function errorResponse(message, status) {
  const body = { success: false, error: message };
  return json(body, { status });
}
function getProjectRefFromUrl(url) {
  try {
    const hostname = new URL(url).hostname;
    return hostname.split(".")[0] || "unknown";
  } catch {
    return "unknown";
  }
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
      text: body.text.trim(),
      mood: body.mood ?? null,
      tags: body.tags ?? null
    }
  };
}
const POST = async ({ request }) => {
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
  const projectRef = supabaseUrl ? getProjectRefFromUrl(supabaseUrl) : "unknown";
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
  const { data: inserted, error: insertError } = await supabase.from("diary").insert({
    user_id: user.id,
    text: validated.data.text,
    mood: validated.data.mood,
    tags: validated.data.tags
  }).select("id, user_id, text, mood, tags, created_at").single();
  if (!insertError && inserted) {
    const response = {
      success: true,
      diary: inserted
    };
    return json(response, { status: 200 });
  }
  const tableMissing = insertError?.code === "PGRST205" || insertError?.code === "42P01" || (insertError?.message ?? "").includes("Could not find the table 'public.diary'");
  if (tableMissing) {
    return errorResponse(
      `Databastabell saknas i Supabase-projektet "${projectRef}". Kontrollera att SUPABASE_URL/PUBLIC_SUPABASE_URL pekar mot projektet där "diary" skapades.`,
      500
    );
  }
  if (insertError || !inserted) {
    console.error("Failed to save diary entry:", insertError);
    if (insertError?.code === "42501") {
      return errorResponse("Not allowed to save diary entry.", 403);
    }
    return errorResponse(insertError?.message ?? "Could not save note.", 500);
  }
  return errorResponse("Could not save note.", 500);
};
export {
  POST
};
