<script lang="ts">
	// "Din period i ord": en AI-sammanfattning av periodens anteckningar.
	//
	// Flödet är alltid: granska urvalet -> godkänn uttryckligen -> sammanfatta.
	// Inget AI-anrop görs utan godkännandet, och servern kontrollerar samtyckena
	// igen. Resultatet lever bara i den här komponenten och sparas aldrig. Byts
	// perioden monteras komponenten om (se {#key} i Framsteg), och ändrat urval
	// eller återkallat samtycke tömmer allt som visas.
	import { onDestroy, onMount } from 'svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import {
		createHealthConsentRecord,
		hasHealthConsentInMetadata,
		HEALTH_CONSENT_STORAGE_KEY,
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION
	} from '$lib/consent';
	import { diaryEntryHref } from '$lib/diary-entry-link';
	import {
		MIN_PERIOD_SUMMARY_ENTRIES,
		type PeriodSummaryPeriod,
		type PeriodSummaryPreview,
		type PeriodSummaryResult,
		type PeriodSummarySource
	} from '$lib/progress-period-summary';
	import { supabase } from '$lib/supabase';

	let { period }: { period: PeriodSummaryPeriod } = $props();

	type Step = 'idle' | 'preview' | 'review' | 'generate' | 'result';

	const ENDPOINT = '/api/diary/insights/period-summary';
	const PERIOD_LABELS: Record<PeriodSummaryPeriod, string> = {
		30: 'de senaste 30 dagarna',
		90: 'de senaste tre månaderna',
		180: 'de senaste sex månaderna'
	};

	let step = $state<Step>('idle');
	let preview = $state<PeriodSummaryPreview | null>(null);
	let result = $state<PeriodSummaryResult | null>(null);
	let confirmed = $state(false);
	let needsHealthConsent = $state(false);
	let needsAiConsent = $state(false);
	let basisOpen = $state(false);
	let message = $state('');
	let insufficient = $state(false);
	let request: AbortController | undefined;
	let resultHeading = $state<HTMLElement | null>(null);

	const longDate = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const shortDate = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
	const toDate = (date: string) => new Date(`${date}T12:00:00Z`);
	const formatLong = (date: string | null) => (date ? longDate.format(toDate(date)) : '');
	const formatShort = (date: string) => shortDate.format(toDate(date));
	const formatMood = (mood: number) => mood.toLocaleString('sv-SE', { maximumFractionDigits: 1 });
	const noteWord = (count: number) => (count === 1 ? 'anteckning' : 'anteckningar');

	/** Tömmer allt som visas. Används vid ändrat urval och återkallat samtycke. */
	function reset() {
		request?.abort();
		request = undefined;
		step = 'idle';
		preview = null;
		result = null;
		confirmed = false;
		needsAiConsent = false;
		basisOpen = false;
		insufficient = false;
	}

	function clearForHealthConsent() {
		reset();
		needsHealthConsent = true;
		message = '';
	}

	onMount(() => {
		const handleStorage = (event: StorageEvent) => {
			if (
				event.storageArea === localStorage &&
				(event.key === null || (event.key === HEALTH_CONSENT_STORAGE_KEY && event.newValue === null))
			) {
				clearForHealthConsent();
			}
		};
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_OUT') reset();
			else if (event === 'USER_UPDATED' && !hasHealthConsentInMetadata(session?.user.user_metadata)) {
				clearForHealthConsent();
			}
		});
		window.addEventListener('storage', handleStorage);
		return () => {
			window.removeEventListener('storage', handleStorage);
			subscription.unsubscribe();
		};
	});
	onDestroy(() => request?.abort());

	async function authHeaders(): Promise<Record<string, string> | null> {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		if (!session) return null;
		return {
			Authorization: `Bearer ${session.access_token}`,
			[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
		};
	}

	function describeFailure(reason: unknown): string {
		switch (reason) {
			case 'rate-limit':
				return 'Vänta en minut innan du ber om en ny sammanfattning.';
			case 'daily-limit':
				return 'Du har bett om fem sammanfattningar i dag. Du kan göra en ny i morgon.';
			case 'withheld':
				return 'En sammanfattning kan inte visas för de här anteckningarna. Dina anteckningar finns kvar i dagboken.';
			case 'invalid-response':
				return 'Det gick inte att ta fram en sammanfattning som kunde kontrolleras mot dina anteckningar. Du kan försöka igen om en stund.';
			default:
				return 'Det gick inte att ta fram sammanfattningen just nu. Försök igen om en stund.';
		}
	}

	async function loadPreview() {
		if (request) return;
		const controller = new AbortController();
		request = controller;
		step = 'preview';
		message = '';
		insufficient = false;
		try {
			const headers = await authHeaders();
			if (controller.signal.aborted) return;
			if (!headers) throw new Error();
			const response = await fetch(`${ENDPOINT}?period=${period}`, {
				headers,
				signal: controller.signal,
				cache: 'no-store'
			});
			const payload = await response.json().catch(() => ({}));
			if (controller.signal.aborted) return;
			if (response.status === 403 && payload.reason === 'health-consent') {
				clearForHealthConsent();
				return;
			}
			if (response.status === 422 && payload.reason === 'insufficient-data') {
				insufficient = true;
				step = 'idle';
				return;
			}
			if (!response.ok || !Array.isArray(payload.entries)) throw new Error();
			preview = payload as PeriodSummaryPreview;
			confirmed = false;
			step = 'review';
		} catch {
			if (!controller.signal.aborted) {
				step = 'idle';
				message = 'Det gick inte att hämta dina anteckningar just nu. Försök igen om en stund.';
			}
		} finally {
			if (request === controller) request = undefined;
		}
	}

	async function generate() {
		if (request || !preview || !confirmed) return;
		const controller = new AbortController();
		request = controller;
		step = 'generate';
		message = '';
		try {
			const headers = await authHeaders();
			if (controller.signal.aborted) return;
			if (!headers) throw new Error();
			const response = await fetch(ENDPOINT, {
				method: 'POST',
				headers: { ...headers, 'Content-Type': 'application/json' },
				body: JSON.stringify({ period, snapshotId: preview.snapshotId, confirmed: true }),
				signal: controller.signal
			});
			const payload = await response.json().catch(() => ({}));
			if (controller.signal.aborted) return;
			if (response.status === 403 && payload.reason === 'health-consent') {
				clearForHealthConsent();
				return;
			}
			if (response.status === 403 && payload.reason === 'ai-consent') {
				needsAiConsent = true;
				step = 'review';
				return;
			}
			if (response.status === 409) {
				// Urvalet är inte längre det användaren godkände. Inget gammalt får synas.
				reset();
				message = 'Dina anteckningar har ändrats sedan du granskade dem. Granska urvalet igen innan du sammanfattar.';
				return;
			}
			if (response.status === 422 && payload.reason === 'insufficient-data') {
				reset();
				insufficient = true;
				return;
			}
			if (!response.ok || !Array.isArray(payload.themes)) {
				step = 'review';
				message = describeFailure(payload.reason);
				return;
			}
			result = payload as PeriodSummaryResult;
			confirmed = false;
			basisOpen = false;
			step = 'result';
			// Flytta fokus till resultatet så att skärmläsare och tangentbord hamnar rätt.
			queueMicrotask(() => resultHeading?.focus());
		} catch {
			if (!controller.signal.aborted) {
				step = 'review';
				message = describeFailure(null);
			}
		} finally {
			if (request === controller) request = undefined;
		}
	}

	async function saveHealthConsent() {
		const { data, error } = await supabase.auth.updateUser({
			data: { health_data_processing_consent: createHealthConsentRecord() }
		});
		if (error || !hasHealthConsentInMetadata(data.user?.user_metadata)) throw new Error();
		needsHealthConsent = false;
		await loadPreview();
	}

	async function saveAiConsent() {
		const headers = await authHeaders();
		if (!headers) throw new Error();
		const response = await fetch('/api/consent/diary-ai', { method: 'POST', headers });
		if (!response.ok) throw new Error();
		needsAiConsent = false;
		message = 'Samtycket är sparat. Tryck på Skapa sammanfattningen för att fortsätta.';
	}

	function hideSummary() {
		reset();
		message = '';
	}
</script>

{#snippet sourceLinks(sources: PeriodSummarySource[])}
	<span class="period-summary-sources">
		{#each sources as source (source.ref)}
			{@const href = diaryEntryHref(source.entryId)}
			{#if href}
				<a {href} aria-label={`Läs anteckningen från ${formatLong(source.date)}`}>{formatShort(source.date)}</a>
			{/if}
		{/each}
	</span>
{/snippet}

{#snippet entryList(entries: PeriodSummaryPreview['entries'], labelledBy: string)}
	<ol class="period-summary-entries" aria-labelledby={labelledBy}>
		{#each entries as entry (entry.ref)}
			<li>
				<p class="period-summary-entry-meta">
					<time datetime={entry.date}>{formatLong(entry.date)}</time>
					{#if entry.mood !== null}<span>· humör {formatMood(entry.mood)} av 10</span>{/if}
				</p>
				<p class="period-summary-entry-text">{entry.text}</p>
			</li>
		{/each}
	</ol>
{/snippet}

<div class="period-summary" data-testid="period-summary">
	<h2 id="period-summary-heading">Din period i ord</h2>
	<p class="period-summary-lead">
		Se vad som återkommer i dina anteckningar, vilka skillnader du själv beskrivit och vilka stunder du vill
		ta med dig.
	</p>

	{#if needsHealthConsent}
		<ConsentGate
			idPrefix="period-summary-health-consent"
			title="Innan MittPsyke visar dina anteckningar"
			dataLabel="Dina sparade dagbokstexter"
			serviceLabel="MittPsyke för att visa urvalet till sammanfattningen"
			requireExplicitConfirmation
			onAccept={saveHealthConsent}
		/>
	{:else if step === 'result' && result}
		<section class="period-summary-result" aria-labelledby="period-summary-result-heading">
			<h3 id="period-summary-result-heading" tabindex="-1" bind:this={resultHeading}>
				Så här har du skrivit under {PERIOD_LABELS[period]}
			</h3>

			{#if result.themes.length > 0}
				<section class="period-summary-part" aria-labelledby="period-summary-themes">
					<h4 id="period-summary-themes">Det du skrev mest om</h4>
					<ul>
						{#each result.themes as theme, index (index)}
							<li>{theme.text} {@render sourceLinks(theme.sources)}</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if result.changes.length > 0}
				<section class="period-summary-part" aria-labelledby="period-summary-changes">
					<h4 id="period-summary-changes">Möjliga förändringar</h4>
					<ul>
						{#each result.changes as change, index (index)}
							<li>{change.text} {@render sourceLinks(change.sources)}</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if result.moments.length > 0}
				<section class="period-summary-part" aria-labelledby="period-summary-moments">
					<h4 id="period-summary-moments">Stunder att ta med dig</h4>
					<ul class="period-summary-moments">
						{#each result.moments as moment (moment.source.ref)}
							<li>
								<blockquote>{moment.quote}</blockquote>
								{@render sourceLinks([moment.source])}
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if result.question}
				<p class="period-summary-question">{result.question}</p>
			{/if}

			<p class="period-summary-note">
				AI-text som bygger på ett begränsat urval: {result.basis.entryCount}
				{noteWord(result.basis.entryCount)} från {formatLong(result.basis.firstDate)} till
				{formatLong(result.basis.lastDate)}. Varje del länkar till anteckningarna den bygger på. Läs dem gärna själv. Sammanfattningen
				sparas inte.
			</p>

			<div class="period-summary-actions">
				<button
					type="button"
					class="auth-button"
					aria-expanded={basisOpen}
					aria-controls="period-summary-basis"
					onclick={() => (basisOpen = !basisOpen)}
				>
					{basisOpen ? 'Dölj underlaget' : 'Visa underlaget'}
				</button>
				<button type="button" class="auth-button" onclick={hideSummary}>Dölj sammanfattningen</button>
			</div>
			<div id="period-summary-basis" hidden={!basisOpen}>
				{#if basisOpen && preview}
					<h4 id="period-summary-basis-heading">Anteckningarna som sammanfattningen bygger på</h4>
					{@render entryList(preview.entries, 'period-summary-basis-heading')}
				{/if}
			</div>
		</section>
	{:else if (step === 'review' || step === 'generate') && preview}
		<section class="period-summary-review" aria-labelledby="period-summary-review-heading">
			<h3 id="period-summary-review-heading">Det här skickas till OpenAI</h3>
			<p id="period-summary-processing">
				Texten i {preview.entryCount} {noteWord(preview.entryCount)} från {formatLong(preview.firstDate)} till
				{formatLong(preview.lastDate)}, med datum och humörvärden. OpenAI har sitt säte i USA. Inget namn eller
				någon e-post skickas, och sammanfattningen sparas inte.
			</p>
			{#if preview.capped}
				<p class="period-summary-note">
					Det här är ett begränsat urval: de senaste anteckningarna under perioden, upp till taket för en
					sammanfattning.
				</p>
			{/if}
			{#if preview.excludedCount > 0}
				<p class="period-summary-note">
					{preview.excludedCount} {noteWord(preview.excludedCount)} tas inte med. Dina anteckningar finns kvar
					som de är i dagboken.
				</p>
			{/if}

			{@render entryList(preview.entries, 'period-summary-review-heading')}

			{#if needsAiConsent}
				<ConsentGate
					idPrefix="period-summary-ai-consent"
					title="Innan AI sammanfattar dina anteckningar"
					dataLabel={`De ${preview.entryCount} anteckningar du precis har granskat`}
					serviceLabel="OpenAI för att skriva sammanfattningen"
					requireExplicitConfirmation
					onAccept={saveAiConsent}
				/>
			{:else}
				<label class="period-summary-confirmation">
					<input type="checkbox" bind:checked={confirmed} disabled={step === 'generate'} />
					Jag har granskat urvalet och godkänner att OpenAI behandlar just de här anteckningarna för att skriva
					sammanfattningen.
				</label>
				<div class="period-summary-actions">
					<button
						type="button"
						class="auth-button primary"
						aria-describedby="period-summary-processing"
						disabled={!confirmed || step === 'generate'}
						onclick={generate}
					>
						{step === 'generate' ? 'Skriver sammanfattningen…' : 'Skapa sammanfattningen'}
					</button>
					<button type="button" class="auth-button" disabled={step === 'generate'} onclick={hideSummary}>
						Avbryt
					</button>
				</div>
				{#if step === 'generate'}
					<p class="period-summary-note" role="status">Skriver sammanfattningen. Det kan ta upp till en halv minut.</p>
				{/if}
			{/if}
		</section>
	{:else}
		{#if insufficient}
			<p class="period-summary-note" data-testid="period-summary-insufficient">
				En sammanfattning blir möjlig när det finns minst {MIN_PERIOD_SUMMARY_ENTRIES} anteckningar med text under
				{PERIOD_LABELS[period]}. Det finns inget du behöver hålla igång. Du kan också välja en längre period
				ovan.
			</p>
		{/if}
		<button
			type="button"
			class="auth-button primary"
			disabled={step === 'preview'}
			onclick={loadPreview}
			data-testid="period-summary-start"
		>
			{step === 'preview' ? 'Hämtar dina anteckningar…' : 'Sammanfatta mina anteckningar'}
		</button>
		<p class="period-summary-note">
			Gäller {PERIOD_LABELS[period]}. Du får först se exakt vilka anteckningar som skulle skickas, och inget
			skickas förrän du har godkänt dem.
		</p>
	{/if}

	<p class="period-summary-message" role="status" aria-live="polite">{message}</p>
</div>

<style>
	.period-summary,
	.period-summary-review,
	.period-summary-result,
	.period-summary-part {
		display: grid;
		gap: 0.85rem;
	}

	h2,
	h3,
	h4,
	p,
	blockquote,
	ul,
	ol {
		margin: 0;
	}

	h3 {
		font-size: 1.1rem;
	}

	h4 {
		font-size: 1rem;
	}

	h3:focus-visible {
		outline: 2px solid currentColor;
		outline-offset: 4px;
	}

	.period-summary-lead {
		line-height: 1.6;
	}

	/* Läsbar radlängd på breda skärmar. */
	.period-summary p,
	.period-summary li {
		max-width: 68ch;
	}

	.period-summary-result {
		padding: 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--surface-soft, var(--muted)));
		line-height: 1.65;
	}

	.period-summary-part ul {
		display: grid;
		gap: 0.6rem;
		padding-inline-start: 1.2rem;
	}

	.period-summary-moments {
		list-style: none;
		padding-inline-start: 0 !important;
	}

	blockquote {
		border-inline-start: 2px solid hsl(var(--border));
		padding-inline-start: 0.75rem;
		font-style: italic;
		overflow-wrap: anywhere;
	}

	.period-summary-question {
		font-weight: 600;
	}

	.period-summary-sources {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.25rem 0.6rem;
		vertical-align: baseline;
	}

	.period-summary-sources a {
		display: inline-flex;
		align-items: center;
		min-height: 44px;
		padding-inline: 0.15rem;
		color: inherit;
		font-size: 0.9rem;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.period-summary-entries {
		display: grid;
		gap: 0.75rem;
		padding: 0.75rem;
		list-style: none;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--surface));
	}

	.period-summary-entries li {
		display: grid;
		gap: 0.2rem;
	}

	.period-summary-entries li + li {
		padding-top: 0.75rem;
		border-top: 1px solid hsl(var(--border));
	}

	.period-summary-entry-text {
		line-height: 1.55;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.period-summary-entry-meta,
	.period-summary-note,
	.period-summary-message {
		font-size: 0.9rem;
		color: hsl(var(--muted-foreground));
	}

	.period-summary-message:empty {
		display: none;
	}

	.period-summary-confirmation {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		line-height: 1.5;
	}

	.period-summary-confirmation input {
		flex: none;
		width: 1.15rem;
		height: 1.15rem;
		margin-top: 0.2rem;
	}

	.period-summary-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
	}

	button {
		min-height: 44px;
	}
</style>
