import type { SupabaseClient } from '@supabase/supabase-js';
import type { EveningCheckinInput } from '$lib/evening-checkin';
import {
	EMPTY_EVENING_INTERIOR_MEMORY,
	getEveningInteriorMemory,
	type EveningInteriorMemory
} from '$lib/evening-interior-memory';
import type { EveningPatternRow } from '$lib/evening-patterns';
import { shiftDateKey } from '$lib/stockholm-date';

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

/** Läser enbart de servervaliderade svenska kalenderdagarna, aldrig fritext. */
export async function loadEveningInteriorMemory(
	supabase: SupabaseClient,
	userId: string | null | undefined
): Promise<EveningInteriorMemory> {
	if (!userId) return EMPTY_EVENING_INTERIOR_MEMORY;

	const { data, error } = await supabase
		.from(TABLE)
		.select('checkin_date')
		.eq('user_id', userId);

	if (error || !data) return EMPTY_EVENING_INTERIOR_MEMORY;
	return getEveningInteriorMemory(data.map((checkin) => checkin.checkin_date));
}

/**
 * Så långt bakåt "Kvällar över tid" behöver läsa: längsta perioden (180 dagar)
 * plus dess jämförelseperiod, med marginal. Äldre kvällar kan inte påverka
 * någon av sektionens observationer.
 */
export const EVENING_PATTERN_WINDOW_DAYS = 365;

/** Taket på antal rader. Fler kvällar än så ryms inte i fönstret ovan ändå. */
export const EVENING_PATTERN_ROW_LIMIT = 500;

/**
 * Underlaget till "Kvällar över tid".
 *
 * Selekterar AVSIKTLIGT bara `theme_id`, `parking_bucket` och `checkin_date`.
 * Fritexten i `thought` lämnar aldrig databasen för den här vyn - den är
 * användarens egen och analyseras inte. Se evening-patterns.test.ts, som
 * slår fast att kolumnlistan inte innehåller `thought`.
 */
export async function loadEveningPatternRows(
	supabase: SupabaseClient,
	userId: string | null | undefined,
	now = new Date()
): Promise<EveningPatternRow[]> {
	if (!userId) return [];

	const { data, error } = await supabase
		.from(TABLE)
		.select('theme_id, parking_bucket, checkin_date')
		.eq('user_id', userId)
		.gte('checkin_date', shiftDateKey(getEveningCheckinDate(now), -EVENING_PATTERN_WINDOW_DAYS))
		.order('checkin_date', { ascending: false })
		.limit(EVENING_PATTERN_ROW_LIMIT);

	if (error || !data) {
		if (error) console.error('[evening-checkin] mönsterläsning misslyckades', error.message);
		return [];
	}

	return data as EveningPatternRow[];
}

/** V1-kompatibel bokkontroll för befintliga anrop. */
export async function hasSavedEveningCheckin(
	supabase: SupabaseClient,
	userId: string | null | undefined
): Promise<boolean> {
	return (await loadEveningInteriorMemory(supabase, userId)).hasBook;
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

	if (error || !data) {
		// Utan det här blir ett schemafel ett anonymt 500 utan spår. Bara Postgres
		// egna felfält loggas - aldrig kvällens text eller hela payloaden.
		//
		// `details` utelämnas avsiktligt: vid check_violation innehåller det
		// "Failing row contains (...)" med användarens fritext.
		console.error('[evening-checkin] insert misslyckades', {
			code: error?.code ?? null,
			message: error?.message ?? 'insert returnerade ingen rad',
			hint: error?.hint ?? null
		});
		return { ok: false };
	}

	return {
		ok: true,
		checkin: {
			id: String(data.id),
			created_at: String(data.created_at),
			checkin_date: String(data.checkin_date)
		}
	};
}
