<script lang="ts">
	// Ett enstaka löv som kan falla genom scenen när AmbientWorlds befintliga,
	// sällsynta vindhändelse inträffar. Ingen egen timer: händelserna ligger kvar
	// på världens gemensamma tidslinje och kan därför inte staplas på varandra.
	//
	// Byggd för att kunna få syskon: en SnowLayer eller PetalLayer kan följa exakt
	// samma mönster (säsongsstyrd täthet + fall-keyframes med parallaxdjup).
	import { untrack } from 'svelte';
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import type { ProgressCompanionSeason } from '$lib/progressCompanion';
	import { getFallingLeafVariation } from '$lib/world/sessionVariation';

	let {
		season = 'summer',
		sessionSeed,
		gust = null
	}: {
		season?: ProgressCompanionSeason;
		sessionSeed: string;
		/** En vindpust från AmbientWorlds director släpper ett löv, en gång per id. */
		gust?: { id: string; count: number } | null;
	} = $props();

	type FallingLeaf = {
		key: number;
		x: number;
		y: number;
		size: number;
		shape: number;
		color: number;
		durationMs: number;
		drift: number;
		fall: number;
		spin: number;
		opacity: number;
		depth: number;
	};

	const motion = createMotionAwareness();
	let leaves = $state<FallingLeaf[]>([]);
	let nextKey = 0;
	let releasedGustId: string | null = null;

	function spawnLeaf(eventId: string) {
		if (!motion.isActive || motion.reducedMotion) return;

		const variation = getFallingLeafVariation(sessionSeed, eventId, season);
		const spawned: FallingLeaf[] = [{ key: nextKey++, ...variation }];

		leaves = [...leaves, ...spawned];

		const longest = variation.durationMs;
		const spawnedKeys = new Set(spawned.map((leaf) => leaf.key));
		window.setTimeout(() => {
			leaves = leaves.filter((leaf) => !spawnedKeys.has(leaf.key));
		}, longest + 400);
	}

	$effect(() => {
		const current = gust;
		if (!current || current.id === releasedGustId) return;
		releasedGustId = current.id;
		// Exakt ett löv: det här är den valda sällsynta världshändelsen, inte en
		// väderpartikeleffekt. untrack gör att effekten bara reagerar på en ny pust.
		untrack(() => spawnLeaf(current.id));
	});
</script>

{#each leaves as leaf (leaf.key)}
	<span
		class="world-effect falling-leaf"
		data-season={season}
		data-shape={leaf.shape}
		data-color={leaf.color}
		style={`--x: ${leaf.x}%; --y: ${leaf.y}%; --size: ${leaf.size}px; --duration: ${leaf.durationMs}ms; --drift: ${leaf.drift}rem; --fall: ${leaf.fall}rem; --spin: ${leaf.spin}deg; --opacity: ${leaf.opacity}; --depth: ${leaf.depth}`}
	>
		<svg viewBox="0 0 32 32" aria-hidden="true">
			{#if leaf.shape === 0}
				<path class="leaf-body" d="M30 2C18 3 6 7 3 17c-2 8 4 13 12 12 10-2 14-15 15-27Z" />
			{:else if leaf.shape === 1}
				<path class="leaf-body" d="M30 4C22 0 10 2 4 10c-6 7-1 17 7 19 10 2 18-10 19-25Z" />
			{:else}
				<path class="leaf-body" d="M29 3C18 4 8 9 4 16c-4 8 2 14 9 13 9-1 15-12 16-26Z" />
			{/if}
			<path class="leaf-vein" d="M2 31C8 22 16 14 27 6M10 23l-1-8m9 1 7 1" />
		</svg>
	</span>
{/each}

<style>
	.world-effect {
		position: absolute;
		pointer-events: none;
		left: var(--x, 0);
		top: var(--y, 0);
		opacity: 0;
		will-change: transform, opacity;
	}

	.falling-leaf {
		width: calc(var(--size, 14px) * var(--leaf-scale, 1));
		height: calc(var(--size, 14px) * var(--leaf-scale, 1));
		color: #8f4f2d;
		animation: leafDrift var(--duration, 13000ms) cubic-bezier(0.42, 0.02, 0.58, 1) both;
	}

	.falling-leaf svg {
		display: block;
		width: 100%;
		height: 100%;
		overflow: visible;
	}

	.leaf-body { fill: currentColor; }
	.leaf-vein {
		fill: none;
		stroke: rgba(63, 42, 24, 0.58);
		stroke-width: 1.45;
		stroke-linecap: round;
	}

	.falling-leaf[data-color='1'] { color: #b76532; }
	.falling-leaf[data-color='2'] { color: #a9822f; }
	.falling-leaf[data-color='3'] { color: #66713a; }
	.falling-leaf[data-shape='1'] svg { transform: scaleX(0.92) rotate(-7deg); }
	.falling-leaf[data-shape='2'] svg { transform: scaleX(0.82) rotate(9deg); }

	.falling-leaf[data-season='spring'] {
		color: #758a4a;
	}

	.falling-leaf[data-season='winter'] {
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(226, 240, 255, 0.35) 60%, transparent 78%);
	}

	.falling-leaf[data-season='winter'] svg { display: none; }

	/* Faller med en mjuk sidledspendling i stället för rakt ned - ojämna steg
	   så två löv aldrig ser ut att följa exakt samma bana. */
	@keyframes leafDrift {
		0% {
			opacity: 0;
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		12% {
			opacity: var(--opacity, 0.28);
		}
		38% {
			transform: translate3d(calc(var(--drift, -2rem) * -0.18), calc(var(--fall, 11rem) * 0.32), 0)
				rotate(calc(var(--spin, 140deg) * 0.35));
		}
		64% {
			transform: translate3d(calc(var(--drift, -2rem) * 1.18), calc(var(--fall, 11rem) * 0.61), 0)
				rotate(calc(var(--spin, 140deg) * 0.66));
		}
		86% {
			opacity: calc(var(--opacity, 0.28) * 0.45);
		}
		100% {
			opacity: 0;
			transform: translate3d(var(--drift, -2rem), var(--fall, 11rem), 0) rotate(var(--spin, 140deg));
		}
	}

	@media (max-width: 480px) {
		.falling-leaf { --leaf-scale: 0.84; }
	}

	@media (prefers-reduced-motion: reduce) {
		.falling-leaf {
			display: none;
		}
	}
</style>
