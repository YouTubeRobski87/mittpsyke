import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

// Anonym gästchatt är kortlivad och får inte ligga kvar långsiktigt.
// Retention: gästdata äldre än 24h rensas. Rutten triggas av GitHub Actions
// (se .github/workflows/guest-cleanup.yml) en gång i timmen, så data raderas
// automatiskt senast inom ~24 timmar.
const RETENTION_HOURS = 24;

export const POST: RequestHandler = async ({ request, url }) => {
	const configuredSecret = env.CRON_SECRET || env.GUEST_CLEANUP_CRON_SECRET;
	const providedSecret =
		request.headers.get('x-cron-secret') ||
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
		url.searchParams.get('secret');

	if (!configuredSecret || providedSecret !== configuredSecret) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	// Service role används enbart server-side (här) för att kringgå RLS på gästtabellerna.
	const supabase = createServiceClient();
	if (!supabase) {
		return json({ error: 'Server configuration error.' }, { status: 500 });
	}

	const cutoffIso = new Date(Date.now() - RETENTION_HOURS * 60 * 60 * 1000).toISOString();

	// Radera gamla gästmeddelanden först, därefter gästkonversationer. Med FK
	// on delete cascade städas ev. kvarvarande meddelanden bort med konversationen.
	const { count: deletedMessages, error: messagesError } = await supabase
		.from('guest_messages')
		.delete({ count: 'exact' })
		.lt('created_at', cutoffIso);

	if (messagesError) {
		console.error('[cron][guest-cleanup] DB operation failed: delete guest_messages', messagesError);
		return json({ error: 'Could not delete guest messages.' }, { status: 500 });
	}

	const { count: deletedConversations, error: conversationsError } = await supabase
		.from('guest_conversations')
		.delete({ count: 'exact' })
		.lt('created_at', cutoffIso);

	if (conversationsError) {
		console.error(
			'[cron][guest-cleanup] DB operation failed: delete guest_conversations',
			conversationsError
		);
		return json({ error: 'Could not delete guest conversations.' }, { status: 500 });
	}

	return json({
		ok: true,
		retentionHours: RETENTION_HOURS,
		cutoff: cutoffIso,
		deletedMessages: deletedMessages ?? 0,
		deletedConversations: deletedConversations ?? 0
	});
};
