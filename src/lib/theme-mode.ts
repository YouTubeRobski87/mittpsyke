export const THEME_MODE_STORAGE_KEY = 'theme-mode';

export type ThemeMode = 'light' | 'dark';

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;
type ThemeRoot = Pick<HTMLElement, 'classList'>;

export function getStoredThemeMode(storage: Pick<Storage, 'getItem'>): ThemeMode {
	return storage.getItem(THEME_MODE_STORAGE_KEY) === 'dark' ? 'dark' : 'light';
}

export function getNextThemeMode(mode: ThemeMode): ThemeMode {
	return mode === 'dark' ? 'light' : 'dark';
}

export function applyThemeMode(root: ThemeRoot, mode: ThemeMode): void {
	root.classList.toggle('dark', mode === 'dark');
}

export function persistThemeMode(storage: ThemeStorage, mode: ThemeMode): void {
	storage.setItem(THEME_MODE_STORAGE_KEY, mode);
}

export function getThemeToggleLabel(mode: ThemeMode): string {
	return mode === 'dark' ? 'Byt till ljust läge' : 'Byt till mörkt läge';
}
