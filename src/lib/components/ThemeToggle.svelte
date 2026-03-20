<script lang="ts">
	import { browser } from '$app/environment';

	function getInitialDarkMode() {
		if (!browser) return false;

		const mode = localStorage.getItem('theme-mode');
		if (mode === 'dark') return true;
		if (mode === 'light') return false;

		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	let dark = $state(getInitialDarkMode());

	$effect(() => {
		document.documentElement.classList.toggle('dark', dark);
	});

	$effect(() => {
		if (!browser) return;

		const mode = localStorage.getItem('theme-mode');
		if (mode === 'dark' || mode === 'light') return;

		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onChange = (event: MediaQueryListEvent) => {
			dark = event.matches;
		};

		media.addEventListener('change', onChange);
		return () => {
			media.removeEventListener('change', onChange);
		};
	});

	function toggle() {
		dark = !dark;
		localStorage.setItem('theme-mode', dark ? 'dark' : 'light');
	}
</script>

<button
	onclick={toggle}
	class="p-2 rounded-[var(--radius-input)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
	aria-label="Växla tema"
	type="button"
>
	{dark ? '☀️' : '🌙'}
</button>
