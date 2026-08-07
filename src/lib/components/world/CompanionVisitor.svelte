<script lang="ts">
	import { onMount } from 'svelte';
	import { dev } from '$app/environment';
	import {
		clearCompanionVisitorState,
		getCompanionVisitorAsset,
		getCompanionVisitorPosition,
		getCompanionVisitorRenderDiagnostics,
		getCompanionVisitorState,
		getStoredCompanionVisitorState,
		canShowCompanionVisitorAtViewport,
		isCompanionVisitorDebugEnabled,
		startCompanionVisitorDebugVisit,
		type CompanionVisitorId,
		type CompanionVisitorState,
		type CompanionVisitorType
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
	let visitorType = $state<CompanionVisitorType | null>(null);
	let hasFailed = $state(false);
	let viewportAllowsVisitor = $state(false);
	let debugEnabled = $state(false);
	let debugForcedType = $state<CompanionVisitorType | null>(null);
	let debugCheckedAt = $state(Date.now());
	let debugVisitorState = $state<CompanionVisitorState>({
		visitorId: null,
		visitorType: null,
		startedAt: null,
		endsAt: null,
		nextEligibleAt: 0
	});
	let debugStoredVisitorState = $state<CompanionVisitorState>({
		visitorId: null,
		visitorType: null,
		startedAt: null,
		endsAt: null,
		nextEligibleAt: 0
	});
	const asset = $derived(getCompanionVisitorAsset(visitorId, visitorType));
	const position = $derived(getCompanionVisitorPosition(scene, visitorType ?? 'awake'));
	const effectiveSleeping = $derived(
		debugEnabled && debugForcedType ? debugForcedType === 'sleeping' : isSleeping
	);
	const debugDiagnostics = $derived(
		getCompanionVisitorRenderDiagnostics(
			{ mainCompanionId, isSleeping: effectiveSleeping, sceneAllowsVisitor },
			debugVisitorState,
			viewportAllowsVisitor,
			hasFailed,
			debugCheckedAt
		)
	);

	function refreshVisitor() {
		const state = getCompanionVisitorState(
			{
				mainCompanionId,
				isSleeping: effectiveSleeping,
				sceneAllowsVisitor: sceneAllowsVisitor && viewportAllowsVisitor
			},
			Date.now(),
			window.sessionStorage
		);
		visitorId = state.visitorId;
		visitorType = state.visitorType;
		debugVisitorState = state;
		if (debugEnabled) debugStoredVisitorState = getStoredCompanionVisitorState(window.sessionStorage);
		debugCheckedAt = Date.now();
		hasFailed = false;
	}

	function startDebugVisit(type: CompanionVisitorType) {
		if (!debugEnabled) return;
		debugForcedType = type;
		const state = startCompanionVisitorDebugVisit(mainCompanionId, type, Date.now(), window.sessionStorage);
		visitorId = state.visitorId;
		visitorType = state.visitorType;
		debugVisitorState = state;
		debugStoredVisitorState = state;
		debugCheckedAt = Date.now();
		hasFailed = false;
	}

	function clearDebugVisitorState() {
		if (!debugEnabled) return;
		clearCompanionVisitorState(window.sessionStorage);
		debugForcedType = null;
		visitorId = null;
		visitorType = null;
		debugVisitorState = {
			visitorId: null,
			visitorType: null,
			startedAt: null,
			endsAt: null,
			nextEligibleAt: 0
		};
		debugStoredVisitorState = debugVisitorState;
		debugCheckedAt = Date.now();
		hasFailed = false;
	}

	function formatTimestamp(value: number | null) {
		return value === null ? '-' : new Date(value).toLocaleTimeString('sv-SE');
	}

	onMount(() => {
		debugEnabled = isCompanionVisitorDebugEnabled(window.location.search, dev);
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
		void debugForcedType;
		if (typeof window !== 'undefined') refreshVisitor();
	});
</script>

{#if visitorId && visitorType && asset && !hasFailed}
	<figure
		class={`companion-visitor ${className}`.trim()}
		data-visitor={visitorId}
		data-visitor-type={visitorType}
		data-scene={scene}
		style={`--visitor-x: ${position.x}%; --visitor-y: ${position.y}%; --visitor-z: ${position.zIndex}; --visitor-scale: ${position.scale};`}
		aria-hidden="true"
	>
		<img class="companion-visitor-image" src={asset} alt="" decoding="async" onerror={() => (hasFailed = true)} />
	</figure>
{/if}

{#if debugEnabled}
	<aside class="companion-visitor-debug" aria-label="Companion visitor debug">
		<strong>Visitor debug</strong>
		<dl>
			<div><dt>state</dt><dd>{debugStoredVisitorState.visitorId ? 'active' : debugStoredVisitorState.nextEligibleAt > debugCheckedAt ? 'cooldown' : 'empty'}</dd></div>
			<div><dt>visitor type</dt><dd>{debugStoredVisitorState.visitorType ?? '-'}</dd></div>
			<div><dt>visitor id</dt><dd>{debugStoredVisitorState.visitorId ?? '-'}</dd></div>
			<div><dt>startedAt</dt><dd>{formatTimestamp(debugStoredVisitorState.startedAt)}</dd></div>
			<div><dt>endsAt</dt><dd>{formatTimestamp(debugStoredVisitorState.endsAt)}</dd></div>
			<div><dt>nextEligibleAt</dt><dd>{formatTimestamp(debugStoredVisitorState.nextEligibleAt || null)}</dd></div>
			<div><dt>sleep status</dt><dd>{isSleeping ? 'true' : 'false'}{debugForcedType ? ` (forced ${debugForcedType})` : ''}</dd></div>
			<div><dt>scene eligible</dt><dd>{sceneAllowsVisitor ? 'true' : 'false'}</dd></div>
			<div><dt>viewport eligible</dt><dd>{viewportAllowsVisitor ? 'true' : 'false'}</dd></div>
			<div><dt>asset available</dt><dd>{debugDiagnostics.assetAvailable ? 'true' : 'false'}</dd></div>
			<div><dt>render decision</dt><dd>{debugDiagnostics.shouldRender ? 'render' : 'hide'}</dd></div>
			<div><dt>blocking reason</dt><dd>{debugDiagnostics.blockingReason}</dd></div>
		</dl>
		<div class="companion-visitor-debug-actions">
			<button type="button" onclick={() => startDebugVisit('awake')}>Starta testbesök</button>
			<button type="button" onclick={() => startDebugVisit('sleeping')}>Starta sovbesök</button>
			<button type="button" onclick={clearDebugVisitorState}>Rensa visitor state</button>
		</div>
	</aside>
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
		transform: translate3d(-50%, -100%, 0) scale(var(--visitor-scale));
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

	.companion-visitor[data-visitor-type='sleeping'] {
		width: min(16%, 124px);
	}

	.companion-visitor[data-visitor-type='sleeping']:global(.progress-companion-visitor) {
		width: clamp(42px, 7%, 76px);
	}

	.companion-visitor-debug {
		position: absolute;
		top: 0.5rem;
		left: 0.5rem;
		z-index: 20;
		width: min(18rem, calc(100% - 1rem));
		padding: 0.6rem;
		border: 1px solid rgb(255 255 255 / 0.42);
		border-radius: 0.5rem;
		background: rgb(15 23 42 / 0.92);
		box-shadow: 0 5px 16px rgb(0 0 0 / 0.24);
		color: #fff;
		font: 0.72rem/1.3 system-ui, sans-serif;
	}

	.companion-visitor-debug dl {
		margin: 0.45rem 0;
	}

	.companion-visitor-debug dl div {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 0.55rem;
	}

	.companion-visitor-debug dt,
	.companion-visitor-debug dd {
		margin: 0;
	}

	.companion-visitor-debug dd {
		max-width: 10rem;
		overflow-wrap: anywhere;
		text-align: right;
	}

	.companion-visitor-debug-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}

	.companion-visitor-debug button {
		border: 0;
		border-radius: 0.3rem;
		padding: 0.3rem 0.45rem;
		background: #eaf6dd;
		color: #1f3526;
		font: inherit;
		font-weight: 700;
		cursor: pointer;
	}

	@media (max-width: 640px) {
		/* Två djur blir för trångt i den smala panoramavyn. Tillståndet ligger
		   kvar i sessionStorage utan att scenen skiftar eller får overflow. */
		.companion-visitor { display: none; }
	}
</style>
