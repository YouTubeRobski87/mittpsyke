import { containsSensitiveContentPhrase } from '$lib/ai/crisis-keywords';
import { resolveDeterministicRiskGuard } from '$lib/ai/crisis-guard';
import { diaryEntryHref } from '$lib/diary-entry-link';
import { MAX_RETROSPECT_SOURCES, type RetrospectPeriod, type RetrospectSegment, type RetrospectSource } from '$lib/progress-retrospect';
import { shiftDateKey, toStockholmDateKey } from '$lib/stockholm-date';
import { getProgressPeriodBounds, filterProgressRows } from './progress-analysis';
import type { LighterDaysRow } from './progress-lighter-days';
import { toEntryId } from './progress-theme-excerpt';

const wordCount = (text: string) => text.match(/\S+/g)?.length ?? 0;

export function buildRetrospectSources(rows: LighterDaysRow[], period: RetrospectPeriod, now = new Date()) {
	const { start } = getProgressPeriodBounds(period, now);
	const middle = shiftDateKey(start, period / 3);
	const later = shiftDateKey(start, period * 2 / 3);
	const candidates = new Map<string, Omit<RetrospectSource, 'ref'>>();
	const excerpts = new Set<string>();
	const chronological = filterProgressRows(rows, period, now).sort((a, b) =>
		(a.created_at ?? '').localeCompare(b.created_at ?? '') ||
		String(a.id ?? '').localeCompare(String(b.id ?? ''))
	);
	for (const row of chronological) {
		const date = toStockholmDateKey(row.created_at);
		const entryId = toEntryId(row.id);
		const original = row.text?.trim() ?? '';
		if (!date || !entryId || !diaryEntryHref(entryId) || candidates.has(date)) continue;

		// Whole notes or an intact opening paragraph. A longer paragraph cannot
		// be cut down safely if the following sentence qualifies what was said.
		const excerpt = original.length <= 360 && wordCount(original) <= 32
			? original
			: original.split(/\r?\n\s*\r?\n/, 1)[0].trim();
		if (!/^[\p{Lu}]/u.test(excerpt) || !/[.!?]$/u.test(excerpt) ||
			excerpt.length > 360 || wordCount(excerpt) > 32 || excerpts.has(excerpt) ||
			containsSensitiveContentPhrase(original) || resolveDeterministicRiskGuard(original)) continue;
		if (excerpt !== original && /\b(men|fast|däremot|egentligen|inte|därefter)\b/iu.test(original.slice(excerpt.length))) continue;

		const segment: RetrospectSegment = date < middle ? 0 : date < later ? 1 : 2;
		excerpts.add(excerpt);
		candidates.set(date, { entryId, date, segment, excerpt });
	}

	const catalog = [...candidates.values()].map((source, index) => ({ ...source, ref: index + 1 }));
	const groups = ([0, 1, 2] as const).map((segment) => catalog.filter((source) => source.segment === segment));
	const chosen = groups.flatMap((group) => group.length ? [group[Math.floor((group.length - 1) / 2)]] : []);
	for (const source of [catalog[0], catalog.at(-1), ...catalog]) {
		if (chosen.length >= MAX_RETROSPECT_SOURCES) break;
		if (source && !chosen.includes(source)) chosen.push(source);
	}

	return { candidates: catalog, sources: chosen.sort((a, b) => a.ref - b.ref) };
}

export function selectRetrospectSources(candidates: RetrospectSource[], refs: unknown): RetrospectSource[] | null {
	if (!Array.isArray(refs) || refs.length < 2 || refs.length > MAX_RETROSPECT_SOURCES ||
		!refs.every(Number.isSafeInteger) || new Set(refs).size !== refs.length) return null;
	const sources = candidates.filter((source) => refs.includes(source.ref));
	if (sources.length !== refs.length || wordCount(sources.map(({ excerpt }) => excerpt).join(' ')) > 128) return null;
	return sources;
}
