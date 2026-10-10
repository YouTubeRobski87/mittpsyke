<script lang="ts">
	import type {
		ProgressCompanionDayState,
		ProgressCompanionSeason
	} from '$lib/progressCompanion';
	import { getReturnTransients } from '$lib/world/returnTransients';

	let {
		daysSinceLastVisit = null,
		season,
		timeOfDay,
		visitSeed = null
	}: {
		daysSinceLastVisit?: number | null;
		season: ProgressCompanionSeason;
		timeOfDay: ProgressCompanionDayState;
		visitSeed?: string | null;
	} = $props();

	const transients = $derived(
		getReturnTransients({ daysSinceLastVisit, season, timeOfDay, visitSeed })
	);
</script>

{#if transients.length > 0}
	<div class="return-transient-layer" aria-hidden="true">
		{#each transients as transient (transient.kind)}
			<div class={`return-transient return-transient--${transient.kind}`} data-return-transient={transient.kind}>
				{#each transient.items as item, index (`${transient.kind}-${index}`)}
					<i
						style={`--x: ${item.x}%; --y: ${item.y}%; --rotation: ${item.rotation}deg; --scale: ${item.scale}; --opacity: ${item.opacity}`}
					></i>
				{/each}
			</div>
		{/each}
	</div>
{/if}

<style>
	.return-transient-layer,
	.return-transient {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}

	.return-transient-layer {
		z-index: 4;
		overflow: hidden;
		contain: layout paint style;
	}

	.return-transient i {
		position: absolute;
		left: var(--x);
		top: var(--y);
		display: block;
		opacity: var(--opacity);
		transform: translate(-50%, -50%) rotate(var(--rotation)) scale(var(--scale));
	}

	.return-transient--gathered-leaves i {
		width: clamp(5px, 0.7vw, 10px);
		aspect-ratio: 1.7 / 1;
		border-radius: 90% 12% 88% 16%;
		background: #8c5a2f;
		box-shadow: 0 1px 1px rgb(42 29 17 / 0.24);
	}

	.return-transient--gathered-leaves i:nth-child(2n) { background: #a47735; }
	.return-transient--gathered-leaves i:nth-child(3n) { background: #6d6332; }

	.return-transient--animal-tracks i {
		width: clamp(4px, 0.55vw, 8px);
		aspect-ratio: 1 / 0.82;
		border-radius: 52% 48% 46% 54%;
		background: rgb(54 67 72 / 0.48);
		box-shadow:
			-0.22em -0.28em 0 -0.08em rgb(54 67 72 / 0.42),
			0.22em -0.28em 0 -0.08em rgb(54 67 72 / 0.42);
	}

	/* Båda tecknen är statiska även utan reduced motion. Regeln skyddar mot att
	   framtida styling råkar göra återkomstsignalerna rörliga. */
	@media (prefers-reduced-motion: reduce) {
		.return-transient i { animation: none !important; transition: none !important; }
	}
</style>
