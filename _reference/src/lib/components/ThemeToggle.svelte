<script lang="ts">
	import { themeStore } from '$lib/stores/theme.svelte';
	import { EmojiSun, EmojiMoonQuarter } from '$lib/assets/emojis';

	export let variant: 'fixed' | 'inline' = 'fixed';
</script>

<button
	class="theme-toggle"
	class:inline={variant === 'inline'}
	onclick={() => themeStore.toggle()}
	aria-label={themeStore.current === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
	title={themeStore.current === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
>
	<span class="icon" class:visible={themeStore.current === 'light'}>
		<EmojiSun size={36} />
	</span>
	<span class="icon" class:visible={themeStore.current === 'dark'}>
		<EmojiMoonQuarter size={36} />
	</span>
</button>

<style>
	.theme-toggle {
		position: fixed;
		top: calc(env(safe-area-inset-top, 0px) + 1.25rem);
		right: calc(env(safe-area-inset-right, 0px) + 1.25rem);
		z-index: 100;
		display: grid;
		place-items: center;
		width: 2.5rem;
		height: 2.5rem;
		padding: 0;
		background: none;
		border: none;
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			transform 0.1s ease;
	}

	.theme-toggle:hover {
		opacity: 0.8;
	}

	.theme-toggle:active {
		transform: scale(0.9);
	}

	.theme-toggle.inline {
		position: static;
		top: auto;
		right: auto;
	}

	.icon {
		grid-area: 1 / 1;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transform: scale(0.5) rotate(-90deg);
		transition:
			opacity 0.2s ease,
			transform 0.2s ease;
	}

	.icon.visible {
		opacity: 1;
		transform: scale(1) rotate(0deg);
	}
</style>
