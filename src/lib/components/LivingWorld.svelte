<script lang="ts">
	import { onMount } from 'svelte';
	import { getLivingWorldScene, type LivingWorldEffect, type LivingWorldScene } from '$lib/worldScene';

	let {
		scene = getLivingWorldScene(),
		class: className = ''
	}: {
		scene?: LivingWorldScene;
		class?: string;
	} = $props();

	let isActive = $state(true);

	const classes = $derived(`living-world ${className}`.trim());
	const effects = $derived(
		scene.effects.filter((effect) => effect.enabled && scene.features[effect.kind])
	);

	function effectStyle(effect: LivingWorldEffect) {
		const declarations = [
			effect.x !== undefined ? `--x: ${effect.x}%` : '',
			effect.y !== undefined ? `--y: ${effect.y}%` : '',
			effect.width !== undefined ? `--w: ${effect.width}%` : '',
			effect.height !== undefined ? `--h: ${effect.height}%` : '',
			effect.durationMs !== undefined ? `--duration: ${effect.durationMs}ms` : '',
			effect.delayMs !== undefined ? `--delay: ${effect.delayMs}ms` : '',
			effect.opacity !== undefined ? `--opacity: ${effect.opacity}` : '',
			effect.scale !== undefined ? `--scale: ${effect.scale}` : ''
		].filter(Boolean);

		return declarations.join('; ');
	}

	onMount(() => {
		const updateActiveState = () => {
			isActive = document.visibilityState === 'visible';
		};

		updateActiveState();
		document.addEventListener('visibilitychange', updateActiveState);

		return () => {
			document.removeEventListener('visibilitychange', updateActiveState);
		};
	});
</script>

<div
	class={classes}
	class:is-paused={!isActive}
	data-season={scene.season}
	data-time={scene.timeOfDay}
	aria-hidden="true"
