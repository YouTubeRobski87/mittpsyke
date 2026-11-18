import { findForbiddenProgressPhrase } from './progress-language';
import type { LighterDaysTheme, LighterDaysView, SummarySource } from './progress-lighter-days-types';

type SummarySnapshot = {
	periodDays: LighterDaysView['periodDays'];
	themeId: string;
	themeLabel: string;
	guardText: string;
	sources: SummarySource[];
};

export function getVisibleComparisonThemes(view: LighterDaysView | null, truncated: boolean): LighterDaysTheme[] {
	if (truncated || !view || view.lowConfidence || !view.helpfulPatterns?.ready) return [];
	return view.helpfulPatterns.themes;
}

const MAX_SUMMARY_SOURCES = 3;
const MIN_EXCERPT_WORDS = 5;

export function getLighterDaysSummaryView(
	view: LighterDaysView | null,
	truncated: boolean,
	themeId: string | null
): SummarySnapshot | null {
	const theme = getVisibleComparisonThemes(view, truncated).find((item) => item.id === themeId);
	if (!view || !theme) return null;
	const guardText = theme.note + ' ' + theme.comparison;
	if (findForbiddenProgressPhrase(guardText)) return null;

	const sources: SummarySource[] = [];
	for (const [evidenceIndex, item] of theme.evidence.entries()) {
		if (sources.length === MAX_SUMMARY_SOURCES) break;
		const excerpt = item.excerpt;
		if (!excerpt || (excerpt.match(/\p{L}+/gu)?.length ?? 0) < MIN_EXCERPT_WORDS ||
			sources.some((source) => source.excerpt === excerpt)) continue;
		sources.push({
			ref: sources.length + 1,
			evidenceIndex,
			entryId: item.entryId,
			date: item.date,
			dateLabel: item.dateLabel,
			excerpt
		});
	}
	return sources.length > 0
		? { periodDays: view.periodDays, themeId: theme.id, themeLabel: theme.label, guardText, sources }
		: null;
}

type SelectedSummarySnapshot = Omit<SummarySnapshot, 'sources'> & { source: SummarySource };

export function selectSummarySource(view: SummarySnapshot | null, ref: number | null): SelectedSummarySnapshot | null {
	if (!view) return null;
	const { sources, ...context } = view;
	const source = sources.find((item) => item.ref === ref);
	return source ? { ...context, source } : null;
}

export async function getSummarySnapshotId(view: SelectedSummarySnapshot): Promise<string> {
	const bytes = new TextEncoder().encode(JSON.stringify(view));
	const digest = await crypto.subtle.digest('SHA-256', bytes);
	return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createSummaryRequests() {
	let active: AbortController | undefined;

	function cancel() {
		active?.abort();
		active = undefined;
	}

	return {
		cancel,
		start(view: SelectedSummarySnapshot) {
			cancel();
			const controller = new AbortController();
			active = controller;
			return {
				signal: controller.signal,
				isCurrent: (current: SelectedSummarySnapshot | null) => active === controller && current === view,
				finish() {
					if (active === controller) active = undefined;
				}
			};
		}
	};
}
