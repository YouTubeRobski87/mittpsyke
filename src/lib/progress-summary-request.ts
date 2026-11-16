import { findForbiddenProgressPhrase } from './progress-language';
import type { LighterDaysTheme, LighterDaysView, SummaryStatement } from './progress-lighter-days-types';

type SummarySnapshot = { periodDays: LighterDaysView['periodDays']; facts: SummaryStatement[] };

export function getVisibleComparisonThemes(view: LighterDaysView | null, truncated: boolean): LighterDaysTheme[] {
	if (truncated || !view || view.lowConfidence || !view.helpfulPatterns?.ready) return [];
	return view.helpfulPatterns.themes;
}

export function getLighterDaysSummaryView(view: LighterDaysView | null, truncated: boolean): SummarySnapshot | null {
	if (!view) return null;
	const facts = collectSummaryFacts(getVisibleComparisonThemes(view, truncated));
	return facts.length ? { periodDays: view.periodDays, facts } : null;
}

export const MAX_SUMMARY_SOURCES = 20;

/** Tillåt bara serverns egna observationer med utdrag från samma tema. */
function collectSummaryFacts(themes: LighterDaysTheme[]): SummaryStatement[] {
	const facts: SummaryStatement[] = [];
	let sourceCount = 0;
	for (const theme of themes) {
		const text = `${theme.note} ${theme.comparison}`;
		if (findForbiddenProgressPhrase(text)) continue;
		const sources: SummaryStatement['sources'] = [];
		for (const item of theme.evidence) {
			if (sourceCount >= MAX_SUMMARY_SOURCES) break;
			if (!item.excerpt) continue;
			sources.push({
				ref: ++sourceCount,
				entryId: item.entryId,
				date: item.date,
				dateLabel: item.dateLabel,
				themeLabel: theme.label,
				excerpt: item.excerpt
			});
		}
		if (sources.length > 0) facts.push({ text, sources });
	}
	return facts;
}

export async function getSummarySnapshotId(view: SummarySnapshot): Promise<string> {
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
		start(view: SummarySnapshot) {
			cancel();
			const controller = new AbortController();
			active = controller;
			return {
				signal: controller.signal,
				isCurrent: (current: SummarySnapshot | null) => active === controller && current === view,
				finish() {
					if (active === controller) active = undefined;
				}
			};
		}
	};
}
