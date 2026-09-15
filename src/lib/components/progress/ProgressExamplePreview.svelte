<script lang="ts">
	// Märkt, påhittat exempel på vad Framstegs återblick kan visa efter en
	// månad. Visas på startsidan (under "Se vad som återkommer.") och i Framsteg
	// för den som inte är inloggad.
	//
	// Ersätter de tidigare suddiga korten, som antingen var tomma eller kunde
	// läsas som riktiga värden. Allt här är påhittat och märkt som exempel på
	// varje nivå: rubrik, etikett, siffror och citat. Dagarna heter "Exempeldag"
	// i stället för riktiga datum, och inget hämtas från någon användare.
	// Texterna ligger i $lib/progress-example så att språkreglerna kan testas.
	import {
		EXAMPLE_PREVIEW_HEADING,
		LIGHTER_DAYS_EXAMPLE,
		RECURRING_THEME_EXAMPLE,
		RECURRING_THEME_EXAMPLE_COUNT,
		RECURRING_THEME_EXAMPLE_OBSERVATION
	} from '$lib/progress-example';

	let {
		headingLevel = 2,
		context = 'progress'
	}: {
		/** 3 på startsidan, där exemplet ligger under sektionens egen h2. */
		headingLevel?: 2 | 3;
		/** 'home' visar bara "Det som återkommer"; 'progress' även lättare dagar. */
		context?: 'home' | 'progress';
	} = $props();

	const headingId = $derived('example-preview-heading-' + context);
	const headingTag = $derived(headingLevel === 3 ? 'h3' : 'h2');
	const cardHeadingTag = $derived(headingLevel === 3 ? 'h4' : 'h3');
	let evidenceOpen = $state(false);
</script>

<section
	class="example-preview"
	aria-labelledby={headingId}
	data-testid="progress-example-preview"
	data-context={context}
