<script lang="ts">
	// Enstaka löv som faller genom scenen. Egen schemaläggning (30-90s) i stället
	// för den generella händelseloopen, så det blir en pålitlig, lugn puls
	// oavsett vilka andra naturhändelser som råkar väljas.
	//
	// Byggd för att kunna få syskon: en SnowLayer eller PetalLayer kan följa exakt
	// samma mönster (säsongsstyrd täthet + fall-keyframes med parallaxdjup).
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import type { ProgressCompanionSeason } from '$lib/progressCompanion';
	import { getLeafSessionCharacter } from '$lib/world/sessionVariation';

	let { season = 'summer', sessionSeed }: { season?: ProgressCompanionSeason; sessionSeed: string } = $props();

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

	// Hösten får fler och tydligare löv; övriga säsonger enstaka och blekare, så
	// scenen aldrig känns helt stilla men heller inte fel för årstiden.
	const seasonProfile = $derived(
		season === 'autumn'
			? { count: [1, 2] as const, opacity: [0.72, 0.9] as const, minGapMs: 8_000, maxGapMs: 15_000, duration: [6_000, 12_000] as const }
			: season === 'winter'
				? { count: [1, 1] as const, opacity: [0.12, 0.18] as const, minGapMs: 55_000, maxGapMs: 95_000, duration: [11_000, 17_000] as const }
				: { count: [1, 1] as const, opacity: [0.56, 0.7] as const, minGapMs: 28_000, maxGapMs: 58_000, duration: [9_000, 15_000] as const }
	);
	const sessionCharacter = $derived(getLeafSessionCharacter(sessionSeed));

	function between(min: number, max: number) {
		return min + Math.random() * (max - min);
	}

	function spawnLeaves() {
		if (!motion.isActive || motion.reducedMotion) return;

		const [minCount, maxCount] = seasonProfile.count;
		const count = Math.round(between(minCount, maxCount));
		const spawned: FallingLeaf[] = [];

		for (let i = 0; i < count; i += 1) {
			// Djupet styr både storlek, fallhastighet och opacitet, så ett löv
			// långt bak faller långsammare och blekare än ett nära - samma
			// parallaxprincip som de statiska lagren.
			const depth = between(0.45, 1);
			const sizeTier = season === 'autumn' && i === 0 ? between(0.18, 1) : Math.random();
			const size = sizeTier < 0.18 ? between(8, 12) : sizeTier < 0.78 ? between(12, 18) : between(18, 22);
			spawned.push({
				key: nextKey++,
				// Håller sig till lövverkets sida av scenen (uppe till höger) så
				// löven aldrig faller över texten till vänster.
				x: between(sessionCharacter.spawnMinX, sessionCharacter.spawnMaxX),
				y: between(2, 16),
				size,
				shape: Math.floor(between(0, 3)),
				color: Math.floor(between(0, 4)),
				durationMs: between(seasonProfile.duration[0], seasonProfile.duration[1]) * (1.12 - depth * 0.18),
				// Samma vänsterbias som vegetationen. Pendlingen går fortfarande kort
				// åt motsatt håll tidigt i banan, men nettovinden motsäger inte gräset.
				drift: between(-5.2, -1.4) * depth * sessionCharacter.driftFactor,
				// Fallhöjd i rem, inte procent: procent i translate3d räknas mot
				// lövets egen (mycket lilla) höjd och skulle knappt flytta det alls.
				fall: between(9, 15) * (0.7 + depth * 0.5) * sessionCharacter.amplitudeFactor,
				spin: between(120, 310) * (Math.random() < 0.5 ? -1 : 1),
				opacity: between(seasonProfile.opacity[0], seasonProfile.opacity[1]),
				depth
			});
		}

		leaves = [...leaves, ...spawned];

		const longest = Math.max(...spawned.map((leaf) => leaf.durationMs));
		const spawnedKeys = new Set(spawned.map((leaf) => leaf.key));
		window.setTimeout(() => {
			leaves = leaves.filter((leaf) => !spawnedKeys.has(leaf.key));
		}, longest + 400);
	}

	// Startas om när fliken döljs/visas eller reduced-motion ändras - samma
	// mönster som den ambienta händelseloopen i AmbientWorld.
	$effect(() => {
		const active = motion.isActive;
		const reduced = motion.reducedMotion;
		const profile = seasonProfile;
		const character = sessionCharacter;

		if (!active || reduced) {
			leaves = [];
			return;
		}

		let timer: number | null = null;
		const schedule = (initial = false) => {
			const delay = initial
				? character.initialDelayMs
				: between(profile.minGapMs, profile.maxGapMs) * character.intervalFactor;
			timer = window.setTimeout(() => {
				spawnLeaves();
				schedule();
			}, delay);
		};

		schedule(true);

		return () => {
			if (timer !== null) window.clearTimeout(timer);
		};
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
