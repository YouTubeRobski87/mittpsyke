<script lang="ts">
	import { browser } from '$app/environment';

	function getInitialDarkMode() {
		if (!browser) return false;

		const mode = localStorage.getItem('theme-mode');
		return mode === 'dark';
	}

	let dark = $state(getInitialDarkMode());

	$effect(() => {
		document.documentElement.classList.toggle('dark', dark);
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
