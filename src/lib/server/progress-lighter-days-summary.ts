// AI-sammanfattning av "Det som ofta fanns med under lättare dagar".
//
// Körs bara när användaren själv trycker på knappen (se
// /api/diary/insights/summary). Modellen får aldrig hela dagboken: den får de
// redan framräknade temaanteckningarna och en numrerad lista med ordagranna
// utdrag ur användarens egna inlägg. Varje påstående i svaret måste peka på
// minst ett av de numren. Påståenden utan giltigt underlag, eller med
// identitets-, diagnos- eller orsaksspråk, kastas innan något visas.

import type { AITextRequest } from '$lib/server/ai/text-generation';
import { buildSharedSafetyInstructions } from '$lib/server/ai/safety-instructions';
import { findForbiddenProgressPhrase } from '$lib/progress-language';
import type { LighterDaysView, SummarySource, SummaryStatement } from '$lib/progress-lighter-days-types';

export const MAX_SUMMARY_SOURCES = 20;
export const MAX_SUMMARY_STATEMENTS = 4;
const MAX_STATEMENT_LENGTH = 280;

export type { SummarySource, SummaryStatement };

/** Utdragen modellen får se. Bara riktiga, visningsbara utdrag ur användarens text. */
export function collectSummarySources(view: LighterDaysView): SummarySource[] {
	const sources: SummarySource[] = [];
	for (const theme of view.themes) {
		for (const item of theme.evidence) {
			if (!item.excerpt) continue;
			if (sources.length >= MAX_SUMMARY_SOURCES) return sources;
			sources.push({
				ref: sources.length + 1,
				entryId: item.entryId,
				date: item.date,
				dateLabel: item.dateLabel,
				themeLabel: theme.label,
				excerpt: item.excerpt
			});
		}
	}
	return sources;
}

const SUMMARY_INSTRUCTIONS = `Du sammanfattar en privat dagboksåterblick på svenska.

Du får teman med färdigräknade siffror och en numrerad lista med utdrag ur användarens egna dagboksinlägg.

Regler:
- Skriv högst ${MAX_SUMMARY_STATEMENTS} korta påståenden.
- Varje påstående ska bygga på ett eller flera numrerade utdrag och ange deras nummer i "sources".
- Citera gärna korta delar av utdragen ordagrant inom citattecken. Hitta aldrig på citat.
- Beskriv bara vad som fanns med i inläggen och när. Aldrig varför.
- Påstå aldrig orsak ("ledde till", "på grund av", "hjälper dig", "gör att").
- Säg aldrig vem användaren är ("du är ..."), tolka aldrig personlighet och nämn aldrig diagnoser eller symtom.
- Inga råd, ingen terapi, inga värderingar.
- Använd bara siffrorna som står i underlaget. Räkna inte fram egna.

Returnera endast JSON: {"statements":[{"text":"...","sources":[1,2]}]}`;

export function buildLighterDaysSummaryRequest(
	view: LighterDaysView,
	sources: readonly SummarySource[]
): AITextRequest {
	const themeLines = view.themes.map((theme) => `- ${theme.note} ${theme.comparison}`);
	const sourceLines = sources.map(
		(source) => `[${source.ref}] ${source.dateLabel} (tema: ${source.themeLabel}): "${source.excerpt}"`
	);
	return {
		purpose: 'diary-narrative',
		systemInstructions: [...buildSharedSafetyInstructions(), SUMMARY_INSTRUCTIONS],
		messages: [
			{
				role: 'user',
				content: `Teman (${view.periodDays} dagar, ${view.relevantEntryCount} inlägg med text och humör):\n${themeLines.join('\n')}\n\nUtdrag:\n${sourceLines.join('\n')}`
			}
		],
		temperature: 0.2,
		outputFormat: 'json_object'
	};
}

/**
 * Tolkar modellens svar strikt. Ett påstående behålls bara när det pekar på
 * minst ett existerande utdrag och håller sig till språkreglerna.
 */
export function parseLighterDaysSummary(
	raw: string,
	sources: readonly SummarySource[]
): SummaryStatement[] {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}
	const statements =
		parsed && typeof parsed === 'object' && Array.isArray((parsed as { statements?: unknown }).statements)
			? ((parsed as { statements: unknown[] }).statements)
			: [];
	const byRef = new Map(sources.map((source) => [source.ref, source]));
	const result: SummaryStatement[] = [];

	for (const candidate of statements) {
		if (result.length >= MAX_SUMMARY_STATEMENTS) break;
		if (!candidate || typeof candidate !== 'object') continue;
		const { text, sources: refs } = candidate as { text?: unknown; sources?: unknown };
		if (typeof text !== 'string' || !Array.isArray(refs)) continue;
		// Referensmarkörer i själva texten tas bort; underlaget visas separat.
		const cleaned = text.replace(/\s*\[\d+(?:\s*,\s*\d+)*\]/g, '').replace(/\s+/g, ' ').trim();
		if (!cleaned || cleaned.length > MAX_STATEMENT_LENGTH) continue;
		if (findForbiddenProgressPhrase(cleaned)) continue;
		const linked = [...new Set(refs)]
			.filter((ref): ref is number => typeof ref === 'number' && Number.isInteger(ref))
			.map((ref) => byRef.get(ref))
			.filter((source): source is SummarySource => source !== undefined);
		if (linked.length === 0) continue;
		result.push({ text: cleaned, sources: linked });
	}

	return result;
}
