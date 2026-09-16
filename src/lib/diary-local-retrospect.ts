// Lokal återblick för den som skriver utan konto.
//
// Räknar vilka ord som återkommer i de lokala inläggen. Allt sker i
// webbläsaren: ingen AI, inget API, ingen Supabase och inget analytics-event
// med text. Resultatet är deterministiskt - samma inlägg ger alltid samma
// återblick - så det går att förklara varför ett ord visas.
//
// Den inloggade återblicken i Framsteg är något annat: den bygger på en
// kurerad ämneslista och på serversidan. Den rörs inte härifrån.

import type { LocalDiaryEntry } from '$lib/diary-local-history';
import { LOCAL_RETROSPECT_STOP_WORDS } from '$lib/swedish-stop-words';

/** Återblicken visas först när det finns tillräckligt att räkna på. */
export const MIN_LOCAL_ENTRIES_FOR_RETROSPECT = 3;
export const MIN_LOCAL_DAYS_FOR_RETROSPECT = 2;

/** Ett tema måste finnas i minst så här många inlägg, spridda över så många dagar. */
export const MIN_THEME_ENTRIES = 2;
export const MIN_THEME_DAYS = 2;

/** Kortare ord säger sällan något om innehållet. */
export const MIN_WORD_LENGTH = 4;

/** Hellre få tydliga teman än en lista som ser innehållsrik ut. */
export const MAX_THEMES = 3;

/**
 * Svenska stoppord, delade med serverns analyser via $lib/swedish-stop-words.
 * Den här listan är bredast av dem: återblicken visas direkt för användaren
 * och ska hellre visa inget än ett svagt tema.
 */
const SWEDISH_STOP_WORDS = LOCAL_RETROSPECT_STOP_WORDS;

/**
 * Lätt normalisering av bestämd form och plural, så att "sömnen" och "sömn"
 * räknas som samma ord. Ändelsen tas bara bort om stammen fortfarande är
 * minst fyra tecken, vilket hindrar att korta ord slås ihop av misstag.
 */
const SUFFIXES = ['arna', 'erna', 'orna', 'ande', 'ar', 'er', 'or', 'en', 'et', 'na', 'n', 't'];

export function normalizeWordForm(word: string): string {
	const lower = word.toLocaleLowerCase('sv-SE');
	for (const suffix of SUFFIXES) {
		if (lower.length - suffix.length >= MIN_WORD_LENGTH && lower.endsWith(suffix)) {
			return lower.slice(0, -suffix.length);
		}
	}
	return lower;
}

/** Endast bokstäver räknas: siffror, tecken och emoji faller bort. */
function tokenize(text: string): string[] {
	return (text.match(/[\p{L}]+/gu) ?? []).map((word) => word.toLocaleLowerCase('sv-SE'));
}

function isCountableWord(word: string): boolean {
	return word.length >= MIN_WORD_LENGTH && !SWEDISH_STOP_WORDS.has(word);
}

