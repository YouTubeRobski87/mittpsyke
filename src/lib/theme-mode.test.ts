import { describe, expect, it, vi } from 'vitest';
import {
	applyThemeMode,
	getNextThemeMode,
	getStoredThemeMode,
	getThemeToggleLabel,
	persistThemeMode
} from './theme-mode';

describe('theme mode', () => {
	it('läser den sparade preference och använder ljust läge som standard', () => {
		expect(getStoredThemeMode({ getItem: () => 'dark' })).toBe('dark');
		expect(getStoredThemeMode({ getItem: () => 'light' })).toBe('light');
		expect(getStoredThemeMode({ getItem: () => null })).toBe('light');
	});

	it('växlar root-klassen och sparar nästa läge', () => {
		const toggle = vi.fn();
		const setItem = vi.fn();
		const root = { classList: { toggle } } as unknown as HTMLElement;

		const nextMode = getNextThemeMode('light');
		applyThemeMode(root, nextMode);
		persistThemeMode({ setItem } as unknown as Storage, nextMode);

		expect(nextMode).toBe('dark');
		expect(toggle).toHaveBeenCalledWith('dark', true);
		expect(setItem).toHaveBeenCalledWith('theme-mode', 'dark');

		applyThemeMode(root, 'light');
		expect(toggle).toHaveBeenLastCalledWith('dark', false);
	});

	it('beskriver nästa tillgängliga läge i aria-labelen', () => {
		expect(getThemeToggleLabel('light')).toBe('Byt till mörkt läge');
		expect(getThemeToggleLabel('dark')).toBe('Byt till ljust läge');
	});
});
