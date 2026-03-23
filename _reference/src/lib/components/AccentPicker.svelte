<script lang="ts">
	import { accentStore, ACCENTS } from '$lib/stores/accent.svelte';
</script>

<div class="accent-picker">
{#each ACCENTS as { id, color }}
	<button
		class="swatch"
		class:active={accentStore.current === id}
		style="--swatch-color: {color}"
		onclick={() => accentStore.set(id)}
		aria-label="Switch to {id} accent color"
		title="{id.charAt(0).toUpperCase() + id.slice(1)}"
	>
		<span class="swatch-dot"></span>
	</button>
{/each}
</div>

<style>
	.accent-picker {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
	}

	.swatch {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		padding: 0.25rem;
		background-color: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		cursor: pointer;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			transform 0.1s ease;
	}

	.swatch:hover {
		background-color: var(--color-neutral);
	}

	.swatch:active {
		transform: scale(0.95);
	}

	.swatch-dot {
		display: block;
		width: 1.25rem;
		height: 1.25rem;
		border-radius: 50%;
		background-color: var(--swatch-color);
	}
</style>
