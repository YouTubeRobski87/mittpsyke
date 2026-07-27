<script lang="ts">
	import { onMount } from 'svelte';
	import { createMotionAwareness } from '$lib/motionAwareness.svelte';
	import { getCompanionDisplayState } from '$lib/companionStateMachine';
	import {
		getCompanionBasePose,
		getCompanionOverlayPose,
		getCompanionPoseDaypart,
		getCompanionScenePosition,
		getMsUntilNextCompanionPoseCheck
	} from '$lib/companionPoseState';
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

	onMount(() => {
		refreshBasePose();
		let baseTimer: number | null = null;
		let baseFrameTimer: number | null = null;
		let overlayFrameTimer: number | null = null;
		let overlayTimer: number | null = null;

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

		scheduleBaseCheck();
		scheduleBaseFrame();
		scheduleOverlayFrame();
		scheduleOverlay(22_000, 68_000);

		return () => {
			if (baseTimer !== null) window.clearTimeout(baseTimer);
			if (baseFrameTimer !== null) window.clearTimeout(baseFrameTimer);
			if (overlayFrameTimer !== null) window.clearTimeout(overlayFrameTimer);
			if (overlayTimer !== null) window.clearTimeout(overlayTimer);
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
		<img class="companion-pose-image companion-pose-base" src={baseFrame.src} alt="" decoding="async" />
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
