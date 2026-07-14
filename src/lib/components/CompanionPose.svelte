<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getCompanionBasePose,
		getCompanionOverlayPose,
		getCompanionPoseDaypart,
		getCompanionScenePosition,
		getMsUntilNextCompanionPoseCheck
	} from '$lib/companionPoseState';
	import type {
		CompanionPose,
		CompanionPoseDaypart,
		CompanionScenePosition
	} from '$lib/companionPoseManifest';

	let {
		class: className = '',
		decorative = false,
		basePose: providedBasePose = null,
		position: providedPosition = null,
		companionId = 'fox'
	}: {
		class?: string;
		decorative?: boolean;
		basePose?: CompanionPose | null;
		position?: CompanionScenePosition | null;
		companionId?: 'fox' | 'bear';
	} = $props();

	let localBasePose = $state<CompanionPose | null>(null);
	let localPosition = $state<CompanionScenePosition | null>(null);
	let overlayPose = $state<CompanionPose | null>(null);
	let daypart = $state<CompanionPoseDaypart>('day');
	let baseFrameIndex = $state(0);
	let overlayFrameIndex = $state(0);
	let isActive = $state(true);
	let reducedMotion = $state(false);

	const classes = $derived(`companion-pose ${className}`.trim());
	const isBear = $derived(companionId === 'bear');
	const bearPose = $derived(
		daypart === 'night' ? 'sleeping' : daypart === 'evening' ? 'sitting' : 'standing'
	);
	const basePose = $derived(providedBasePose ?? localBasePose);
	const position = $derived(providedPosition ?? localPosition);
	const baseFrame = $derived(
		basePose ? basePose.frames[baseFrameIndex % basePose.frames.length] : null
	);
	const overlayFrame = $derived(
		overlayPose ? overlayPose.frames[overlayFrameIndex % overlayPose.frames.length] : null
	);
	const positionStyle = $derived(
		position
			? [
					`--companion-x: ${position.x}%`,
					`--companion-y: ${position.y}%`,
					`--companion-scale: ${position.scale}`,
					`--companion-z: ${position.zIndex}`,
					`--shadow-width: ${position.shadow.width}%`,
					`--shadow-height: ${position.shadow.height}%`,
					`--shadow-blur: ${position.shadow.blur}px`,
					`--shadow-opacity: ${position.shadow.opacity}`,
					`--companion-animal-scale: ${isBear ? 0.82 : 1}`
				].join('; ')
			: ''
	);

	function refreshBasePose() {
		const now = new Date();
		daypart = getCompanionPoseDaypart(now);
		if (!providedBasePose) {
			const nextBasePose = getCompanionBasePose(now, window.localStorage);
			localBasePose = nextBasePose;
			localPosition = getCompanionScenePosition(nextBasePose, now, window.localStorage);
		} else if (!providedPosition) {
			localPosition = getCompanionScenePosition(providedBasePose, now, window.localStorage);
		}
		baseFrameIndex = 0;
	}

	function maybePlayOverlay() {
		if (overlayPose || !isActive || reducedMotion) return;

		const isSleeping = basePose?.id === 'sleep-curled' || basePose?.id === 'sleep-side';
		const motion = isSleeping ? 'sleep' : Math.random() < 0.72 ? 'blink' : 'gesture';
		const nextOverlay = getCompanionOverlayPose(daypart, motion);
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
		// Björnen använder en stilla, gemensam SVG-fallback tills separata scenposer finns.
		// Den ska inte starta rävens pose- eller overlaytimers.
		if (isBear) return;

		let baseTimer: number | null = null;
		let baseFrameTimer: number | null = null;
		let overlayFrameTimer: number | null = null;
		let overlayTimer: number | null = null;
		const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

		const updateMotionState = () => {
			reducedMotion = motionQuery.matches;
		};

		const updateActiveState = () => {
			isActive = document.visibilityState === 'visible';
		};

		const scheduleBaseCheck = () => {
			baseTimer = window.setTimeout(() => {
				refreshBasePose();
				scheduleBaseCheck();
			}, getMsUntilNextCompanionPoseCheck(new Date(), window.localStorage));
		};

		const scheduleBaseFrame = () => {
			baseFrameTimer = window.setTimeout(() => {
				if (isActive && !reducedMotion && basePose && basePose.frames.length > 1) {
					baseFrameIndex += 1;
				}
				scheduleBaseFrame();
			}, basePose?.frameMs ?? 900);
		};

		const scheduleOverlayFrame = () => {
			overlayFrameTimer = window.setTimeout(() => {
				if (isActive && !reducedMotion && overlayPose && overlayPose.frames.length > 1) {
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

		updateMotionState();
		updateActiveState();
		motionQuery.addEventListener('change', updateMotionState);
		document.addEventListener('visibilitychange', updateActiveState);

		scheduleBaseCheck();
		scheduleBaseFrame();
		scheduleOverlayFrame();
		scheduleOverlay(22_000, 68_000);

		return () => {
			if (baseTimer !== null) window.clearTimeout(baseTimer);
			if (baseFrameTimer !== null) window.clearTimeout(baseFrameTimer);
			if (overlayFrameTimer !== null) window.clearTimeout(overlayFrameTimer);
			if (overlayTimer !== null) window.clearTimeout(overlayTimer);
			motionQuery.removeEventListener('change', updateMotionState);
			document.removeEventListener('visibilitychange', updateActiveState);
		};
	});

	$effect(() => {
		if (!providedBasePose || providedPosition) return;
		localPosition = getCompanionScenePosition(providedBasePose, new Date(), window.localStorage);
	});
</script>

<figure
	class={classes}
	data-companion={companionId}
	data-daypart={daypart}
	data-position={position?.id}
	style={positionStyle}
	aria-hidden={decorative ? 'true' : undefined}
	aria-label={decorative ? undefined : basePose?.alt}
	role={decorative ? undefined : 'img'}
>
	{#if isBear}
		<span class="bear-scene-fallback" data-pose={bearPose} aria-hidden="true">
			<svg viewBox="0 0 100 100" focusable="false" aria-hidden="true">
				<ellipse class="bear-body" cx="50" cy="66" rx="28" ry="24" />
				<circle class="bear-ear" cx="31" cy="38" r="11" />
				<circle class="bear-ear" cx="69" cy="38" r="11" />
				<circle class="bear-head" cx="50" cy="48" r="25" />
				<ellipse class="bear-muzzle" cx="50" cy="58" rx="13" ry="9" />
				<circle class="bear-eye" cx="41" cy="47" r="2.5" />
				<circle class="bear-eye" cx="59" cy="47" r="2.5" />
				<path class="bear-mouth" d="M45 62 C48 65 52 65 55 62" />
			</svg>
		</span>
	{:else if baseFrame}
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

	/* TODO: ersätt med frilagda björnposer (stående, sittande och sovande) när de finns. */
	.bear-scene-fallback {
		position: absolute;
		inset: 0;
		display: block;
		filter: var(--companion-grade) drop-shadow(0 12px 14px rgb(43 33 20 / 0.1));
		-webkit-mask-image: radial-gradient(ellipse at 50% 56%, #000 70%, rgb(0 0 0 / 0.9) 88%, transparent 100%);
		mask-image: radial-gradient(ellipse at 50% 56%, #000 70%, rgb(0 0 0 / 0.9) 88%, transparent 100%);
	}

	.bear-scene-fallback svg { width: 100%; height: 100%; display: block; }
	.bear-body, .bear-head, .bear-ear { fill: #836454; }
	.bear-ear { fill: #6d4f43; }
	.bear-muzzle { fill: #c7a98e; }
	.bear-eye { fill: #2e2824; }
	.bear-mouth { fill: none; stroke: #4a342d; stroke-width: 2.4; stroke-linecap: round; }
	.bear-scene-fallback[data-pose='sitting'] .bear-body { transform: scale(0.88, 1.04); transform-origin: 50px 70px; }
	.bear-scene-fallback[data-pose='sleeping'] { transform: translateY(13%) scale(1.12, 0.66); transform-origin: 50% 100%; }

	.companion-pose[data-daypart='evening'] .companion-pose-image {
		filter: saturate(0.72) contrast(0.9) brightness(0.9) sepia(0.13)
			drop-shadow(0 16px 18px rgb(24 25 44 / 0.2));
	}

	.companion-pose[data-daypart='night'] .companion-pose-image {
		filter: saturate(0.62) contrast(0.88) brightness(0.78) sepia(0.1)
			drop-shadow(0 16px 18px rgb(9 13 27 / 0.28));
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
