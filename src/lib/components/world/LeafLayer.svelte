<script lang="ts">
	// Enstaka löv som faller genom scenen. Egen schemaläggning (30-90s) i stället
	// för den generella händelseloopen, så det blir en pålitlig, lugn puls
	// oavsett vilka andra naturhändelser som råkar väljas.
	//
	// Byggd för att kunna få syskon: en SnowLayer eller PetalLayer kan följa exakt
	// samma mönster (säsongsstyrd täthet + fall-keyframes med parallaxdjup).
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import type { ProgressCompanionSeason } from '$lib/progressCompanion';

	let { season = 'summer' }: { season?: ProgressCompanionSeason } = $props();

	type FallingLeaf = {
		key: number;
		x: number;
		y: number;
		size: number;
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
			? { count: [2, 3] as const, opacity: 0.42, minGapMs: 26_000, maxGapMs: 62_000 }
			: season === 'winter'
				? { count: [1, 1] as const, opacity: 0.16, minGapMs: 55_000, maxGapMs: 95_000 }
				: { count: [1, 2] as const, opacity: 0.24, minGapMs: 34_000, maxGapMs: 88_000 }
	);

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
			spawned.push({
				key: nextKey++,
				// Håller sig till lövverkets sida av scenen (uppe till höger) så
				// löven aldrig faller över texten till vänster.
				x: between(58, 92),
				y: between(2, 16),
				size: 0.5 + depth * 0.85,
				durationMs: between(11_000, 17_000) * (1.35 - depth * 0.45),
				drift: between(-4.5, -1.2) * depth,
				// Fallhöjd i rem, inte procent: procent i translate3d räknas mot
				// lövets egen (mycket lilla) höjd och skulle knappt flytta det alls.
				fall: between(9, 15) * (0.7 + depth * 0.5),
				spin: between(90, 220) * (Math.random() < 0.5 ? -1 : 1),
				opacity: seasonProfile.opacity * (0.6 + depth * 0.4),
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

		if (!active || reduced) {
			leaves = [];
			return;
		}

		let timer: number | null = null;
		const schedule = (initial = false) => {
			const delay = initial
				? between(8_000, 20_000)
				: between(profile.minGapMs, profile.maxGapMs);
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
		style={`--x: ${leaf.x}%; --y: ${leaf.y}%; --size: ${leaf.size}rem; --duration: ${leaf.durationMs}ms; --drift: ${leaf.drift}rem; --fall: ${leaf.fall}rem; --spin: ${leaf.spin}deg; --opacity: ${leaf.opacity}; --depth: ${leaf.depth}`}
	></span>
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
		width: var(--size, 0.7rem);
		height: calc(var(--size, 0.7rem) * 0.62);
		border-radius: 70% 30% 70% 30%;
		background: linear-gradient(135deg, rgba(157, 119, 62, 0.62), rgba(126, 145, 80, 0.32));
		filter: blur(calc((1 - var(--depth, 0.7)) * 0.9px));
		animation: leafDrift var(--duration, 13000ms) cubic-bezier(0.42, 0.02, 0.58, 1) both;
	}

	.falling-leaf[data-season='spring'] {
		background: linear-gradient(135deg, rgba(226, 192, 205, 0.5), rgba(196, 214, 160, 0.3));
	}

	.falling-leaf[data-season='winter'] {
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.9), rgba(226, 240, 255, 0.35) 60%, transparent 78%);
	}

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
			transform: translate3d(calc(var(--drift, -2rem) * 0.45), calc(var(--fall, 11rem) * 0.32), 0)
				rotate(calc(var(--spin, 140deg) * 0.35));
		}
		64% {
			transform: translate3d(calc(var(--drift, -2rem) * 1.15), calc(var(--fall, 11rem) * 0.61), 0)
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

	@media (prefers-reduced-motion: reduce) {
		.falling-leaf {
			display: none;
		}
	}
</style>