>
	<p class="example-badge">Exempel</p>
	<svelte:element this={headingTag} id={headingId} class="example-heading">
		{EXAMPLE_PREVIEW_HEADING}
	</svelte:element>
	<p class="example-disclaimer">
		Påhittat exempel. Siffrorna och texterna nedan är inte dina och kommer inte från någon riktig
		person. Med ett konto bygger återblicken bara på det du själv sparar.
	</p>

	<div class="example-cards">
		<div class="example-card">
			<p class="example-card-label">Exempel · Det som återkommer</p>
			<svelte:element this={cardHeadingTag} class="example-card-title">
				{RECURRING_THEME_EXAMPLE.label}
			</svelte:element>
			<p class="example-note">{RECURRING_THEME_EXAMPLE_COUNT}</p>
			<p class="example-comparison">{RECURRING_THEME_EXAMPLE_OBSERVATION}</p>
			<ul class="example-evidence" aria-label="Exempelmeningar där temat nämndes">
				{#each RECURRING_THEME_EXAMPLE.quotes as quote (quote.day)}
					<li>
						<strong>{quote.day}</strong>
						<blockquote>Exempeltext: {quote.text}</blockquote>
					</li>
				{/each}
			</ul>
		</div>

		{#if context === 'progress'}
			<div class="example-card">
				<p class="example-card-label">Exempel · Det som ofta fanns med under lättare dagar</p>
				<svelte:element this={cardHeadingTag} class="example-card-title">
					{LIGHTER_DAYS_EXAMPLE.label}
				</svelte:element>
				<p class="example-note">{LIGHTER_DAYS_EXAMPLE.note}</p>
				<p class="example-comparison">{LIGHTER_DAYS_EXAMPLE.comparison}</p>
				<button
					type="button"
					class="example-action"
					aria-expanded={evidenceOpen}
					aria-controls="example-evidence"
					onclick={() => (evidenceOpen = !evidenceOpen)}
				>
					{evidenceOpen ? 'Dölj exempelunderlaget' : 'Visa exempelunderlaget'}
				</button>
				{#if evidenceOpen}
					<ul class="example-evidence" id="example-evidence">
						{#each LIGHTER_DAYS_EXAMPLE.quotes as quote (quote.day)}
							<li>
								<strong>{quote.day} · humör {quote.mood} av 10</strong>
								<blockquote>Exempeltext: {quote.text}</blockquote>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>

	<p class="example-footnote">
		{#if context === 'home'}
			Ett tema visas först när det har återkommit minst 3 gånger under minst 2 olika veckor. Det är
			dina egna ord över tid – ingen poäng och ingen bedömning.
		{:else}
			I din egen återblick visar "Visa underlaget" dina egna inlägg med datum, och du kan byta namn på
			ett tema eller ta bort det. Dina inlägg ändras aldrig.
		{/if}
	</p>
</section>

<style>
	/* Färgerna går via --example-*, så att en sida med egen palett (startsidan)
	   kan ge exemplet sina färger. Utan dem gäller appens tema. */
	.example-preview {
		--ex-bg: var(--example-surface, hsl(var(--surface)));
		--ex-card: var(--example-card, hsl(var(--muted) / 0.35));
		--ex-fg: var(--example-text, hsl(var(--foreground)));
		--ex-muted: var(--example-muted, hsl(var(--muted-foreground)));
		--ex-border: var(--example-border, hsl(var(--border)));
		--ex-badge-bg: var(--example-badge-bg, hsl(var(--foreground)));
		--ex-badge-fg: var(--example-badge-fg, hsl(var(--background)));
		padding: clamp(1.25rem, 3vw, 2.5rem);
		border: 2px dashed var(--ex-border);
		border-radius: var(--radius-card, 1.25rem);
		background: var(--ex-bg);
		min-width: 0;
	}

	.example-badge {
		display: inline-flex;
		margin: 0 0 0.6rem;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		background: var(--ex-badge-bg);
		color: var(--ex-badge-fg);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.example-heading {
		margin: 0 0 0.5rem;
		font-size: clamp(1.25rem, 3vw, 1.45rem);
		color: var(--ex-fg);
		text-wrap: balance;
	}

	.example-disclaimer,
	.example-comparison,
	.example-footnote {
		max-width: 62ch;
		margin: 0 0 1rem;
		color: var(--ex-muted);
		line-height: 1.55;
		overflow-wrap: break-word;
	}

	/* Två kort sida vid sida när det finns plats, annars under varandra. */
	.example-cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(min(100%, 18rem), 1fr));
		gap: 1rem;
	}

	.example-card {
		padding: 1rem 1.1rem;
		border: 1px dashed var(--ex-border);
		border-radius: 0.9rem;
		background: var(--ex-card);
		min-width: 0;
	}

	.example-card-label {
		margin: 0 0 0.4rem;
		color: var(--ex-muted);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		overflow-wrap: break-word;
	}

	.example-card-title {
		margin: 0 0 0.35rem;
		font-size: 1.1rem;
		color: var(--ex-fg);
	}

	.example-note {
		margin: 0 0 0.25rem;
		color: var(--ex-fg);
		font-weight: 600;
		line-height: 1.5;
		overflow-wrap: break-word;
	}

	.example-comparison {
		margin-bottom: 0.75rem;
		font-size: 0.92rem;
	}

	.example-action {
		min-height: 44px;
		padding: 0.5rem 0.9rem;
		border: 1px solid var(--ex-border);
		border-radius: 999px;
		background: var(--ex-bg);
		color: var(--ex-fg);
		font: inherit;
		font-size: 0.92rem;
		font-weight: 600;
		cursor: pointer;
	}

	.example-action:focus-visible {
		outline: 2px solid hsl(var(--ring, var(--primary)));
		outline-offset: 2px;
	}

	.example-evidence {
		display: grid;
		gap: 0.7rem;
		margin: 0.9rem 0 0;
		padding: 0.8rem 0 0;
		border-top: 1px solid var(--ex-border);
		list-style: none;
	}

	.example-evidence strong {
		display: block;
		font-size: 0.88rem;
		color: var(--ex-fg);
	}

	.example-evidence blockquote {
		margin: 0.25rem 0 0;
		padding-left: 0.75rem;
		border-left: 3px dashed var(--ex-border);
		color: var(--ex-muted);
		font-style: italic;
		line-height: 1.5;
		overflow-wrap: break-word;
	}

	.example-footnote {
		margin: 1rem 0 0;
		font-size: 0.9rem;
	}
</style>
