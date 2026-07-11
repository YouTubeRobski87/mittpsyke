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
		position: providedPosition = null
	}: {
		class?: string;
		decorative?: boolean;
		basePose?: CompanionPose | null;
		position?: CompanionScenePosition | null;
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
					`--shadow-opacity: ${position.shadow.opacity}`
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

		const nextOverlay = getCompanionOverlayPose(daypart);
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
	data-daypart={daypart}
	data-position={position?.id}
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
	}

	.companion-pose:global(.hero-companion-pose) {
		position: absolute;
		left: var(--companion-x, 78%);
		top: var(--companion-y, 82%);
		z-index: var(--companion-z, 2);
		width: min(39%, 310px);
		transform: translate3d(-50%, -100%, 0) scale(var(--companion-scale, 1));
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
		left: 17%;
		bottom: 9%;
		width: var(--shadow-width, 68%);
		height: var(--shadow-height, 8%);
		border-radius: 50%;
		background: rgb(43 39 27 / var(--shadow-opacity, 0.22));
		filter: blur(var(--shadow-blur, 8px));
		transform: rotate(-4deg);
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
			radial-gradient(34% 18% at 26% 78%, rgb(74 78 52 / 0.42), transparent 70%),
			radial-gradient(26% 14% at 68% 84%, rgb(96 93 66 / 0.28), transparent 72%),
			linear-gradient(82deg, transparent 0 14%, rgb(86 103 61 / 0.48) 15% 16%, transparent 17%),
			linear-gradient(98deg, transparent 0 30%, rgb(65 85 51 / 0.4) 31% 32%, transparent 33%),
			linear-gradient(76deg, transparent 0 45%, rgb(91 109 65 / 0.42) 46% 47%, transparent 48%),
			linear-gradient(104deg, transparent 0 58%, rgb(67 86 52 / 0.34) 59% 60%, transparent 61%);
		filter: blur(0.1px);
		opacity: 0.74;
		transform: rotate(-3deg);
		pointer-events: none;
	}

	.companion-pose-image {
		position: absolute;
		inset: 0;
		z-index: 1;
		width: 100%;
		height: 100%;
		object-fit: contain;
		filter: drop-shadow(0 24px 28px rgb(43 33 20 / 0.2));
		transform-origin: 50% 78%;
	}

	.companion-pose-base {
		animation: companionPoseBreath 7s ease-in-out infinite;
	}

	.companion-pose-overlay {
		animation: companionPoseOverlay 420ms ease both;
	}

	.companion-pose[data-daypart='evening'] .companion-pose-image {
		filter: drop-shadow(0 24px 28px rgb(24 25 44 / 0.24)) saturate(0.95) brightness(0.96);
	}

	.companion-pose[data-daypart='night'] .companion-pose-image {
		filter: drop-shadow(0 24px 28px rgb(9 13 27 / 0.34)) saturate(0.82) brightness(0.84);
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
