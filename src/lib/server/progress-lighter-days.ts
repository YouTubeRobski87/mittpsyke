// Underlaget för "Det som ofta fanns med under lättare dagar" på Framsteg.
//
// Allt här räknas ur användarens egna inlägg i vald period. Varje tema som
// visas bär sina siffror (n, jämförelsebas och period) och en lista med de
// inlägg det bygger på, så att slutsatsen alltid går att kontrollera. Ingen
// språkmodell är inblandad, och ingen text säger att ett tema orsakar något:
// den säger bara att temat fanns med.

import { containsAcuteCrisisPhrase, containsThirdPartyRiskPhrase } from '$lib/ai/crisis-keywords';
import { TOPICS, type DiaryInsightRow } from '$lib/server/diary-insight-analysis';
import {
	LOW_CONFIDENCE_ENTRY_LIMIT,
	MIN_THEME_WEEKS,
	detectThemes,
	filterProgressRows,
	isoWeek,
	type ProgressPeriodDays
} from '$lib/server/progress-analysis';
import {
	getThemeDisplayLabel,
	isThemeHidden,
	type ProgressThemeOverrides
} from '$lib/progress-theme-overrides';
import { toStockholmDateKey } from '$lib/stockholm-date';
import type { LighterDaysTheme, LighterDaysView, ThemeEvidence } from '$lib/progress-lighter-days-types';

/** Ett tema måste finnas med i minst så här många inlägg med högre humör. */
export const MIN_LIGHTER_DAY_OCCURRENCES = 3;
export { LOW_CONFIDENCE_ENTRY_LIMIT, MIN_THEME_WEEKS };

const MAX_THEMES = 5;
const MAX_EVIDENCE_PER_THEME = 8;
const MAX_EXCERPT_LENGTH = 160;

export type LighterDaysRow = DiaryInsightRow & { id?: string | number | null };

export type { LighterDaysTheme, LighterDaysView, ThemeEvidence };

type RelevantEntry = {
	entryId: string | null;
	date: string;
	mood: number;
	text: string;
	themeIds: string[];
};

function formatMood(value: number): string {
	return (Math.round(value * 10) / 10).toFixed(1).replace('.', ',');
}

function dateLabel(date: string): string {
	return new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }).format(
		new Date(`${date}T12:00:00Z`)
	);
}

function parseMood(value: unknown): number | null {
	const numeric =
		typeof value === 'number'
			? value
			: typeof value === 'string'
				? Number.parseFloat(value.replace(',', '.'))
				: Number.NaN;
	return Number.isFinite(numeric) ? Math.min(10, Math.max(1, numeric)) : null;
}

