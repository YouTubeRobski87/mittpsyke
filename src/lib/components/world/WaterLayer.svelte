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

	/* Ett varmt, diffust solnedgångssken på vattenytan - ambient ljus, inte en
	   strålkastare. Måste komma efter .world-water i källan för att override:a
	   dess border/bakgrund korrekt.
	   Ingen vit kärna: färgen ligger i solnedgångens varma toner så skenet
	   smälter in i fotot i stället för att lägga ett vitt lager på den mörka
	   stranden. Många mjuka gradientsteg + stor blur ger en gradvis falloff
	   utan läsbar kant. */
	.water-glint {
		border: 0;
		border-radius: 50%;
		background: radial-gradient(
			ellipse at 46% 52%,
			rgba(255, 227, 182, 0.32) 0%,
			rgba(252, 216, 166, 0.24) 26%,
			rgba(244, 209, 172, 0.14) 48%,
			rgba(233, 205, 182, 0.07) 68%,
			rgba(226, 204, 186, 0.03) 84%,
			transparent 100%
		);
		/* Proportionell blur. Scenen är bara ~210-260px hög på mobil, så en fast
		   blur i px smetar ut fläcken helt där samtidigt som den blir för hård på
		   desktop. */
		filter: blur(clamp(10px, 1.5vw, 22px));
		mix-blend-mode: screen;
		opacity: 0;
		animation: waterGlintSweep var(--duration, 34000ms) ease-in-out var(--delay, 0ms) infinite;
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

	/* Rörelsen är i första hand små opacitetsvariationer - skenet andas på plats.
	   Translationen är avsiktligt liten (~6% totalt, mot 150% tidigare) och något
	   diagonal, med ojämnt fördelade keyframes så rytmen inte blir mekanisk.
	   0% och 100% är identiska, så loopen inte hoppar.
	   Öka inte translationen: så fort fläcken tydligt färdas över scenen läser den
	   som en svepande kägla igen. */
	@keyframes waterGlintSweep {
		0%,
		100% {
			opacity: calc(var(--opacity, 0.26) * 0.34);
			transform: translate3d(-2.4%, 0.5%, 0) scale(0.97);
		}
		23% {
			opacity: var(--opacity, 0.26);
			transform: translate3d(-0.7%, -0.4%, 0) scale(1.02);
		}
		41% {
			opacity: calc(var(--opacity, 0.26) * 0.58);
			transform: translate3d(1.1%, 0.8%, 0) scale(1);
		}
		62% {
			opacity: calc(var(--opacity, 0.26) * 0.9);
			transform: translate3d(3.1%, -0.7%, 0) scale(1.04);
		}
		84% {
			opacity: calc(var(--opacity, 0.26) * 0.46);
			transform: translate3d(0.9%, 1%, 0) scale(0.99);
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
