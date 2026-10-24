import type { SupabaseClient } from '@supabase/supabase-js';
import type { LoadStatus } from '$lib/load-state';

export type DiaryEntryCountResult = { count: number; status: LoadStatus };

/**
 * Samma räkning som loadDiaryEntryCount, men skiljer "noll inlägg" från
 * "kunde inte läsa". En sida som visar tomt läge vid noll ska använda den här,
 * så att ett läsfel aldrig ser ut som att anteckningarna är borta.
 */
export async function loadDiaryEntryCountResult(
	supabase: SupabaseClient,
	userId: string
): Promise<DiaryEntryCountResult> {
	const { count, error } = await supabase
		.from('diary')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId);

	if (error) {
		console.error('Diary entry count load error:', error);
		return { count: 0, status: 'error' };
	}

	return { count: count ?? 0, status: 'ready' };
}

/**
 * Canonical source for the count shown as “Texter skrivna” on Dashboard and
 * Framsteg. It counts saved rows in `diary`, without a time limit.
 */
export async function loadDiaryEntryCount(supabase: SupabaseClient, userId: string): Promise<number> {
	return (await loadDiaryEntryCountResult(supabase, userId)).count;
}
