import type { LighterDaysTheme, LighterDaysView } from './progress-lighter-days-types';

/** Teman som får visas under "lättare dagar": bara när jämförelsen är tillförlitlig. */
export function getVisibleComparisonThemes(view: LighterDaysView | null, truncated: boolean): LighterDaysTheme[] {
	if (truncated || !view || view.lowConfidence || !view.helpfulPatterns?.ready) return [];
	return view.helpfulPatterns.themes;
}
