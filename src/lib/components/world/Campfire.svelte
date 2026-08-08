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
	<span class="campfire-ground-shadow"></span>
	<span class="campfire-light-patch"></span>
	<span class="campfire-stump campfire-stump--rear"></span>
	<span class="campfire-stump campfire-stump--near"></span>
	<span class="campfire-log campfire-log--rear"></span>
	<span class="campfire-log campfire-log--front"></span>
	<span class="campfire-glow"></span>
	<span class="campfire-ember"></span>
	<span class="campfire-flame campfire-flame--a"></span>
	<span class="campfire-flame campfire-flame--b"></span>
	<svg class="campfire-figure" viewBox="0 0 38 48" role="presentation">
		<!-- En liten sidovänd siluett: fötter, knän och bänk möter samma
		     markpunkt som elden, så figuren inte läses som svävande. -->
		<ellipse class="figure-seat" cx="20" cy="44.5" rx="15" ry="3.2" />
		<path class="figure-leg figure-leg--far" d="M16 30.5 L10.8 39.5 L17.8 42.2 L23.8 33.3 Z" />
		<path class="figure-leg figure-leg--near" d="M21.2 30.2 L29 38.2 L34 40.7 L32.7 43.3 L25.2 42.1 L17.4 34.1 Z" />
		<path class="figure-coat" d="M13.2 17.5 C16 14.4 21.4 14 24.6 17.4 L28 31.8 L19.3 34.3 L12 28.8 Z" />
		<path class="figure-arm" d="M23.8 19.4 L29.2 27.3 L27 29.4 L20.2 22.4 Z" />
		<path class="figure-neck" d="M16.8 14.8 L18.6 12.2 L21.5 15.8 L20.3 17.5 Z" />
		<ellipse class="figure-face" cx="18.7" cy="10.5" rx="3.5" ry="4.2" />
		<path class="figure-cap" d="M14.6 9.5 C14.8 5.9 17.1 3.7 19.2 3.8 C21.7 3.9 23.1 6.1 23 8.9 L21.5 10.2 L15.3 10.3 Z" />
		<path class="figure-hat-brim" d="M13.2 9.7 C15.2 8.7 21.8 8.7 24.5 10.2 C21.1 11.3 16.5 11.3 13.2 9.7 Z" />
		<!-- Ett mycket svagt varmt kantljus mot elden, aldrig ett ljust ansikte. -->
		<path class="figure-firelight" d="M23.8 19.4 L28.5 27.1 L26.9 28.6 L21.6 21.3 Z" />
	</svg>
</div>

