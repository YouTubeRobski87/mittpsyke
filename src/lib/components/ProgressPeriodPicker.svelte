<script lang="ts">
	import { PERIOD_OPTIONS, type PeriodDays } from '$lib/progress-recent-period';

	let { period, onSelect, options = PERIOD_OPTIONS }: {
		period: PeriodDays;
		onSelect: (period: PeriodDays) => void;
		options?: { value: PeriodDays; label: string }[];
	} = $props();
</script>

<div class="period-picker" role="group" aria-label="Välj tidsperiod">
	{#each options as option}
		<button
			type="button"
			class="period-button"
			class:is-active={period === option.value}
			aria-pressed={period === option.value}
			onclick={() => onSelect(option.value)}
		>
			{option.label}
		</button>
	{/each}
</div>

<style>
	.period-picker {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.period-button {
		min-height: 44px;
		padding: 0 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: transparent;
		color: hsl(var(--muted-foreground));
		font: inherit;
		font-size: 0.9rem;
		cursor: pointer;
	}

	.period-button:hover {
		color: hsl(var(--foreground));
		border-color: hsl(var(--foreground) / 0.35);
	}

	.period-button.is-active {
		border-color: var(--theme-accent, hsl(var(--foreground)));
		background: color-mix(in srgb, var(--theme-accent, #557c68) 12%, transparent);
		color: hsl(var(--foreground));
		font-weight: 600;
	}

	/* Aktivt val markeras även med form och vikt, inte enbart med färg. */
	.period-button.is-active::before {
		content: '';
		display: inline-block;
		width: 0.45rem;
		height: 0.45rem;
		margin-right: 0.45rem;
		border-radius: 50%;
		background: var(--theme-accent, #557c68);
		vertical-align: middle;
	}

	.period-button:focus-visible {
		outline: 2px solid hsl(var(--foreground));
		outline-offset: 2px;
	}

	@media (prefers-reduced-motion: no-preference) {
		.period-button {
			transition:
				color 0.18s ease,
				border-color 0.18s ease,
				background 0.18s ease;
		}
	}

	@media (max-width: 520px) {
		.period-button {
			flex: 1 1 auto;
			padding-inline: 0.6rem;
			font-size: 0.85rem;
		}

	}
</style>
