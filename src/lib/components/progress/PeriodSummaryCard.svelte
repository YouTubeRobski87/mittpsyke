<script lang="ts">
	// "Det du har skrivit": en sammanhängande AI-text om hela dagboken, med
	// klickbara hänvisningar till anteckningarna den bygger på.
	//
	// Flödet är alltid: granska urvalet -> godkänn uttryckligen -> skriv texten.
	// Inget AI-anrop görs utan godkännandet, och servern kontrollerar samtyckena
	// igen. Resultatet lever bara i den här komponenten och sparas aldrig.
	// Ändrat urval eller återkallat samtycke tömmer allt som visas.
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
		type PeriodSummaryPreview,
		type PeriodSummaryResult,
		type PeriodSummarySource
	} from '$lib/progress-period-summary';
	import { supabase } from '$lib/supabase';

	type Step = 'idle' | 'preview' | 'review' | 'generate' | 'result';

	const ENDPOINT = '/api/diary/insights/period-summary';
	/** Samma tak som servern läser (SUMMARY_ROW_LIMIT). */
	const SUMMARY_ROW_LIMIT_LABEL = '1 000';

	let step = $state<Step>('idle');
	let preview = $state<PeriodSummaryPreview | null>(null);
	let result = $state<PeriodSummaryResult | null>(null);
	let confirmed = $state(false);
	/** Anteckningar användaren valt bort i granskningen. Skickas aldrig. */
	let omitted = $state<string[]>([]);
	const includedEntries = $derived(preview ? preview.entries.filter(({ entryId }) => !omitted.includes(entryId)) : []);
	let needsHealthConsent = $state(false);
	let needsAiConsent = $state(false);
	let basisOpen = $state(false);
	let message = $state('');
	let insufficient = $state(false);
	let request: AbortController | undefined;
	let resultHeading = $state<HTMLElement | null>(null);

	const longDate = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
	const shortDate = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', timeZone: 'UTC' });
	const shortDateWithYear = new Intl.DateTimeFormat('sv-SE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
	const currentYear = String(new Date().getFullYear());
	const toDate = (date: string) => new Date(`${date}T12:00:00Z`);
	const formatLong = (date: string | null) => (date ? longDate.format(toDate(date)) : '');
	// Året visas bara när anteckningen är från ett annat år än i år.
	const formatShort = (date: string) =>
		(date.startsWith(currentYear) ? shortDate : shortDateWithYear).format(toDate(date));
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
		omitted = [];
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
				return 'Vänta en minut innan du ber om en ny text.';
			case 'daily-limit':
				return 'Du har bett om fem texter i dag. Du kan göra en ny i morgon.';
			case 'withheld':
				return 'En text kan inte visas för de här anteckningarna. Dina anteckningar finns kvar i dagboken.';
			case 'invalid-response':
				return 'Det gick inte att ta fram en text som kunde kontrolleras mot dina anteckningar. Du kan försöka igen om en stund.';
			default:
				return 'Det gick inte att ta fram texten just nu. Försök igen om en stund.';
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
			const response = await fetch(ENDPOINT, {
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
			omitted = [];
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
		if (request || !preview || !confirmed || includedEntries.length < MIN_PERIOD_SUMMARY_ENTRIES) return;
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
				body: JSON.stringify({ snapshotId: preview.snapshotId, confirmed: true, omit: omitted }),
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
				message = 'Dina anteckningar har ändrats sedan du granskade dem. Granska urvalet igen innan du fortsätter.';
				return;
			}
			if (response.status === 422 && payload.reason === 'insufficient-data') {
				reset();
				insufficient = true;
				return;
			}
			if (response.status === 422 && payload.reason === 'too-few-selected') {
				confirmed = false;
				step = 'review';
				message = `Välj minst ${MIN_PERIOD_SUMMARY_ENTRIES} anteckningar att ta med.`;
				return;
			}
			if (!response.ok || !Array.isArray(payload.paragraphs)) {
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
		message = 'Samtycket är sparat. Tryck på Skriv texten för att fortsätta.';
	}

	/** Ett ändrat urval kräver ett nytt godkännande, så godkännandet alltid gäller exakt det som skickas. */
	function toggleEntry(entryId: string, include: boolean) {
		omitted = include ? omitted.filter((id) => id !== entryId) : [...omitted, entryId];
		confirmed = false;
	}

	function hideSummary() {
		reset();
		message = '';
	}
</script>

{#snippet sourceLinks(sources: PeriodSummarySource[])}
	{' '}<span class="period-summary-sources"
		>({#each sources as source, index (source.ref)}{@const href = diaryEntryHref(source.entryId)}{#if index > 0}{', '}{/if}{#if href}<a {href} aria-label={`Läs anteckningen från ${formatLong(source.date)}`}
					>{formatShort(source.date)}</a
				>{:else}{formatShort(source.date)}{/if}{/each})</span
	>
{/snippet}

{#snippet entryList(entries: PeriodSummaryPreview['entries'], labelledBy: string, selectable = false)}
	<ol class="period-summary-entries" aria-labelledby={labelledBy}>
		{#each entries as entry (entry.ref)}
			{@const included = !omitted.includes(entry.entryId)}
			<li class:period-summary-entry-omitted={selectable && !included}>
				<p class="period-summary-entry-meta">
					<time datetime={entry.date}>{formatLong(entry.date)}</time>
					{#if entry.mood !== null}<span>· humör {formatMood(entry.mood)} av 10</span>{/if}
				</p>
				{#if selectable}
					<label class="period-summary-entry-toggle">
						<input
							type="checkbox"
							checked={included}
							disabled={step === 'generate'}
							onchange={(event) => toggleEntry(entry.entryId, event.currentTarget.checked)}
							aria-label={`Ta med anteckningen från ${formatLong(entry.date)}`}
						/>
						Ta med
					</label>
				{/if}
				<p class="period-summary-entry-text">{entry.text}</p>
			</li>
		{/each}
	</ol>
{/snippet}

<div class="period-summary" data-testid="period-summary">
	<h2 id="period-summary-heading">Det du har skrivit</h2>
	<p class="period-summary-lead">
		En sammanhängande text om allt du har skrivit i dagboken: det som återkommer, det som har förändrats och
		det du själv lyft fram. Varje del länkar till anteckningarna den bygger på.
	</p>

	{#if needsHealthConsent}
		<ConsentGate
			idPrefix="period-summary-health-consent"
			title="Innan MittPsyke visar dina anteckningar"
			dataLabel="Dina sparade dagbokstexter"
			serviceLabel="MittPsyke för att visa urvalet till texten"
			requireExplicitConfirmation
			onAccept={saveHealthConsent}
		/>
	{:else if step === 'result' && result}
		<section class="period-summary-result" aria-labelledby="period-summary-result-heading">
			<h3 id="period-summary-result-heading" tabindex="-1" bind:this={resultHeading}>Så här har du skrivit</h3>

			<div class="period-summary-prose">
				{#each result.paragraphs as paragraph, index (index)}
					<p>
						{#each paragraph as segment, part (part)}{#if 'sources' in segment}
								{@render sourceLinks(segment.sources)}{:else}{segment.text}{/if}{/each}
					</p>
				{/each}
			</div>

			{#if result.question}
				<p class="period-summary-question">{result.question}</p>
			{/if}

			<p class="period-summary-note">
				AI-text som bygger på {result.basis.entryCount}
				{noteWord(result.basis.entryCount)} från {formatLong(result.basis.firstDate)} till
				{formatLong(result.basis.lastDate)}. Datumen i texten länkar till anteckningarna. Läs dem gärna själv,
				det är du som vet vad de betyder. Texten sparas inte.
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
				<button type="button" class="auth-button" onclick={hideSummary}>Dölj texten</button>
			</div>
			<div id="period-summary-basis" hidden={!basisOpen}>
				{#if basisOpen && preview}
					<h4 id="period-summary-basis-heading">Anteckningarna som texten bygger på</h4>
					{@render entryList(includedEntries, 'period-summary-basis-heading')}
				{/if}
			</div>
		</section>
	{:else if (step === 'review' || step === 'generate') && preview}
		<section class="period-summary-review" aria-labelledby="period-summary-review-heading">
			<h3 id="period-summary-review-heading">Det här skickas till OpenAI</h3>
			<p id="period-summary-processing">
				Texten i de anteckningar du markerar nedan, från {formatLong(preview.firstDate)} till
				{formatLong(preview.lastDate)}, med datum och humörvärden. OpenAI har sitt säte i USA. Ditt kontonamn
				och din e-postadress skickas inte, men texterna skickas precis som du skrev dem, även namn och
				andra uppgifter som står i dem. Texten sparas inte.
			</p>
			{#if preview.capped}
				<p class="period-summary-note">
					Alla {preview.availableCount} anteckningar ryms inte. Därför skickas {preview.entryCount} som är
					jämnt spridda från den första till den senaste, och långa anteckningar kortas.
				</p>
			{/if}
			{#if preview.truncated}
				<p class="period-summary-note">
					Dagboken har fler än {SUMMARY_ROW_LIMIT_LABEL} anteckningar. Bara de senaste {SUMMARY_ROW_LIMIT_LABEL}
					är med i urvalet, så de allra äldsta kommer inte med.
				</p>
			{/if}
			{#if preview.excludedCount > 0}
				<p class="period-summary-note">
					{preview.excludedCount} {noteWord(preview.excludedCount)} tas inte med. Dina anteckningar finns kvar
					som de är i dagboken.
				</p>
			{/if}
			{#if preview.skippedCount > 0}
				<p class="period-summary-note">
					{preview.skippedCount} {noteWord(preview.skippedCount)} hoppas över eftersom de är mycket korta eller ser
					ut som inklistrad text. MittPsykes egna reflektioner i incheckningar skickas inte heller.
				</p>
			{/if}
			<p class="period-summary-note">
				Ta bort bocken vid sådant du inte vill att texten ska bygga på, till exempel tester eller text du klistrat
				in. {includedEntries.length} av {preview.entries.length} är med.
			</p>

			{@render entryList(preview.entries, 'period-summary-review-heading', true)}

			{#if needsAiConsent}
				<ConsentGate
					idPrefix="period-summary-ai-consent"
					title="Innan AI skriver om dina anteckningar"
					dataLabel={`De ${includedEntries.length} anteckningar du precis har granskat`}
					serviceLabel="OpenAI för att skriva texten"
					requireExplicitConfirmation
					onAccept={saveAiConsent}
				/>
			{:else}
				<label class="period-summary-confirmation">
					<input type="checkbox" bind:checked={confirmed} disabled={step === 'generate'} />
					Jag har granskat urvalet och godkänner att OpenAI behandlar just de {includedEntries.length} markerade
					anteckningarna för att skriva texten.
				</label>
				<div class="period-summary-actions">
					<button
						type="button"
						class="auth-button primary"
						aria-describedby="period-summary-processing"
						disabled={!confirmed || step === 'generate' || includedEntries.length < MIN_PERIOD_SUMMARY_ENTRIES}
						onclick={generate}
					>
						{step === 'generate' ? 'Skriver texten…' : 'Skriv texten'}
					</button>
					<button type="button" class="auth-button" disabled={step === 'generate'} onclick={hideSummary}>
						Avbryt
					</button>
				</div>
				{#if step === 'generate'}
					<p class="period-summary-note" role="status">Skriver texten. Det kan ta upp till en halv minut.</p>
				{/if}
			{/if}
		</section>
	{:else}
		{#if insufficient}
			<p class="period-summary-note" data-testid="period-summary-insufficient">
				En text blir möjlig när det finns minst {MIN_PERIOD_SUMMARY_ENTRIES} anteckningar med text i dagboken.
				Det finns inget du behöver hålla igång.
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
			Gäller allt du har skrivit, oavsett vald period. Du får först se exakt vilka anteckningar som skulle
			skickas, och inget skickas förrän du har godkänt dem.
		</p>
	{/if}

	<p class="period-summary-message" role="status" aria-live="polite">{message}</p>
</div>

<style>
	.period-summary,
	.period-summary-review,
	.period-summary-result {
		display: grid;
		gap: 0.85rem;
	}

	h2,
	h3,
	h4,
	p,
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

	.period-summary-prose {
		display: grid;
		gap: 0.9rem;
		font-size: 1.02rem;
		line-height: 1.75;
	}

	.period-summary-prose p {
		overflow-wrap: anywhere;
	}

	.period-summary-question {
		font-weight: 600;
	}

	.period-summary-sources {
		color: hsl(var(--muted-foreground));
		font-size: 0.9em;
	}

	/* Tryckytan förstoras utan att radavståndet i löptexten ändras. */
	.period-summary-sources a {
		display: inline-block;
		white-space: nowrap;
		padding-block: 0.6rem;
		margin-block: -0.6rem;
		color: inherit;
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

	.period-summary-entry-toggle {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		min-height: 44px;
		font-size: 0.9rem;
	}

	.period-summary-entry-toggle input {
		width: 1.15rem;
		height: 1.15rem;
	}

	.period-summary-entry-omitted .period-summary-entry-text {
		opacity: 0.45;
		text-decoration: line-through;
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
