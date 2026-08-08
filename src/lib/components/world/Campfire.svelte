<script lang="ts">
	// En liten brasa med en stillsam gestalt bredvid i Framstegs förgrund.
	// Egen komponent (inte en LivingWorldEffectKind) eftersom
	// eld och gestalt hör ihop, delar en ankarpunkt i scenen och inte ska
	// påverka Mitt Hems hero, som återanvänder samma AmbientWorld-lager.
	//
	// Placeringen ligger mellan textblocket och räven, på den mörka stranden
	// i nedre mellangrunden. Den ska läsas som en liten samlingspunkt, inte
	// som en ljuskälla ute i sjön.
	//
	// Scenen beskärs olika i tre breakpoints (se object-position i
	// +page.svelte), så gruppen får en egen mobilplacering för att hålla både
	// eld och figur synliga utan att täcka kopian.
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';

	let { class: className = '' }: { class?: string } = $props();

	const motion = createMotionAwareness();
</script>

<div
	class={`campfire ${className}`.trim()}
	class:is-paused={!motion.isActive || motion.reducedMotion}
	aria-hidden="true"
>
	<span class="campfire-log campfire-log--rear"></span>
	<span class="campfire-log campfire-log--front"></span>
	<span class="campfire-glow"></span>
	<span class="campfire-ember"></span>
	<span class="campfire-flame campfire-flame--a"></span>
	<span class="campfire-flame campfire-flame--b"></span>
	<svg class="campfire-figure" viewBox="0 0 24 32" role="presentation">
		<g fill="currentColor">
			<!-- sten att sitta på, så gestalten står kvar på marken -->
			<ellipse cx="12" cy="30" rx="7" ry="2" />
			<!-- kappa/överkropp, lätt hopsjunken -->
			<path d="M6,29 C5,20 7,12 12,10 C17,12 19,20 18,29 Z" />
			<circle cx="12" cy="8" r="3.4" />
			<!-- enkel hatt - det som gör siluetten läsbart lantlig -->
			<path d="M9.3,5.4 C9.6,3 10.6,1.6 12,1.6 C13.4,1.6 14.4,3 14.7,5.4 Z" />
			<ellipse cx="12" cy="5.6" rx="5" ry="1.3" />
		</g>
	</svg>
</div>

