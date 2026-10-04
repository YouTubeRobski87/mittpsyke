import type { SupabaseClient } from '@supabase/supabase-js';
import {
	CREATIVE_MOMENT_ACTIVITY,
	getCreativeMomentWindowStart
} from '$lib/creative-moments';

export async function loadCreativeMomentCount(
	supabase: SupabaseClient,
	userId: string,
	now = new Date()
): Promise<number> {
	const { count, error } = await supabase
		.from('creative_moments')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('activity_type', CREATIVE_MOMENT_ACTIVITY)
		.gte('occurred_at', getCreativeMomentWindowStart(now))
		.lte('occurred_at', now.toISOString());

	if (error) {
		console.error('[creative-moments] kunde inte läsa antal', error.message);
		return 0;
	}

	return count ?? 0;
}
