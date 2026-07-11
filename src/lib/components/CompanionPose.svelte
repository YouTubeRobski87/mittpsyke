<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getCompanionBasePose,
		getCompanionOverlayPose,
		getCompanionPoseDaypart,
		getMsUntilNextCompanionPoseCheck
	} from '$lib/companionPoseState';
	import type { CompanionPose, CompanionPoseDaypart } from '$lib/companionPoseManifest';

	let {
		class: className = '',
		decorative = false
	}: {
		class?: string;
		decorative?: boolean;
	} = $props();

	let basePose = $state<CompanionPose | null>(null);
	let overlayPose = $state<CompanionPose | null>(null);
	let daypart = $state<CompanionPoseDaypart>('day');
	let baseFrameIndex = $state(0);
	let overlayFrameIndex = $state(0);

	const classes = $derived(`companion-pose ${className}`.trim());
	const baseFrame = $derived(
		basePose ? basePose.frames[baseFrameIndex % basePose.frames.length] : null
	);
	const overlayFrame = $derived(
		overlayPose ? overlayPose.frames[overlayFrameIndex % overlayPose.frames.length] : null
	);

	function refreshBasePose() {
		const now = new Date();
		daypart = getCompanionPoseDaypart(now);
		basePose = getCompanionBasePose(now, window.localStorage);
		baseFrameIndex = 0;
	}

	function maybePlayOverlay() {
		if (overlayPose) return;

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

		const scheduleBaseCheck = () => {
			baseTimer = window.setTimeout(() => {
				refreshBasePose();
				scheduleBaseCheck();
			}, getMsUntilNextCompanionPoseCheck(new Date(), window.localStorage));
		};

		scheduleBaseCheck();

		const baseFrameTimer = window.setInterval(() => {
			if (!basePose || basePose.frames.length <= 1) return;
			baseFrameIndex += 1;
		}, basePose?.frameMs ?? 700);

		const overlayFrameTimer = window.setInterval(() => {
			if (!overlayPose || overlayPose.frames.length <= 1) return;
			overlayFrameIndex += 1;
		}, overlayPose?.frameMs ?? 700);

		const firstOverlayDelay = window.setTimeout(maybePlayOverlay, 15_000 + Math.random() * 40_000);
		const overlayTimer = window.setInterval(maybePlayOverlay, 90_000);

		return () => {
			if (baseTimer !== null) window.clearTimeout(baseTimer);
			window.clearInterval(baseFrameTimer);
			window.clearInterval(overlayFrameTimer);
			window.clearTimeout(firstOverlayDelay);
			window.clearInterval(overlayTimer);
		};
	});
</script>

<figure
	class={classes}
	data-daypart={daypart}
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
		right: clamp(18px, 4.2vw, 64px);
		bottom: clamp(-10px, -0.5vw, -2px);
		z-index: 2;
		width: min(39%, 310px);
	}

	.companion-pose:global(.hero-companion-pose)::before {
		content: '';
		position: absolute;
		z-index: -1;
		left: 17%;
		bottom: 9%;
		width: 68%;
		height: 8%;
		border-radius: 50%;
		background: rgb(43 39 27 / 0.22);
		filter: blur(8px);
		transform: rotate(-4deg);
		pointer-events: none;
	}

	.companion-pose-image {
		position: absolute;
		inset: 0;
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
		.companion-pose-image {
			animation: none !important;
			transform: none !important;
		}
	}

	@media (max-width: 620px) {
		.companion-pose:global(.hero-companion-pose) {
			right: 10px;
			bottom: -4px;
			width: min(50%, 220px);
		}
	}
</style>