function dayKey(timestamp: number): string {
	const date = new Date(timestamp);
	return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

/** Kort utdrag runt ordet, så att användaren ser sammanhanget i sina egna ord. */
export function excerptAround(text: string, word: string, maxLength = 110): string {
	const flat = text.replace(/\s+/g, ' ').trim();
	const match = new RegExp(`[\\p{L}]*${word}[\\p{L}]*`, 'iu').exec(flat);
	if (!match || flat.length <= maxLength) return flat.slice(0, maxLength);

	const start = Math.max(0, match.index - Math.floor((maxLength - match[0].length) / 2));
	const end = Math.min(flat.length, start + maxLength);
	const slice = flat.slice(start, end).trim();
	return `${start > 0 ? '…' : ''}${slice}${end < flat.length ? '…' : ''}`;
}

export type LocalRetrospectOccurrence = {
	entryId: string;
	updatedAt: number;
	excerpt: string;
};

export type LocalRetrospectTheme = {
	/** Den vanligaste formen av ordet i användarens egna inlägg. */
	label: string;
	/** Normaliserad form, används för att hitta ordet i texten. */
	stem: string;
	entryCount: number;
	dayCount: number;
	occurrences: LocalRetrospectOccurrence[];
};

export type LocalRetrospect =
	| { status: 'not-enough'; entryCount: number; dayCount: number; themes: [] }
	| { status: 'no-theme'; entryCount: number; dayCount: number; themes: [] }
	| { status: 'ready'; entryCount: number; dayCount: number; themes: LocalRetrospectTheme[] };

type WordStat = {
	forms: Map<string, number>;
	entries: Map<string, { updatedAt: number; text: string }>;
	days: Set<string>;
};

/**
 * Räknar återkommande ord i de lokala inläggen.
 *
 * Ett ord blir ett tema först när det förekommer i minst två inlägg från
 * minst två olika dagar. Ett ord som bara finns i ett inlägg räknas aldrig,
 * och ingen text lämnar funktionen utom användarens egna utdrag.
 */
export function buildLocalRetrospect(entries: LocalDiaryEntry[]): LocalRetrospect {
	const usable = entries.filter((entry) => entry.text.trim().length > 0);
	const entryCount = usable.length;
	const dayCount = new Set(usable.map((entry) => dayKey(entry.updatedAt))).size;

	if (entryCount < MIN_LOCAL_ENTRIES_FOR_RETROSPECT || dayCount < MIN_LOCAL_DAYS_FOR_RETROSPECT) {
		return { status: 'not-enough', entryCount, dayCount, themes: [] };
	}

	const stats = new Map<string, WordStat>();

	for (const entry of usable) {
		const seenInEntry = new Set<string>();
		for (const word of tokenize(entry.text)) {
			if (!isCountableWord(word)) continue;

			const stem = normalizeWordForm(word);
			if (stem.length < MIN_WORD_LENGTH) continue;

			const stat = stats.get(stem) ?? { forms: new Map(), entries: new Map(), days: new Set() };
			stat.forms.set(word, (stat.forms.get(word) ?? 0) + 1);
			if (!seenInEntry.has(stem)) {
				seenInEntry.add(stem);
				stat.entries.set(entry.id, { updatedAt: entry.updatedAt, text: entry.text });
				stat.days.add(dayKey(entry.updatedAt));
			}
			stats.set(stem, stat);
		}
	}

	const themes: LocalRetrospectTheme[] = [...stats.entries()]
		.filter(([, stat]) => stat.entries.size >= MIN_THEME_ENTRIES && stat.days.size >= MIN_THEME_DAYS)
		.map(([stem, stat]) => {
			// Vanligaste skrivna formen visas, med alfabetisk ordning som
			// tiebreak så att resultatet blir detsamma varje gång.
			const label = [...stat.forms.entries()].sort(
				(a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'sv-SE')
			)[0][0];

			const occurrences = [...stat.entries.entries()]
				.map(([entryId, value]) => ({
					entryId,
					updatedAt: value.updatedAt,
					excerpt: excerptAround(value.text, stem)
				}))
				.sort((a, b) => b.updatedAt - a.updatedAt);

			return {
				label: label.charAt(0).toLocaleUpperCase('sv-SE') + label.slice(1),
				stem,
				entryCount: stat.entries.size,
				dayCount: stat.days.size,
				occurrences
			};
		})
		.sort(
			(a, b) =>
				b.entryCount - a.entryCount ||
				b.dayCount - a.dayCount ||
				a.label.localeCompare(b.label, 'sv-SE')
		)
		.slice(0, MAX_THEMES);

	if (themes.length === 0) return { status: 'no-theme', entryCount, dayCount, themes: [] };

	return { status: 'ready', entryCount, dayCount, themes };
}

/**
 * Raden som visas för ett tema. Beskriver bara vad som går att räkna:
 * hur många av inläggen ordet förekommer i. Ingen tolkning, ingen orsak.
 */
export function describeLocalTheme(theme: LocalRetrospectTheme, entryCount: number): string {
	return `”${theme.label}” förekommer i ${theme.entryCount} av dina ${entryCount} senaste inlägg.`;
}
