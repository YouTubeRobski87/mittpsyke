<script lang="ts">
	// En liten brasa med en stillsam gestalt bredvid, på den bortre stranden i
	// Framstegs banner. Egen komponent (inte en LivingWorldEffectKind) eftersom
	// eld och gestalt hör ihop, delar en ankarpunkt i scenen och inte ska
	// påverka Mitt Hems hero, som återanvänder samma AmbientWorld-lager.
	//
	// Placeringen (left/top nedan) är avläst mot det faktiska fotot, inte
	// gissad: källpunkt x23 %/y43 % i progress-cabin-lakeside.webp ligger mitt
	// i den mörka, jämna bortre stranden (luminans ~15-30 i ett 4x4%-fönster
	// runt punkten) - tydligt under den ljusa solnedgångsreflektionen i sjön
	// och till höger om stugans siluett.
	//
	// Scenen beskärs olika i tre breakpoints (se object-position i
	// +page.svelte: bas=70% 64%, ≥981px=50% 50%, ≤640px=20% 64%), så samma
	// källpunkt kräver tre olika container-procent. Ändras någon av de tre
	// object-position-värdena i +page.svelte måste top-värdena här räknas om.
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';

	let { class: className = '' }: { class?: string } = $props();

	const motion = createMotionAwareness();
</script>

<div
	class={`campfire ${className}`.trim()}
	class:is-paused={!motion.isActive || motion.reducedMotion}
	aria-hidden="true"
>
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
		left: 23%;
		top: 25%;
		pointer-events: none;
		z-index: calc(var(--scene-ambient, 2) - 1);
	}

	.campfire-glow,
	.campfire-ember,
	.campfire-flame,
	.campfire-figure {
		position: absolute;
		left: 0;
		top: 0;
	}

	/* Det breda, mjuka skenet. Varma toner utan vit kärna, stor blur, låg alpha
	   - samma idiom som vattenglimten i WaterLayer.svelte: ljuset ska andas på
	   plats, inte lysa som en strålkastare. */
	.campfire-glow {
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

	/* ≥981px: object-position går till 50% 50% i +page.svelte (centrerad
	   beskärning i stället för bas-värdets 70% 64%). */
	@media (min-width: 981px) {
		.campfire {
			top: 32%;
		}
	}

	/* ≤640px: object-position går till 20% 64%, och scenen byter fokus mot
	   stugan på vänster strand - samma källpunkt hamnar då mycket längre ner
	   i rutan. */
	@media (max-width: 640px) {
		.campfire {
			/* Den avlägsna stranden beskärs ner mot textytan på smal mobil.
		   Dölj den extra detaljscenen i stället för att låta den konkurrera
		   med kopian nere till vänster. Det påverkar inte layouten eftersom
		   komponenten är absolut positionerad. */
			display: none;
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
