<script lang="ts">
	import { browser } from '$app/environment';
	import {
		applyThemeMode,
		getNextThemeMode,
		getStoredThemeMode,
		getThemeToggleLabel,
		persistThemeMode
	} from '$lib/theme-mode';

	function getInitialDarkMode() {
		if (!browser) return false;

		return getStoredThemeMode(localStorage) === 'dark';
	}

	let dark = $state(getInitialDarkMode());

	$effect(() => {
		applyThemeMode(document.documentElement, dark ? 'dark' : 'light');
	});

	function toggle() {
		const nextMode = getNextThemeMode(dark ? 'dark' : 'light');
		dark = nextMode === 'dark';
		persistThemeMode(localStorage, nextMode);
	}
</script>

<button
	onclick={toggle}
	class="p-2 rounded-[var(--radius-input)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
	aria-label={getThemeToggleLabel(dark ? 'dark' : 'light')}
	aria-pressed={dark}
	type="button"
>
	{dark ? '☀️' : '🌙'}
</button>
