import type { SupabaseClient } from '@supabase/supabase-js';
import { isMissingTableError } from '$lib/server/supabase-admin';

// Innehåll som INTE försvinner av sig självt när auth-användaren raderas.
//
// De flesta tabeller har user_id -> auth.users med ON DELETE CASCADE och
// följer med när kontot raderas. Följande gör det inte, och raderas därför
// här innan kontot tas bort:
//
// - conversations: user_id saknar främmande nyckel. Sparade chattar låg kvar
//   efter kontoradering (messages följer med conversations i kaskad).
// - Filer i diary-images och diary-videos: Storage har ingen koppling till
//   kontot. Filerna ligger under <user_id>/.
// - journal_entries (äldre tabell): nyckeln har NO ACTION och skulle stoppa
//   raderingen av kontot om en rad fanns kvar.
// - forum_replies och forum_threads (det tidigare forumet): user_id har ON
//   DELETE SET NULL, så inläggen låg kvar utan ägare. Svar tas bort före
//   trådar. En raderad tråd tar med sig alla svar i den i kaskad, även andras.
//
// community_posts och community_comments har ON DELETE CASCADE och följer med
// kontot av sig själva. forum_reports behålls som modereringsunderlag; där
// nollställs reporter_id av databasen.

/** Buckets där dagbokens filer ligger under <user_id>/. */
export const ACCOUNT_STORAGE_BUCKETS = ['diary-images', 'diary-videos'] as const;

/** Forumets tabeller i raderingsordning: svar före trådar. */
export const FORUM_TABLES = ['forum_replies', 'forum_threads'] as const;

const STORAGE_PAGE_SIZE = 1000;

async function listUserFiles(client: SupabaseClient, bucket: string, userId: string): Promise<string[]> {
	const paths: string[] = [];

	for (let offset = 0; ; offset += STORAGE_PAGE_SIZE) {
		const { data, error } = await client.storage
			.from(bucket)
			.list(userId, { limit: STORAGE_PAGE_SIZE, offset });
		if (error) throw new Error(`Kunde inte lista filer i ${bucket}: ${error.message}`);

		const files = (data ?? []).filter((entry) => entry.id !== null && entry.name);
		paths.push(...files.map((entry) => `${userId}/${entry.name}`));
		if ((data ?? []).length < STORAGE_PAGE_SIZE) return paths;
	}
}

/**
 * Raderar användarens innehåll som inte följer med auth-användaren i kaskad.
 * Kastar vid fel, så att anroparen kan avbryta i stället för att radera kontot
 * och lämna innehållet kvar utan ägare.
 */
export async function deleteAccountContent(client: SupabaseClient, userId: string): Promise<void> {
	if (!userId.trim()) throw new Error('Saknar användar-id.');

	for (const bucket of ACCOUNT_STORAGE_BUCKETS) {
		const paths = await listUserFiles(client, bucket, userId);
		if (paths.length === 0) continue;

		const { error } = await client.storage.from(bucket).remove(paths);
		if (error) throw new Error(`Kunde inte radera filer i ${bucket}: ${error.message}`);
	}

	const { error: conversationError } = await client.from('conversations').delete().eq('user_id', userId);
	if (conversationError) throw new Error(`Kunde inte radera chattar: ${conversationError.message}`);

	for (const table of FORUM_TABLES) {
		const { error } = await client.from(table).delete().eq('user_id', userId);
		if (error && !isMissingTableError(error, table)) {
			throw new Error(`Kunde inte radera forumdata i ${table}: ${error.message}`);
		}
	}

	const { error: journalError } = await client.from('journal_entries').delete().eq('user_id', userId);
	if (journalError && !isMissingTableError(journalError, 'journal_entries')) {
		throw new Error(`Kunde inte radera äldre dagboksinlägg: ${journalError.message}`);
	}
}
