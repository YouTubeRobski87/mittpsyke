<script lang="ts">
	// Sovlägets panel.
	//
	// Panelen äger flödet (välj källa → välj meditation → välj längd → aktivt
	// läge) men vet ingenting om hur ljud produceras. Den håller en
	// SleepPlayback och anropar start/pause/resume/stop – vilken adapter som
	// ligger bakom avgörs i $lib/evening-sleep-playback.
	//
	// Panelen renderas i normalt flöde direkt under scenen, inte som overlay
	// inuti 16:9-rutan. På 375 px är scenen bara ~200 px hög, och en panel
	// inklämd där hade antingen svämmat över eller tryckt ihop kontrollerna.
	// Scenen dimmas i stället av routen, så känslan av att ligga kvar i stugan
	// bärs av scenen medan panelen får den plats den behöver.
	import { browser } from '$app/environment';
	import { onDestroy, tick, untrack } from 'svelte';
	import {
		SLEEP_LENGTHS,
		SLEEP_SOURCES,
		createSleepTimer,
		formatSleepRemaining,
		getSleepActiveStatus,
		getSleepLength,
		getSleepRemainingMs,
		getSleepStageAfterSource,
		getSleepStageBefore,
		getSleepStageHeading,
		isSleepFinished,
		pauseSleepTimer,
		resumeSleepTimer,
		type SleepLengthId,
		type SleepSourceId,
		type SleepStage,
		type SleepTimer
	} from '$lib/evening-sleep-mode';
	import {
		DEFAULT_EVENING_MEDITATION_ID,
		formatMeditationLength,
		getEveningMeditation,
		getEveningMeditationScript,
		getEveningMeditations
	} from '$lib/evening-meditation-sources';
	import {
		DEFAULT_EVENING_MUSIC_ID,
		EVENING_MUSIC_TRACKS,
		getEveningMusicTrack,
		readEveningMusicLoop,
		writeEveningMusicLoop
	} from '$lib/evening-music-sources';
	import {
		createAudioFilePlayback,
		createBrowserSpeechEngine,
		createSilentPlayback,
		createTtsPlayback,
		type SleepPlayback,
		type SleepPlaybackStatus
	} from '$lib/evening-sleep-playback';

	// Steget är bindbart så att routen både kan öppna Sovläge (från en framtida
	// bädd-hotspot) och läsa av när det är aktivt, utan att panelen behöver
	// exponera något eget event-API.
	let { stage = $bindable('closed' as SleepStage) } = $props<{ stage?: SleepStage }>();

	const meditations = getEveningMeditations();

	let source = $state<SleepSourceId | null>(null);
	let meditationId = $state<string>(DEFAULT_EVENING_MEDITATION_ID);
	let musicId = $state<string>(DEFAULT_EVENING_MUSIC_ID);
	let timer = $state<SleepTimer | null>(null);
	let now = $state(Date.now());
	let playbackStatus = $state<SleepPlaybackStatus>('idle');
	// Upprepning av musikspåret. Av tills användaren själv slår på den; valet
	// sparas lokalt men startar aldrig någon uppspelning.
	let musicLoop = $state(false);
	let heading = $state<HTMLElement | null>(null);
	// Speltid per inspelat spår, läst ur filerna själva och nycklad på id.
	// Ett spår som ännu inte hunnit mätas, eller inte går att mäta, saknas här
	// och visas då utan tidsangivelse.
	let recordedDurations = $state<Record<string, number>>({});
	// Vilka spår som redan har en mätning på gång. Medvetet en vanlig Set och
	// inte $state: läses den inne i effekten nedan skulle varje mätning
	// trigga om effekten och starta en ny mätning.
	const probedIds = new Set<string>();

	// Adaptern är avsiktligt inte reaktiv: panelen läser aldrig av den, den
	// styr den. Statusen kommer tillbaka via onStatusChange.
	let playback: SleepPlayback | null = null;
	// Ogiltigförklarar en uppspelning som hunnit avbrytas medan talmotorn
	// laddades. Utan den kan ett avslutat Sovläge börja tala efteråt.
	let startToken = 0;

	const meditation = $derived(getEveningMeditation(meditationId));
	const musicTrack = $derived(getEveningMusicTrack(musicId));
	const lengthLabelFor = $derived((id: string) =>
		formatMeditationLength(recordedDurations[id] ?? null)
	);
	// Titeln i statusraden kommer från vald källa: musikspåret eller meditationen.
	const activeTitle = $derived(
		source === 'music' ? (musicTrack?.title ?? null) : (meditation?.title ?? null)
	);
	// Tystnad har ingenting att pausa. Musik och meditation har båda det.
	const canPause = $derived(source !== null && source !== 'silence');
	const remainingLabel = $derived(
		timer ? formatSleepRemaining(getSleepRemainingMs(timer, now)) : null
	);
	const isPaused = $derived(playbackStatus === 'paused');
	const statusText = $derived(getSleepActiveStatus(source, activeTitle));

	function goToStage(next: SleepStage) {
		stage = next;
	}

	// Upprepningsvalet är en inställning, inte sovlägets tillstånd, och är
	// det enda som sparas. Läsningen startar aldrig någon uppspelning.
	$effect(() => {
		if (!browser) return;
		musicLoop = readEveningMusicLoop();
	});

	function toggleMusicLoop() {
		musicLoop = !musicLoop;
		playback?.setLoop?.(musicLoop);
		writeEveningMusicLoop(musicLoop);
	}

	// Läser speltiden ur ljudfilerna när musik- eller meditationsvalet öppnas.
	//
	// preload="metadata" hämtar bara filhuvudet via en Range-förfrågan, inte
	// hela spåret - ingen 38 MB laddas ned för att visa en längd. Går det inte
	// att läsa lämnas längden osatt och valet visas utan tidsangivelse.
	$effect(() => {
		const candidates =
			stage === 'music'
				? EVENING_MUSIC_TRACKS.map((track) => ({ id: track.id, audioSrc: track.audioSrc }))
				: stage === 'meditation'
					? meditations.map((option) => ({ id: option.id, audioSrc: option.audioSrc }))
					: [];

		const pending = candidates.filter(
			(option) => option.audioSrc && !probedIds.has(option.id)
		);
		if (pending.length === 0) return;

		const probes = pending.map((option) => {
			probedIds.add(option.id);
			const probe = new Audio();
			const onLoaded = () => {
				if (Number.isFinite(probe.duration) && probe.duration > 0) {
					recordedDurations = { ...recordedDurations, [option.id]: probe.duration };
				}
			};
			probe.preload = 'metadata';
			probe.addEventListener('loadedmetadata', onLoaded);
			probe.src = option.audioSrc ?? '';
			return { probe, onLoaded };
		});

		return () => {
			for (const { probe, onLoaded } of probes) {
				probe.removeEventListener('loadedmetadata', onLoaded);
				probe.src = '';
			}
		};
	});

	// Fokus följer steget.
	//
	// Ligger i en effekt i stället för i varje övergång, eftersom steget också
	// kan sättas utifrån: routen öppnar Sovläge genom att skriva till den
	// bundna `stage`, och då passerar den aldrig goToStage. Utan det här
	// hamnar fokus kvar på bädd-hotspoten medan panelen öppnas nedanför.
	$effect(() => {
		if (stage === 'closed') return;
		void tick().then(() => heading?.focus());
	});

	function chooseSource(next: SleepSourceId) {
		source = next;
		goToStage(getSleepStageAfterSource(next));
	}

	function chooseMusic(id: string) {
		musicId = id;
		goToStage('length');
	}

	function chooseMeditation(id: string) {
		meditationId = id;
		goToStage('length');
	}

	function goBack() {
		goToStage(getSleepStageBefore(stage, source));
	}

	function stopPlayback() {
		startToken += 1;
		playback?.stop();
		playback = null;
		playbackStatus = 'idle';
	}

	/** Avslutar utan ljudsignal och utan bekräftelse – scenen som ljusnar är kvittot. */
	function endSleep() {
		stopPlayback();
		timer = null;
		source = null;
		stage = 'closed';
	}

	function changeChoice() {
		stopPlayback();
		timer = null;
		goToStage('source');
	}

	// Ljudet får aldrig överleva att panelen stängs, oavsett vem som stänger
	// den. endSleep stoppar redan själv; det här är skyddsnätet om steget sätts
	// till closed utifrån via den bundna `stage`.
	$effect(() => {
		if (stage === 'closed') untrack(stopPlayback);
	});

	// Musik är alltid en ljudfil. Den upprepas bara om användaren valt det.
	function playSelectedMusic() {
		const track = getEveningMusicTrack(musicId);
		if (!track) return;

		startToken += 1;
		const token = startToken;
		playback = createAudioFilePlayback(track.audioSrc, {
			loop: musicLoop,
			onStatusChange: (next) => {
				if (token !== startToken) return;
				playbackStatus = next;
			}
		});
		playback.start();
	}

	/**
	 * Byter låt mitt i stunden. Stundens klocka fortsätter, och eftersom bytet
	 * är ett aktivt val spelar den nya låten direkt – även om musiken var pausad.
	 */
	function switchMusic(id: string) {
		if (!getEveningMusicTrack(id)) return;
		if (id === musicId && playbackStatus === 'playing') return;

		musicId = id;
		stopPlayback();
		if (timer) timer = resumeSleepTimer(timer, Date.now());
		playSelectedMusic();
	}

	async function startSleep(lengthId: SleepLengthId) {
		const length = getSleepLength(lengthId);
		if (!length || !source) return;

		timer = createSleepTimer(Date.now(), length.minutes);
		now = Date.now();
		goToStage('active');

		// Vakten frågar uttryckligen efter tystnad i stället för "allt utom
		// meditation". Den tidigare formen hade skickat musik hit och spelat
		// ingenting alls när en tredje källa tillkom.
		if (source === 'silence') {
			// Tystnad rör aldrig talmotorn. Nollobjektet finns bara för att
			// kontrollerna ska kunna behandla alla lägen likadant.
			playback = createSilentPlayback();
			return;
		}

		startToken += 1;
		const token = startToken;

		// Musik spelas synkront i klickets gest, precis som inspelade meditationer.
		if (source === 'music') {
			playSelectedMusic();
			return;
		}

		// Färdiginspelade meditationer spelas som ljudfil. Talsyntesen rörs
		// aldrig för ett sådant spår, och uppspelningen startar synkront i
		// klickets gest - ingen await hinner bryta gestkedjan.
		if (meditation?.audioSrc) {
			playback = createAudioFilePlayback(meditation.audioSrc, {
				onStatusChange: (next) => {
					if (token !== startToken) return;
					playbackStatus = next;
				}
			});
			playback.start();
			return;
		}

		const script = meditation ? getEveningMeditationScript(meditation) : [];
		const engine = await createBrowserSpeechEngine();
		// Användaren kan ha avslutat medan rösterna laddades.
		if (token !== startToken) return;

		playback = createTtsPlayback(script, engine, {
			onStatusChange: (next) => {
				if (token !== startToken) return;
				playbackStatus = next;
			}
		});
		playback.start();
	}

	function togglePlayback() {
		if (!playback || !timer) return;

		if (isPaused) {
			playback.resume();
			timer = resumeSleepTimer(timer, Date.now());
			return;
		}

		playback.pause();
		timer = pauseSleepTimer(timer, Date.now());
	}

	// Tiden läses av mot Date.now(), aldrig ackumulerad i intervallet, så en
	// strypt bakgrundsflik varken förlänger eller förkortar stunden.
	$effect(() => {
		if (stage !== 'active' || !timer || timer.durationMs === null) return;

		const id = window.setInterval(() => {
			now = Date.now();
			if (timer && isSleepFinished(timer, now)) endSleep();
		}, 1000);

		return () => window.clearInterval(id);
	});

	onDestroy(stopPlayback);
