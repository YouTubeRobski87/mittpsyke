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
	import { onDestroy, tick } from 'svelte';
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
		getEveningMeditation,
		getEveningMeditationScript,
		getEveningMeditations
	} from '$lib/evening-meditation-sources';
	import {
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
	let timer = $state<SleepTimer | null>(null);
	let now = $state(Date.now());
	let playbackStatus = $state<SleepPlaybackStatus>('idle');
	let heading = $state<HTMLElement | null>(null);

	// Adaptern är avsiktligt inte reaktiv: panelen läser aldrig av den, den
	// styr den. Statusen kommer tillbaka via onStatusChange.
	let playback: SleepPlayback | null = null;
	// Ogiltigförklarar en uppspelning som hunnit avbrytas medan talmotorn
	// laddades. Utan den kan ett avslutat Sovläge börja tala efteråt.
	let startToken = 0;

	const meditation = $derived(getEveningMeditation(meditationId));
	const remainingLabel = $derived(
		timer ? formatSleepRemaining(getSleepRemainingMs(timer, now)) : null
	);
	const isPaused = $derived(playbackStatus === 'paused');
	const statusText = $derived(getSleepActiveStatus(source, meditation?.title ?? null));

	function goToStage(next: SleepStage) {
		stage = next;
	}

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

	async function startSleep(lengthId: SleepLengthId) {
		const length = getSleepLength(lengthId);
		if (!length || !source) return;

		timer = createSleepTimer(Date.now(), length.minutes);
		now = Date.now();
		goToStage('active');

		if (source !== 'meditation') {
			// Tystnad rör aldrig talmotorn. Nollobjektet finns bara för att
			// kontrollerna ska kunna behandla alla lägen likadant.
			playback = createSilentPlayback();
			return;
		}

		const script = meditation ? getEveningMeditationScript(meditation) : [];
		startToken += 1;
		const token = startToken;
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
							<span class="sleep-option-hint">{option.summary}</span>
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
						Uppläsningen fungerar inte i den här webbläsaren. Stunden fortsätter i tystnad, och du
						kan läsa övningen själv om du vill.
					</p>
					{#if meditation}
						<a class="sleep-read-link" href={meditation.href}>Öppna {meditation.title}</a>
					{/if}
				{/if}
				<div class="sleep-controls">
					{#if source === 'meditation'}
						<button
							class="sleep-primary"
							type="button"
							aria-pressed={isPaused}
							onclick={togglePlayback}
						>
							{isPaused ? 'Fortsätt uppläsningen' : 'Pausa uppläsningen'}
						</button>
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

	.sleep-primary:focus-visible,
	.sleep-secondary:focus-visible,
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
		.sleep-options button {
			transition: none;
		}
	}
</style>
