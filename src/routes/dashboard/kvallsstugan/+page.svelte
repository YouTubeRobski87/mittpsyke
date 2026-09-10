<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';
	import CompanionPose from '$lib/components/CompanionPose.svelte';
	import EveningCheckinFlow from '$lib/components/evening/EveningCheckinFlow.svelte';
	import SleepModePanel from '$lib/components/evening/SleepModePanel.svelte';
	import AmbientWorld from '$lib/components/world/AmbientWorld.svelte';
	import WaterLayer from '$lib/components/world/WaterLayer.svelte';
	import type { SleepStage } from '$lib/evening-sleep-mode';
	import type { CompanionPosePreference } from '$lib/companionPoseState';
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

	// Sovlägets golvbädd.
	//
	// null = ingen godkänd asset finns. Den levererade filen underkändes vid
	// verifiering (helt rum i stället för urklippt bädd, genomgående ~94 %
	// alfa) - se docs/sovlage-asset-spec.md. Så länge konstanten är null
	// renderas ingen bädd. Sovläge är ändå nåbart via den tydligt märkta
	// scen-hotspoten nedan; när rätt asset finns läggs den under samma hotspot.
	//
	// När en korrekt urklippt WebP finns är det här den enda rad som behöver
	// ändras: sätt sökvägen, så följer bild, hotspot och Sovläge med.
	const FLOOR_BED_ASSET: string | null = null;

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

	// Sovläge. Rent lokalt tillstånd: ingen persistens, ingen DB, ingen
	// endpoint, ingen analytics. Lämnar man sidan är stunden slut.
	let sleepStage = $state<SleepStage>('closed');
	const isSleepMode = $derived(sleepStage === 'active');
	// Följeslagaren lägger sig först när Sovläge faktiskt är aktivt - inte
	// medan användaren fortfarande väljer.
	//
	// Typen står som annotering och inte som typargument till $derived. Ett
	// typargument hade skrivits med vinkelparentes direkt före typnamnet, och
	// den formen krockar med resting-scene.test.ts: testet klipper ut
	// companion-taggen genom att söka efter taggens inledning som text, och
	// hade då hittat typargumentet i skriptet i stället för taggen i markupen.
	const sleepPosePreference: CompanionPosePreference = $derived(
		isSleepMode ? 'resting' : 'calm'
	);

	function openSleepMode() {
		if (sleepStage === 'closed') sleepStage = 'source';
	}

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
		<section class="evening-scene" data-time={dayState} data-view={sceneView} data-sleep={isSleepMode ? 'on' : 'off'} style={getEveningLampCssVariables(dayState)} aria-label={sceneLabel}>
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
					eventsBlocked={isSleepMode}
				/>
			</div>
			<!-- Sjöytan utanför fönstret: egen viewport så ringarna klipps till
			     vattnet och aldrig hamnar på karm, vägg, golv eller möbler.
			     Under Sovläge tas lagret bort helt i stället för att döljas, så
			     att inga animationer fortsätter bakom en osynlig yta. -->
			{#if !isSleepMode}
				<div class="cabin-lake-view" aria-hidden="true">
					<WaterLayer effects={LAKE_RIPPLES} />
				</div>
			{/if}
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
			<!-- Golvbädden och dess hotspot. Till skillnad från matta, filt och
			     bok är den inte kopplad till EveningInteriorMemory: sovplatsen
			     är permanent och kräver ingen progression. Därför finns här
			     heller ingen introduktionsanimation - bädden dyker aldrig upp,
			     den har alltid funnits. Placeringen följer
			     docs/sovlage-asset-spec.md avsnitt 3. -->
			{#if FLOOR_BED_ASSET}
				<img
					class="interior-floor-bed"
					src={FLOOR_BED_ASSET}
					alt=""
					aria-hidden="true"
					draggable="false"
				/>
			{/if}
			{#if sleepStage === 'closed'}
				<button
					class="scene-object scene-object-bed"
					type="button"
					aria-label="Öppna Sovläge"
					onclick={openSleepMode}
				>
					<span class="scene-object-label" aria-hidden="true">Sovläge</span>
				</button>
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
				<!-- Boken på fönsterbänken är vägen in i dagboken. Egen yta ovanpå
				     asseten, så bildens uttoning och introduktionsanimation lämnas
				     orörda. Finns bara när boken faktiskt syns. -->
				<a class="scene-object scene-object-book" href="/dagbok" aria-label="Öppna min dagbok"></a>
			{/if}
			<CompanionPose
				class="evening-companion interior-companion"
				companionId={companionId}
				scene="dashboard"
				greetingReaction={completionSignal}
				bondLevel={companionBondLevel}
				behaviourProfile="quiet"
				posePreference={sleepPosePreference}
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

			<SleepModePanel bind:stage={sleepStage} />

			<section class="evening-reassurance" aria-labelledby="evening-reassurance-title">
				<h2 id="evening-reassurance-title">Du är på en trygg plats</h2>
				<p>Här inne får du stanna upp, andas och lyssna in hur du har det just nu.</p>
				<p>Det finns inget rätt eller fel – bara du och en stund av lugn.</p>
			</section>
		</div>

		<div class="evening-flow-column" class:is-dimmed={isSleepMode}>
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
	/* Klickbara föremål i scenen. Samma tysta princip som dörrarna: ingen ram,
	   ingen etikett, föremålet är sin egen affordans. Till skillnad från dörrarna
	   är det här navigation, så det är en länk och inte en knapp. */
	.scene-object {
		position: absolute;
		z-index: 4;
		display: block;
		min-width: 44px;
		min-height: 44px;
		border-radius: 0.4rem;
		cursor: pointer;
		/* Mycket lågmäld glöd, i samma varma ton som lampan. */
		transition: background 200ms ease, box-shadow 200ms ease;
	}
	.scene-object:hover {
		background: rgb(255 205 140 / 0.09);
		box-shadow: 0 0 12px 2px rgb(255 205 140 / 0.14);
	}
	.scene-object:focus-visible {
		outline: 2px solid rgb(255 214 150 / 0.9);
		outline-offset: 2px;
	}
	/* Ligger över boken på fönsterbänken, med lite marginal så den går att träffa
	   på mobil. Krockar inte med dörrytorna till vänster. */
	.scene-object-book { left: 59%; top: 58.5%; width: 8%; height: 9.5%; }
	/* Bädden. Ytan täcker medvetet inte hela madrassen: följeslagaren står på
	   x 10-36 % och boken har sin yta från x 59 %, så hotspoten håller sig
	   mellan dem. Då kan ett klick på djuret aldrig starta Sovläge. */
	.scene-object-bed {
		left: 38%;
		top: 72%;
		width: 19%;
		height: 22%;
		padding: 0;
		border: 0;
		background: transparent;
		color: #f7e7c7;
		font: inherit;
	}
	.scene-object-label {
		position: absolute;
		left: 50%;
		bottom: 0.45rem;
		transform: translateX(-50%);
		padding: 0.25rem 0.55rem;
		border: 1px solid rgb(245 200 120 / 0.32);
		border-radius: 999px;
		background: rgb(31 22 18 / 0.76);
		box-shadow: 0 5px 16px rgb(18 12 10 / 0.3);
		font-size: clamp(0.68rem, 1.6vw, 0.78rem);
		font-weight: 700;
		line-height: 1.2;
		white-space: nowrap;
		transition: background-color 200ms ease, border-color 200ms ease;
	}
	.scene-object-bed:hover .scene-object-label,
	.scene-object-bed:focus-visible .scene-object-label {
		border-color: rgb(255 214 150 / 0.72);
		background: rgb(53 36 27 / 0.9);
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
	/* Golvbädden ligger på samma z-index som mattan men senare i DOM, så den
	   målas ovanpå den - fysiskt korrekt, bädden står på mattan. Kvar under
	   lampskenet (z 2) och följeslagaren (z 3). Måtten kommer från
	   docs/sovlage-asset-spec.md; toppkanten faller ut av assetens egen
	   proportion (2,26:1) och får aldrig gå över y 68 %. */
	.interior-floor-bed {
		position: absolute;
		z-index: 1;
		left: 20%;
		bottom: -1%;
		width: 42%;
		pointer-events: none;
		user-select: none;
	}
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
	/* Sovläge: scenen sänks ett steg. Ingen svart overlay - i stället dämpas
	   bilden med brightness/saturate, så rummet är kvar men vilar. Lampskenet
	   får behålla sin flimmerkurva men dämpad, annars slocknar den enda
	   ljuskällan i rummet helt. */
	.evening-scene[data-sleep='on'] .evening-scene-image {
		filter: brightness(0.62) saturate(0.86);
	}
	.evening-scene[data-sleep='on']::before { opacity: 0.55; }
	.evening-scene[data-sleep='on'] :global(.interior-companion),
	.evening-scene[data-sleep='on'] .interior-memory-rug,
	.evening-scene[data-sleep='on'] .interior-memory-blanket,
	.evening-scene[data-sleep='on'] .interior-memory-book,
	.evening-scene[data-sleep='on'] .interior-floor-bed {
		filter: brightness(0.7);
	}
	.evening-scene-image,
	.evening-scene :global(.interior-companion),
	.interior-memory-rug,
	.interior-memory-blanket,
	.interior-memory-book,
	.interior-floor-bed {
		transition: filter 900ms ease;
	}

	/* Högerspalten tonas ned men förblir nåbar: den som vill checka in mitt i
	   Sovläge ska kunna göra det, och pointer-events: none hade dessutom låst
	   ut tangentbordsnavigering. */
	.evening-flow-column {
		transition: opacity 900ms ease;
	}
	.evening-flow-column.is-dimmed { opacity: 0.42; }
	.evening-flow-column.is-dimmed:focus-within { opacity: 1; }

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
		.scene-object { transition: none; }
		/* Sovläget ska fortfarande dämpa scenen - bara utan uttoning. */
		.evening-scene-image,
		.evening-scene :global(.interior-companion),
		.interior-memory-rug,
		.interior-memory-blanket,
		.interior-memory-book,
		.interior-floor-bed,
		.evening-flow-column { transition: none; }
	}
</style>
