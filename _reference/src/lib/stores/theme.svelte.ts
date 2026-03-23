import { browser } from '$app/environment';
import { Preferences } from '@capacitor/preferences';
import { StatusBar, Style } from '@capacitor/status-bar';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'theme';

function createThemeStore() {
	let theme = $state<Theme>('light');

	async function init() {
		if (!browser) return;

		try {
			const { value } = await Preferences.get({ key: THEME_STORAGE_KEY });
			if (value === 'light' || value === 'dark') {
				theme = value;
			} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				theme = 'dark';
			}
		} catch {
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				theme = 'dark';
			}
		}
		applyTheme();
	}

	function applyTheme() {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', theme);

		// Update Android status bar to match app theme
		StatusBar.setStyle({ style: theme === 'light' ? Style.Light : Style.Dark }).catch(() => {});
		StatusBar.setBackgroundColor({ color: theme === 'light' ? '#FFFFFF' : '#000000' }).catch(() => {});
	}

	async function saveTheme() {
		if (!browser) return;
		try {
			await Preferences.set({ key: THEME_STORAGE_KEY, value: theme });
		} catch (e) {
			console.error('Failed to save theme to Preferences:', e);
		}
	}

	function toggle() {
		theme = theme === 'light' ? 'dark' : 'light';
		void saveTheme();
		applyTheme();
	}

	function set(newTheme: Theme) {
		theme = newTheme;
		void saveTheme();
		applyTheme();
	}

	return {
		get current() {
			return theme;
		},
		init,
		toggle,
		set
	};
}

export const themeStore = createThemeStore();
