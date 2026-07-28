<script lang="ts">
	// Orkestrerar den levande världen: äger himmel-/ljus-/dim-/lövverkslagren
	// själv och delegerar vatten och fallande löv till egna lager.
	//
	// Lägg till en ny effekttyp genom att (1) lägga till den i
	// LivingWorldEffectKind + baseEffects i $lib/worldScene, och (2) antingen ge
	// den CSS här eller bryta ut den i ett eget lager när den växer.
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import {
		getLivingWorldScene,
		type LivingWorldEffect,
		type LivingWorldEvent,
		type LivingWorldScene
	} from '$lib/worldScene';
	import { effectStyle } from '$lib/world/effectStyle';
	import WaterLayer from './WaterLayer.svelte';
	import LeafLayer from './LeafLayer.svelte';

	type ActiveWorldEvent = LivingWorldEffect & { eventId: string };

	let {
		scene = getLivingWorldScene(),
		class: className = ''
	}: {
		scene?: LivingWorldScene;
		class?: string;
	} = $props();

	const motion = createMotionAwareness();
	let activeEvent = $state<ActiveWorldEvent | null>(null);

	const classes = $derived(`living-world ${className}`.trim());
	const enabledEffects = $derived(
		scene.effects.filter((effect) => effect.enabled && scene.features[effect.kind])
	);
	// Vattnet renderas av WaterLayer, resten av det här lagret.
	const waterEffects = $derived(enabledEffects.filter((effect) => effect.kind === 'water'));
	const ambientEffects = $derived(enabledEffects.filter((effect) => effect.kind !== 'water'));

	function between(min: number, max: number) {
		return min + Math.random() * (max - min);
	}

	function chooseEvent(): LivingWorldEvent | null {
		const eligible = scene.events.filter((event) => event.enabled && scene.features[event.kind]);
		const roll = Math.random();
		let threshold = 0;

		for (const event of eligible) {
			threshold += event.chance;
			if (roll < threshold) return event;
		}

		return null;
	}

	function createActiveEvent(event: LivingWorldEvent): ActiveWorldEvent {
		const position = event.positions[Math.floor(Math.random() * event.positions.length)];
		const durationMs = Math.round(between(event.durationMs[0], event.durationMs[1]));
		const size = event.kind === 'water' ? 9 : event.kind === 'bird' ? 2.2 : 1;

		return {
			id: `${event.id}-${Date.now()}`,
			eventId: event.id,
			kind: event.kind,
			enabled: true,
			className: `world-event-${event.kind}`,
			x: position.x,
			y: position.y,
			width: size,
			height: event.kind === 'water' ? size * 0.34 : size,
			durationMs,
			opacity: position.opacity,
			scale: position.scale
		};
	}

	// Körs om varje gång motion.isActive/motion.reducedMotion ändras (flik
	// döljs/visas, eller användaren togglar reduced-motion), och startar då om
	// den ambienta händelseloopen från grunden.
	$effect(() => {
		const active = motion.isActive;
		const reduced = motion.reducedMotion;

		let eventTimer: number | null = null;
		let clearEventTimer: number | null = null;
		// Tills den första händelsen faktiskt spelats: försök igen snabbt om
		// slumpen missar (chooseEvent() returnerar null), så att "första
		// händelsen inom ~3-8 sekunder" håller även vid otur i urvalet.
		let hasPlayedFirstEvent = false;

		const clearTimers = () => {
			if (eventTimer !== null) window.clearTimeout(eventTimer);
			if (clearEventTimer !== null) window.clearTimeout(clearEventTimer);
			eventTimer = null;
			clearEventTimer = null;
		};

		const scheduleAmbientEvent = (initial = false) => {
			if (!active || reduced) return;

			const delay = initial
				? between(3_000, 8_000)
				: hasPlayedFirstEvent
					? between(12_000, 30_000)
					: between(2_000, 4_500);
			eventTimer = window.setTimeout(() => {
				if (!active || reduced || activeEvent) {
					scheduleAmbientEvent();
					return;
				}

				const event = chooseEvent();
				if (!event) {
					scheduleAmbientEvent();
					return;
				}

				hasPlayedFirstEvent = true;
				activeEvent = createActiveEvent(event);
				clearEventTimer = window.setTimeout(() => {
					activeEvent = null;
					scheduleAmbientEvent();
				}, activeEvent.durationMs ?? 5_000);
			}, delay);
		};

		activeEvent = null;
		if (active && !reduced) scheduleAmbientEvent(true);

		return clearTimers;
	});
