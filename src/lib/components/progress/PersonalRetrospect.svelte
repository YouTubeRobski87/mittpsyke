<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import { createHealthConsentRecord, hasHealthConsentInMetadata, HEALTH_CONSENT_STORAGE_KEY, SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
	import { diaryEntryHref } from '$lib/diary-entry-link';
	import { isRetrospectPeriod, RETROSPECT_SEGMENTS, retrospectSnapshotId, type RetrospectPreview, type RetrospectResult, type RetrospectSource } from '$lib/progress-retrospect';
	import type { PeriodDays } from '$lib/progress-recent-period';
	import { supabase } from '$lib/supabase';

	let { period }: { period: PeriodDays } = $props();
	let needsHealthConsent = $state(false);
	let preview = $state<RetrospectPreview | null>(null);
	let result = $state<RetrospectResult | null>(null);
	let step = $state<'idle' | 'preview' | 'generate' | 'consent'>('idle');
	let message = $state('');
	let confirmed = $state(false);
	let request: AbortController | undefined;
	let sources = $state<RetrospectSource[]>([]);
	const coveredSegments = $derived(
		RETROSPECT_SEGMENTS.filter((_, index) => sources.some((source) => source.segment === index))
	);

	function replaceSource(ref: number, replacement: number) {
		const candidate = preview?.candidates.find((source) => source.ref === replacement);
		if (!candidate || sources.some((source) => source.ref === replacement)) return;
		request?.abort();
		request = undefined;
		step = 'idle';
		confirmed = false;
		message = '';
		sources = sources.map((source) => source.ref === ref ? candidate : source).sort((a, b) => a.ref - b.ref);
	}

	const dateFormatter = new Intl.DateTimeFormat('sv-SE', { dateStyle: 'long', timeZone: 'UTC' });
	const dateLabel = (date: string) => dateFormatter.format(new Date(date));

	function clearForHealthConsent() {
		request?.abort();
		request = undefined;
		confirmed = false;
		preview = null;
		result = null;
		sources = [];
		step = 'idle';
		needsHealthConsent = true;
		message = '';
	}

	onMount(() => {
		const handleStorage = (event: StorageEvent) => {
			if (event.storageArea === localStorage && (event.key === null ||
				(event.key === HEALTH_CONSENT_STORAGE_KEY && event.newValue === null))) clearForHealthConsent();
		};
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
			if (event === 'SIGNED_OUT' || (event === 'USER_UPDATED' &&
				!hasHealthConsentInMetadata(session?.user.user_metadata))) clearForHealthConsent();
		});
		let disposed = false;
		const handleFocus = async () => {
			const displayedPreview = preview;
			if (!displayedPreview) return;
			try {
				const { data, error } = await supabase.auth.getUser();
				if (!disposed && preview === displayedPreview &&
					(error || !hasHealthConsentInMetadata(data.user?.user_metadata))) clearForHealthConsent();
			} catch {
				if (!disposed && preview === displayedPreview) clearForHealthConsent();
			}
		};
		window.addEventListener('storage', handleStorage);
		window.addEventListener('focus', handleFocus);
		return () => {
			disposed = true;
			window.removeEventListener('storage', handleStorage);
			window.removeEventListener('focus', handleFocus);
			subscription.unsubscribe();
		};
	});
	onDestroy(() => request?.abort());

	async function saveHealthConsent() {
		const { data, error } = await supabase.auth.updateUser({
			data: { health_data_processing_consent: createHealthConsentRecord() }
		});
		if (error || !hasHealthConsentInMetadata(data.user?.user_metadata)) throw new Error();
		needsHealthConsent = false;
		message = 'Samtycket är sparat. Du kan nu välja att visa utdragen.';
	}

	async function perform(action: 'preview' | 'generate' | 'consent') {
		if (request || (action === 'generate' && !confirmed) || needsHealthConsent || !isRetrospectPeriod(period) || (action !== 'preview' && !preview)) return;
		const controller = new AbortController();
		request = controller;
		step = action;
		message = '';
		const { signal } = controller;
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (signal.aborted) return;
			if (!session) throw new Error();
			const headers = {
				Authorization: `Bearer ${session.access_token}`,
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			};
			if (action === 'consent') {
				const response = await fetch('/api/consent/diary-ai', { method: 'POST', headers, signal });
				if (signal.aborted) return;
				if (!response.ok) throw new Error();
				message = 'Samtycket är sparat. Du väljer själv om du vill skapa återblicken.';
				return;
			}

			const path = '/api/diary/insights/retrospect';
			let response: Response;
			if (action === 'preview') {
				response = await fetch(`${path}?period=${period}`, { headers, signal, cache: 'no-store' });
			} else {
				const snapshotId = await retrospectSnapshotId(session.user.id, period, sources);
				if (signal.aborted) return;
				response = await fetch(path, {
					method: 'POST',
					headers: { ...headers, 'Content-Type': 'application/json' },
					body: JSON.stringify({ period, refs: sources.map(({ ref }) => ref), snapshotId, confirmed }),
					signal
				});
			}
			const payload = await response.json();
			if (signal.aborted) return;
			if (response.status === 403 && payload.reason === 'health-consent') {
				clearForHealthConsent();
				return;
			}
			if (response.status === 403 && payload.reason === 'ai-consent') {
				step = 'consent';
				return;
			}
			if (response.ok) {
				if (action === 'preview') {
					preview = payload;
					sources = payload.sources;
				} else {
					result = payload;
					confirmed = false;
					message = 'Återblicken är klar.';
				}
				return;
			}

			if (payload.reason === 'changed') {
				preview = null;
				confirmed = false;
				message = 'Underlaget har ändrats. Visa utdragen igen för att läsa det nya urvalet.';
			} else if (payload.reason === 'insufficient-data') {
				message = 'Det finns ännu för lite passande underlag för en återblick för perioden.';
			} else if (payload.reason === 'withheld') {
				message = 'En återblick kan inte skapas från de här utdragen. Du kan fortfarande läsa i din dagbok.';
			} else if (payload.reason === 'rate-limit') {
				message = 'Vänta en liten stund innan du ber om en ny återblick.';
			} else if (payload.reason === 'invalid-response') {
				message = 'Det gick inte att ta fram en återblick som kunde verifieras mot utdragen.';
			} else throw new Error();
		} catch {
			if (!signal.aborted) {
				message = action === 'consent' ? 'Samtycket kunde inte sparas just nu.' : 'Det gick inte att hämta återblicken just nu.';
			}
		} finally {
			if (!signal.aborted) {
				request = undefined;
				if (step !== 'consent' || action === 'consent') step = 'idle';
			}
		}
	}
