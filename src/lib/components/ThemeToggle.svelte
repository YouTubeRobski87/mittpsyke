<script lang="ts">
	import { browser } from '$app/environment';

	let dark = $state(browser ? localStorage.getItem('theme-mode') === 'dark' : false);

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
	class="p-2 rounded-[var(--radius-input)] hover:bg-[var(--bg-card)] transition-colors"
	aria-label="Växla tema"
	type="button"
>
	{dark ? '☀️' : '🌙'}
</button>

