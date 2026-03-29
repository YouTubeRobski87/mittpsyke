import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUserFromAccessToken } from '$lib/server/admin-auth';
import { createServiceClient } from '$lib/server/supabase-admin';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function err(message: string, status: number) {
	return json({ success: false, error: message }, { status });
}

function getToken(authHeader: string | null): string | null {
	if (!authHeader) return null;
	const [scheme, token] = authHeader.split(' ');
	return scheme?.toLowerCase() === 'bearer' && token?.trim() ? token.trim() : null;
}

export const POST: RequestHandler = async ({ request }) => {
	const token = getToken(request.headers.get('authorization'));
	if (!token) {
		return err('Ej autentiserad.', 401);
	}

	const user = await getUserFromAccessToken(token);
	if (!user?.is_super_admin) {
		return err('Åtkomst nekad.', 403);
	}

	const admin = createServiceClient();
	if (!admin) {
		return err('Serverkonfigurationsfel.', 500);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return err('Ogiltig JSON.', 400);
	}

	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return err('Ogiltig body.', 400);
	}

	const payload = body as Record<string, unknown>;
	const reportId = typeof payload.reportId === 'string' ? payload.reportId.trim() : '';
	const threadId = typeof payload.threadId === 'string' ? payload.threadId.trim() : '';
	const replyId = typeof payload.replyId === 'string' ? payload.replyId.trim() : '';

	if (!reportId || !UUID_REGEX.test(reportId)) {
		return err('Ogiltigt reportId.', 400);
	}

	if (!threadId && !replyId) {
		return err('Ange threadId eller replyId.', 400);
	}

	if (threadId && !UUID_REGEX.test(threadId)) {
		return err('Ogiltigt threadId.', 400);
	}

	if (replyId && !UUID_REGEX.test(replyId)) {
		return err('Ogiltigt replyId.', 400);
	}

	const now = new Date().toISOString();

	if (threadId) {
		const { error: deleteError } = await admin
			.from('forum_threads')
			.update({ deleted_at: now })
			.eq('id', threadId)
			.is('deleted_at', null);

		if (deleteError) {
			console.error('Admin delete thread error:', deleteError);
			return err('Kunde inte radera tråden.', 500);
		}
	}

	if (replyId) {
		const { error: deleteError } = await admin
			.from('forum_replies')
			.update({ deleted_at: now })
			.eq('id', replyId)
			.is('deleted_at', null);

		if (deleteError) {
			console.error('Admin delete reply error:', deleteError);
			return err('Kunde inte radera svaret.', 500);
		}
	}

	const { error: resolveError } = await admin
		.from('forum_reports')
		.update({ resolved_at: now })
		.eq('id', reportId);

	if (resolveError) {
		console.error('Admin resolve report error:', resolveError);
		return err('Inlägget raderades men rapporten kunde inte markeras som löst.', 500);
	}

	return json({ success: true }, { status: 200 });
};
