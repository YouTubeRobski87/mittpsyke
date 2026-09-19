import type { SupabaseClient, User } from '@supabase/supabase-js';
import { loadLegacyMoodActivity } from '$lib/server/diary-activity-days';
import {
	WORLD_PROGRESS_METADATA_KEY,
	buildLegacyWorldPresence,
	readWorldProgressState,
	resolveWorldProgress,
	type WorldProgressState
} from '$lib/world/worldProgress';
import type { WorldPresence } from '$lib/world/worldStage';

/**
 * Läser, slår ihop och sparar världens beständiga progression för Framsteg.
 *
 * Den gamla humörmodellen hämtas bara när inget tillstånd finns ännu, dvs en
 * enda gång per användare. Misslyckas sparningen visas unionen ändå i det här
 * besöket, och nästa besök försöker igen - ingenting tas bort under tiden.
 */
export async function syncWorldProgress(input: {
	supabase: SupabaseClient;
	user: Pick<User, 'id' | 'user_metadata' | 'created_at'>;
	presence: WorldPresence;
	entryCount: number;
	reflectionCount: number;
	now?: Date;
}): Promise<WorldProgressState> {
	const stored = readWorldProgressState(input.user.user_metadata);

	let legacy: WorldPresence | null = null;
	if (!stored) {
		const legacyMood = await loadLegacyMoodActivity(input.supabase, input.user.id);
		if (legacyMood) {
			legacy = buildLegacyWorldPresence({
				moodDays: legacyMood.moodDays,
				moodEntryCount: legacyMood.moodEntryCount,
				entryCount: input.entryCount,
				reflectionCount: input.reflectionCount,
				accountCreatedAt: input.user.created_at ?? null,
				now: input.now
			});
		}
		// Kunde den gamla modellen inte läsas sparas ingenting nu. Annars skulle
		// migrationen räknas som klar utan att ha kunnat skydda det som syntes.
		if (!legacyMood) {
			return resolveWorldProgress({ stored: null, presence: input.presence }).state;
		}
	}

	const { state, changed } = resolveWorldProgress({ stored, presence: input.presence, legacy });
	if (changed) {
		const { error } = await input.supabase.auth.updateUser({
			data: { [WORLD_PROGRESS_METADATA_KEY]: state }
		});
		if (error) console.error('World progress save error:', error.message);
	}
	return state;
}