<style>
	.campfire {
		position: absolute;
		left: 55%;
		top: 71%;
		pointer-events: none;
		z-index: var(--scene-ambient, 2);
	}

	.campfire-log,
	.campfire-glow,
	.campfire-ember,
	.campfire-flame,
	.campfire-figure {
		position: absolute;
		left: 0;
		top: 0;
	}

	/* Två små stockar gör platsen läsbar utan att bli en campingillustration. */
	.campfire-log {
		z-index: 0;
		width: clamp(13px, 1.55vw, 20px);
		height: clamp(2.6px, 0.3vw, 4px);
		border-radius: 999px;
		background: linear-gradient(90deg, rgb(46 31 20 / 0.72), rgb(91 57 32 / 0.62), rgb(39 27 19 / 0.66));
		box-shadow: 0 1px 2px rgb(13 10 8 / 0.28);
		filter: blur(0.2px);
		transform-origin: center;
	}

	.campfire-log--rear {
		transform: translate3d(calc(-50% - 1px), 0, 0) rotate(-20deg);
	}

	.campfire-log--front {
		transform: translate3d(calc(-50% + 1px), 1.5px, 0) rotate(22deg);
		opacity: 0.86;
	}

	/* Det breda, mjuka skenet. Varma toner utan vit kärna, stor blur, låg alpha
	   - samma idiom som vattenglimten i WaterLayer.svelte: ljuset ska andas på
	   plats, inte lysa som en strålkastare. */
	.campfire-glow {
		z-index: 1;
		width: clamp(22px, 3vw, 38px);
		height: clamp(14px, 1.9vw, 24px);
		border-radius: 50%;
		background: radial-gradient(
			ellipse at 50% 60%,
			rgba(255, 198, 122, 0.34) 0%,
			rgba(247, 168, 96, 0.2) 32%,
			rgba(224, 140, 86, 0.1) 56%,
			rgba(196, 124, 86, 0.04) 78%,
			transparent 100%
		);
		filter: blur(clamp(3px, 0.6vw, 8px));
		mix-blend-mode: screen;
		transform: translate3d(-50%, -55%, 0);
		animation: campfireGlowBreathe 8500ms ease-in-out infinite;
	}

	.campfire-ember {
		z-index: 2;
		width: clamp(3.5px, 0.5vw, 6px);
		height: clamp(1.6px, 0.24vw, 3px);
		border-radius: 50%;
		background: radial-gradient(
			ellipse at center,
			rgba(255, 180, 112, 0.55) 0%,
			rgba(224, 132, 70, 0.3) 55%,
			transparent 100%
		);
		filter: blur(1px);
		transform: translate3d(-50%, -25%, 0);
		animation: campfireEmberPulse 6000ms ease-in-out infinite;
	}

	/* Lågan: liten, mjukt oregelbunden, ankrad i sin bas. Flimret ligger på
	   scaleY/skew, aldrig på position - en låga som vandrar i sidled läser som
	   tecknad. Två lågor med olika takt/fördröjning ger ett organiskt
	   intryck utan att röra sig mycket. */
	.campfire-flame {
		z-index: 3;
		width: clamp(2.2px, 0.28vw, 3.6px);
		height: clamp(4px, 0.5vw, 6.5px);
		border-radius: 55% 45% 48% 52% / 66% 68% 32% 34%;
		background: linear-gradient(
			358deg,
			rgba(255, 150, 68, 0.6) 0%,
			rgba(255, 184, 108, 0.48) 45%,
			rgba(255, 214, 160, 0.26) 76%,
			transparent 100%
		);
		filter: blur(clamp(0.6px, 0.12vw, 1.6px));
		transform-origin: 50% 100%;
		transform: translate3d(-50%, -100%, 0);
		animation: campfireFlicker 3100ms ease-in-out infinite;
	}

	.campfire-flame--b {
		transform: translate3d(calc(-50% - 1.6px), -100%, 0) scale(0.72);
		opacity: 0.8;
		animation-duration: 2400ms;
		animation-delay: -1100ms;
	}

	/* Gestalten sitter till vänster om elden, vänd mot den. Ankrad nedtill,
	   precis som CompanionFriend, så den står kvar på marken när scenen ändrar
	   storlek. Aldrig ren svart - det ser ut som ett hål i kvällsfotot. */
	.campfire-figure {
		z-index: 2;
		width: clamp(7px, 0.95vw, 12px);
		height: auto;
		aspect-ratio: 24 / 32;
		transform: translate3d(calc(-100% - 5px), -100%, 0);
		color: rgb(28 22 17 / 0.85);
		filter: blur(0.4px);
	}

	@keyframes campfireGlowBreathe {
		0%,
		100% {
			opacity: 0.72;
			transform: translate3d(-50%, -55%, 0) scale(0.97);
		}
		34% {
			opacity: 1;
			transform: translate3d(-50%, -55%, 0) scale(1.03);
		}
		61% {
			opacity: 0.8;
			transform: translate3d(-50%, -55%, 0) scale(1);
		}
		85% {
			opacity: 0.92;
			transform: translate3d(-50%, -55%, 0) scale(1.02);
		}
	}

	@keyframes campfireEmberPulse {
		0%,
		100% {
			opacity: 0.78;
		}
		38% {
			opacity: 1;
		}
		70% {
			opacity: 0.86;
		}
	}

	@keyframes campfireFlicker {
		0%,
		100% {
			opacity: 0.82;
			transform: translate3d(-50%, -100%, 0) scaleY(0.95) skewX(0deg);
		}
		23% {
			opacity: 1;
			transform: translate3d(-50%, -100%, 0) scaleY(1.06) skewX(-1.6deg);
		}
		52% {
			opacity: 0.88;
			transform: translate3d(-50%, -100%, 0) scaleY(0.99) skewX(1deg);
		}
		79% {
			opacity: 0.96;
			transform: translate3d(-50%, -100%, 0) scaleY(1.03) skewX(-0.6deg);
		}
	}

	.campfire.is-paused .campfire-glow,
	.campfire.is-paused .campfire-ember,
	.campfire.is-paused .campfire-flame {
		animation-play-state: paused;
	}

	/* ≥981px: den bredare beskärningen ger plats åt en lite lugnare avståndsbild. */
	@media (min-width: 981px) {
		.campfire {
			left: 54%;
			top: 72%;
		}
	}

	/* På mobil ligger gruppen precis till höger om kopian och före räven.
	   Elden prioriteras; figur och stockar får skala ner, men döljs inte. */
	@media (max-width: 640px) {
		.campfire {
			left: 63%;
			top: 59%;
		}

		.campfire-log {
			width: clamp(11px, 3.6vw, 14px);
			height: 2.5px;
		}

		.campfire-glow {
			width: clamp(13px, 3.8vw, 16px);
			height: clamp(8px, 2.3vw, 10px);
			background: radial-gradient(
				ellipse at 50% 62%,
				rgb(242 176 106 / 0.2) 0%,
				rgb(213 141 81 / 0.09) 45%,
				transparent 82%
			);
			filter: blur(4.5px);
			mix-blend-mode: normal;
		}

		.campfire-ember {
			opacity: 0.68;
		}

		.campfire-flame {
			width: clamp(1.8px, 0.52vw, 2.2px);
			height: clamp(3.4px, 0.95vw, 4px);
		}

		.campfire-figure {
			width: clamp(6px, 2.15vw, 8px);
			transform: translate3d(calc(-100% - 3px), -100%, 0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.campfire-glow,
		.campfire-ember,
		.campfire-flame {
			animation: none !important;
		}
	}
</style>
