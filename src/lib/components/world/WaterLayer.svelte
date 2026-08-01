<script lang="ts">
	// Sjöns liv: ytmönster som driver, en varm ljusglimt som sveper över, och
	// långsamt upprepade ringar. Alla effekter kommer från scenkonfigurationen
	// (worldScene.ts) - den här komponenten äger bara utseendet och rörelsen.
	import type { LivingWorldEffect } from '$lib/worldScene';
	import { effectStyle } from '$lib/world/effectStyle';

	let { effects }: { effects: LivingWorldEffect[] } = $props();
</script>

{#each effects as effect (effect.id)}
	<span class={`world-effect world-water ${effect.className ?? ''}`.trim()} style={effectStyle(effect)}
	></span>
{/each}

<style>
	.world-effect {
		position: absolute;
		pointer-events: none;
		left: var(--x, 0);
		top: var(--y, 0);
		width: var(--w, auto);
		height: var(--h, auto);
		opacity: 0;
		will-change: transform, opacity;
	}

	.world-water {
		border-radius: 50%;
		border: 1px solid rgba(235, 248, 246, 0.42);
		background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1), transparent 66%);
		filter: blur(0.25px);
	}

	.water-surface {
		border: 0;
		border-radius: 0;
		background: repeating-linear-gradient(176deg, transparent 0 10%, rgba(235, 248, 246, 0.34) 13%, transparent 18% 29%);
		filter: blur(0.65px);
		opacity: var(--opacity, 0.26);
		transform-origin: 50% 50%;
		-webkit-mask-image: linear-gradient(to bottom, transparent, #000 18%, #000 80%, transparent);
		mask-image: linear-gradient(to bottom, transparent, #000 18%, #000 80%, transparent);
		animation: waterSurfaceDrift var(--duration, 64000ms) ease-in-out var(--delay, 0ms) infinite alternate;
	}

	/* Den primära, tydligt läsbara vattenrörelsen: en varm ljusglimt som sveper
	   över ytan. Egen visuell form (glödande sken, screen-blend) i stället för
	   bara högre opacitet på water-surface - måste komma efter .world-water i
	   källan för att override:a dess border/bakgrund korrekt. */
	.water-glint {
		border: 0;
		border-radius: 50%;
		background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.98) 0%, rgba(224, 245, 255, 0.65) 38%, transparent 72%);
		filter: blur(2px);
		mix-blend-mode: screen;
		opacity: 0;
		animation: waterGlintSweep var(--duration, 13000ms) ease-in-out var(--delay, 0ms) infinite;
	}

	/* Kontinuerligt upprepade ringar - en ring är en otvetydig vattenform (till
	   skillnad från en abstrakt glimt), så det här är den tydligaste
	   "vattnet rör sig"-signalen. */
	.water-ripple-loop {
		border-radius: 50%;
		border: 1px solid rgba(255, 255, 255, 0.5);
		background: radial-gradient(circle at center, rgba(255, 255, 255, 0.55), transparent 68%);
		filter: blur(0.3px);
		transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 0.64));
		animation: waterRing var(--duration, 4800ms) ease-out var(--delay, 0ms) infinite;
	}

	@keyframes waterSurfaceDrift {
		0%,
		24% {
			transform: translate3d(-1.8%, 0, 0) scaleX(1.03);
		}
		62%,
		100% {
			transform: translate3d(calc(3.6% + (2% * var(--world-wind, 0.18))), -0.9%, 0) scaleX(1.07);
		}
	}

	@keyframes waterGlintSweep {
		0% {
			opacity: 0;
			transform: translate3d(-20%, 0, 0) scaleX(0.75);
		}
		18% {
			opacity: var(--opacity, 0.55);
		}
		50% {
			transform: translate3d(55%, -1.8%, 0) scaleX(1.08);
			opacity: calc(var(--opacity, 0.55) * 0.82);
		}
		82% {
			opacity: var(--opacity, 0.55);
		}
		100% {
			opacity: 0;
			transform: translate3d(130%, 0.6%, 0) scaleX(0.75);
		}
	}

	@keyframes waterRing {
		0% {
			opacity: 0;
			transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 0.64));
		}
		14% {
			opacity: var(--opacity, 0.16);
		}
		46% {
			opacity: var(--opacity, 0.16);
			transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 1.05));
		}
		78% {
			opacity: calc(var(--opacity, 0.16) * 0.4);
			transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 1.22));
		}
		100% {
			opacity: 0;
			transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 1.34));
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.world-effect {
			animation: none !important;
			transform: none !important;
		}

		.world-water,
		.water-glint,
		.water-ripple-loop {
			opacity: 0 !important;
		}

		.water-surface {
			opacity: calc(var(--opacity, 0.14) * 0.35) !important;
		}
	}
</style>
