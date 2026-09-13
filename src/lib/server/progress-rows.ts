// Gemensam hämtning av periodens dagboksrader för Framstegs återblick.
// Både analysen och den valbara AI-sammanfattningen läser härifrån, så de
// alltid räknar på exakt samma underlag.

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { TOPICS } from '$lib/server/diary-insight-analysis';
import { getProgressPeriodBounds, type ProgressPeriodDays } from '$lib/server/progress-analysis';
import type { LighterDaysRow } from '$lib/server/progress-lighter-days';
import {
	PROGRESS_THEME_OVERRIDES_KEY,
	normalizeProgressThemeOverrides,
	type ProgressThemeOverrides
} from '$lib/progress-theme-overrides';
import { shiftDateKey } from '$lib/stockholm-date';

export const INSIGHTS_ROW_LIMIT = 500;
export const VALID_PROGRESS_PERIODS = new Set<ProgressPeriodDays>([30, 90, 180]);

export function parseProgressPeriod(value: unknown): ProgressPeriodDays {
	const numeric = Number(value ?? 30);
	return VALID_PROGRESS_PERIODS.has(numeric as ProgressPeriodDays) ? (numeric as ProgressPeriodDays) : 30;
}

/** Användarens temakorrigeringar, filtrerade mot de teman analysen känner till. */
export function readThemeOverrides(user: Pick<User, 'user_metadata'>): ProgressThemeOverrides {
	return normalizeProgressThemeOverrides(
		user.user_metadata?.[PROGRESS_THEME_OVERRIDES_KEY],
		TOPICS.map((topic) => topic.label)
	);
}

export async function loadProgressRows(
	supabase: SupabaseClient,
	userId: string,
	period: ProgressPeriodDays
): Promise<{ rows: LighterDaysRow[]; truncated: boolean; error: string | null }> {
	const { start: periodStart } = getProgressPeriodBounds(period);
	// En kalenderdag extra bakåt fångar tidsstämplar nära sommartidsskiftet.
	// filterProgressRows() lägger sedan på det exakta Stockholmsintervallet.
	const queryStart = `${shiftDateKey(periodStart, -1)}T00:00:00.000Z`;
	const { data, error, count } = await supabase
		.from('diary')
		.select('id, created_at, mood, text, tags', { count: 'exact' })
		.eq('user_id', userId)
		.gte('created_at', queryStart)
		// Begränsningen ska alltid prioritera det användaren nyligen lagt till.
		// Analysen sorterar tillbaka raderna kronologiskt innan den jämför
		// perioder, så den läser aldrig äldre data på bekostnad av nya mönster.
		.order('created_at', { ascending: false })
		.limit(INSIGHTS_ROW_LIMIT);

	if (error) return { rows: [], truncated: false, error: error.message };

	const rows = ((data ?? []) as LighterDaysRow[])
		.slice()
		.sort((first, second) => (first.created_at ?? '').localeCompare(second.created_at ?? ''));
	return { rows, truncated: (count ?? data?.length ?? 0) > INSIGHTS_ROW_LIMIT, error: null };
}
