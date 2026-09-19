import type { SupabaseClient } from '@supabase/supabase-js';
import { toStockholmDateKey } from '$lib/stockholm-date';

/**
 * Hur många av de senaste inläggen som läses. En användare som når gränsen har
 * redan långt över världens högsta registreringströskel, så det sista stadiet
 * är nått oavsett vilka äldre dagar som inte kommer med.
 */
export const DIARY_ACTIVITY_ROW_LIMIT = 1000;

/**
 * Framstegs-världens aktiva dagar: varje svensk kalenderdag med minst ett
 * sparat dagboksinlägg, med antalet inlägg den dagen. Humörvärde krävs inte -
 * ett sparat inlägg räcker för att dagen ska räknas.
 *
 * Läser bara tidsstämpeln, aldrig text eller humör. Samma form som den gamla
 * heatmapen (datum -> antal), så buildWorldPresence tar emot den oförändrad.
 */
export async function loadDiaryActivityDays(
	supabase: SupabaseClient,
	userId: string
): Promise<Record<string, number>> {
	const { data, error } = await supabase
		.from('diary')
		.select('created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(DIARY_ACTIVITY_ROW_LIMIT);

	if (error) {
		console.error('Diary activity days load error:', error);
		return {};
	}

	return countDiaryActivityDays((data ?? []) as { created_at: string | null }[]);
}

/** Ren del av laddaren: tidsstämplar -> antal inlägg per Stockholmsdatum. */
export function countDiaryActivityDays(
	rows: readonly { created_at: string | null | undefined }[]
): Record<string, number> {
	const days: Record<string, number> = {};
	for (const row of rows) {
		const dateKey = toStockholmDateKey(row.created_at);
		if (dateKey) days[dateKey] = (days[dateKey] ?? 0) + 1;
	}
	return days;
}

/**
 * Samma gräns som /api/diary/stats-timeline. Den gamla världsmodellen räknade
 * humörvärden ur just den listan, så migrationen läser exakt samma underlag.
 */
export const LEGACY_MOOD_ROW_LIMIT = 2000;

/**
 * ENBART för världens engångsmigration ($lib/world/worldProgress): dagarna med
 * humörvärde och antalet humörvärden, så som den gamla modellen såg dem. Läser
 * bara tidsstämpeln och om ett humörvärde finns - aldrig själva värdet.
 */
export async function loadLegacyMoodActivity(
	supabase: SupabaseClient,
	userId: string
): Promise<{ moodDays: Record<string, number>; moodEntryCount: number } | null> {
	const { data, error } = await supabase
		.from('diary')
		.select('created_at')
		.eq('user_id', userId)
		.not('mood', 'is', null)
		.order('created_at', { ascending: false })
		.limit(LEGACY_MOOD_ROW_LIMIT);

	if (error) {
		console.error('Legacy mood activity load error:', error);
		return null;
	}

	const rows = (data ?? []) as { created_at: string | null }[];
	const moodDays = countDiaryActivityDays(rows);
	const moodEntryCount = Object.values(moodDays).reduce((sum, count) => sum + count, 0);
	return { moodDays, moodEntryCount };
}
