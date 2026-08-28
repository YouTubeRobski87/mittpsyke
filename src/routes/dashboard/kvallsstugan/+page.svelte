<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';
	import CompanionPose from '$lib/components/CompanionPose.svelte';
	import EveningCheckinFlow from '$lib/components/evening/EveningCheckinFlow.svelte';
	import AmbientWorld from '$lib/components/world/AmbientWorld.svelte';
	import WaterLayer from '$lib/components/world/WaterLayer.svelte';
	import {
		isEveningInteriorMemoryEligible,
		shouldIntroduceEveningInteriorBlanket,
		shouldIntroduceEveningInteriorRug,
		type EveningInteriorMemory
	} from '$lib/evening-interior-memory';
	import type { LivingWorldEffect } from '$lib/worldScene';
	import {
		getProgressCompanionAnimal,
		getProgressCompanionArtId,
		getWorldCompanionId,
		getProgressCompanionDayState,
		type ProgressCompanionDayState,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';
	import { getLivingWorldScene, type LivingWorldScene } from '$lib/worldScene';
	import { getEveningLampCssVariables } from '$lib/evening-lamp';
	import type { CompanionDailyState } from '$lib/companionDailyQuestion';
	import { getCompanionBond, getCompanionBondLevel } from '$lib/companionBond';

	// Kvällsstugan har en egen scenbild: personen är inbakad i soffan i samma
	// perspektiv som möbeln. Därmed behöver vi inte lägga en frilagd kropp ovanpå
	// soffans ryggstöd eller ändra följeslagarens lokala placering.
	const CABIN_IMAGE = '/images/scenes/cabin-interior-evening-resting-veranda-v1.webp';
	const CABIN_SRCSET = [
		'/images/scenes/cabin-interior-evening-resting-veranda-v1-800.webp 800w',
		'/images/scenes/cabin-interior-evening-resting-veranda-v1-1200.webp 1200w',
		'/images/scenes/cabin-interior-evening-resting-veranda-v1.webp 1672w'
	].join(', ');

	// Verandan är samma plats, sedd utifrån dörren. Den ligger i samma
	// scencontainer som interiören och delar dygnsrytm och world-state - det är
	// ett vybyte, inte en ny route.
	const VERANDA_IMAGE = '/images/scenes/cabin-veranda-evening-v1.webp';
	const VERANDA_SRCSET = [
		'/images/scenes/cabin-veranda-evening-v1-800.webp 800w',
		'/images/scenes/cabin-veranda-evening-v1-1200.webp 1200w',
		'/images/scenes/cabin-veranda-evening-v1.webp 1672w'
	].join(', ');

	// Samma vattenringar som på /framsteg: klassen `.water-ripple-loop` och
	// keyframen `waterRing` bor kvar i WaterLayer.svelte - här definieras bara
	// var de ligger inne i fönstrets sjövy. Route-lokala i stället för i
	// worldScene.ts, eftersom koordinaterna hör till interiörbilden och inte till
	// den globala sjöscenen.
	//
	// Två emitters i stället för /framstegs tre, och längre durations (~2x), så
	// ringarna kommer sällan och expanderar mjukare - sjön ska leva lite utanför,
	// inte dra blicken från Kvällslugn. Koordinaterna är procent av
	// `.cabin-lake-view`, och `.water-ripple-loop` centrerar sig själv på dem.
	const LAKE_RIPPLES: LivingWorldEffect[] = [
		{
			id: 'cabin-lake-ripple-one',
			kind: 'water',
			enabled: true,
			className: 'water-ripple-loop',
			x: 33,
			y: 44,
			width: 20,
			height: 36,
			durationMs: 7_600,
			delayMs: 0,
			opacity: 0.38,
			scale: 1
		},
		{
			id: 'cabin-lake-ripple-two',
			kind: 'water',
			enabled: true,
			className: 'water-ripple-loop',
			x: 70,
			y: 60,
			width: 16,
			height: 30,
			durationMs: 9_400,
			delayMs: -3_400,
			opacity: 0.3,
			scale: 0.82
		}
	];

	let { data } = $props<{
		data: {
			progressCompanion: ProgressCompanionSelection | null;
			companionDaily: CompanionDailyState | null;
			interiorMemory: EveningInteriorMemory;
		};
	}>();
	let sceneDate = $state(new Date());
	let completionSignal = $state(0);
	let savedInteriorMemory = $state<EveningInteriorMemory | null>(null);
	let interiorMemoryIntroduction = $state(0);
	let interiorRugIntroduction = $state(0);
	let interiorBlanketIntroduction = $state(0);
	let dayState = $state<ProgressCompanionDayState>(getProgressCompanionDayState());
	const interiorMemory = $derived(savedInteriorMemory ?? data.interiorMemory);
	const hasInteriorBook = $derived(interiorMemory.hasBook);
	const hasInteriorRug = $derived(interiorMemory.hasRug);
	const hasInteriorBlanket = $derived(interiorMemory.hasBlanket);
	const hasVeranda = $derived(interiorMemory.hasVeranda);

	// Lokal scenvy. Ingen route, ingen DB, ingen ny progression - så att
	// Kvällslugn-flödet och check-in-state överlever att man går ut och in.
	type SceneView = 'interior' | 'veranda';
	let sceneView = $state<SceneView>('interior');
	const isVerandaView = $derived(sceneView === 'veranda');
	const sceneLabel = $derived(
		isVerandaView ? 'Ute på Kvällsstugans veranda, vid vattnet' : 'Inne i Kvällsstugan, vid vattnet'
	);

	function setSceneView(next: SceneView) {
		// Verandan får aldrig nås utan behörighet, inte heller via tangentbord.
		if (next === 'veranda' && !hasVeranda) return;
		sceneView = next;
	}

	// Tappar användaren behörigheten hamnar hen alltid inne igen.
	$effect(() => {
		if (!hasVeranda && sceneView !== 'interior') sceneView = 'interior';
	});

	const companionId = $derived(
		getWorldCompanionId(getProgressCompanionAnimal(data.progressCompanion)?.id)
	);
	const companionBondLevel = $derived(
		getCompanionBondLevel(getCompanionBond(data.companionDaily?.answeredDayCount ?? 0))
	);
	const worldScene = $derived<LivingWorldScene>(
		getLivingWorldScene({
			date: sceneDate,
			features: {
				water: false,
				foliage: false,
				bird: false,
				butterfly: false,
				leaf: false,
				cloud: true,
				drift: false
			}
		})
	);

	function handleComplete(saved: boolean, savedMemory?: EveningInteriorMemory) {
		completionSignal += 1;
		if (!saved) return;

		const wasBookEligible = interiorMemory.hasBook;
		const wasRugEligible = interiorMemory.hasRug;
		const wasBlanketEligible = interiorMemory.hasBlanket;
		savedInteriorMemory = savedMemory ?? {
			...interiorMemory,
			hasBook: isEveningInteriorMemoryEligible(interiorMemory.hasBook, true)
		};

		if (!wasBookEligible && interiorMemory.hasBook) interiorMemoryIntroduction += 1;
		if (shouldIntroduceEveningInteriorRug(wasRugEligible, interiorMemory.hasRug)) {
			interiorRugIntroduction += 1;
		}
		if (shouldIntroduceEveningInteriorBlanket(wasBlanketEligible, interiorMemory.hasBlanket)) {
			interiorBlanketIntroduction += 1;
		}
	}

	onMount(() => {
		const timer = window.setInterval(() => {
			sceneDate = new Date();
			dayState = getProgressCompanionDayState(sceneDate);
		}, 60_000);
		return () => window.clearInterval(timer);
	});
</script>

<SEO canonical="https://mittpsyke.se/dashboard/kvallsstugan" />

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
		<section class="evening-scene" data-time={dayState} data-view={sceneView} style={getEveningLampCssVariables(dayState)} aria-label={sceneLabel}>
		<div class="scene-layer" class:is-active={!isVerandaView} aria-hidden={isVerandaView}>
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
				<AmbientWorld
					scene={worldScene}
					class="evening-ambient"
					visibleEffects={['moon', 'cloud']}
					visibleEventKinds={['water']}
					eventContext="cabin"
				/>
			</div>
			<!-- Sjöytan utanför fönstret: egen viewport så ringarna klipps till
			     vattnet och aldrig hamnar på karm, vägg, golv eller möbler. -->
			<div class="cabin-lake-view" aria-hidden="true">
				<WaterLayer effects={LAKE_RIPPLES} />
			</div>
			{#if hasInteriorRug}
				<img
					class:introducing={interiorRugIntroduction > 0}
					class="interior-memory-rug"
					src="/images/evening/interior/rug.png"
					alt=""
					aria-hidden="true"
					draggable="false"
				/>
			{/if}
			{#if hasInteriorBlanket}
				<img
					class:introducing={interiorBlanketIntroduction > 0}
					class="interior-memory-blanket"
					src="/images/evening/interior/blanket.png"
					alt=""
					aria-hidden="true"
					draggable="false"
				/>
			{/if}
			{#if hasInteriorBook}
				<img
					class:introducing={interiorMemoryIntroduction > 0}
					class="interior-memory-book"
					src="/images/evening/interior/boken.png"
					alt=""
					aria-hidden="true"
					draggable="false"
				/>
			{/if}
			<CompanionPose
				class="evening-companion interior-companion"
				companionId={companionId}
				scene="dashboard"
				greetingReaction={completionSignal}
				bondLevel={companionBondLevel}
				behaviourProfile="quiet"
				posePreference="calm"
			/>
			{#if hasVeranda && !isVerandaView}
				<!-- Tyst hotspot över verandadörren. Ingen synlig knapp, ingen
				     markering - dörren är sin egen affordans. -->
				<button
					class="scene-door scene-door-out"
					type="button"
					aria-label="Gå ut på verandan"
					onclick={() => setSceneView('veranda')}
				></button>
			{/if}
		</div>
		<div class="scene-layer" class:is-active={isVerandaView} aria-hidden={!isVerandaView}>
			<img
				class="evening-scene-image"
				srcset={VERANDA_SRCSET}
				sizes="(max-width: 899px) calc(100vw - 20px), 860px"
				src={VERANDA_IMAGE}
				alt=""
				aria-hidden="true"
				width="1672"
				height="941"
				loading="lazy"
				decoding="async"
			/>
			{#if isVerandaView}
				<button
					class="scene-door scene-door-in"
					type="button"
					aria-label="Gå in i stugan"
					onclick={() => setSceneView('interior')}
				></button>
			{/if}
		</div>
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
		background: radial-gradient(circle at 79% 48%, rgb(255 193 112 / var(--cabin-lamp-glow-opacity, 0.2)), transparent 23%);
		mix-blend-mode: screen;
		pointer-events: none;
		animation: cabin-lamp-flicker 8s ease-in-out infinite;
	}
	/* Lampskenet hör till interiören - ute på verandan finns ingen bordslampa. */
	.evening-scene[data-view='veranda']::before { opacity: 0; }
	.evening-scene::after {
		content: '';
		position: absolute;
		inset: 0;
		z-index: 1;
		background: linear-gradient(90deg, rgb(9 14 22 / 0.08), rgb(13 9 7 / 0.26));
		pointer-events: none;
	}
	.evening-scene-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
	/* Interiör och veranda ligger i samma container och korsfadar. Aktivt lager
	   har opacity 1 och skapar därför ingen stacking context - den befintliga
	   z-ordningen inne i scenen (lampsken, följeslagare, minnesobjekt) är
	   oförändrad i vila. */
	.scene-layer {
		position: absolute;
		inset: 0;
		opacity: 0;
		visibility: hidden;
		transition: opacity 300ms ease, visibility 0s linear 300ms;
	}
	.scene-layer.is-active {
		opacity: 1;
		visibility: visible;
		transition: opacity 300ms ease;
	}
	/* Dörrarna är tysta ytor ovanpå scenen: ingen ram, ingen ikon, ingen copy.
	   Minsta träffyta 44 x 44 px även på små skärmar. */
	.scene-door {
		position: absolute;
		z-index: 4;
		appearance: none;
		margin: 0;
		padding: 0;
		border: 0;
		background: transparent;
		min-width: 44px;
		min-height: 44px;
		cursor: pointer;
		border-radius: 0.35rem;
	}
	.scene-door:focus-visible {
		outline: 2px solid rgb(255 214 150 / 0.9);
		outline-offset: 2px;
	}
	/* Dörröppningen enligt docs/veranda-asset-spec.md: x 4,5-20,5 %, y 3-66,5 %. */
	.scene-door-out { left: 4.5%; top: 3%; width: 16%; height: 63.5%; }
	/* Returdörren mätt i den färdiga verandabilden: den glasade dörren går från
	   y 4 % ned till trallen på y 86 %, inte bara till 60 % som specen antog. */
	.scene-door-in { left: 6%; top: 6%; width: 13%; height: 78%; }
	.cabin-window-view {
		position: absolute;
		z-index: 1;
		left: 25.5%;
		top: 7.2%;
		width: 41.7%;
		height: 55%;
		overflow: hidden;
	}
	/* Dämpa bara molnen som tidigare. Månen behåller sin enda gemensamma stil från
	   AmbientWorld och blandas inte ned mot den kallare fönsterbilden. */
	.cabin-window-view :global(.evening-ambient) { inset: 0; --cloud-layer-opacity: 0.72; }
	/* Route-specifik "sjövy": exakt den del av interiörbilden där den öppna
	   vattenytan syns, under horisonten på y 38,5 % och fri från trädsiluetter.
	   Rent procentuell, så masken följer bilden när scenen skalar. overflow: hidden
	   gör att ringarna aldrig kan läcka ut på strandbuskar eller fönsterkarm.
	   z-index 1 håller den under lampskenet (::before, z 2) och companion (z 3). */
	.cabin-lake-view {
		position: absolute;
		z-index: 1;
		left: 33%;
		top: 40.5%;
		width: 25%;
		height: 9.5%;
		overflow: hidden;
		pointer-events: none;
	}
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
	/* Det enda bestående avtrycket i rummet. Boken vilar på den smala
	   träfönsterbänken direkt till vänster om sidobordet: en fri horisontell
	   yta nära lampan. Den ligger under lampskenet och bakom följeslagaren. */
	.interior-memory-book {
		position: absolute;
		z-index: 1;
		left: 60%;
		top: 60%;
		width: 6%;
		max-width: 5rem;
		min-width: 2.5rem;
		opacity: 0.82;
		pointer-events: none;
		user-select: none;
	}
	.interior-memory-book.introducing { animation: interior-memory-arrive 1.3s ease-out both; }
	/* Mattans egna perspektiv följer golvet utan warp. Den ligger under
	   följeslagaren (z 3), UI:t (z 4) och det varma lampskenet (z 2). */
	.interior-memory-rug {
		position: absolute;
		z-index: 1;
		left: 14%;
		bottom: -1%;
		width: 51%;
		pointer-events: none;
		user-select: none;
	}
	.interior-memory-rug.introducing { animation: interior-rug-arrive 1.8s ease-out both; }
	/* Filten vilar över soffans vänstra arm och får behålla assetens perspektiv. */
	.interior-memory-blanket {
		position: absolute;
		z-index: 1;
		left: 83%;
		top: 58%;
		width: 12%;
		pointer-events: none;
		user-select: none;
	}
	.interior-memory-blanket.introducing { animation: interior-blanket-arrive 1.8s ease-out both; }
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
		0%, 100% { opacity: var(--cabin-lamp-idle-opacity, 0.72); transform: scale(1); }
		38% { opacity: var(--cabin-lamp-peak-opacity, 0.82); transform: scale(1.008); }
		57% { opacity: var(--cabin-lamp-low-opacity, 0.68); transform: scale(0.994); }
	}
	@keyframes interior-memory-arrive {
		from { opacity: 0; }
		to { opacity: 0.8; }
	}
	@keyframes interior-rug-arrive {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	@keyframes interior-blanket-arrive {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	@media (max-width: 640px) {
		.evening-page { width: min(100% - 1.25rem, 44rem); padding-top: 0.45rem; }
		.evening-scene { min-height: 180px; border-radius: 1rem; }
		.evening-scene :global(.interior-companion) { left: 8%; bottom: 1%; width: min(32%, 175px); }
		.evening-scene :global(.interior-companion[data-companion='bear']) { left: 6%; bottom: 0; width: min(37%, 190px); }
		.evening-scene :global(.interior-companion[data-companion='wolf']) { left: 7%; bottom: 2%; width: min(35%, 185px); }
		/* Något större på liten skärm, men med samma faktiska fönsterbänk som på desktop. */
		.interior-memory-book { left: 60%; top: 60%; width: 6.5%; }
		.interior-memory-rug { left: 13%; bottom: -1.5%; width: 53%; }
		.interior-memory-blanket { left: 83%; top: 58%; width: 12%; }
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
		.interior-memory-book.introducing { animation: none; }
		.interior-memory-rug.introducing { animation: none; }
		.interior-memory-blanket.introducing { animation: none; }
		/* Vybytet ska ske direkt, inte tonas. */
		.scene-layer,
		.scene-layer.is-active { transition: none; }
	}
</style>
