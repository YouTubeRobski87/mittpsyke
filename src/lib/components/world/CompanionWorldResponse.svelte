<script lang="ts">
	// Världens korta svar när användaren reflekterat: en mjuk ljus-/luftpust som
	// drar lågt genom scenen och försvinner. Rent kosmetisk, ingen belöning.
	//
	// Egen komponent i stället för AmbientWorld: på Mitt Hem är hela det lagret
	// medvetet dolt (se .hero-living-world i dashboard/+page.svelte), så det finns
	// ingen synlig vegetation eller lövlager att förstärka i den här scenen.
	// Komponenten lånar därför AmbientWorlds visuella språk - blurrad gradient,
	// soft-light, bara transform och opacity - utan att röra dess lager.
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import {
		WORLD_RESPONSE_DELAY_MS,
		WORLD_RESPONSE_DURATION_MS,
		getWorldResponseMode
	} from '$lib/world/worldResponse';

	// En räknare, inte en boolean: varje ny signal är ett nytt svar, och två svar
	// efter varandra ska kunna spela var sin pust.
	let { signal = 0, class: className = '' }: { signal?: number; class?: string } = $props();

	const motion = createMotionAwareness();
	let playing = $state(false);
	let handledSignal = 0;

	const mode = $derived(getWorldResponseMode(motion.reducedMotion));

	$effect(() => {
		if (!signal || signal === handledSignal) return;
		handledSignal = signal;

		const startTimer = window.setTimeout(() => {
			playing = true;
		}, WORLD_RESPONSE_DELAY_MS);
		const endTimer = window.setTimeout(() => {
			playing = false;
		}, WORLD_RESPONSE_DELAY_MS + WORLD_RESPONSE_DURATION_MS);

		return () => {
			window.clearTimeout(startTimer);
			window.clearTimeout(endTimer);
		};
	});
</script>

{#if playing}
	<span
		class={`world-response ${className}`.trim()}
		data-mode={mode}
		style={`--response-duration: ${WORLD_RESPONSE_DURATION_MS}ms`}
		aria-hidden="true"
	></span>
{/if}

<style>
	/* Absolut placerad i en scen som redan klipper sitt innehåll: kan varken
	   flytta layout, ändra scenens mått eller skapa overflow. Bara transform och
	   opacity animeras. */
	.world-response {
		position: absolute;
		left: -14%;
		top: 52%;
		width: 46%;
		height: 30%;
		border-radius: 999px;
		background: linear-gradient(
			92deg,
			transparent 0%,
			rgba(255, 244, 214, 0.42) 38%,
			rgba(214, 238, 255, 0.28) 62%,
			transparent 100%
		);
		filter: blur(14px);
		/* screen, inte soft-light: stugscenen är mörk kväll/natt, och soft-light
		   ger nästan ingen skillnad mot mörka pixlar. screen är samma blend som
		   världens ljuspartiklar (.world-drift) redan använder. */
		mix-blend-mode: screen;
		opacity: 0;
		pointer-events: none;
		will-change: transform, opacity;
		animation: worldResponseBreeze var(--response-duration, 1500ms) ease-in-out both;
	}

	/* Reducerad rörelse: samma pust, men den står stilla och andas bara upp och
	   ner. Ingen egen logik här - läget kommer från createMotionAwareness. */
	.world-response[data-mode='still'] {
		left: 8%;
		animation-name: worldResponseGlow;
	}

	@keyframes worldResponseBreeze {
		0% {
			opacity: 0;
			transform: translate3d(0, 0, 0) scaleX(0.92);
		}
		/* Topparna är uppmätta mot den mörka stugscenen: lägre än så försvinner
		   pusten helt, högre börjar den läsa som en blixt. */
		30% {
			opacity: 0.5;
		}
		70% {
			opacity: 0.4;
		}
		100% {
			opacity: 0;
			transform: translate3d(120%, -3%, 0) scaleX(1.06);
		}
	}

	@keyframes worldResponseGlow {
		0%,
		100% {
			opacity: 0;
		}
		45% {
			opacity: 0.3;
		}
	}
</style>
