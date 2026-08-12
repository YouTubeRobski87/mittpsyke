<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';
	import CompanionPose from '$lib/components/CompanionPose.svelte';
	import EveningCheckinFlow from '$lib/components/evening/EveningCheckinFlow.svelte';
	import AmbientWorld from '$lib/components/world/AmbientWorld.svelte';
	import {
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		getProgressCompanionDayState,
		type ProgressCompanionDayState,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';
	import { getLivingWorldScene, type LivingWorldScene } from '$lib/worldScene';

	const CABIN_IMAGE = '/images/scenes/cabin-interior-evening-v1.webp';
	const CABIN_SRCSET = [
		'/images/scenes/cabin-interior-evening-v1-800.webp 800w',
		'/images/scenes/cabin-interior-evening-v1-1200.webp 1200w',
		'/images/scenes/cabin-interior-evening-v1.webp 1672w'
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
	const worldScene = $derived<LivingWorldScene>(
		getLivingWorldScene({
			date: sceneDate,
			features: {
				water: false,
				foliage: false,
				bird: false,
				butterfly: false,
				leaf: false,
				cloud: false,
				drift: false
			}
		})
	);

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
		<p>KVÄLLSSTUGAN</p>
		<h1 id="evening-title">Kvällslugn</h1>
		<span>En stund där dagen får landa.</span>
	</header>

	<div class="evening-experience">
		<div class="evening-scene-column">
		<section class="evening-scene" data-time={dayState} aria-label="Inne i Kvällsstugan, vid vattnet">
			<img
				class="evening-scene-image"
				srcset={CABIN_SRCSET}
				sizes="(max-width: 899px) calc(100vw - 20px), 860px"
				src={CABIN_IMAGE}
				alt=""
				aria-hidden="true"
				width="1672"
				height="941"
				decoding="async"
			/>
			<div class="cabin-window-view" aria-hidden="true">
				<AmbientWorld scene={worldScene} class="evening-ambient" />
			</div>
			<CompanionPose
				class="evening-companion interior-companion"
				companionId={companionId}
				scene="dashboard"
				greetingReaction={completionSignal}
			/>
		</section>

			<section class="evening-reassurance" aria-labelledby="evening-reassurance-title">
				<h2 id="evening-reassurance-title">Du är på en trygg plats</h2>
				<p>Här inne får du stanna upp, andas och lyssna in hur du har det just nu.</p>
				<p>Det finns inget rätt eller fel – bara du och en stund av lugn.</p>
			</section>
		</div>

		<div class="evening-flow-column">
			<div class="evening-flow-wrap">
				<EveningCheckinFlow oncomplete={handleComplete} />
			</div>
			<p class="evening-privacy">
				Dina svar sparas bara om du väljer att spara dem.
				<a href="/integritet">Läs mer om integritet</a>
			</p>
		</div>
	</div>

	<details class="evening-help">
		<summary>Behöver du akut stöd?</summary>
		<p>Vid akut fara, ring <a href="tel:112">112</a>. För vårdråd, ring <a href="https://www.1177.se" rel="noopener noreferrer" target="_blank">1177</a>. Du hittar fler stödvägar på <a href="https://stodlinjer.se" rel="noopener noreferrer" target="_blank">stodlinjer.se</a>.</p>
	</details>
</main>

<style>
	.evening-page {
		width: min(100% - 2rem, 92rem);
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
		aspect-ratio: 16 / 9;
		min-height: 220px;
		overflow: hidden;
		border: 1px solid rgb(92 72 47 / 0.26);
		border-radius: 1.25rem;
		background: #17110e;
	}
	.evening-scene::before {
		content: '';
		position: absolute;
		z-index: 2;
		inset: 0;
		background: radial-gradient(circle at 79% 48%, rgb(255 193 112 / 0.2), transparent 23%);
		mix-blend-mode: screen;
		pointer-events: none;
		animation: cabin-lamp-flicker 8s ease-in-out infinite;
	}
	.evening-scene::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(90deg, rgb(9 14 22 / 0.08), rgb(13 9 7 / 0.26));
		pointer-events: none;
	}
	.evening-scene-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
	.cabin-window-view {
		position: absolute;
		z-index: 1;
		left: 3.5%;
		top: 4%;
		width: 57.5%;
		height: 49%;
		overflow: hidden;
	}
	.cabin-window-view :global(.evening-ambient) { inset: 0; opacity: 0.72; }
	.evening-scene :global(.interior-companion) {
		position: absolute;
		z-index: 3;
		left: 10%;
		bottom: 2%;
		width: min(26%, 250px);
		margin: 0;
	}
	.evening-scene :global(.interior-companion[data-companion='bear']) { left: 8%; bottom: 1%; width: min(30%, 280px); }
	.evening-scene :global(.interior-companion[data-companion='wolf']) { left: 9%; bottom: 3%; width: min(29%, 270px); }
	.evening-experience {
		display: grid;
		gap: 1rem;
	}
	.evening-scene-column,
	.evening-flow-column {
		display: grid;
		gap: 1rem;
		min-width: 0;
	}
	.evening-flow-wrap {
		position: relative;
		z-index: 4;
		width: min(100% - 1.5rem, 44rem);
		margin: 0 auto;
	}
	.evening-reassurance {
		padding: clamp(1rem, 2.4vw, 1.45rem);
		border: 1px solid rgb(237 222 194 / 0.12);
		border-radius: 1rem;
		background: linear-gradient(135deg, rgb(46 42 37 / 0.54), rgb(28 30 31 / 0.5));
		color: rgb(247 243 235 / 0.88);
	}
	.evening-reassurance h2 {
		margin: 0 0 0.55rem;
		font-family: var(--font-heading);
		font-size: 1.1rem;
	}
	.evening-reassurance p {
		margin: 0;
		font-size: 0.92rem;
		line-height: 1.55;
	}
	.evening-reassurance p + p { margin-top: 0.2rem; }
	.evening-privacy {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.82rem;
		line-height: 1.5;
	}
	.evening-privacy a {
		display: block;
		width: fit-content;
		margin-top: 0.1rem;
		color: #d6b46c;
		text-underline-offset: 0.18em;
	}
	.evening-privacy a:focus-visible {
		outline: 2px solid #f5c878;
		outline-offset: 3px;
	}
	.evening-help { margin: 1.1rem 0 0; color: hsl(var(--muted-foreground)); font-size: 0.82rem; line-height: 1.55; }
	.evening-help summary { min-height: 44px; display: flex; align-items: center; cursor: pointer; font-weight: 650; }
	.evening-help p { margin: 0.2rem 0 0; }
	.evening-help a { color: inherit; text-underline-offset: 0.18em; }

	@keyframes cabin-lamp-flicker {
		0%, 100% { opacity: 0.72; transform: scale(1); }
		38% { opacity: 0.82; transform: scale(1.008); }
		57% { opacity: 0.68; transform: scale(0.994); }
	}

	@media (max-width: 640px) {
		.evening-page { width: min(100% - 1.25rem, 44rem); padding-top: 0.45rem; }
		.evening-scene { min-height: 180px; border-radius: 1rem; }
		.evening-scene :global(.interior-companion) { left: 8%; bottom: 1%; width: min(32%, 175px); }
		.evening-scene :global(.interior-companion[data-companion='bear']) { left: 6%; bottom: 0; width: min(37%, 190px); }
		.evening-scene :global(.interior-companion[data-companion='wolf']) { left: 7%; bottom: 2%; width: min(35%, 185px); }
		.evening-flow-wrap { width: 100%; margin-top: 0; }
	}

	@media (min-width: 900px) {
		.evening-experience {
			grid-template-columns: minmax(0, 1.55fr) minmax(20rem, 0.9fr);
			align-items: start;
			gap: clamp(1.25rem, 3vw, 2rem);
		}
		.evening-flow-wrap {
			width: 100%;
			margin: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.evening-scene::before { animation: none; }
	}
</style>
