/** Shared theme definitions for MittPsyke â€” single source of truth */

export const THEME_STORAGE_KEY = 'mittpsyke:theme';

export interface ThemeColors {
	label: string;
	accent: string;
	bg: string;
}

export const THEMES: Record<string, ThemeColors> = {
	neutral:   { label: 'Neutral',    accent: '#436e8f', bg: 'rgba(67, 110, 143, 0.08)' },
	salvia:    { label: 'Salvia',     accent: '#5f7fa5', bg: 'rgba(95, 127, 165, 0.09)' },
	havsblÃ¥:   { label: 'HavsblÃ¥',   accent: '#5b8db8', bg: 'rgba(91, 141, 184, 0.09)' },
	lavendel:  { label: 'Lavendel',  accent: '#8b7ab8', bg: 'rgba(139, 122, 184, 0.09)' },
	sand:      { label: 'Sand',       accent: '#b8956a', bg: 'rgba(184, 149, 106, 0.09)' },
	skogsgrÃ¶n: { label: 'SkogsgrÃ¶n', accent: '#395d84', bg: 'rgba(57, 93, 132, 0.09)' },
};

export const DEFAULT_THEME = 'neutral';

/** Read theme from localStorage (safe for SSR) */
export function getCachedTheme(): string {
	if (typeof globalThis.localStorage === 'undefined') return DEFAULT_THEME;
	return localStorage.getItem(THEME_STORAGE_KEY) ?? DEFAULT_THEME;
}

/** Get theme colors for a theme key */
export function getThemeColors(key: string): ThemeColors {
	return THEMES[key] ?? THEMES[DEFAULT_THEME];
}

/** Build CSS variable string for inline styles */
export function themeStyleVars(key: string): string {
	const t = getThemeColors(key);
	return `--theme-accent: ${t.accent}; --theme-bg: ${t.bg};`;
}