</script>

{#snippet musicLoopToggle()}
	<button
		class="sleep-toggle"
		type="button"
		aria-pressed={musicLoop}
		onclick={toggleMusicLoop}
	>
		Upprepa låten: {musicLoop ? 'på' : 'av'}
	</button>
{/snippet}

{#if stage !== 'closed'}
	<section class="sleep-panel" data-stage={stage} aria-labelledby="sleep-panel-title">
		{#if stage === 'source'}
			<div class="sleep-step">
				<h2 id="sleep-panel-title" bind:this={heading} tabindex="-1">
					{getSleepStageHeading(stage, source)}
				</h2>
				<p class="sleep-hint">Du väljer själv. Inget ljud startar förrän du har valt.</p>
				<div class="sleep-options" aria-label="Välj vad som ska höras">
					{#each SLEEP_SOURCES as option (option.id)}
						<button type="button" onclick={() => chooseSource(option.id)}>
							<span class="sleep-option-label">{option.label}</span>
							<span class="sleep-option-hint">{option.hint}</span>
						</button>
					{/each}
				</div>
				<div class="sleep-actions">
					<button class="sleep-secondary" type="button" onclick={endSleep}>Avbryt</button>
				</div>
			</div>
		{:else if stage === 'music'}
			<div class="sleep-step">
				<h2 id="sleep-panel-title" bind:this={heading} tabindex="-1">
					{getSleepStageHeading(stage, source)}
				</h2>
				<div class="sleep-options" aria-label="Välj musik">
					{#each EVENING_MUSIC_TRACKS as track (track.id)}
						<button
							type="button"
							class:selected={musicId === track.id}
							onclick={() => chooseMusic(track.id)}
						>
							<span class="sleep-option-label">{track.title}</span>
							<span class="sleep-option-hint">
								{track.summary}{lengthLabelFor(track.id) ? ` · ${lengthLabelFor(track.id)}` : ''}
							</span>
						</button>
					{/each}
				</div>
				<div class="sleep-actions">
					<button class="sleep-secondary" type="button" onclick={goBack}>Tillbaka</button>
				</div>
			</div>
		{:else if stage === 'meditation'}
			<div class="sleep-step">
				<h2 id="sleep-panel-title" bind:this={heading} tabindex="-1">
					{getSleepStageHeading(stage, source)}
				</h2>
				<div class="sleep-options" aria-label="Välj meditation">
					{#each meditations as option (option.id)}
						<button
							type="button"
							class:selected={meditationId === option.id}
							onclick={() => chooseMeditation(option.id)}
						>
							<span class="sleep-option-label">{option.title}</span>
							<span class="sleep-option-hint">
								{option.summary}{option.audioSrc && lengthLabelFor(option.id)
									? ` · ${lengthLabelFor(option.id)}`
									: ''}
							</span>
						</button>
					{/each}
				</div>
				<div class="sleep-actions">
					<button class="sleep-secondary" type="button" onclick={goBack}>Tillbaka</button>
				</div>
			</div>
		{:else if stage === 'length'}
			<div class="sleep-step">
				<h2 id="sleep-panel-title" bind:this={heading} tabindex="-1">
					{getSleepStageHeading(stage, source)}
				</h2>
				<div class="sleep-options sleep-options--lengths" aria-label="Välj hur länge">
					{#each SLEEP_LENGTHS as option (option.id)}
						<button type="button" onclick={() => startSleep(option.id)}>
							<span class="sleep-option-label">{option.label}</span>
						</button>
					{/each}
				</div>
				<div class="sleep-actions">
					{#if source === 'music'}
						{@render musicLoopToggle()}
					{/if}
					<button class="sleep-secondary" type="button" onclick={goBack}>Tillbaka</button>
				</div>
			</div>
		{:else}
			<div class="sleep-step sleep-step--active">
				<h2 id="sleep-panel-title" bind:this={heading} tabindex="-1">
					{getSleepStageHeading(stage, source)}
				</h2>
				<p class="sleep-status" role="status" aria-live="polite">
					{statusText}{remainingLabel ? ` · ${remainingLabel}` : ''}
				</p>
				{#if playbackStatus === 'unavailable'}
					<p class="sleep-hint" role="status">
						{#if source === 'music'}
							Låten kunde inte spelas upp just nu. Stunden fortsätter i tystnad – du kan välja en
							annan låt eller avsluta när du vill.
						{:else if meditation?.audioSrc}
							Ljudet kunde inte spelas upp just nu. Stunden fortsätter i tystnad – du kan byta
							val eller avsluta när du vill.
						{:else}
							Uppläsningen fungerar inte i den här webbläsaren. Stunden fortsätter i tystnad, och
							du kan läsa övningen själv om du vill.
						{/if}
					</p>
					<!-- Bara textövningarna har en sida att läsa. Den inspelade
					     meditationen finns inte i skriven form. -->
					{#if source === 'meditation' && meditation?.href}
						<a class="sleep-read-link" href={meditation.href}>Öppna {meditation.title}</a>
					{/if}
				{/if}
				{#if source === 'music'}
					<!-- Låten går att byta utan att lämna stunden. Vald låt markeras
					     både med aria-pressed och i statusraden ovan, inte bara med färg. -->
					<div class="sleep-tracks" role="group" aria-label="Byt låt">
						{#each EVENING_MUSIC_TRACKS as track (track.id)}
							<button
								class="sleep-track"
								type="button"
								aria-pressed={musicId === track.id}
								onclick={() => switchMusic(track.id)}
							>
								{track.title}
							</button>
						{/each}
					</div>
				{/if}
				<div class="sleep-controls">
					{#if canPause}
						<button
							class="sleep-primary"
							type="button"
							aria-pressed={isPaused}
							onclick={togglePlayback}
						>
							{#if source === 'music'}
								{isPaused ? 'Fortsätt musiken' : 'Pausa musiken'}
							{:else}
								{isPaused ? 'Fortsätt uppläsningen' : 'Pausa uppläsningen'}
							{/if}
						</button>
					{/if}
					{#if source === 'music'}
						{@render musicLoopToggle()}
					{/if}
					<button class="sleep-secondary" type="button" onclick={changeChoice}>Byt val</button>
					<button class="sleep-secondary" type="button" onclick={endSleep}>Avsluta Sovläge</button>
				</div>
			</div>
		{/if}
	</section>
{/if}

<style>
	.sleep-panel {
		padding: clamp(1.1rem, 4vw, 1.6rem);
		border: 1px solid rgb(237 222 194 / 0.28);
		border-radius: 1.2rem;
		background: linear-gradient(145deg, rgb(55 38 29 / 0.96), rgb(28 23 22 / 0.97));
		box-shadow: 0 18px 42px rgb(22 15 12 / 0.28);
		color: #f7f3eb;
		font-family: var(--font-body);
	}

	/* Aktivt läge är avsiktligt lugnare än valstegen: mindre kontrast, mindre
	   yta, ingenting som ber om uppmärksamhet. */
	.sleep-panel[data-stage='active'] {
		border-color: rgb(237 222 194 / 0.16);
		background: linear-gradient(145deg, rgb(42 31 25 / 0.92), rgb(22 19 18 / 0.94));
	}

	.sleep-step {
		display: grid;
		gap: 0.85rem;
	}

	.sleep-step h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(1.2rem, 3vw, 1.5rem);
		line-height: 1.2;
	}

	.sleep-step h2:focus-visible {
		outline: 2px solid #f5c878;
		outline-offset: 4px;
	}

	.sleep-hint,
	.sleep-status {
		margin: 0;
		color: rgb(240 235 225 / 0.8);
		font-size: 0.94rem;
		line-height: 1.55;
	}

	.sleep-options {
		display: grid;
		gap: 0.6rem;
	}

	/* Längderna är korta etiketter och får ligga i par när bredden räcker. */
	.sleep-options--lengths {
		grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
	}

	.sleep-options button {
		display: grid;
		gap: 0.15rem;
		width: 100%;
		min-height: 44px;
		padding: 0.8rem 0.9rem;
		border: 1px solid rgb(238 225 202 / 0.24);
		border-radius: 0.8rem;
		background: rgb(255 255 255 / 0.06);
		color: inherit;
		font: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color 160ms ease, border-color 160ms ease;
	}

	.sleep-options button:hover,
	.sleep-options button:focus-visible,
	.sleep-options button.selected {
		border-color: rgb(245 200 120 / 0.78);
		background: rgb(245 200 120 / 0.15);
		outline: none;
	}

	.sleep-option-label {
		font-weight: 650;
		line-height: 1.3;
	}

	.sleep-option-hint {
		color: rgb(240 235 225 / 0.68);
		font-size: 0.85rem;
		line-height: 1.4;
	}

	.sleep-actions,
	.sleep-controls {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-top: 0.25rem;
	}

	.sleep-primary,
	.sleep-secondary {
		min-height: 44px;
		padding: 0.72rem 1rem;
		border-radius: 0.8rem;
		font: inherit;
		font-weight: 650;
		line-height: 1.3;
		cursor: pointer;
	}

	.sleep-primary {
		border: 1px solid #efc171;
		background: #efc171;
		color: #2b2116;
	}

	.sleep-primary:hover {
		background: #f7d28f;
	}

	.sleep-secondary {
		border: 1px solid transparent;
		background: transparent;
		color: rgb(240 235 225 / 0.82);
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.sleep-tracks {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.sleep-track {
		min-height: 44px;
		padding: 0.55rem 0.85rem;
		border: 1px solid rgb(238 225 202 / 0.24);
		border-radius: 999px;
		background: transparent;
		color: rgb(240 235 225 / 0.86);
		font: inherit;
		font-size: 0.92rem;
		line-height: 1.3;
		cursor: pointer;
		transition: background-color 160ms ease, border-color 160ms ease;
	}

	.sleep-track:hover {
		border-color: rgb(245 200 120 / 0.5);
	}

	.sleep-track[aria-pressed='true'] {
		border-color: rgb(245 200 120 / 0.78);
		background: rgb(245 200 120 / 0.15);
		color: #f7f3eb;
		font-weight: 650;
	}

	.sleep-track:focus-visible {
		outline: 2px solid #f5c878;
		outline-offset: 3px;
	}

	/* Av/på-läget bärs av texten, inte bara av färgen. */
	.sleep-toggle {
		min-height: 44px;
		padding: 0.72rem 1rem;
		border: 1px solid rgb(238 225 202 / 0.34);
		border-radius: 0.8rem;
		background: rgb(255 255 255 / 0.06);
		color: #f7f3eb;
		font: inherit;
		font-weight: 650;
		line-height: 1.3;
		cursor: pointer;
		transition: background-color 160ms ease, border-color 160ms ease;
	}

	.sleep-toggle[aria-pressed='true'] {
		border-color: rgb(245 200 120 / 0.78);
		background: rgb(245 200 120 / 0.15);
	}

	.sleep-primary:focus-visible,
	.sleep-secondary:focus-visible,
	.sleep-toggle:focus-visible,
	.sleep-read-link:focus-visible {
		outline: 2px solid #f5c878;
		outline-offset: 3px;
	}

	.sleep-read-link {
		width: fit-content;
		color: #d6b46c;
		font-size: 0.9rem;
		text-underline-offset: 0.18em;
	}

	@media (prefers-reduced-motion: reduce) {
		.sleep-options button,
		.sleep-toggle,
		.sleep-track {
			transition: none;
		}
	}
</style>
