<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';
	import CompanionPose from '$lib/components/CompanionPose.svelte';
	import EveningCheckinFlow from '$lib/components/evening/EveningCheckinFlow.svelte';
	import AmbientWorld from '$lib/components/world/AmbientWorld.svelte';
	import { DASHBOARD_CABIN_COMPANION_PLACEMENTS } from '$lib/companionPoseManifest';
	import {
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		getProgressCompanionDayState,
		type ProgressCompanionDayState,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';
	import { getLivingWorldScene, type LivingWorldScene } from '$lib/worldScene';

	const CABIN_IMAGE = '/images/scenes/dashboard-cabin-close.webp';
	const CABIN_SRCSET = [
		'/images/scenes/dashboard-cabin-close-800.webp 800w',
		'/images/scenes/dashboard-cabin-close-1200.webp 1200w',
		'/images/scenes/dashboard-cabin-close.webp 1915w'
	].join(', ');

	let { data } = $props<{ data: { progressCompanion: ProgressCompanionSelection | null } }>();
	let sceneDate = $state(new Date());
	let completionSignal = $state(0);
	let dayState = $state<ProgressCompanionDayState>(getProgressCompanionDayState());

	const companionId = $derived(
		getProgressCompanionArtId(getProgressCompanionAnimal(data.progressCompanion)?.id) === 'bear'
			? 'bear'
			: getProgressCompanionArtId(getProgressCompanionAnimal(data.progressCompanion)?.id) === 'wolf'
				? 'wolf'
				: 'fox'
	) as 'fox' | 'bear' | 'wolf';
	const companionPlacement = $derived(DASHBOARD_CABIN_COMPANION_PLACEMENTS[companionId]);
	const worldScene = $derived<LivingWorldScene>(getLivingWorldScene({ date: sceneDate }));

	function handleComplete() {
		completionSignal += 1;
	}

	onMount(() => {
		const timer = window.setInterval(() => {
			sceneDate = new Date();
			dayState = getProgressCompanionDayState(sceneDate);
		}, 60_000);
		return () => window.clearInterval(timer);
	});
</script>

<SEO canonical="https://www.mittpsyke.se/dashboard/kvallsstugan" />

<svelte:head>
	<title>Kvällslugn – MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="evening-page" aria-labelledby="evening-title">
	<a class="evening-back" href="/dashboard">← Till Mitt Hem</a>
	<header class="evening-header">
		<p>Kvällsstugan</p>
		<h1 id="evening-title">Kvällslugn</h1>
		<span>En stund där dagen får landa.</span>
	</header>

	<section class="evening-scene" data-time={dayState} aria-label="Kvällsstugan vid vattnet">
		<img
			class="evening-scene-image"
			srcset={CABIN_SRCSET}
			sizes="(max-width: 680px) calc(100vw - 32px), 720px"
			src={CABIN_IMAGE}
			alt=""
			aria-hidden="true"
			width="1915"
			height="821"
			decoding="async"
		/>
		<AmbientWorld scene={worldScene} class="evening-ambient" />
		<CompanionPose
			class="evening-companion"
			companionId={companionId}
			placement={companionPlacement}
			scene="dashboard"
			greetingReaction={completionSignal}
		/>
	</section>

	<div class="evening-flow-wrap">
		<EveningCheckinFlow oncomplete={handleComplete} />
	</div>

	<details class="evening-help">
		<summary>Behöver du akut stöd?</summary>
		<p>Vid akut fara, ring <a href="tel:112">112</a>. För vårdråd, ring <a href="https://www.1177.se" rel="noopener noreferrer" target="_blank">1177</a>. Du hittar fler stödvägar på <a href="https://stodlinjer.se" rel="noopener noreferrer" target="_blank">stodlinjer.se</a>.</p>
	</details>
</main>

<style>
	.evening-page {
		width: min(100% - 2rem, 44rem);
		margin: 0 auto;
		padding: clamp(0.9rem, 3vw, 1.6rem) 0 2.8rem;
		font-family: var(--font-body);
	}

	.evening-back {
		display: inline-flex;
		min-height: 44px;
		align-items: center;
		color: hsl(var(--foreground));
		font-size: 0.9rem;
		font-weight: 650;
		text-decoration: none;
	}
	.evening-back:hover, .evening-back:focus-visible { text-decoration: underline; text-underline-offset: 0.18em; }
	.evening-back:focus-visible { outline: 2px solid hsl(var(--primary)); outline-offset: 3px; }

	.evening-header { margin: 1rem 0 1.15rem; }
	.evening-header p {
		margin: 0 0 0.2rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}
	.evening-header h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(2rem, 7vw, 2.7rem);
		line-height: 1.04;
		letter-spacing: -0.04em;
	}
	.evening-header span { display: block; margin-top: 0.55rem; color: hsl(var(--muted-foreground)); line-height: 1.5; }

	.evening-scene {
		position: relative;
		height: clamp(190px, 42vw, 280px);
		overflow: hidden;
		border: 1px solid rgb(92 72 47 / 0.26);
		border-radius: 1.25rem;
		background: #172130;
	}
	.evening-scene::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 2;
		background: linear-gradient(90deg, rgb(9 14 22 / 0.1), rgb(9 14 22 / 0.42));
		pointer-events: none;
	}
	.evening-scene-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 10% 62%; }
	.evening-scene[data-time='night'] .evening-scene-image { filter: brightness(0.78) saturate(0.76); }
	.evening-scene[data-time='evening'] .evening-scene-image { filter: brightness(0.9) saturate(0.84); }
	.evening-scene :global(.evening-ambient) { z-index: 1; }
	.evening-scene :global(.evening-companion) { z-index: 3; width: min(32%, 190px); }
	.evening-flow-wrap { margin-top: -1.2rem; position: relative; z-index: 4; }
	.evening-help { margin: 1.1rem 0 0; color: hsl(var(--muted-foreground)); font-size: 0.82rem; line-height: 1.55; }
	.evening-help summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-weight: 650; }
	.evening-help p { margin: 0.2rem 0 0; }
	.evening-help a { color: inherit; text-underline-offset: 0.18em; }

	@media (max-width: 640px) {
		.evening-page { width: min(100% - 1.25rem, 44rem); padding-top: 0.45rem; }
		.evening-scene { height: clamp(180px, 52vw, 240px); border-radius: 1rem; }
		.evening-scene-image { object-position: 3% 60%; }
		.evening-scene :global(.evening-companion) { width: min(38%, 165px); }
	}

	@media (prefers-reduced-motion: reduce) {
		.evening-scene :global(.living-world) { display: none; }
	}
</style>
