<script lang="ts">
	// Förgängliga återkomsttecken i scenen (se $lib/world/returnTraces).
	//
	// Lagret är rent dekorativt: aria-hidden, pointer-events: none, ingen text
	// och inga knappar. Det ritar bara löv som samlats vid stugans trappa. Den stilla
	// vattenringen återanvänder sidans egna ripple-lager och renderas där.
	import { getGatheredLeaves, type WorldReturnTraceId } from '$lib/world/returnTraces';

	let {
		traces = [],
		seed = null,
		class: className = ''
	}: {
		traces?: readonly WorldReturnTraceId[];
		/** Besökets seed. Ger lövens placering, stabil för hela sessionen. */
		seed?: string | null;
		class?: string;
	} = $props();

	const showLeaves = $derived(traces.includes('gathered-leaves'));
	const leaves = $derived(showLeaves ? getGatheredLeaves(seed) : []);
</script>

{#if leaves.length > 0}
	<div class={`world-return-traces ${className}`.trim()} aria-hidden="true" data-testid="world-return-traces">
		{#each leaves as leaf (leaf.key)}
			<span
				class="gathered-leaf"
				data-color={leaf.color}
				style={`--x: ${leaf.x}%; --y: ${leaf.y}%; --size: ${leaf.size}px; --rotation: ${leaf.rotation}deg; --leaf-opacity: ${leaf.opacity}`}
			>
				<svg viewBox="0 0 32 32">
					{#if leaf.shape === 0}
						<path d="M30 2C18 3 6 7 3 17c-2 8 4 13 12 12 10-2 14-15 15-27Z" />
					{:else if leaf.shape === 1}
						<path d="M30 4C22 0 10 2 4 10c-6 7-1 17 7 19 10 2 18-10 19-25Z" />
					{:else}
						<path d="M29 3C18 4 8 9 4 16c-4 8 2 14 9 13 9-1 15-12 16-26Z" />
					{/if}
				</svg>
			</span>
		{/each}
	</div>
{/if}

<style>
	.world-return-traces {
		position: absolute;
		inset: 0;
		/* Samma djupband som spåren: över bakgrunden, under följeslagaren och copyn. */
		z-index: var(--world-return-traces-z, 2);
		overflow: hidden;
		contain: layout paint style;
		pointer-events: none;
	}

	.gathered-leaf {
		position: absolute;
		left: var(--x, 0);
		top: var(--y, 0);
		width: calc(var(--size, 9px) * var(--gathered-leaf-scale, 1));
		height: calc(var(--size, 9px) * var(--gathered-leaf-scale, 1));
		color: #8f5a2c;
		opacity: var(--leaf-opacity, 0.5);
		/* Platt mot marken: löven ligger, de faller inte. */
		transform: translate(-50%, -50%) rotate(var(--rotation, 0deg)) scaleY(0.55);
		/* En enda lugn intoning när lagret monteras, aldrig en loop. */
		animation: gatheredLeafSettle 2.4s ease-out both;
	}

	.gathered-leaf[data-color='1'] { color: #b76532; }
	.gathered-leaf[data-color='2'] { color: #a9822f; }
	.gathered-leaf[data-color='3'] { color: #7a6a3a; }

	.gathered-leaf svg {
		display: block;
		width: 100%;
		height: 100%;
		fill: currentColor;
	}

	@keyframes gatheredLeafSettle {
		from { opacity: 0; }
		to { opacity: var(--leaf-opacity, 0.5); }
	}

	@media (max-width: 640px) {
		.gathered-leaf { --gathered-leaf-scale: 0.8; }
	}

	/* Löven är statiska och får synas, men utan intoning. */
	@media (prefers-reduced-motion: reduce) {
		.gathered-leaf {
			animation: none;
		}
	}
</style>
