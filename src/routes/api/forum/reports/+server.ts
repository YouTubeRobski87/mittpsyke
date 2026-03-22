import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import type {
	CreateForumReportSuccessResponse,
	CreateForumReportErrorResponse,
	ForumReportReason
} from '$lib/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_REASONS: ForumReportReason[] = ['offensive', 'spam', 'crisis', 'misinformation', 'other'];

function err(message: string, status: number) {
	const body: CreateForumReportErrorResponse = { success: false, error: message };
	return json(body, { status });
}

function getToken(authHeader: string | null): string | null {
	if (!authHeader) return null;
	const [scheme, token] = authHeader.split(' ');
	return scheme?.toLowerCase() === 'bearer' && token?.trim() ? token.trim() : null;
}

export const POST: RequestHandler = async ({ request }) => {
	let body: unknown;
	try { body = await request.json(); } catch { return err('Invalid JSON.', 400); }

	if (!body || typeof body !== 'object' || Array.isArray(body)) return err('Invalid request body.', 400);
	const b = body as Record<string, unknown>;

	const threadId = typeof b.threadId === 'string' ? b.threadId.trim() : null;
	const replyId = typeof b.replyId === 'string' ? b.replyId.trim() : null;
	const reason = typeof b.reason === 'string' ? b.reason.trim() : '';
	const details = typeof b.details === 'string' ? b.details.trim() || null : null;

	// Validera att exakt ett mål är angivet
	const hasThread = threadId && UUID_REGEX.test(threadId);
	const hasReply = replyId && UUID_REGEX.test(replyId);

	if (!hasThread && !hasReply) return err('Ange antingen threadId eller replyId.', 400);
	if (hasThread && hasReply) return err('Ange antingen threadId eller replyId, inte båda.', 400);

	if (!VALID_REASONS.includes(reason as ForumReportReason)) {
		return err('Ogiltig rapportorsak.', 400);
	}

	const token = getToken(request.headers.get('authorization'));
	if (!token) return err('Du måste vara inloggad för att rapportera.', 401);

	const url = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const anon = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!url || !anon) return err('Server configuration error.', 500);

	const supabase = createClient(url, anon, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const { data: { user }, error: userError } = await supabase.auth.getUser();
	if (userError || !user) return err('Ej autentiserad.', 401);

	const { error: insertError } = await supabase.from('forum_reports').insert({
		reporter_id: user.id,
		thread_id: hasThread ? threadId : null,
		reply_id: hasReply ? replyId : null,
		reason,
		details
	});

	if (insertError) {
		console.error('Forum report insert error:', insertError);
		return err(insertError.message ?? 'Kunde inte skicka rapporten.', 500);
	}

	const response: CreateForumReportSuccessResponse = { success: true };
	return json(response, { status: 201 });
};