</script>

<h2 id="personal-retrospect-heading">Din personliga återblick</h2>
<p>Se vad du själv har beskrivit över tid – återkommande stunder, möjliga förändringar och sådant du vill ta med dig.</p>

{#if !isRetrospectPeriod(period)}
	<p>Välj 30 dagar eller 3 månader för att se utdrag till återblicken.</p>
{:else if needsHealthConsent}
	<ConsentGate
		idPrefix="retrospect-health-consent"
		title="Innan MittPsyke visar utdragen"
		dataLabel="Dina sparade dagbokstexter"
		serviceLabel="MittPsyke för att visa underlaget för återblicken"
		requireExplicitConfirmation
		onAccept={saveHealthConsent}
	/>
{:else if result}
	<div class="retrospect-result" aria-labelledby="retrospect-result-heading">
		<h3 id="retrospect-result-heading">Några stunder i dina egna ord</h3>
		<p class="retrospect-note">Återblicken gäller de valda utdragen ur perioden.</p>
		{#each result.observations as observation (observation.text)}
			<p>
				{observation.text}
				<span class="retrospect-source-links">
					{#each result.sources.filter(({ ref }) => observation.refs.includes(ref)) as source (source.ref)}
						<a href={diaryEntryHref(source.entryId)} class="retrospect-source-link" aria-label={`Källa, ${dateLabel(source.date)}`}>[{source.ref}]</a>
					{/each}
				</span>
			</p>
		{:else}
			<p>De valda utdragen finns kvar att läsa. Den här gången gick det inte att formulera en observation med tydligt stöd i dem.</p>
		{/each}
		{#if result.question}<p>{result.question}</p>{/if}
		<p class="retrospect-note">AI föreslog observationer som MittPsyke kontrollerade. Återblicken sparas inte.</p>
		<details>
			<summary>Visa utdrag och källor</summary>
			<ul class="retrospect-sources">
				{#each result.sources as source (source.ref)}
					<li>
						<blockquote>{source.excerpt}</blockquote>
						<a class="retrospect-source-link" href={diaryEntryHref(source.entryId)}>[{source.ref}] Läs anteckningen från {dateLabel(source.date)}</a>
					</li>
				{/each}
			</ul>
		</details>
		<button type="button" class="auth-button" onclick={() => (result = null)}>Dölj återblicken</button>
	</div>
{:else if preview}
	<p id="retrospect-processing">Om du skapar återblicken behandlar OpenAI de {sources.length} utdragen nedan efter ditt samtycke. Utdragen är ett begränsat urval ur perioden.</p>
	<p class="retrospect-note">Delar av perioden i urvalet: {coveredSegments.join(', ').toLocaleLowerCase('sv')}.</p>
	<details class="retrospect-note">
		<summary>Så väljs utdragen</summary>
		<p>MittPsyke föreslår högst fyra korta anteckningar eller hela inledande stycken, utspridda över kalenderperioden där det finns passande text. Du kan byta ut utdragen. Högst ett utdrag per skrivdag ingår.</p>
	</details>
	<ul class="retrospect-sources">
		{#each sources as source (source.ref)}
			<li>
				<time datetime={source.date}>{dateLabel(source.date)}</time>
				<blockquote>{source.excerpt}</blockquote>
				{#if preview.candidates.length > sources.length}
					<label class="retrospect-replacement">
						Byt utdrag från {dateLabel(source.date)}
						<select value={source.ref} onchange={(event) => replaceSource(source.ref, Number(event.currentTarget.value))}>
							<option value={source.ref}>Behåll utdraget</option>
							{#each preview.candidates.filter((candidate) => !sources.some(({ ref }) => ref === candidate.ref)) as candidate (candidate.ref)}
								<option value={candidate.ref}>{dateLabel(candidate.date)}</option>
							{/each}
						</select>
					</label>
				{/if}
			</li>
		{/each}
	</ul>
	{#if step === 'consent'}
		<ConsentGate
			idPrefix="retrospect-ai-consent"
			title="Innan AI skapar en återblick"
			dataLabel={`De ${sources.length} utdrag du precis har granskat`}
			serviceLabel="OpenAI för att föreslå observationer från de valda utdragen"
			requireExplicitConfirmation
			onAccept={() => perform('consent')}
		/>
	{:else}
		<label class="retrospect-confirmation">
			<input type="checkbox" bind:checked={confirmed} disabled={step !== 'idle'} />
			Jag samtycker till att OpenAI behandlar just de här utdragen för att skapa återblicken.
		</label>
		<button type="button" class="auth-button primary" aria-describedby="retrospect-processing" disabled={!confirmed || step !== 'idle'} onclick={() => perform('generate')}>
			{step === 'generate' ? 'Skapar återblicken…' : 'Skapa min personliga återblick'}
		</button>
	{/if}
{:else}
	<button type="button" class="auth-button" disabled={step !== 'idle'} onclick={() => perform('preview')}>
		{step === 'preview' ? 'Hämtar utdragen…' : 'Visa utdrag för återblicken'}
	</button>
{/if}
<p class="retrospect-note" role="status">{message}</p>

<style>
	h2, h3, p, blockquote {
		margin: 0;
	}

	a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	button {
		min-height: 44px;
		justify-self: start;
	}

	.retrospect-confirmation {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
	}

	.retrospect-confirmation input {
		margin-top: 0.3rem;
	}

	.retrospect-replacement {
		display: grid;
		gap: 0.25rem;
		margin-top: 0.5rem;
		max-width: 24rem;
	}

	.retrospect-replacement select {
		min-height: 44px;
		max-width: 100%;
		padding: 0.35rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.5rem;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
	}

	.retrospect-sources {
		display: grid;
		gap: 0.8rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.retrospect-result {
		display: grid;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid hsl(var(--border));
		border-radius: 0.75rem;
		background: hsl(var(--surface-soft, var(--muted)));
	}

	.retrospect-source-links {
		display: inline-flex;
		flex-wrap: wrap;
		gap: 0.4rem;
		vertical-align: middle;
	}

	.retrospect-source-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 44px;
		min-height: 44px;
	}

	blockquote {
		border-inline-start: 2px solid hsl(var(--border));
		padding-inline-start: 0.75rem;
		line-height: 1.6;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	time, .retrospect-note {
		font-size: 0.9rem;
		color: hsl(var(--muted-foreground));
	}

	.retrospect-note:empty {
		display: none;
	}
</style>
