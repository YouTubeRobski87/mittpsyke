import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Canonical source for the count shown as “Texter skrivna” on Dashboard and
 * Framsteg. It counts saved rows in `diary`, without a time limit.
 */
export async function loadDiaryEntryCount(supabase: SupabaseClient, userId: string): Promise<number> {
	const { count, error } = await supabase
		.from('diary')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId);

	if (error) {
		console.error('Diary entry count load error:', error);
		return 0;
	}

	return count ?? 0;
}