>
	{#each effects as effect (effect.id)}
		<span
			class={`world-effect world-${effect.kind} ${effect.className ?? ''}`.trim()}
			style={effectStyle(effect)}
		></span>
	{/each}
</div>

<style>
	.living-world,
	.world-effect {
		position: absolute;
		pointer-events: none;
	}

	.living-world {
		inset: 0;
		z-index: 1;
		overflow: hidden;
		contain: layout paint style;
		isolation: isolate;
		mix-blend-mode: screen;
	}

	.world-effect {
		left: var(--x, 0);
		top: var(--y, 0);
		width: var(--w, auto);
		height: var(--h, auto);
		opacity: 0;
		will-change: transform, opacity;
	}

	.is-paused .world-effect {
		animation-play-state: paused !important;
	}

	.world-light {
		inset: -18% auto auto -10%;
		width: 58%;
		height: 70%;
		border-radius: 50%;
		background: radial-gradient(
			circle,
			rgba(255, 243, 206, 0.24) 0%,
			rgba(255, 243, 206, 0.08) 44%,
			transparent 72%
		);
		opacity: var(--opacity, 0.42);
		animation: worldLightShift var(--duration, 52000ms) ease-in-out infinite alternate;
	}

	.living-world[data-time='night'] .world-light {
		background: radial-gradient(
			circle,
			rgba(171, 204, 255, 0.12) 0%,
			rgba(171, 204, 255, 0.05) 46%,
			transparent 74%
		);
	}

	.world-cloud {
		border-radius: 999px;
		background:
			radial-gradient(ellipse at 22% 58%, rgba(255, 252, 238, 0.9), transparent 58%),
			radial-gradient(ellipse at 54% 48%, rgba(255, 252, 238, 0.8), transparent 62%),
			radial-gradient(ellipse at 78% 60%, rgba(255, 252, 238, 0.64), transparent 58%);
		filter: blur(7px);
		opacity: 0;
		transform: translate3d(-8%, 0, 0) scale(var(--scale, 1));
		animation: cloudDrift var(--duration, 140000ms) linear var(--delay, 0ms) infinite;
	}

	.cloud-front {
		filter: blur(9px);
	}

	.world-mist {
		border-radius: 999px;
		background: linear-gradient(
			90deg,
			transparent,
			rgba(255, 251, 236, 0.34),
			rgba(226, 245, 255, 0.2),
			transparent
		);
		filter: blur(12px);
		mix-blend-mode: soft-light;
		animation: mistDrift var(--duration, 82000ms) ease-in-out var(--delay, 0ms) infinite;
	}

	.living-world[data-time='day'] .world-mist {
		filter: blur(14px);
	}

	.world-water {
		border-radius: 50%;
		border: 1px solid rgba(235, 248, 246, 0.42);
		background: radial-gradient(circle at center, rgba(255, 255, 255, 0.1), transparent 66%);
		filter: blur(0.25px);
		transform: translate3d(-50%, -50%, 0) scale(0.72);
		animation: waterRing var(--duration, 52000ms) ease-out var(--delay, 0ms) infinite;
	}

	.world-foliage {
		transform-origin: 50% 100%;
		background:
			radial-gradient(ellipse at 24% 88%, rgba(111, 148, 94, 0.34), transparent 46%),
			radial-gradient(ellipse at 60% 82%, rgba(151, 177, 102, 0.2), transparent 52%),
			linear-gradient(180deg, transparent 14%, rgba(89, 131, 83, 0.13), transparent 76%);
		filter: blur(0.5px);
		opacity: var(--opacity, 0.14);
		animation: foliageBreathe var(--duration, 36000ms) ease-in-out var(--delay, 0ms) infinite alternate;
	}

	.canopy-right {
		transform-origin: 70% 0%;
		background:
			radial-gradient(ellipse at 40% 15%, rgba(133, 154, 80, 0.2), transparent 60%),
			radial-gradient(ellipse at 72% 35%, rgba(87, 126, 74, 0.16), transparent 62%);
		filter: blur(1px);
	}

	.world-bird {
		opacity: 0;
		transform: translate3d(0, 0, 0) scale(var(--scale, 0.75));
		animation: birdGlide var(--duration, 130000ms) ease-in-out var(--delay, 0ms) infinite;
	}

	.world-bird::before,
	.world-bird::after {
		content: '';
		position: absolute;
		top: 34%;
		width: 50%;
		height: 42%;
		border-top: 1.5px solid rgba(36, 49, 45, 0.42);
		border-radius: 999px 999px 0 0;
	}

	.world-bird::before {
		left: 0;
		transform: rotate(-13deg);
	}

	.world-bird::after {
		right: 0;
		transform: rotate(13deg);
	}

	.world-butterfly {
		border-radius: 50%;
		transform: translate3d(0, 0, 0);
		animation: butterflyPass var(--duration, 170000ms) ease-in-out var(--delay, 0ms) infinite;
	}

	.world-butterfly::before,
	.world-butterfly::after {
		content: '';
		position: absolute;
		top: 18%;
		width: 45%;
		height: 58%;
		border-radius: 70% 30% 70% 30%;
		background: rgba(245, 196, 135, 0.42);
		filter: blur(0.2px);
	}

	.world-butterfly::before {
		left: 0;
		transform-origin: 100% 60%;
		animation: butterflyWing 980ms ease-in-out infinite alternate;
	}

	.world-butterfly::after {
		right: 0;
		transform: scaleX(-1);
		transform-origin: 0 60%;
		animation: butterflyWing 980ms ease-in-out 160ms infinite alternate;
	}

	.world-leaf {
		border-radius: 70% 30% 70% 30%;
		background: linear-gradient(135deg, rgba(157, 119, 62, 0.56), rgba(126, 145, 80, 0.28));
		filter: blur(0.15px);
		transform: translate3d(0, 0, 0) rotate(0deg);
		animation: leafFall var(--duration, 110000ms) linear var(--delay, 0ms) infinite;
	}

	@keyframes worldLightShift {
		from {
			transform: translate3d(0, 0, 0) scale(1);
		}
		to {
			transform: translate3d(2.2%, 1.6%, 0) scale(1.035);
		}
	}

	@keyframes cloudDrift {
		0%,
		8%,
		100% {
			opacity: 0;
			transform: translate3d(-10%, 0, 0) scale(var(--scale, 1));
		}
		18%,
		72% {
			opacity: var(--opacity, 0.1);
		}
		86% {
			opacity: 0;
			transform: translate3d(18%, -3%, 0) scale(var(--scale, 1));
		}
	}

	@keyframes mistDrift {
		0%,
		100% {
			opacity: calc(var(--opacity, 0.14) * 0.34);
			transform: translate3d(-4%, 0, 0) scaleX(0.94);
		}
		48% {
			opacity: var(--opacity, 0.14);
		}
		74% {
			opacity: calc(var(--opacity, 0.14) * 0.62);
			transform: translate3d(5%, -4%, 0) scaleX(1.08);
		}
	}

	@keyframes waterRing {
		0%,
		72%,
		100% {
			opacity: 0;
			transform: translate3d(-50%, -50%, 0) scale(0.68);
		}
		77% {
			opacity: var(--opacity, 0.16);
		}
		91% {
			opacity: calc(var(--opacity, 0.16) * 0.35);
			transform: translate3d(-50%, -50%, 0) scale(1.22);
		}
	}

	@keyframes foliageBreathe {
		from {
			transform: skewX(0deg) translate3d(0, 0, 0);
		}
		to {
			transform: skewX(1.25deg) translate3d(0, -0.8%, 0);
		}
	}

	@keyframes birdGlide {
		0%,
		42%,
		100% {
			opacity: 0;
			transform: translate3d(0, 0, 0) scale(var(--scale, 0.75));
		}
		48% {
			opacity: var(--opacity, 0.2);
		}
		76% {
			opacity: calc(var(--opacity, 0.2) * 0.7);
			transform: translate3d(92vw, -2.4rem, 0) scale(var(--scale, 0.75));
		}
		86% {
			opacity: 0;
			transform: translate3d(108vw, -3rem, 0) scale(var(--scale, 0.75));
		}
	}

	@keyframes butterflyPass {
		0%,
		56%,
		100% {
			opacity: 0;
			transform: translate3d(0, 0, 0) rotate(-5deg);
		}
		61% {
			opacity: var(--opacity, 0.26);
		}
		74% {
			transform: translate3d(18vw, -4.4rem, 0) rotate(8deg);
			opacity: calc(var(--opacity, 0.26) * 0.78);
		}
		82% {
			opacity: 0;
			transform: translate3d(26vw, -3.2rem, 0) rotate(-3deg);
		}
	}

	@keyframes butterflyWing {
		from {
			transform: rotateY(0deg) rotate(8deg);
		}
		to {
			transform: rotateY(54deg) rotate(-6deg);
		}
	}

	@keyframes leafFall {
		0%,
		58%,
		100% {
			opacity: 0;
			transform: translate3d(0, 0, 0) rotate(0deg);
		}
		63% {
			opacity: var(--opacity, 0.22);
		}
		82% {
			opacity: calc(var(--opacity, 0.22) * 0.58);
			transform: translate3d(-2.5rem, 6.8rem, 0) rotate(120deg);
		}
		91% {
			opacity: 0;
			transform: translate3d(-3.3rem, 9.2rem, 0) rotate(180deg);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.world-effect {
			animation: none !important;
			transform: none !important;
		}

		.world-water,
		.world-bird,
		.world-butterfly,
		.world-leaf {
			opacity: 0 !important;
		}

		.world-light,
		.world-mist,
		.world-cloud,
		.world-foliage {
			opacity: calc(var(--opacity, 0.12) * 0.5);
		}
	}
</style>