function median(values: number[]): number | null {
	if (values.length === 0) return null;
	const sorted = [...values].sort((a, b) => a - b);
	const middle = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function isSafeToShow(sentence: string): boolean {
	return !containsAcuteCrisisPhrase(sentence) && !containsThirdPartyRiskPhrase(sentence);
}

/**
 * Kortar en mening kring nyckelordet utan att skriva om den. Resultatet är
 * alltid ett sammanhängande utdrag ur originaltexten, markerat med … där det
 * kapats.
 */
function clipAround(sentence: string, keywordIndex: number): string {
	if (sentence.length <= MAX_EXCERPT_LENGTH) return sentence;
	const half = Math.floor(MAX_EXCERPT_LENGTH / 2);
	let start = Math.max(0, keywordIndex - half);
	let end = Math.min(sentence.length, start + MAX_EXCERPT_LENGTH);
	start = Math.max(0, end - MAX_EXCERPT_LENGTH);
	// Kapa vid mellanslag så inga ord bryts mitt itu.
	if (start > 0) {
		const space = sentence.indexOf(' ', start);
		if (space !== -1 && space < keywordIndex) start = space + 1;
	}
	if (end < sentence.length) {
		const space = sentence.lastIndexOf(' ', end);
		if (space > keywordIndex) end = space;
	}
	return `${start > 0 ? '…' : ''}${sentence.slice(start, end).trim()}${end < sentence.length ? '…' : ''}`;
}

/**
 * Den mening i användarens text där temat nämns. Temat kan också komma från
 * en tagg utan att ordet står i texten; då används första meningen, eftersom
 * det är den texten taggen sitter på.
 */
export function extractThemeExcerpt(text: string, themeId: string): string | null {
	const sentences = text
		.split(/(?<=[.!?])\s+|\n+/)
		.map((sentence) => sentence.trim())
		.filter(Boolean);
	const keywords = (TOPICS.find((topic) => topic.label === themeId)?.keywords ?? []).map((keyword) =>
		keyword.toLocaleLowerCase('sv-SE')
	);

	for (const sentence of sentences) {
		const lowered = sentence.toLocaleLowerCase('sv-SE');
		const index = keywords
			.map((keyword) => lowered.indexOf(keyword))
			.filter((position) => position >= 0)
			.sort((a, b) => a - b)[0];
		if (index === undefined) continue;
		return isSafeToShow(sentence) ? clipAround(sentence, index) : null;
	}

	const first = sentences[0];
	if (!first || !isSafeToShow(first)) return null;
	return clipAround(first, 0);
}

function toEntryId(value: LighterDaysRow['id']): string | null {
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	if (typeof value === 'string' && value.trim()) return value.trim();
	return null;
}

function prepareRelevantEntries(rows: LighterDaysRow[]): RelevantEntry[] {
	const entries: RelevantEntry[] = [];
	for (const row of rows) {
		const date = toStockholmDateKey(row.created_at);
		const mood = parseMood(row.mood);
		const text = typeof row.text === 'string' ? row.text.trim() : '';
		if (!date || mood === null || !text) continue;
		entries.push({ entryId: toEntryId(row.id), date, mood, text, themeIds: detectThemes(text, row.tags) });
	}
	return entries.sort((a, b) => b.date.localeCompare(a.date));
}

function buildBasis(
	periodDays: ProgressPeriodDays,
	relevantEntryCount: number,
	higherEntryCount: number,
	medianMood: number | null
): string {
	const intro = `Underlaget är ${relevantEntryCount} inlägg med både text och humör de senaste ${periodDays} dagarna.`;
	if (medianMood === null || higherEntryCount === 0) {
		return `${intro} Inget inlägg ligger över periodens mittvärde, så det finns inga lättare dagar att jämföra med ännu.`;
	}
	return `${intro} "Högre humör" betyder över periodens mittvärde ${formatMood(medianMood)} av 10, vilket gäller ${higherEntryCount} av dem. Ett tema visas när det fanns med i minst ${MIN_LIGHTER_DAY_OCCURRENCES} av de inläggen, under minst ${MIN_THEME_WEEKS} olika veckor, och oftare än i övriga inlägg. Det beskriver vad som fanns med, inte vad som orsakade något.`;
}

export function buildLighterDaysView(
	rows: LighterDaysRow[],
	periodDays: ProgressPeriodDays,
	overrides: ProgressThemeOverrides = {},
	now: Date = new Date()
): LighterDaysView {
	const entries = prepareRelevantEntries(filterProgressRows(rows, periodDays, now) as LighterDaysRow[]);
	const medianMood = median(entries.map((entry) => entry.mood));
	const higher = medianMood === null ? [] : entries.filter((entry) => entry.mood > medianMood);
	const other = medianMood === null ? entries : entries.filter((entry) => entry.mood <= medianMood);

	const hiddenThemes = Object.entries(overrides)
		.filter(([, override]) => override.hidden === true)
		.map(([id]) => ({ id, label: getThemeDisplayLabel(overrides, id) }));

	const themes: LighterDaysTheme[] = [];
	for (const topic of TOPICS) {
		const id = topic.label;
		if (isThemeHidden(overrides, id)) continue;
		const withTheme = higher.filter((entry) => entry.themeIds.includes(id));
		const weekCount = new Set(withTheme.map((entry) => isoWeek(entry.date))).size;
		if (withTheme.length < MIN_LIGHTER_DAY_OCCURRENCES || weekCount < MIN_THEME_WEEKS) continue;

		const otherCount = other.filter((entry) => entry.themeIds.includes(id)).length;
		// Temat ska ha funnits med oftare under lättare dagar än i övriga inlägg.
		// Ett tema som finns i nästan allt säger annars ingenting om lättare dagar.
		const higherShare = withTheme.length / higher.length;
		const otherShare = other.length > 0 ? otherCount / other.length : 1;
		if (higherShare <= otherShare) continue;

		const label = getThemeDisplayLabel(overrides, id);
		themes.push({
			id,
			label,
			renamed: label !== id,
			count: withTheme.length,
			base: higher.length,
			otherCount,
			otherBase: other.length,
			weekCount,
			note: `${label} fanns med i ${withTheme.length} av ${higher.length} inlägg med högre humör (${periodDays} dagar).`,
			comparison: `I övriga inlägg: ${otherCount} av ${other.length}.`,
			evidence: withTheme.slice(0, MAX_EVIDENCE_PER_THEME).map((entry) => ({
				entryId: entry.entryId,
				date: entry.date,
				dateLabel: dateLabel(entry.date),
				mood: entry.mood,
				excerpt: extractThemeExcerpt(entry.text, id)
			}))
		});
	}

	// Flest förekomster först; vid lika antal det tema som skiljer sig mest
	// från övriga inlägg.
	const shareGap = (theme: LighterDaysTheme) =>
		theme.count / theme.base - theme.otherCount / Math.max(theme.otherBase, 1);
	themes.sort((a, b) => b.count - a.count || shareGap(b) - shareGap(a));

	return {
		periodDays,
		relevantEntryCount: entries.length,
		higherEntryCount: higher.length,
		medianMood,
		lowConfidence: entries.length < LOW_CONFIDENCE_ENTRY_LIMIT,
		themes: themes.slice(0, MAX_THEMES),
		hiddenThemes,
		basis: buildBasis(periodDays, entries.length, higher.length, medianMood)
	};
}
