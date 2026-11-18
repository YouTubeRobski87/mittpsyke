// Framstegs flik och tidsperiod i adressen.
//
// Valet ligger i adressen så att det finns kvar när användaren öppnar en
// anteckning i Dagboken och sedan går tillbaka, med bakåtknappen eller med
// länken "Tillbaka till Framsteg". Bara kända värden läses och skrivs. Min plats
// och 30 dagar är standard och skrivs därför aldrig ut, så /framsteg utan
// parametrar betyder samma sak som förut.

import { PERIOD_OPTIONS, type PeriodDays } from '$lib/progress-recent-period';

export type ProgressUrlTab = 'place' | 'insights' | 'mood' | 'development';

export const PROGRESS_PATH = '/framsteg';
export const PROGRESS_TAB_PARAM = 'tab';
export const PROGRESS_PERIOD_PARAM = 'period';
export const DEFAULT_PROGRESS_TAB: ProgressUrlTab = 'place';
export const DEFAULT_PROGRESS_PERIOD: PeriodDays = 30;

const TABS: readonly ProgressUrlTab[] = ['place', 'insights', 'mood', 'development'];

/** Fliken i adressen, eller null när den saknas eller är okänd. */
export function readProgressTab(searchParams: URLSearchParams | null | undefined): ProgressUrlTab | null {
	const value = searchParams?.get(PROGRESS_TAB_PARAM);
	return TABS.find((tab) => tab === value) ?? null;
}

/** Perioden i adressen, eller null när den saknas eller inte går att välja. */
export function readProgressPeriod(searchParams: URLSearchParams | null | undefined): PeriodDays | null {
	const value = searchParams?.get(PROGRESS_PERIOD_PARAM);
	return PERIOD_OPTIONS.find((option) => String(option.value) === value)?.value ?? null;
}

/** Adressen till Framsteg med vald flik och period. Standardvärden utelämnas. */
export function progressHref(tab: ProgressUrlTab, period: PeriodDays): string {
	const params = new URLSearchParams();
	if (tab !== DEFAULT_PROGRESS_TAB) params.set(PROGRESS_TAB_PARAM, tab);
	if (period !== DEFAULT_PROGRESS_PERIOD) params.set(PROGRESS_PERIOD_PARAM, String(period));
	const query = params.toString();
	return query ? `${PROGRESS_PATH}?${query}` : PROGRESS_PATH;
}

/**
 * Länken tillbaka till Framsteg från Dagboken. Kom användaren från Framsteg
 * byggs länken om från den sidans flik och period. Allt annat i den adressen
 * ignoreras, så länken kan aldrig leda någon annanstans än till Framsteg.
 */
export function progressReturnHref(from: URL | null | undefined): string {
	if (!from || from.pathname !== PROGRESS_PATH) return PROGRESS_PATH;
	return progressHref(
		readProgressTab(from.searchParams) ?? DEFAULT_PROGRESS_TAB,
		readProgressPeriod(from.searchParams) ?? DEFAULT_PROGRESS_PERIOD
	);
}
