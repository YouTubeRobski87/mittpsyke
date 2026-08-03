<script lang="ts">
	import { onMount } from 'svelte';
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import { getCompanionDisplayState } from '$lib/companionStateMachine';
	import {
		getCompanionAbsenceMs,
		getCompanionBasePose,
		getCompanionOverlayPose,
		getCompanionPoseDaypart,
		getCompanionScenePosition,
		getMsUntilNextCompanionPoseCheck,
		isReflectionSaveWithinReactionWindow,
		qualifiesAsCompanionReturn,
		recordCompanionSeen
	} from '$lib/companionPoseState';
	import {
		clearReflectionSavedTimestamp,
		getReflectionSavedTimestamp
	} from '$lib/diary-events';
	import {
		COMPANION_BEHAVIOURS,
		getCompanionBehaviourRestMs,
		isQuietPose,
		pickCompanionBehaviour,
		type CompanionBehaviour,
		type CompanionBehaviourId
	} from '$lib/world/companionBehaviour';
	import type {
		CompanionId,
		CompanionPose,
		CompanionPoseDaypart,
		CompanionScenePosition
	} from '$lib/companionPoseManifest';

	let {
		class: className = '',
		decorative = false,
		basePose: providedBasePose = null,
		position: providedPosition = null,
		placement = null,
		companionId = 'fox'
	}: {
		class?: string;
		decorative?: boolean;
		basePose?: CompanionPose | null;
		position?: CompanionScenePosition | null;
		placement?: { scale?: number; x?: number; y?: number } | null;
		companionId?: CompanionId;
	} = $props();

	const motionAwareness = createMotionAwareness();
	let localBasePose = $state<CompanionPose | null>(null);
	let localPosition = $state<CompanionScenePosition | null>(null);
	let overlayPose = $state<CompanionPose | null>(null);
	let daypart = $state<CompanionPoseDaypart>('day');
	let baseFrameIndex = $state(0);
	let overlayFrameIndex = $state(0);

	// Mikrorörelser - urval, vikter och vilotider bor i $lib/world/companionBehaviour.
	let microGesture = $state<CompanionBehaviourId | null>(null);
	let previousGesture: CompanionBehaviourId | null = null;
	// Sant en gång per montering om användaren varit borta länge nog (se
	// companionPoseState.ts). Förbrukas av den första tillåtna mikrorörelsen
	// i maybePlayMicroGesture - se kommentaren där för ordningen.
	let returnGestureAvailable = false;
	// Sant en gång per montering om en reflektion sparades nyligen (se
	// diary-events.ts + companionPoseState.ts). Till skillnad från
	// returnGestureAvailable är den underliggande signalen persisterad
	// (localStorage), så "förbrukning" innebär att faktiskt rensa den - se
	// maybePlayMicroGesture, som gör det exakt när gesten startar, inte
	// tidigare.
	let reflectionGestureAvailable = false;

	const classes = $derived(`companion-pose ${className}`.trim());
	const basePose = $derived(providedBasePose ?? localBasePose);
	const position = $derived(providedPosition ?? localPosition);
	const sceneAdjustment = $derived(basePose?.sceneAdjustment);
	const baseFrame = $derived(
		basePose ? basePose.frames[baseFrameIndex % basePose.frames.length] : null
	);
	const overlayFrame = $derived(
		overlayPose ? overlayPose.frames[overlayFrameIndex % overlayPose.frames.length] : null
	);
	// Kanoniskt tillstånd (idle/look-left/look-right/blink/sniff/walk/sit/rest/sleep),
	// se $lib/companionStateMachine - används bara som ett stabilt data-attribut,
	// styr inte vilken bild som faktiskt visas (det gör basePose/overlayPose ovan).
	const displayState = $derived(getCompanionDisplayState(basePose, overlayPose));
	const positionStyle = $derived(
	position
		? [
					`--companion-x: ${(placement?.x ?? position.x) + (sceneAdjustment?.x ?? 0)}%`,
					`--companion-y: ${(placement?.y ?? position.y) + (sceneAdjustment?.y ?? 0)}%`,
					`--companion-scale: ${position.scale * (sceneAdjustment?.scale ?? 1) * (placement?.scale ?? 1)}`,
					`--companion-z: ${position.zIndex}`,
					`--shadow-width: ${position.shadow.width}%`,
					`--shadow-height: ${position.shadow.height}%`,
					`--shadow-blur: ${position.shadow.blur}px`,
					`--shadow-opacity: ${position.shadow.opacity}`
				].join('; ')
			: ''
	);

	function refreshBasePose() {
		const now = new Date();
		daypart = getCompanionPoseDaypart(now);
		if (!providedBasePose) {
			const nextBasePose = getCompanionBasePose(now, window.localStorage, companionId);
			localBasePose = nextBasePose;
			localPosition = getCompanionScenePosition(nextBasePose, now, window.localStorage, companionId);
		} else if (!providedPosition) {
			localPosition = getCompanionScenePosition(providedBasePose, now, window.localStorage, companionId);
		}
		baseFrameIndex = 0;
	}

	function maybePlayOverlay() {
		if (overlayPose || !motionAwareness.isActive || motionAwareness.reducedMotion) return;

		const isSleeping = basePose?.id === 'sleep-curled' || basePose?.id === 'sleep-side';
		const motion = isSleeping ? 'sleep' : Math.random() < 0.72 ? 'blink' : 'gesture';
		const nextOverlay = getCompanionOverlayPose(daypart, motion, companionId);
		if (!nextOverlay) return;

		overlayPose = nextOverlay;
		overlayFrameIndex = 0;
		window.setTimeout(() => {
			overlayPose = null;
			overlayFrameIndex = 0;
		}, nextOverlay.durationMs ?? 3000);
	}

	/** Samma lugna gest används för båda "riktade" reaktionerna nedan - ingen
	 *  ny CSS eller pose, bara ett medvetet val i stället för fri slump. */
	function getSettleBehaviour(): CompanionBehaviour {
		return (
			COMPANION_BEHAVIOURS.find((candidate) => candidate.id === 'settle') ??
			pickCompanionBehaviour(previousGesture)
		);
	}

	function maybePlayMicroGesture() {
		if (microGesture || !motionAwareness.isActive || motionAwareness.reducedMotion) return;
		// Ingen mikrorörelse ovanpå ett aktivt blink/gesture-overlay, och inte
		// för poser som redan rör sig eller ska ligga still.
		if (overlayPose || isQuietPose(basePose?.id)) return;

		// Båda flaggorna förbrukas här, efter att alla spärrar ovan redan
		// passerats - blockerar de gesten förbrukas ingendera, och nästa
		// tillåtna cykel får försöka igen. När båda är false (det normala
		// fallet) är else-grenen nedan identisk med tidigare.
		let behaviour: CompanionBehaviour;
		if (reflectionGestureAvailable) {
			// Reflektionsreaktionen har prioritet över återkomstgesten om båda
			// är tillgängliga samma cykel (se onMount) - returnGestureAvailable
			// rörs inte här, så den kan spelas en senare cykel, efter den
			// normala viloperioden, aldrig direkt efter denna.
			behaviour = getSettleBehaviour();
			reflectionGestureAvailable = false;
			// Den persisterade flaggan (diary-events.ts) rensas exakt här, när
			// gesten faktiskt startar - inte tidigare, se onMount.
			clearReflectionSavedTimestamp();
		} else if (returnGestureAvailable) {
			behaviour = getSettleBehaviour();
			returnGestureAvailable = false;
		} else {
			behaviour = pickCompanionBehaviour(previousGesture);
		}

		previousGesture = behaviour.id;
		microGesture = behaviour.id;
		window.setTimeout(() => {
			microGesture = null;
		}, behaviour.durationMs);
	}

	onMount(() => {
		refreshBasePose();

		// Mäts en gång per faktisk montering, inte i den periodiska
		// refreshBasePose-cykeln ovan - annars skulle en flik som bara
		// ligger öppen räknas som "borta och tillbaka" varje gång posen
		// råkar uppdateras i bakgrunden. Skrivs alltid, oavsett
		// rörelseinställning, så nästa faktiska återkomst mäts mot rätt
		// tidpunkt.
		const seenNow = new Date();
		const absenceMs = getCompanionAbsenceMs(seenNow, window.localStorage, companionId);
		recordCompanionSeen(seenNow, window.localStorage, companionId);
		returnGestureAvailable = qualifiesAsCompanionReturn(absenceMs);

		// Reflektion sparad nyligen (se diary-events.ts): flaggan lämnas kvar
		// i storage om den är giltig - den rensas först när gesten faktiskt
		// startar (maybePlayMicroGesture), så en blockerad cykel inte
		// förbrukar den. En utgången flagga rensas direkt, utan gest.
		const reflectionSavedAt = getReflectionSavedTimestamp();
		if (reflectionSavedAt !== null) {
			if (isReflectionSaveWithinReactionWindow(reflectionSavedAt, seenNow)) {
				reflectionGestureAvailable = true;
			} else {
				clearReflectionSavedTimestamp();
			}
		}

		let baseTimer: number | null = null;
		let baseFrameTimer: number | null = null;
		let overlayFrameTimer: number | null = null;
		let overlayTimer: number | null = null;
		let microGestureTimer: number | null = null;

		const scheduleBaseCheck = () => {
			baseTimer = window.setTimeout(() => {
				refreshBasePose();
				scheduleBaseCheck();
			}, getMsUntilNextCompanionPoseCheck(new Date(), window.localStorage, companionId));
		};

		const scheduleBaseFrame = () => {
			baseFrameTimer = window.setTimeout(() => {
				if (motionAwareness.isActive && !motionAwareness.reducedMotion && basePose && basePose.frames.length > 1) {
					baseFrameIndex += 1;
				}
				scheduleBaseFrame();
			}, basePose?.frameMs ?? 900);
		};

		const scheduleOverlayFrame = () => {
			overlayFrameTimer = window.setTimeout(() => {
				if (motionAwareness.isActive && !motionAwareness.reducedMotion && overlayPose && overlayPose.frames.length > 1) {
					overlayFrameIndex += 1;
				}
				scheduleOverlayFrame();
			}, overlayPose?.frameMs ?? 900);
		};

		const scheduleOverlay = (minDelay = 75_000, maxDelay = 155_000) => {
			const delay = minDelay + Math.random() * (maxDelay - minDelay);
			overlayTimer = window.setTimeout(() => {
				maybePlayOverlay();
				scheduleOverlay();
			}, delay);
		};

		// Kort rörelse följd av flera sekunders vila - vilotiderna kommer från
		// $lib/world/companionBehaviour så de kan justeras på ett ställe.
		const scheduleMicroGesture = (isFirst = false) => {
			microGestureTimer = window.setTimeout(() => {
				maybePlayMicroGesture();
				scheduleMicroGesture();
			}, getCompanionBehaviourRestMs(isFirst));
		};

		scheduleBaseCheck();
		scheduleBaseFrame();
		scheduleOverlayFrame();
		scheduleOverlay(22_000, 68_000);
		scheduleMicroGesture(true);

		return () => {
			if (baseTimer !== null) window.clearTimeout(baseTimer);
			if (baseFrameTimer !== null) window.clearTimeout(baseFrameTimer);
			if (overlayFrameTimer !== null) window.clearTimeout(overlayFrameTimer);
			if (overlayTimer !== null) window.clearTimeout(overlayTimer);
			if (microGestureTimer !== null) window.clearTimeout(microGestureTimer);
		};
	});

	$effect(() => {
		if (!providedBasePose || providedPosition) return;
		localPosition = getCompanionScenePosition(
			providedBasePose,
			new Date(),
			window.localStorage,
			companionId
		);
	});
