import { json } from '@sveltejs/kit';
import { isHelpfulReminder } from '$lib/progress-helpful-reminders';
import { changeHelpfulReminder, loadHelpfulReminders } from '$lib/server/progress-helpful-reminders';
import type { RequestHandler } from './$types';

const headers = { 'Cache-Control': 'private, no-store' };

async function confirmedAccount(locals: App.Locals, accountId: string | null) {
	const { data: { user }, error } = await locals.supabase.auth.getUser();
	return !error && user && !user.is_anonymous && user.id === accountId ? user : null;
}

export const GET: RequestHandler = async ({ request, locals }) => {
	try {
		const user = await confirmedAccount(locals, request.headers.get('X-MittPsyke-Account-Id'));
		if (!user) return json({ error: 'Kontot kunde inte verifieras.' }, { status: 403, headers });
		return json({ reminders: await loadHelpfulReminders(locals.supabase, user.id) }, { headers });
	} catch {
		return json({ error: 'Listan kunde inte hämtas.' }, { status: 502, headers });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	// JSON kräver preflight vid anrop från andra ursprung. Routens CORS är stängd.
	if (request.headers.get('content-type') !== 'application/json') {
		return json({ error: 'Ogiltigt format.' }, { status: 415, headers });
	}

	const payload = await request.json().catch(() => null);
	const { accountId, item, action, revision } = payload ?? {};
	if (
		typeof accountId !== 'string' || !isHelpfulReminder(item) ||
		(action !== 'add' && action !== 'remove') ||
		!Number.isInteger(revision) || revision < 0 || revision >= 2147483647
	) return json({ error: 'Ogiltigt val.' }, { status: 400, headers });

	try {
		const user = await confirmedAccount(locals, accountId);
		if (!user) return json({ error: 'Kontot kunde inte verifieras.' }, { status: 403, headers });
		const reminder = await changeHelpfulReminder(locals.supabase, item, action === 'add', revision);
		if (!reminder) return json({ error: 'Valet har ändrats.' }, { status: 409, headers });
		return json({ reminder }, { headers });
	} catch {
		return json({ error: 'Liständringen kunde inte bekräftas.' }, { status: 502, headers });
	}
};