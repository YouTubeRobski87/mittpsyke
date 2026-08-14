import type { SupabaseClient } from '@supabase/supabase-js';
import type { EveningCheckinInput } from '$lib/evening-checkin';

const TABLE = 'evening_checkins';
const STOCKHOLM_DATE_FORMATTER = new Intl.DateTimeFormat('sv-CA', {
	timeZone: 'Europe/Stockholm',
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

export function getEveningCheckinDate(now = new Date()): string {
	return STOCKHOLM_DATE_FORMATTER.format(now);
}

export type SaveEveningCheckinResult =
	| { ok: true; checkin: { id: string; created_at: string; checkin_date: string } }
	| { ok: false };

/**
 * Läser bara om minst ett tidigare kvällsavtryck finns för användaren. Det
 * används för en enda bestående detalj i Kvällsstugan, aldrig som progression.
 */
export async function hasSavedEveningCheckin(
	supabase: SupabaseClient,
	userId: string | null | undefined
): Promise<boolean> {
	if (!userId) return false;

	const { count, error } = await supabase
		.from(TABLE)
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId);

	return !error && (count ?? 0) > 0;
}

/** Sparar en uttryckligen vald kvällsincheckning. Klienten bestämmer aldrig användare eller datum. */
export async function saveEveningCheckin(
	supabase: SupabaseClient,
	userId: string,
	input: EveningCheckinInput,
	now = new Date()
): Promise<SaveEveningCheckinResult> {
	const { data, error } = await supabase
		.from(TABLE)
		.insert({
			user_id: userId,
			theme_id: input.themeId,
			thought: input.thought,
			parking_bucket: input.parkingBucket,
			checkin_date: getEveningCheckinDate(now),
			flow_version: input.flowVersion
		})
		.select('id, created_at, checkin_date')
		.single();

	if (error || !data) return { ok: false };

	return {
		ok: true,
		checkin: {
			id: String(data.id),
			created_at: String(data.created_at),
			checkin_date: String(data.checkin_date)
		}
	};
}