</script>

<figure
	class={classes}
	data-companion={companionId}
	data-daypart={daypart}
	data-position={position?.id}
	data-pose={basePose?.id}
	data-state={displayState}
	style={positionStyle}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : basePose?.alt}
	role={decorative ? undefined : 'img'}
>
	{#if baseFrame}
		<img
			class="companion-pose-image companion-pose-base"
			data-micro-gesture={microGesture}
			src={baseFrame.src}
			alt=""
			decoding="async"
		/>
	{/if}
	{#if overlayFrame}
		<img
			class="companion-pose-image companion-pose-overlay"
			src={overlayFrame.src}
			alt=""
			decoding="async"
		/>
	{/if}
</figure>

<style>
	.companion-pose {
		position: relative;
		display: block;
		width: min(48%, 430px);
		aspect-ratio: 1;
		margin: 0;
		pointer-events: none;
		--companion-grade: saturate(0.78) contrast(0.9) brightness(0.96) sepia(0.08);
	}

	.companion-pose:global(.hero-companion-pose) {
		position: absolute;
		left: var(--companion-x, 78%);
		top: var(--companion-y, 82%);
		z-index: var(--companion-z, 2);
		width: min(39%, 310px);
		transform: translate3d(-50%, -100%, 0) scale(calc(var(--companion-scale, 1) * var(--companion-animal-scale, 1)));
		transform-origin: 50% 100%;
		transition:
			left 900ms ease,
			top 900ms ease,
			transform 900ms ease;
	}

	.companion-pose:global(.hero-companion-pose)::before {
		content: '';
		position: absolute;
		z-index: -1;
		left: 15%;
		bottom: 7%;
		width: var(--shadow-width, 68%);
		height: var(--shadow-height, 8%);
		border-radius: 52% 48% 58% 42%;
		background:
			radial-gradient(ellipse at 44% 56%, rgb(37 35 23 / 0.48), transparent 58%),
			linear-gradient(88deg, transparent 0%, rgb(46 43 28 / 0.28) 30%, rgb(37 35 23 / 0.34) 56%, transparent 100%);
		filter: blur(var(--shadow-blur, 8px));
		opacity: var(--shadow-opacity, 0.22);
		transform: rotate(-7deg) skewX(-14deg) scaleX(1.14);
		transform-origin: 44% 50%;
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	.companion-pose:global(.hero-companion-pose)[data-companion='bear']::before {
		left: 10%;
		bottom: 5%;
		width: 76%;
		height: 10%;
		filter: blur(9px);
		opacity: 0.26;
		transform: rotate(-5deg) skewX(-12deg) scaleX(1.1);
	}

	.companion-pose:global(.hero-companion-pose)[data-position='shore-near']::after {
		content: '';
		position: absolute;
		z-index: 3;
		left: 18%;
		right: 11%;
		bottom: 5%;
		height: 18%;
		background:
			radial-gradient(34% 18% at 26% 78%, rgb(74 78 52 / 0.38), transparent 70%),
			radial-gradient(26% 14% at 68% 84%, rgb(96 93 66 / 0.25), transparent 72%),
			linear-gradient(82deg, transparent 0 14%, rgb(86 103 61 / 0.42) 15% 16%, transparent 17%),
			linear-gradient(98deg, transparent 0 30%, rgb(65 85 51 / 0.35) 31% 32%, transparent 33%),
			linear-gradient(76deg, transparent 0 45%, rgb(91 109 65 / 0.37) 46% 47%, transparent 48%),
			linear-gradient(104deg, transparent 0 58%, rgb(67 86 52 / 0.3) 59% 60%, transparent 61%);
		filter: blur(0.1px);
		opacity: 0.64;
		transform: rotate(-5deg) skewX(-7deg);
		mix-blend-mode: multiply;
		pointer-events: none;
	}

	.companion-pose-image {
		position: absolute;
		inset: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: var(--companion-grade) drop-shadow(0 12px 14px rgb(43 33 20 / 0.1));
		-webkit-mask-image: radial-gradient(ellipse at 50% 52%, #000 72%, rgb(0 0 0 / 0.9) 89%, transparent 100%);
		mask-image: radial-gradient(ellipse at 50% 52%, #000 72%, rgb(0 0 0 / 0.9) 89%, transparent 100%);
		transform-origin: 50% 78%;
	}

	.companion-pose-base {
		animation: companionPoseBreath 7s ease-in-out infinite;
	}

	/* Mikrorörelser - kort, sällan och litet. Ersätter tillfälligt den
	   vanliga andningen (samma transform-egenskap kan inte köra två
	   animationer samtidigt) med en variant som väver in ett litet ögonkast
	   eller en hållningsjustering i samma lugna rörelse, så andningen aldrig
	   känns som att den tvärstannar. */
	.companion-pose-base[data-micro-gesture='glance-left'] {
		animation: companionMicroGlanceLeft 2.8s ease-in-out both;
	}

	.companion-pose-base[data-micro-gesture='glance-right'] {
		animation: companionMicroGlanceRight 2.8s ease-in-out both;
	}

	.companion-pose-base[data-micro-gesture='settle'] {
		animation: companionMicroSettle 2.2s ease-in-out both;
	}

	.companion-pose-base[data-micro-gesture='ear-twitch'] {
		animation: companionMicroEarTwitch 0.9s ease-out both;
	}

	.companion-pose-base[data-micro-gesture='sniff'] {
		animation: companionMicroSniff 2.6s ease-in-out both;
	}

	.companion-pose-overlay {
		animation: companionPoseOverlay 420ms ease both;
	}

	.companion-pose[data-daypart='evening'] .companion-pose-image {
		filter: saturate(0.72) contrast(0.9) brightness(0.9) sepia(0.13)
			drop-shadow(0 16px 18px rgb(24 25 44 / 0.2));
	}

	.companion-pose[data-daypart='night'] .companion-pose-image {
		filter: saturate(0.62) contrast(0.88) brightness(0.78) sepia(0.1)
			drop-shadow(0 16px 18px rgb(9 13 27 / 0.28));
	}

	/* Vargens panorama är redan frilagt. Behåll alpha-kanalen direkt i stället
	 * för den generella mjuka masken, och förankra bildytan nedåt så tassarna
	 * möter scenens markpunkt. */
	.companion-pose[data-companion='wolf'] .companion-pose-image {
		object-position: center bottom;
		filter: saturate(0.78) contrast(0.9) brightness(0.96) sepia(0.08);
		-webkit-mask-image: none;
		mask-image: none;
	}

	.companion-pose[data-companion='wolf'][data-daypart='evening'] .companion-pose-image {
		filter: saturate(0.72) contrast(0.9) brightness(0.9) sepia(0.13);
	}

	.companion-pose[data-companion='wolf'][data-daypart='night'] .companion-pose-image {
		filter: saturate(0.62) contrast(0.88) brightness(0.78) sepia(0.1);
	}

	@keyframes companionPoseBreath {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(0.55%) scale(1.006);
		}
	}

	/* Ett lugnt litet ögonkast åt sidan och tillbaka - ojämna procentsteg så
	   det inte känns som en mekanisk pendling. */
	@keyframes companionMicroGlanceLeft {
		0%,
		100% {
			transform: translateY(0) scale(1) rotate(0deg) translateX(0);
		}
		18% {
			transform: translateY(0.25%) scale(1.003) rotate(-0.4deg) translateX(-0.3%);
		}
		45% {
			transform: translateY(0.5%) scale(1.006) rotate(-1.1deg) translateX(-0.7%);
		}
		72% {
			transform: translateY(0.35%) scale(1.004) rotate(-0.9deg) translateX(-0.6%);
		}
	}

	@keyframes companionMicroGlanceRight {
		0%,
		100% {
			transform: translateY(0) scale(1) rotate(0deg) translateX(0);
		}
		18% {
			transform: translateY(0.25%) scale(1.003) rotate(0.4deg) translateX(0.3%);
		}
		45% {
			transform: translateY(0.5%) scale(1.006) rotate(1.1deg) translateX(0.7%);
		}
		72% {
			transform: translateY(0.35%) scale(1.004) rotate(0.9deg) translateX(0.6%);
		}
	}

	/* En liten justering av hållning/svans - kortare och lite mer asymmetrisk
	   än ögonkasten ovan så de två inte känns som samma rörelse. */
	@keyframes companionMicroSettle {
		0%,
		100% {
			transform: translateY(0) scale(1) rotate(0deg);
		}
		35% {
			transform: translateY(0.3%) scale(1.009) rotate(0.6deg);
		}
		65% {
			transform: translateY(0.15%) scale(1.004) rotate(-0.3deg);
		}
	}

	/* Snabbt öronryck - avsiktligt mycket kortare och vassare än de andra, det
	   är det som får den att läsas som ett ryck och inte som en rörelse. */
	@keyframes companionMicroEarTwitch {
		0%,
		100% {
			transform: translateY(0) scale(1) rotate(0deg);
		}
		22% {
			transform: translateY(-0.15%) scale(1.004) rotate(0.5deg);
		}
		44% {
			transform: translateY(0) scale(1.001) rotate(-0.2deg);
		}
		66% {
			transform: translateY(-0.08%) scale(1.003) rotate(0.28deg);
		}
	}

	/* Nosa mot marken: en mjuk nedåtdipp som stannar kvar en stund innan den
	   släpper - läses som uppmärksamhet nedåt snarare än en nick. */
	@keyframes companionMicroSniff {
		0%,
		100% {
			transform: translateY(0) scale(1) rotate(0deg);
		}
		28% {
			transform: translateY(0.7%) scale(1.005) rotate(-0.35deg);
		}
		58% {
			transform: translateY(0.95%) scale(1.008) rotate(-0.5deg);
		}
		80% {
			transform: translateY(0.5%) scale(1.004) rotate(-0.25deg);
		}
	}

	@keyframes companionPoseOverlay {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.companion-pose:global(.hero-companion-pose) {
			transition: none;
		}

		.companion-pose-image {
			animation: none !important;
			transform: none !important;
		}
	}

	@media (max-width: 620px) {
		.companion-pose:global(.hero-companion-pose) {
			width: min(50%, 220px);
		}
	}
</style>
