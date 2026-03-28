import { error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { PageServerLoad } from './$types';

const ADMIN_USER_ID = 'f4f107ef-461a-4090-bc2f-6ddccc0cc64d';

const REASON_LABELS: Record<string, string> = {
	offensive: 'Olämpligt innehåll',
	crisis: 'Skadligt innehåll',
	spam: 'Spam',
	misinformation: 'Felaktig information',
	other: 'Annat'
};

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

	if (!user || user.id !== ADMIN_USER_ID) {
		throw error(403, 'Åtkomst nekad.');
	}

	const url = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !serviceKey) throw error(500, 'Serverkonfigurationsfel.');

	const admin = createClient(url, serviceKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	const { data, error: fetchError } = await admin
		.from('forum_reports')
		.select(`
			id,
			reason,
			details,
			created_at,
			resolved_at,
			thread_id,
			reply_id,
			thread:forum_threads ( id, title, body, deleted_at ),
			reply:forum_replies ( id, body, thread_id, deleted_at )
		`)
		.is('resolved_at', null)
		.order('created_at', { ascending: false });

	if (fetchError) {
		console.error('Admin forum_reports fetch error:', fetchError);
		throw error(500, 'Kunde inte hämta rapporter.');
	}

	// Normalisera och sätt svenska etiketter
	const reports = (data ?? []).map((r) => ({
		id: String(r.id),
		reason: REASON_LABELS[r.reason as string] ?? String(r.reason),
		details: r.details ? String(r.details) : null,
		created_at: String(r.created_at),
		thread_id: r.thread_id ? String(r.thread_id) : null,
		reply_id: r.reply_id ? String(r.reply_id) : null,
		thread: r.thread
			? {
					id: String((r.thread as Record<string, unknown>).id),
					title: String((r.thread as Record<string, unknown>).title),
					body: String((r.thread as Record<string, unknown>).body),
					deleted_at: (r.thread as Record<string, unknown>).deleted_at ?? null
				}
			: null,
		reply: r.reply
			? {
					id: String((r.reply as Record<string, unknown>).id),
					body: String((r.reply as Record<string, unknown>).body),
					thread_id: String((r.reply as Record<string, unknown>).thread_id),
					deleted_at: (r.reply as Record<string, unknown>).deleted_at ?? null
				}
			: null
	}));

	return { reports };
};
