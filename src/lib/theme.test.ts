import { describe, it, expect } from 'vitest';
import { getThemeColors, themeStyleVars, THEMES, DEFAULT_THEME } from './theme';

describe('getThemeColors', () => {
	it('returns colors for a valid theme key', () => {
		const colors = getThemeColors('neutral');
		expect(colors).toHaveProperty('label');
		expect(colors).toHaveProperty('accent');
		expect(colors).toHaveProperty('bg');
	});

	it('returns the correct accent for each defined theme', () => {
		for (const [key, expected] of Object.entries(THEMES)) {
			const colors = getThemeColors(key);
			expect(colors.accent).toBe(expected.accent);
		}
	});

	it('falls back to the default theme for an unknown key', () => {
		const fallback = getThemeColors('unknown-theme');
		expect(fallback).toEqual(THEMES[DEFAULT_THEME]);
	});

	it('falls back to the default theme for an empty string', () => {
		const fallback = getThemeColors('');
		expect(fallback).toEqual(THEMES[DEFAULT_THEME]);
	});
});

describe('themeStyleVars', () => {
	it('returns a string containing CSS variable declarations', () => {
		const style = themeStyleVars('neutral');
		expect(style).toContain('--theme-accent:');
		expect(style).toContain('--theme-bg:');
	});

	it('includes the correct accent color value', () => {
		const style = themeStyleVars('neutral');
		expect(style).toContain(THEMES['neutral'].accent);
	});

	it('falls back gracefully for unknown theme key', () => {
		const style = themeStyleVars('nonexistent');
		expect(style).toContain(THEMES[DEFAULT_THEME].accent);
	});

	it('produces valid inline-style-compatible output (no newlines)', () => {
		const style = themeStyleVars('salvia');
		expect(style).not.toMatch(/\n/);
	});
});
