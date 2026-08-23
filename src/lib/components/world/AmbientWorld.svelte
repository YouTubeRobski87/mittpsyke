<script lang="ts">
	// Orkestrerar den levande världen: äger himmel-/ljus-/dim-/lövverkslagren
	// själv och delegerar vatten och fallande löv till egna lager.
	//
	// Lägg till en ny effekttyp genom att (1) lägga till den i
	// LivingWorldEffectKind + baseEffects i $lib/worldScene, och (2) antingen ge
	// den CSS här eller bryta ut den i ett eget lager när den växer.
	import { onMount } from 'svelte';
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import {
		getLivingWorldScene,
		type LivingWorldEffect,
		type LivingWorldEffectKind,
		type LivingWorldEvent,
		type LivingWorldScene
	} from '$lib/worldScene';
	import { effectStyle } from '$lib/world/effectStyle';
	import { getCloudSessionVariation } from '$lib/world/sessionVariation';
	import {
		getAmbientEventPlan,
		type AmbientEventContext,
		type AmbientEventKind
	} from '$lib/world/ambientEvents';
	import type { CompanionRelationshipStage } from '$lib/companionRelationship';
	import WaterLayer from './WaterLayer.svelte';
	import LeafLayer from './LeafLayer.svelte';

	type ActiveWorldEvent = LivingWorldEffect & { eventId: string; planId: string };

	let {
		scene = getLivingWorldScene(),
		relationshipStage = 0,
		visibleEffects,
		visibleEventKinds,
		eventContext = 'progress',
		eventsBlocked = false,
		class: className = ''
	}: {
		scene?: LivingWorldScene;
		relationshipStage?: CompanionRelationshipStage;
		visibleEffects?: readonly LivingWorldEffectKind[];
		visibleEventKinds?: readonly AmbientEventKind[];
		eventContext?: AmbientEventContext;
		eventsBlocked?: boolean;
		class?: string;
	} = $props();

	const motion = createMotionAwareness();
	let activeEvent = $state<ActiveWorldEvent | null>(null);
	let activeWindEvent = $state(false);
	let sessionSeed = $state<string | null>(null);
	let handledPlanId = $state<string | null>(null);
	let clearEventTimer: number | null = null;

	const classes = $derived(`living-world ${className}`.trim());
	const isVisibleEffect = (kind: LivingWorldEffectKind) =>
		visibleEffects === undefined || visibleEffects.includes(kind);
	const enabledEffects = $derived(
		scene.effects.filter(
			(effect) => effect.enabled && scene.features[effect.kind] && isVisibleEffect(effect.kind)
		)
	);
	// Vattnet renderas av WaterLayer, resten av det här lagret.
	const waterEffects = $derived(enabledEffects.filter((effect) => effect.kind === 'water'));
	const ambientEffects = $derived(enabledEffects.filter((effect) => effect.kind !== 'water'));
	const skyEffects = $derived(
		ambientEffects.filter((effect) =>
			['light', 'moon', 'sun', 'cloud', 'mist'].includes(effect.kind)
		)
	);
	const foregroundEffects = $derived(
		ambientEffects.filter(
			(effect) => !['light', 'moon', 'sun', 'cloud', 'mist'].includes(effect.kind)
		)
	);
	const availableEventKinds = $derived.by(() => {
		const worldKinds = scene.events
			.filter((event) => event.enabled && event.kind !== 'leaf')
			.map((event) => event.kind as AmbientEventKind);
		if (isVisibleEffect('foliage')) worldKinds.push('wind');
		return visibleEventKinds === undefined
			? worldKinds
			: worldKinds.filter((kind) => visibleEventKinds.includes(kind));
	});
	const ambientPlan = $derived(
		sessionSeed
			? getAmbientEventPlan({
				sessionSeed,
				dateKey: scene.localDateKey,
				localTimeMinutes: scene.localTimeMinutes,
				timeOfDay: scene.timeOfDay,
				season: scene.season,
				growthLevel: scene.growthLevel,
				context: eventContext,
				reducedMotion: motion.reducedMotion,
				availableKinds: availableEventKinds
			})
			: null
	);

	function styleForEffect(effect: LivingWorldEffect) {
		const baseStyle = effectStyle(effect);
		if (effect.kind !== 'cloud' || !sessionSeed) return baseStyle;

		const variation = getCloudSessionVariation(sessionSeed, effect.id, effect);
		return [
			baseStyle,
			`--cloud-offset-x: ${variation.offsetX.toFixed(2)}%`,
			`--cloud-offset-y: ${variation.offsetY.toFixed(2)}%`,
			`--cloud-duration: ${variation.durationMs}ms`,
			`--cloud-delay: ${variation.delayMs}ms`
		].join('; ');
	}

	function createActiveEvent(
		event: LivingWorldEvent,
		plan: NonNullable<typeof ambientPlan>
	): ActiveWorldEvent {
		const position = event.positions[plan.positionIndex % event.positions.length];
		const durationMs = plan.durationMs;
		const size = event.kind === 'water' ? 9 : event.kind === 'bird' ? 2.2 : 1;

		return {
			id: plan.id,
			planId: plan.id,
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

	function clearActiveEvent() {
		if (clearEventTimer !== null) window.clearTimeout(clearEventTimer);
		clearEventTimer = null;
		activeEvent = null;
		activeWindEvent = false;
	}

	function getSessionSeed() {
		const key = 'mittpsyke:ambient-event-seed:v1';
		const existing = window.sessionStorage.getItem(key);
		if (existing) return existing;
		const value = window.crypto.randomUUID();
		window.sessionStorage.setItem(key, value);
		return value;
	}

	onMount(() => {
		sessionSeed = getSessionSeed();
		return clearActiveEvent;
	});

	// Samma session, samma 30-minutersfönster och samma världstid ger samma
	// beslut. Ingen händelseplan skapas om vid en vanlig Svelte-render.
	$effect(() => {
		const active = motion.isActive;
		const reduced = motion.reducedMotion;
		const plan = ambientPlan;

		if (!active || reduced || eventsBlocked) {
			clearActiveEvent();
			return;
		}
		if (!plan || handledPlanId === plan.id || activeEvent || activeWindEvent) return;

		handledPlanId = plan.id;
		const playedKey = `mittpsyke:ambient-event-played:v1:${plan.id}`;
		if (window.sessionStorage.getItem(playedKey)) return;
		window.sessionStorage.setItem(playedKey, '1');
		if (plan.kind === 'wind') {
			activeWindEvent = true;
		} else {
			const event = scene.events.find((candidate) => candidate.enabled && candidate.kind === plan.kind);
			if (!event) return;
			activeEvent = createActiveEvent(event, plan);
		}

		clearEventTimer = window.setTimeout(clearActiveEvent, plan.durationMs);
	});
</script>

<div
	class={classes}
	class:is-paused={!motion.isActive || motion.reducedMotion}
	class:is-wind-event={activeWindEvent}
	data-season={scene.season}
	data-time={scene.timeOfDay}
	style={`--world-wind: ${scene.wind}`}
	aria-hidden="true"
>
	{#each skyEffects as effect (effect.id)}
		<span
			class={`world-effect world-${effect.kind} ${effect.className ?? ''}`.trim()}
			style={styleForEffect(effect)}
		></span>
	{/each}

	{#if activeEvent && (activeEvent.kind === 'bird' || activeEvent.kind === 'butterfly')}
		<span
			class={`world-effect world-${activeEvent.kind} ${activeEvent.className ?? ''}`.trim()}
			style={effectStyle(activeEvent)}
		></span>
	{/if}

	<WaterLayer effects={waterEffects} />
	{#if activeEvent?.kind === 'water'}
		<span
			class={`world-effect world-${activeEvent.kind} ${activeEvent.className ?? ''}`.trim()}
			style={effectStyle(activeEvent)}
		></span>
	{/if}

	{#each foregroundEffects as effect (effect.id)}
		<span
			class={`world-effect world-${effect.kind} ${effect.className ?? ''}`.trim()}
			style={styleForEffect(effect)}
		></span>
	{/each}

	{#if isVisibleEffect('foliage') && sessionSeed}
		<LeafLayer season={scene.season} {sessionSeed} />
	{/if}

	{#if relationshipStage >= 1 && isVisibleEffect('water')}
		<!-- Ett diskret naturtecken, inte en belöning eller indikator. -->
		<span class="world-presence-sign" aria-hidden="true"></span>
	{/if}

</div>

<style>
	.living-world,
	.world-effect { position: absolute; pointer-events: none; }
	.living-world { inset: 0; z-index: 1; overflow: hidden; contain: layout paint style; isolation: isolate; }
	.world-effect { left: var(--x, 0); top: var(--y, 0); width: var(--w, auto); height: var(--h, auto); opacity: 0; will-change: transform, opacity; }
	.is-paused :global(.world-effect) { animation-play-state: paused !important; }

	.world-light { inset: -18% auto auto -10%; width: 58%; height: 70%; border-radius: 50%; background: radial-gradient(circle, rgba(255, 243, 206, 0.24) 0%, rgba(255, 243, 206, 0.08) 44%, transparent 72%); opacity: var(--opacity, 0.42); animation: worldLightShift var(--duration, 52000ms) ease-in-out infinite alternate; transition: opacity 1200ms ease, background 1200ms ease; }
	.living-world[data-time='morning'] .world-light { background: radial-gradient(circle at 28% 42%, rgba(255, 215, 154, 0.3) 0%, rgba(255, 227, 182, 0.11) 46%, transparent 74%); }
	.living-world[data-time='day'] .world-light { inset: -22% auto auto 12%; background: radial-gradient(circle, rgba(232, 245, 255, 0.2) 0%, rgba(206, 230, 255, 0.07) 46%, transparent 75%); }
	.living-world[data-time='evening'] .world-light { inset: -12% -8% auto auto; background: radial-gradient(circle at 62% 38%, rgba(255, 187, 120, 0.28) 0%, rgba(255, 208, 158, 0.1) 47%, transparent 74%); }
	.living-world[data-time='night'] .world-light { background: radial-gradient(circle, rgba(171, 204, 255, 0.1) 0%, rgba(171, 204, 255, 0.035) 46%, transparent 74%); }
	.world-cloud { border-radius: 50% 54% 48% 52% / 56% 48% 52% 44%; background: radial-gradient(ellipse at 20% 65%, rgba(250, 246, 231, 0.54), transparent 42%), radial-gradient(ellipse at 48% 45%, rgba(255, 252, 241, 0.64), transparent 48%), radial-gradient(ellipse at 78% 61%, rgba(236, 241, 230, 0.46), transparent 44%); filter: blur(12px); mix-blend-mode: soft-light; opacity: 0; transform: translate3d(calc(-8% + var(--cloud-offset-x, 0%)), var(--cloud-offset-y, 0%), 0) scale(var(--scale, 1)); animation: cloudDrift var(--cloud-duration, var(--duration, 140000ms)) linear var(--cloud-delay, var(--delay, 0ms)) infinite; transition: filter 1200ms ease; }
	.cloud-front { filter: blur(16px); }
	.living-world[data-time='morning'] .world-cloud { --cloud-layer-opacity: 0.86; }
	.living-world[data-time='day'] .world-cloud { --cloud-layer-opacity: 1; mix-blend-mode: screen; }
	.living-world[data-time='evening'] .world-cloud { --cloud-layer-opacity: 0.72; }
	.living-world[data-time='night'] .world-cloud {
		--cloud-layer-opacity: 0.14;
		background:
			radial-gradient(ellipse at 20% 65%, rgba(178, 194, 214, 0.14), transparent 58%),
			radial-gradient(ellipse at 48% 45%, rgba(191, 204, 220, 0.18), transparent 62%),
			radial-gradient(ellipse at 78% 61%, rgba(162, 181, 201, 0.12), transparent 58%);
		filter: blur(32px) saturate(0.5) brightness(0.62);
	}
	/* Månen har ingen egen animation eller timer. worldScene.ts deklarerar den före
	   .world-cloud, så molnen behåller sitt vanliga lager ovanpå halo och månskiva. */
	.world-moon { width: clamp(3.25rem, 7vw, 5.5rem); aspect-ratio: 1; height: auto; border-radius: 50%; background: radial-gradient(circle, rgba(239, 217, 154, 0.15) 0%, rgba(226, 199, 138, 0.07) 42%, transparent 72%); opacity: var(--opacity, 0.82); transform: translate3d(-50%, -50%, 0); }
	.world-moon::after { content: ''; position: absolute; inset: 31%; border-radius: 50%; background: radial-gradient(circle at 35% 30%, rgba(239, 217, 154, 0.82) 0%, rgba(226, 199, 138, 0.7) 58%, rgba(184, 157, 105, 0.58) 100%); box-shadow: 0 0 14px rgba(226, 199, 138, 0.13); }
	/* Medvetet ett mjukt sken utan skarp skiva - scenbilden har redan en inbakad
	   sol, och en andra tydlig solskiva skulle läsa som två solar. Det här lagret
	   visar var dagsljuset kommer ifrån, inte solen själv. */
	.world-sun {
		width: clamp(5rem, 13vw, 10rem);
		aspect-ratio: 1;
		height: auto;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(255, 243, 214, 0.72) 0%,
			rgba(255, 226, 163, 0.34) 34%,
			rgba(255, 206, 138, 0.14) 58%,
			transparent 76%
		);
		filter: blur(6px);
		opacity: var(--opacity, 0.6);
		mix-blend-mode: screen;
		transform: translate3d(-50%, -50%, 0);
	}
	.living-world[data-time='day'] .world-sun {
		background: radial-gradient(
			circle,
			rgba(255, 252, 240, 0.78) 0%,
			rgba(255, 244, 209, 0.36) 34%,
			rgba(233, 240, 255, 0.14) 60%,
			transparent 78%
		);
	}
	.world-mist { border-radius: 999px; background: linear-gradient(90deg, transparent, rgba(255, 251, 236, 0.52), rgba(226, 245, 255, 0.36), transparent); filter: blur(12px); mix-blend-mode: soft-light; animation: mistDrift var(--duration, 118000ms) ease-in-out var(--delay, 0ms) infinite; }
	.living-world[data-time='day'] .world-mist { filter: blur(14px); }
	.world-foliage { transform-origin: 50% 100%; background: radial-gradient(ellipse at 24% 88%, rgba(111, 148, 94, 0.34), transparent 46%), radial-gradient(ellipse at 60% 82%, rgba(151, 177, 102, 0.2), transparent 52%), linear-gradient(180deg, transparent 14%, rgba(89, 131, 83, 0.13), transparent 76%); filter: blur(0.5px); opacity: var(--opacity, 0.14); animation: foliageBreathe var(--duration, 52000ms) ease-in-out var(--delay, 0ms) infinite; }
	/* Samma lövverksanimation som vanligt, bara tillfälligt snabbare när den
	   deterministiska eventplanen valt en vindpust. */
	.is-wind-event .world-foliage { animation-duration: 11s; }
	.is-wind-event .canopy-right { animation-duration: 5.5s; }
	/* Beständig markvegetation för Growth Garden. Samma foliage-lager och
	   vindanimation som övrig värld, med små, låga former i strandperspektiv. */
	.shore-sprigs { background: radial-gradient(ellipse at 18% 90%, rgba(83, 124, 73, 0.65) 0 16%, transparent 19%), radial-gradient(ellipse at 42% 77%, rgba(119, 151, 88, 0.58) 0 13%, transparent 17%), radial-gradient(ellipse at 68% 88%, rgba(77, 112, 70, 0.58) 0 18%, transparent 22%), linear-gradient(180deg, transparent 35%, rgba(73, 109, 66, 0.34) 100%); }
	.bank-groundcover { background: radial-gradient(ellipse at 14% 85%, rgba(74, 113, 68, 0.72) 0 15%, transparent 19%), radial-gradient(ellipse at 36% 68%, rgba(122, 149, 84, 0.52) 0 12%, transparent 16%), radial-gradient(ellipse at 62% 83%, rgba(92, 132, 74, 0.62) 0 19%, transparent 24%), radial-gradient(ellipse at 84% 72%, rgba(133, 157, 91, 0.44) 0 10%, transparent 15%), linear-gradient(180deg, transparent 26%, rgba(62, 101, 62, 0.4) 100%); }
	.shore-understory { background: radial-gradient(ellipse at 17% 84%, rgba(70, 110, 65, 0.7) 0 17%, transparent 21%), radial-gradient(ellipse at 43% 62%, rgba(125, 151, 87, 0.56) 0 13%, transparent 17%), radial-gradient(ellipse at 74% 82%, rgba(86, 125, 69, 0.68) 0 21%, transparent 26%), linear-gradient(180deg, transparent 22%, rgba(60, 96, 60, 0.42) 100%); }
	.settled-foreground { background: radial-gradient(ellipse at 12% 90%, rgba(68, 105, 64, 0.78) 0 19%, transparent 23%), radial-gradient(ellipse at 35% 72%, rgba(115, 142, 79, 0.54) 0 13%, transparent 17%), radial-gradient(ellipse at 60% 85%, rgba(77, 118, 66, 0.72) 0 20%, transparent 25%), radial-gradient(ellipse at 86% 77%, rgba(130, 149, 84, 0.46) 0 11%, transparent 16%), linear-gradient(180deg, transparent 25%, rgba(58, 92, 59, 0.46) 100%); }
	/* Ligger ovanpå den fotografiska grenen uppe till höger (companion-hero-scene) -
	   transform-origin nära bildens överkant, dvs där grenen kommer in i bild, inte
	   mitt i klungan, så rörelsen ser ut som en gren som svajar, inte hela trädet. */
	.canopy-right { transform-origin: 78% 0%; background: radial-gradient(ellipse at 40% 15%, rgba(133, 154, 80, 0.2), transparent 60%), radial-gradient(ellipse at 72% 35%, rgba(87, 126, 74, 0.16), transparent 62%); filter: blur(1px); animation: canopySway var(--duration, 7400ms) cubic-bezier(0.42, 0, 0.24, 1) var(--delay, 0ms) infinite; }

	.world-drift { border-radius: 50%; background: radial-gradient(circle, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.4) 45%, transparent 72%); filter: blur(0.5px); mix-blend-mode: screen; opacity: 0; animation: driftFloat var(--duration, 13000ms) ease-in-out var(--delay, 0ms) infinite; }
	/* Driftpartiklarna är avsedda som små ljus i dags-/skymningsvärlden, men
	   blir tydliga vita ovaler mot Framstegs natthimmel. Nattens enda
	   koncentrerade ljusform ska vara månen. */
	.progress-living-world[data-time='night'] .world-drift { display: none; }
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
	.world-presence-sign { position: absolute; left: 61%; top: 66%; width: clamp(22px, 4.4%, 46px); height: clamp(5px, 0.8%, 8px); border-radius: 50%; border: 1px solid rgba(228, 239, 218, 0.18); opacity: 0; transform: translate3d(-50%, -50%, 0) scale(0.6); animation: presenceRipple 29s ease-out 9s infinite; }

	/* Parallax: --depth (0 = längst bort, 1 = närmast) skalar rörelselängden, så
	   avlägsna lager driver kortare och långsammare än nära. Se EFFECT_DEPTHS i
	   $lib/worldScene för djupordningen. */
	@keyframes worldLightShift { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(calc(2.2% * (0.4 + var(--depth, 0.5))), calc(1.6% * (0.4 + var(--depth, 0.5))), 0) scale(1.035); } }
	@keyframes cloudDrift { 0%, 8%, 100% { opacity: 0; transform: translate3d(calc(-10% + var(--cloud-offset-x, 0%)), var(--cloud-offset-y, 0%), 0) scale(var(--scale, 1)); } 18%, 72% { opacity: calc(var(--opacity, 0.1) * var(--cloud-layer-opacity, 1)); } 86% { opacity: 0; transform: translate3d(calc((12% + (28% * var(--world-wind, 0.18))) * (0.5 + var(--depth, 0.5)) + var(--cloud-offset-x, 0%)), calc(-3% + var(--cloud-offset-y, 0%)), 0) scale(var(--scale, 1)); } }
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
	@keyframes presenceRipple { 0%, 48%, 100% { opacity: 0; transform: translate3d(-50%, -50%, 0) scale(0.6); } 56% { opacity: 0.18; } 78% { opacity: 0.03; transform: translate3d(-50%, -50%, 0) scale(1.28); } }

	@media (prefers-reduced-motion: reduce) {
		.world-effect { animation: none !important; transform: none !important; }
		.world-moon, .world-sun { transform: translate3d(-50%, -50%, 0) !important; }
		.world-bird, .world-butterfly, .world-leaf, .world-drift, .world-event-water, .world-presence-sign { opacity: 0 !important; }
		.world-light, .world-mist, .world-foliage { opacity: calc(var(--opacity, 0.12) * 0.5); }
		.world-cloud { opacity: calc(var(--opacity, 0.12) * var(--cloud-layer-opacity, 1) * 0.5); }
	}

	/* På smala vyer prioriteras stugan, följeslagaren och Kvällslugn. De
	   rikaste stranddetaljerna får falla bort innan de kan göra beskärningen rörig. */
	@media (max-width: 620px) {
		.hero-living-world .shore-understory,
		.hero-living-world .settled-foreground { display: none; }
		.hero-living-world .bank-groundcover { opacity: calc(var(--opacity, 0.12) * 0.72); }
	}
</style>
