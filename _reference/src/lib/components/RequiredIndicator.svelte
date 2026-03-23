<script lang="ts">
	import IconAsterisk from '$lib/assets/icons/IconAsterisk.svelte';

	let { tooltip = 'Obligatoriskt' } = $props();
</script>

<span class="required-indicator">
	<IconAsterisk size={10} class="required-icon" />
	<span class="tooltip">{tooltip}</span>
</span>

<style>
	.required-indicator {
		position: relative;
		display: inline-flex;
		align-items: center;
		margin-left: 0.25em;
		cursor: help;
	}

	.required-indicator :global(.required-icon) {
		color: var(--color-accent);
	}

	.tooltip {
		position: absolute;
		bottom: calc(100% + 8px);
		left: 50%;
		transform: translateX(-50%);
		padding: 0.4rem 0.6rem;
		background-color: var(--color-bg-elevated);
		color: var(--color-text);
		border: 1px solid var(--color-border);
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-medium);
		letter-spacing: var(--tracking-wide);
		line-height: var(--leading-snug);
		white-space: nowrap;
		border-radius: var(--radius-sm);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
		opacity: 0;
		visibility: hidden;
		transition: opacity 0.15s ease, visibility 0.15s ease;
		pointer-events: none;
		z-index: 100;
	}

	.tooltip::after {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-top-color: var(--color-border);
	}

	.tooltip::before {
		content: '';
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: -1px;
		border: 5px solid transparent;
		border-top-color: var(--color-bg-elevated);
		z-index: 1;
	}

	.required-indicator:hover .tooltip,
	.required-indicator:focus .tooltip,
	.required-indicator:active .tooltip {
		opacity: 1;
		visibility: visible;
	}

	@media (max-width: 480px) {
		.tooltip {
			font-size: 0.7rem;
			padding: 0.35rem 0.5rem;
		}
	}
</style>
