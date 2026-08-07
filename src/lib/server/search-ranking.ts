import type { SearchContentItem, SearchContentType } from './search-index';

// ---------------------------------------------------------------------------
// Viktad keyword-rankning för den gemensamma innehållssökningen.
//
// Ren modul utan I/O: inga API-anrop, ingen databas, inga env-variabler. Det
// gör att /api/search svarar utan extern kostnad, och att rankningen går att
// testa direkt (search-ranking.test.ts).
//
// Semantiken är medvetet INTE inbyggd här. Embeddinginfrastrukturen finns kvar
// i search-index.ts och cron-jobbet, men ligger utanför sökvägen så att en
// sökning aldrig kostar ett OpenAI-anrop. Ska den återinföras som förstärkning
// är rätt ställe rankResults nedan: lägg semantisk poäng som en bonus ovanpå
// keywordScore, inte som en egen väg in i resultatlistan.
// ---------------------------------------------------------------------------

/**
 * Vikterna avgör hela rankningen. Titeln väger inte bara mest av fälten - de
 * övriga tre summerar medvetet till mindre än titelns vikt (0.45 + 0.3 + 0.1 =
 * 0.85 < 1), så en sida som faktiskt heter det användaren söker på alltid slår
 * en sida som bara nämner ordet i ingress, taggar och brödtext.
 *
 * Den regeln testas i search-ranking.test.ts. Höjs något av de tre andra
 * fälten måste summan hållas under title, annars faller testet.
 */
export const FIELD_WEIGHTS = {
	title: 1,
	summary: 0.45,
	keywords: 0.3,
	body: 0.1
} as const;

/**
 * Vid samma URL vinner den här ordningen över poängen. En FAQ ärver sin guides
 * URL, så utan detta kunde en enskild fråga representera hela guiden i
 * resultatlistan - med frågan som rubrik och etiketten "Vanlig fråga".
 */
const CONTENT_TYPE_PRIORITY: Record<SearchContentType, number> = {
	article: 0,
	guide: 0,
	tool: 0,
	pillar: 1,
	'support-line': 1,
	faq: 2
};

export type RankedResult = {
	contentType: SearchContentType;
	title: string;
	url: string;
	snippet: string;
	score: number;
};

/**
 * Gemensam normalisering för både sökfråga och indexerat innehåll.
 *
 * NFD delar upp å/ä/ö i grundbokstav + diakritiskt tecken, och tecknen tas
 * bort. Därför matchar "sjalvkansla" mot "självkänsla" och tvärtom, utan
 * synonymlistor. Bieffekten är att t.ex. "har" också matchar "här" - i en
 * fritextsökning är det en acceptabel kostnad för att slippa kräva att
 * användaren har svenskt tangentbord.
 */
export function normalizeForSearch(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Kortaste prefix som får räknas som partiell träff. Kortare än så matchar för brett. */
const MIN_PREFIX_LENGTH = 5;
/** Partiell träff är alltid värd mindre än en hel, så exakta ord rankas högre. */
const PREFIX_CREDIT = 0.6;

/**
 * Hur väl ett enskilt sökord täcks av fältet.
 *
 * Delsträngsmatchning löser svenska sammansättningar när frågan är kortast:
 * "jämför" hittar "jämförelse". Men det omvända är minst lika vanligt -
 * någon söker "andningsövning" och innehållet heter "4-7-8 andning". Därför
 * provas även frågeordets prefix nedåt, med reducerad poäng.
 */
function wordCredit(word: string, field: string): number {
	if (field.includes(word)) return 1;

	for (let length = word.length - 1; length >= MIN_PREFIX_LENGTH; length -= 1) {
		if (field.includes(word.slice(0, length))) return PREFIX_CREDIT;
	}

	return 0;
}

/**
 * Delfältets träffgrad, 0-1. Hela frasen väger hälften och täckningen av
 * sökorden hälften.
 */
function fieldScore(normalizedQuery: string, queryWords: string[], fieldValue: string): number {
	if (!fieldValue) return 0;
	const field = normalizeForSearch(fieldValue);
	if (!field) return 0;

	const phrase = field.includes(normalizedQuery) ? 1 : 0;
	const credit = queryWords.reduce((sum, word) => sum + wordCredit(word, field), 0);
	const overlap = queryWords.length > 0 ? credit / queryWords.length : 0;

	return Math.min(1, 0.5 * phrase + 0.5 * overlap);
}

/** Viktad poäng över alla fält. 0 betyder ingen träff alls och filtreras bort. */
export function scoreItem(normalizedQuery: string, queryWords: string[], item: SearchContentItem): number {
	if (!normalizedQuery) return 0;

	return (
		FIELD_WEIGHTS.title * fieldScore(normalizedQuery, queryWords, item.title) +
		FIELD_WEIGHTS.summary * fieldScore(normalizedQuery, queryWords, item.summary) +
		FIELD_WEIGHTS.keywords * fieldScore(normalizedQuery, queryWords, item.keywords) +
		FIELD_WEIGHTS.body * fieldScore(normalizedQuery, queryWords, item.body)
	);
}

function buildSnippet(item: SearchContentItem): string {
	const source = item.summary || item.body || item.chunkText;
	const normalized = source.trim().replace(/\s+/g, ' ');
	return normalized.length > 220 ? `${normalized.slice(0, 220)}…` : normalized;
}

/** Ord kortare än två tecken bidrar inte - "i", "på" matchar nästan allt. */
export function toQueryWords(normalizedQuery: string): string[] {
	return normalizedQuery.split(' ').filter((word) => word.length > 1);
}

/**
 * Rankar hela innehållsmängden mot frågan och lämnar högst ett resultat per
 * URL. En tom fråga ger en tom lista - söksidan ska aldrig visa hela indexet.
 */
export function rankResults(rawQuery: string, content: SearchContentItem[]): RankedResult[] {
	const normalizedQuery = normalizeForSearch(rawQuery);
	if (!normalizedQuery) return [];

	const queryWords = toQueryWords(normalizedQuery);

	const scored = content
		.map((item) => ({ item, score: scoreItem(normalizedQuery, queryWords, item) }))
		.filter((entry) => entry.score > 0);

	// Behåll ett resultat per URL. Poängen vinner, men en primär innehållstyp
	// (artikel/guide/övning) slår alltid en FAQ som pekar på samma sida - och
	// tar då med sig FAQ-träffens poäng, eftersom frågan var det som matchade.
	const bestByUrl = new Map<string, { item: SearchContentItem; score: number }>();
	for (const entry of scored) {
		const current = bestByUrl.get(entry.item.url);
		if (!current) {
			bestByUrl.set(entry.item.url, entry);
			continue;
		}

		const currentPriority = CONTENT_TYPE_PRIORITY[current.item.contentType];
		const nextPriority = CONTENT_TYPE_PRIORITY[entry.item.contentType];
		const score = Math.max(current.score, entry.score);

		if (nextPriority < currentPriority || (nextPriority === currentPriority && entry.score > current.score)) {
			bestByUrl.set(entry.item.url, { item: entry.item, score });
		} else {
			bestByUrl.set(entry.item.url, { item: current.item, score });
		}
	}

	return [...bestByUrl.values()]
		.map(({ item, score }) => ({
			contentType: item.contentType,
			title: item.title,
			url: item.url,
			snippet: buildSnippet(item),
			score
		}))
		.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'sv'));
}