</script>

<div
	class={classes}
	class:is-paused={!motion.isActive || motion.reducedMotion}
	data-season={scene.season}
	data-time={scene.timeOfDay}
	style={`--world-wind: ${scene.wind}`}
	aria-hidden="true"
>
	{#each ambientEffects as effect (effect.id)}
		<span
			class={`world-effect world-${effect.kind} ${effect.className ?? ''}`.trim()}
			style={effectStyle(effect)}
		></span>
	{/each}

	<WaterLayer effects={waterEffects} />
	<LeafLayer season={scene.season} />

	{#if activeEvent}
		<span
			class={`world-effect world-${activeEvent.kind} ${activeEvent.className ?? ''}`.trim()}
			style={effectStyle(activeEvent)}
		></span>
	{/if}
</div>

<style>
	.living-world,
	.world-effect { position: absolute; pointer-events: none; }
	.living-world { inset: 0; z-index: 1; overflow: hidden; contain: layout paint style; isolation: isolate; }
	.world-effect { left: var(--x, 0); top: var(--y, 0); width: var(--w, auto); height: var(--h, auto); opacity: 0; will-change: transform, opacity; }
	.is-paused :global(.world-effect) { animation-play-state: paused !important; }

	.world-light { inset: -18% auto auto -10%; width: 58%; height: 70%; border-radius: 50%; background: radial-gradient(circle, rgba(255, 243, 206, 0.24) 0%, rgba(255, 243, 206, 0.08) 44%, transparent 72%); opacity: var(--opacity, 0.42); animation: worldLightShift var(--duration, 52000ms) ease-in-out infinite alternate; }
	.living-world[data-time='night'] .world-light { background: radial-gradient(circle, rgba(171, 204, 255, 0.12) 0%, rgba(171, 204, 255, 0.05) 46%, transparent 74%); }
	.world-cloud { border-radius: 999px; background: radial-gradient(ellipse at 22% 58%, rgba(255, 252, 238, 0.9), transparent 58%), radial-gradient(ellipse at 54% 48%, rgba(255, 252, 238, 0.8), transparent 62%), radial-gradient(ellipse at 78% 60%, rgba(255, 252, 238, 0.64), transparent 58%); filter: blur(7px); opacity: 0; transform: translate3d(-8%, 0, 0) scale(var(--scale, 1)); animation: cloudDrift var(--duration, 140000ms) linear var(--delay, 0ms) infinite; }
	.cloud-front { filter: blur(9px); }
	.world-mist { border-radius: 999px; background: linear-gradient(90deg, transparent, rgba(255, 251, 236, 0.52), rgba(226, 245, 255, 0.36), transparent); filter: blur(12px); mix-blend-mode: soft-light; animation: mistDrift var(--duration, 118000ms) ease-in-out var(--delay, 0ms) infinite; }
	.living-world[data-time='day'] .world-mist { filter: blur(14px); }
	.world-foliage { transform-origin: 50% 100%; background: radial-gradient(ellipse at 24% 88%, rgba(111, 148, 94, 0.34), transparent 46%), radial-gradient(ellipse at 60% 82%, rgba(151, 177, 102, 0.2), transparent 52%), linear-gradient(180deg, transparent 14%, rgba(89, 131, 83, 0.13), transparent 76%); filter: blur(0.5px); opacity: var(--opacity, 0.14); animation: foliageBreathe var(--duration, 52000ms) ease-in-out var(--delay, 0ms) infinite; }
	/* Ligger ovanpå den fotografiska grenen uppe till höger (companion-hero-scene) -
	   transform-origin nära bildens överkant, dvs där grenen kommer in i bild, inte
	   mitt i klungan, så rörelsen ser ut som en gren som svajar, inte hela trädet. */
	.canopy-right { transform-origin: 78% 0%; background: radial-gradient(ellipse at 40% 15%, rgba(133, 154, 80, 0.2), transparent 60%), radial-gradient(ellipse at 72% 35%, rgba(87, 126, 74, 0.16), transparent 62%); filter: blur(1px); animation: canopySway var(--duration, 7400ms) cubic-bezier(0.42, 0, 0.24, 1) var(--delay, 0ms) infinite; }

	.world-drift { border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.4) 45%, transparent 72%); filter: blur(0.5px); mix-blend-mode: screen; opacity: 0; animation: driftFloat var(--duration, 13000ms) ease-in-out var(--delay, 0ms) infinite; }
	.world-event-water { border-radius: 50%; border: 1px solid rgba(235, 248, 246, 0.42); transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 0.64)); animation: waterRing var(--duration, 4800ms) ease-out both; }
	.world-bird { transform: translate3d(0, 0, 0) scale(var(--scale, 0.75)); }
	.world-bird::before, .world-bird::after { content: ''; position: absolute; top: 34%; width: 50%; height: 42%; border-top: 1.5px solid rgba(36, 49, 45, 0.42); border-radius: 999px 999px 0 0; }
	.world-bird::before { left: 0; transform: rotate(-13deg); }
	.world-bird::after { right: 0; transform: rotate(13deg); }
	.world-event-bird { animation: birdGlide var(--duration, 10000ms) ease-in-out both; }
	.world-butterfly { border-radius: 50%; transform: translate3d(0, 0, 0) scale(var(--scale, 1)); }
	.world-butterfly::before, .world-butterfly::after { content: ''; position: absolute; top: 18%; width: 45%; height: 58%; border-radius: 70% 30% 70% 30%; background: rgba(245, 196, 135, 0.42); filter: blur(0.2px); }
	.world-butterfly::before { left: 0; transform-origin: 100% 60%; animation: butterflyWing 980ms ease-in-out infinite alternate; }
	.world-butterfly::after { right: 0; transform: scaleX(-1); transform-origin: 0 60%; animation: butterflyWing 980ms ease-in-out 160ms infinite alternate; }
	.world-event-butterfly { animation: butterflyPass var(--duration, 7000ms) ease-in-out both; }
	.world-leaf { border-radius: 70% 30% 70% 30%; background: linear-gradient(135deg, rgba(157, 119, 62, 0.56), rgba(126, 145, 80, 0.28)); filter: blur(0.15px); }
	.world-event-leaf { animation: leafFall var(--duration, 6200ms) linear both; }

	/* Parallax: --depth (0 = längst bort, 1 = närmast) skalar rörelselängden, så
	   avlägsna lager driver kortare och långsammare än nära. Se EFFECT_DEPTHS i
	   $lib/worldScene för djupordningen. */
	@keyframes worldLightShift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(calc(2.2% * (0.4 + var(--depth, 0.5))), calc(1.6% * (0.4 + var(--depth, 0.5))), 0) scale(1.035); } }
	@keyframes cloudDrift { 0%, 8%, 100% { opacity: 0; transform: translate3d(-10%, 0, 0) scale(var(--scale, 1)); } 18%, 72% { opacity: var(--opacity, 0.1); } 86% { opacity: 0; transform: translate3d(calc((12% + (28% * var(--world-wind, 0.18))) * (0.5 + var(--depth, 0.5))), -3%, 0) scale(var(--scale, 1)); } }
	@keyframes mistDrift { 0%, 100% { opacity: calc(var(--opacity, 0.14) * 0.34); transform: translate3d(-4%, 0, 0) scaleX(0.94); } 48% { opacity: var(--opacity, 0.14); } 74% { opacity: calc(var(--opacity, 0.14) * 0.62); transform: translate3d(calc(5% * (0.5 + var(--depth, 0.5))), calc(-4% * (0.5 + var(--depth, 0.5))), 0) scaleX(1.08); } }
	@keyframes foliageBreathe { 0%, 24%, 100% { transform: rotate(0deg) translate3d(0, 0, 0); } 58% { transform: rotate(calc((2deg + (2.4deg * var(--world-wind, 0.18))) * (0.5 + var(--depth, 0.5)))) translate3d(calc(1.6% * var(--world-wind, 0.18)), -0.8%, 0); } }
	/* Svag, ojämn vindpust i grenen - ojämna procentsteg och skilda +/- värden
	   (inte ett symmetriskt fram-och-tillbaka) så det inte känns mekaniskt
	   loopat. Börjar och slutar i samma läge så loopen inte hackar till. */
	@keyframes canopySway {
		0% { transform: rotate(0deg) translate3d(0, 0, 0); }
		22% { transform: rotate(0.55deg) translate3d(1.4px, -0.6px, 0); }
		47% { transform: rotate(-0.35deg) translate3d(-1.8px, 0.3px, 0); }
		68% { transform: rotate(0.75deg) translate3d(2.2px, -1px, 0); }
		85% { transform: rotate(-0.2deg) translate3d(-1px, 0.2px, 0); }
		100% { transform: rotate(0deg) translate3d(0, 0, 0); }
	}
	/* Långsamt svävande ljuspartiklar i övre delen av scenen - synliga inom några sekunder, hela tiden. */
	@keyframes driftFloat { 0% { opacity: 0; transform: translate3d(0, 8%, 0) scale(0.8); } 12% { opacity: var(--opacity, 0.5); } 50% { transform: translate3d(calc(3% * (0.5 + var(--depth, 0.5))), calc(-10% * (0.5 + var(--depth, 0.5))), 0) scale(1.08); opacity: calc(var(--opacity, 0.5) * 0.8); } 88% { opacity: var(--opacity, 0.5); } 100% { opacity: 0; transform: translate3d(calc(-2.5% * (0.5 + var(--depth, 0.5))), calc(-22% * (0.5 + var(--depth, 0.5))), 0) scale(0.85); } }
	@keyframes waterRing { 0% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 0.64)); } 14% { opacity: var(--opacity, 0.16); } 46% { opacity: var(--opacity, 0.16); transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 1.05)); } 78% { opacity: calc(var(--opacity, 0.16) * 0.4); transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 1.22)); } 100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(calc(var(--scale, 1) * 1.34)); } }
	@keyframes birdGlide { 0% { opacity: 0; transform: translate3d(0, 0, 0) scale(var(--scale, 0.75)); } 12% { opacity: var(--opacity, 0.18); } 82% { opacity: calc(var(--opacity, 0.18) * 0.65); transform: translate3d(92vw, -2.2rem, 0) scale(var(--scale, 0.75)); } 100% { opacity: 0; transform: translate3d(108vw, -2.8rem, 0) scale(var(--scale, 0.75)); } }
	@keyframes butterflyPass { 0% { opacity: 0; transform: translate3d(0, 0, 0) scale(var(--scale, 1)) rotate(-5deg); } 12% { opacity: var(--opacity, 0.24); } 80% { opacity: calc(var(--opacity, 0.24) * 0.72); transform: translate3d(18vw, -4.4rem, 0) scale(var(--scale, 1)) rotate(8deg); } 100% { opacity: 0; transform: translate3d(26vw, -3.2rem, 0) scale(var(--scale, 1)) rotate(-3deg); } }
	@keyframes butterflyWing { from { transform: rotateY(0deg) rotate(8deg); } to { transform: rotateY(54deg) rotate(-6deg); } }
	@keyframes leafFall { 0% { opacity: 0; transform: translate3d(0, 0, 0) scale(var(--scale, 1)) rotate(0deg); } 14% { opacity: var(--opacity, 0.22); } 84% { opacity: calc(var(--opacity, 0.22) * 0.5); transform: translate3d(-2.7rem, 7rem, 0) scale(var(--scale, 1)) rotate(128deg); } 100% { opacity: 0; transform: translate3d(-3.4rem, 9.4rem, 0) scale(var(--scale, 1)) rotate(184deg); } }

	@media (prefers-reduced-motion: reduce) {
		.world-effect { animation: none !important; transform: none !important; }
		.world-bird, .world-butterfly, .world-leaf, .world-drift, .world-event-water { opacity: 0 !important; }
		.world-light, .world-mist, .world-cloud, .world-foliage { opacity: calc(var(--opacity, 0.12) * 0.5); }
	}
</style>
