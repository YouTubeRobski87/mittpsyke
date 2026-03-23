/**
 * Server-side notishjälpare.
 * Använder service role för att skriva notiser – kringgår RLS på ett kontrollerat sätt.
 * Importeras bara från server-sida (+server.ts, +page.server.ts, actions).
 */
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

function getServiceClient() {
	const url = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const key = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;
	if (!url || !key) {
		console.error('notifications.ts: Missing Supabase service env vars');
		return null;
	}
	return createClient(url, key, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}

interface NotificationInsert {
	user_id: string;
	type: string;
	title: string;
	body: string;
	link: string;
	actor_user_id?: string | null;
	thread_id?: string | null;
	reply_id?: string | null;
}

async function insertNotifications(rows: NotificationInsert[]): Promise<void> {
	if (rows.length === 0) return;
	const client = getServiceClient();
	if (!client) return;
	const { error } = await client.from('notifications').insert(rows);
	if (error) console.error('notifications insert error:', error.message);
}

/**
 * Skapar notiser när ett nytt svar postas i en tråd.
 * Notifierar:
 *   – trådens ägare (om inte aktören är ägaren)
 *   – alla som följer tråden (om inte aktören)
 * Skapar inte duplicerade notiser (Set deduplicerar mottagare).
 */
export async function notifyNewReply({
	threadId,
	threadTitle,
	replyId,
	actorUserId
}: {
	threadId: string;
	threadTitle: string;
	replyId: string;
	actorUserId: string;
}): Promise<void> {
	const client = getServiceClient();
	if (!client) return;

	const link = `/forum/thread/${threadId}`;

	// Hämta trådens ägare
	const { data: thread } = await client
		.from('forum_threads')
		.select('user_id')
		.eq('id', threadId)
		.maybeSingle();

	// Hämta trådföljarar (exkl. aktören)
	const { data: follows } = await client
		.from('user_thread_follows')
		.select('user_id')
		.eq('thread_id', threadId)
		.neq('user_id', actorUserId);

	const recipientIds = new Set<string>();

	if (thread?.user_id && thread.user_id !== actorUserId) {
		recipientIds.add(thread.user_id);
	}
	for (const f of follows ?? []) {
		if (f.user_id !== actorUserId) recipientIds.add(f.user_id);
	}

	if (recipientIds.size === 0) return;

	await insertNotifications(
		[...recipientIds].map((userId) => ({
			user_id: userId,
			type: 'forum_reply',
			title: 'Nytt svar i en tråd',
			body: threadTitle,
			link,
			actor_user_id: actorUserId,
			thread_id: threadId,
			reply_id: replyId
		}))
	);
}

/**
 * Skapar notiser när en ny tråd skapas i en kategori.
 * Notifierar alla som följer kategorin (exkl. aktören).
 */
export async function notifyNewThread({
	categoryId,
	categoryName,
	threadId,
	threadTitle,
	actorUserId
}: {
	categoryId: string;
	categoryName: string;
	threadId: string;
	threadTitle: string;
	actorUserId: string;
}): Promise<void> {
	const client = getServiceClient();
	if (!client) return;

	const { data: follows } = await client
		.from('user_category_follows')
		.select('user_id')
		.eq('category_id', categoryId)
		.neq('user_id', actorUserId);

	if (!follows || follows.length === 0) return;

	const link = `/forum/thread/${threadId}`;

	await insertNotifications(
		follows.map((f) => ({
			user_id: f.user_id,
			type: 'forum_new_thread',
			title: `Ny tråd i ${categoryName}`,
			body: threadTitle,
			link,
			actor_user_id: actorUserId,
			thread_id: threadId
		}))
	);
}
