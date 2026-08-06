<script lang="ts">
	import { onMount } from 'svelte';
	import {
		getCompanionVisitorAsset,
		getCompanionVisitorPosition,
		getCompanionVisitorState,
		canShowCompanionVisitorAtViewport,
		type CompanionVisitorId
	} from '$lib/companionVisitor';

	let {
		mainCompanionId,
		isSleeping = false,
		sceneAllowsVisitor = true,
		scene,
		class: className = ''
	}: {
		mainCompanionId: string;
		isSleeping?: boolean;
		sceneAllowsVisitor?: boolean;
		scene: 'dashboard' | 'progress';
		class?: string;
	} = $props();

	let visitorId = $state<CompanionVisitorId | null>(null);
	let hasFailed = $state(false);
	let viewportAllowsVisitor = $state(false);
	const asset = $derived(getCompanionVisitorAsset(visitorId));
	const position = $derived(getCompanionVisitorPosition(scene));

	function refreshVisitor() {
		const state = getCompanionVisitorState(
			{ mainCompanionId, isSleeping, sceneAllowsVisitor: sceneAllowsVisitor && viewportAllowsVisitor },
			Date.now(),
			window.sessionStorage
		);
		visitorId = state.visitorId;
		hasFailed = false;
	}

	onMount(() => {
		const updateViewport = () => {
			viewportAllowsVisitor = canShowCompanionVisitorAtViewport(window.innerWidth);
			refreshVisitor();
		};

		updateViewport();
		window.addEventListener('resize', updateViewport);
		refreshVisitor();
		const timer = window.setInterval(refreshVisitor, 60 * 1000);
		return () => {
			window.removeEventListener('resize', updateViewport);
			window.clearInterval(timer);
		};
	});

	$effect(() => {
		void mainCompanionId;
		void isSleeping;
		void sceneAllowsVisitor;
		void viewportAllowsVisitor;
		if (typeof window !== 'undefined') refreshVisitor();
	});
</script>

{#if visitorId && asset && !hasFailed}
	<figure
		class={`companion-visitor ${className}`.trim()}
		data-visitor={visitorId}
		data-scene={scene}
		style={`--visitor-x: ${position.x}%; --visitor-y: ${position.y}%; --visitor-z: ${position.zIndex};`}
		aria-hidden="true"
	>
		<img class="companion-visitor-image" src={asset} alt="" decoding="async" onerror={() => (hasFailed = true)} />
	</figure>
{/if}

<style>
	.companion-visitor {
		position: absolute;
		left: var(--visitor-x);
		top: var(--visitor-y);
		z-index: var(--visitor-z);
		width: min(18%, 142px);
		aspect-ratio: 1;
		margin: 0;
		transform: translate3d(-50%, -100%, 0);
		transform-origin: 50% 100%;
		pointer-events: none;
		overflow: clip;
	}

	.companion-visitor-image {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: contain;
		object-position: center bottom;
		filter: var(--visitor-grade, saturate(0.7) contrast(0.88) brightness(0.92) sepia(0.12)) drop-shadow(0 5px 6px rgb(37 31 20 / 0.1));
	}

	:global(.companion-media[data-time='evening']) .companion-visitor-image {
		filter: saturate(0.64) contrast(0.86) brightness(0.82) sepia(0.16) drop-shadow(0 5px 6px rgb(37 31 20 / 0.12));
	}

	:global(.companion-media[data-time='night']) .companion-visitor-image {
		filter: saturate(0.5) contrast(0.82) brightness(0.68) sepia(0.14) drop-shadow(0 5px 6px rgb(37 31 20 / 0.12));
	}

	.companion-visitor:global(.progress-companion-visitor) {
		width: clamp(46px, 8%, 86px);
	}

	@media (max-width: 640px) {
		/* Två djur blir för trångt i den smala panoramavyn. Tillståndet ligger
		   kvar i sessionStorage utan att scenen skiftar eller får overflow. */
		.companion-visitor { display: none; }
	}
</style>