<style>
	.campfire {
		position: absolute;
		left: 63%;
		top: 76%;
		pointer-events: none;
		/* Elden ligger över den mörka förgrundstoningen så att den fortfarande
		   läses som en liten punkt på stranden, inte som ljus ute i sjön. */
		z-index: var(--scene-overlay, 5);
	}

	.campfire-ground-shadow,
	.campfire-light-patch,
	.campfire-stump,
	.campfire-log,
	.campfire-glow,
	.campfire-ember,
	.campfire-flame,
	.campfire-figure {
		position: absolute;
		left: 0;
		top: 0;
	}

	/* En kort skugga och en låg varm fläck ger hela gruppen markkontakt.
	   Skenet stannar inom samlingsplatsen och når aldrig ut mot vattnet. */
	.campfire-ground-shadow {
		z-index: 0;
		width: clamp(70px, 8.8vw, 108px);
		height: clamp(14px, 1.7vw, 21px);
		border-radius: 50%;
		background: radial-gradient(ellipse at center, rgb(18 14 10 / 0.44), transparent 72%);
		filter: blur(clamp(2px, 0.38vw, 5px));
		transform: translate3d(-48%, -40%, 0) rotate(-7deg);
	}

	.campfire-light-patch {
		z-index: 1;
		width: clamp(64px, 8vw, 98px);
		height: clamp(24px, 2.85vw, 35px);
		border-radius: 50%;
		background: radial-gradient(
			ellipse at 52% 56%,
			rgb(210 124 61 / 0.24) 0%,
			rgb(153 86 42 / 0.12) 38%,
			transparent 76%
		);
		filter: blur(clamp(3px, 0.55vw, 7px));
		transform: translate3d(-48%, -57%, 0) rotate(-7deg);
	}

	.campfire-stump {
		z-index: 1;
		width: clamp(11px, 1.25vw, 16px);
		height: clamp(7px, 0.82vw, 10px);
		border-radius: 47% 53% 35% 36%;
		background: linear-gradient(100deg, rgb(42 28 18 / 0.88), rgb(81 50 29 / 0.8) 58%, rgb(30 21 15 / 0.78));
		box-shadow: inset 0 1px 0 rgb(154 100 58 / 0.18), 0 1px 2px rgb(8 7 5 / 0.34);
		transform-origin: 50% 100%;
	}

	.campfire-stump--rear {
		transform: translate3d(calc(100% + 8px), -84%, 0) rotate(-4deg) scale(0.82);
		opacity: 0.7;
	}

	.campfire-stump--near {
		transform: translate3d(calc(-100% - 21px), -60%, 0) rotate(7deg);
		opacity: 0.84;
	}

	/* Två små stockar gör platsen läsbar utan att bli en campingillustration. */
	.campfire-log {
		z-index: 2;
		width: clamp(25px, 3vw, 38px);
		height: clamp(4px, 0.5vw, 6.5px);
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
		z-index: 3;
		width: clamp(44px, 5.5vw, 68px);
		height: clamp(25px, 3.15vw, 39px);
		border-radius: 50%;
		background: radial-gradient(
			ellipse at 50% 60%,
			rgb(255 192 113 / 0.42) 0%,
			rgb(241 151 76 / 0.23) 32%,
			rgb(198 107 58 / 0.12) 56%,
			transparent 78%
		);
		filter: blur(clamp(2.5px, 0.46vw, 6px));
		mix-blend-mode: soft-light;
		transform: translate3d(-50%, -49%, 0);
		animation: campfireGlowBreathe 8500ms ease-in-out infinite;
	}

	.campfire-ember {
		z-index: 4;
		width: clamp(5px, 0.64vw, 8px);
		height: clamp(2.5px, 0.33vw, 4.2px);
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
		z-index: 5;
		width: clamp(5.5px, 0.68vw, 8.5px);
		height: clamp(10px, 1.18vw, 15px);
		border-radius: 55% 45% 48% 52% / 66% 68% 32% 34%;
		background: linear-gradient(
			358deg,
			rgb(246 132 55 / 0.68) 0%,
			rgb(255 173 86 / 0.54) 45%,
			rgb(255 207 139 / 0.24) 76%,
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
		z-index: 4;
		width: clamp(28px, 3.15vw, 44px);
		height: auto;
		aspect-ratio: 38 / 48;
		transform: translate3d(calc(-100% - 8px), -100%, 0);
		filter: drop-shadow(0 1px 1px rgb(9 7 5 / 0.38)) saturate(0.84);
	}

	.figure-seat { fill: rgb(46 30 19 / 0.78); }
	.figure-leg--far { fill: rgb(39 32 23 / 0.86); }
	.figure-leg--near { fill: rgb(48 38 27 / 0.92); }
	.figure-coat { fill: rgb(58 45 33 / 0.94); }
	.figure-arm { fill: rgb(77 51 30 / 0.86); }
	.figure-neck,
	.figure-face { fill: rgb(139 87 51 / 0.72); }
	.figure-cap,
	.figure-hat-brim { fill: rgb(34 34 26 / 0.94); }
	.figure-firelight { fill: rgb(216 122 59 / 0.38); }

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
			left: 63%;
			top: 75.5%;
		}
	}

	/* På mobil ligger gruppen precis till höger om kopian och före räven.
	   Elden prioriteras; figur och stockar får skala ner, men döljs inte. */
	@media (max-width: 640px) {
		.campfire {
			left: 66%;
			top: 65%;
		}

		.campfire-ground-shadow {
			width: clamp(46px, 13vw, 54px);
			height: clamp(10px, 3vw, 12px);
		}

		.campfire-light-patch {
			width: clamp(42px, 12vw, 48px);
			height: clamp(16px, 4.5vw, 18px);
			background: radial-gradient(ellipse at 52% 56%, rgb(210 124 61 / 0.16), transparent 74%);
		}

		.campfire-log {
			width: clamp(18px, 5.5vw, 21px);
			height: 2.5px;
		}

		.campfire-stump {
			width: clamp(8px, 2.35vw, 9px);
			height: clamp(5px, 1.75vw, 6.5px);
		}

		.campfire-glow {
			width: clamp(27px, 7.4vw, 30px);
			height: clamp(15px, 4.2vw, 16px);
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
			width: clamp(3.6px, 1.05vw, 4px);
			height: clamp(6.5px, 1.85vw, 7.4px);
		}

		.campfire-figure {
			width: clamp(18px, 5vw, 20px);
			transform: translate3d(calc(-100% - 5px), -100%, 0);
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
