import type { SupabaseClient } from '@supabase/supabase-js';
import { getCompanionRelationshipStage, type CompanionRelationshipStage } from '$lib/companionRelationship';

type PresenceRow = { week_start: string };

/**
 * Registrerar bara innevarande Stockholm-vecka. Databasfunktionen väljer både
 * användare och datum, så inga identifierare eller tidpunkter lämnar klienten.
 */
export async function recordCurrentCompanionPresence(supabase: SupabaseClient) {
	const { data, error } = await supabase.rpc('record_companion_presence_week');
	if (error) throw error;
	return Boolean(data);
}

/** Hämtar högst tio veckor eftersom fler inte påverkar det synliga steget. */
export async function getCompanionRelationshipStageForUser(
	supabase: SupabaseClient,
	userId: string
): Promise<CompanionRelationshipStage> {
	const { data, error } = await supabase
		.from('companion_presence_weeks')
		.select('week_start')
		.eq('user_id', userId)
		.limit(10);

	if (error) {
		console.error('Companion presence load error:', error);
		return 0;
	}

	return getCompanionRelationshipStage((data as PresenceRow[] | null)?.length ?? 0);
}
