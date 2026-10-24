// Ordagranna utdrag ur användarens egna anteckningar för Framstegs teman.
//
// Delas av "Det som återkommer i dina anteckningar" (progress-analysis) och
// "Det som ofta fanns med under lättare dagar" (progress-lighter-days), så att
// båda visar utdrag på exakt samma sätt. Ingenting skrivs om: ett utdrag är
// alltid en sammanhängande del av originaltexten, markerad med … där det
// kapats. Meningar med krisinnehåll visas aldrig här.

import { containsSensitiveContentPhrase } from '$lib/ai/crisis-keywords';
import { TOPICS } from '$lib/server/diary-insight-analysis';

const MAX_EXCERPT_LENGTH = 160;

function isSafeToShow(sentence: string): boolean {
	return !containsSensitiveContentPhrase(sentence);
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

/** Id för originalinlägget, eller null när raden saknar ett användbart id. */
export function toEntryId(value: string | number | null | undefined): string | null {
	if (typeof value === 'number' && Number.isFinite(value)) return String(value);
	if (typeof value === 'string' && value.trim()) return value.trim();
	return null;
}
