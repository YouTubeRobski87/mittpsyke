<script lang="ts">
	// Förhandsvisning av Framstegs återblick för den som inte är inloggad.
	//
	// Ersätter de tidigare suddiga korten, som antingen var tomma eller kunde
	// läsas som riktiga värden. Allt här är påhittat och märkt som exempel på
	// varje nivå: rubrik, etikett, siffror och citat. Dagarna heter "Exempeldag"
	// i stället för riktiga datum, och inget hämtas från någon användare.
	const EXAMPLE_THEME = {
		label: 'Promenad',
		note: 'Promenad fanns med i 4 av 6 inlägg med högre humör (30 dagar).',
		comparison: 'I övriga inlägg: 1 av 8. Spritt över 3 veckor.',
		evidence: [
			{ day: 'Exempeldag 4', mood: '7,0', excerpt: 'Tog en promenad runt sjön efter middagen.' },
			{ day: 'Exempeldag 11', mood: '7,5', excerpt: 'Kort promenad i lunchen, solen var framme.' },
			{ day: 'Exempeldag 19', mood: '8,0', excerpt: 'Promenad med en vän på eftermiddagen.' },
			{ day: 'Exempeldag 26', mood: '7,0', excerpt: 'Gick en promenad innan jag skrev det här.' }
		]
	} as const;

	let evidenceOpen = $state(false);
</script>

<section class="example-preview" aria-labelledby="example-preview-heading" data-testid="progress-example-preview">
	<p class="example-badge">Exempel</p>
	<h2 id="example-preview-heading">Så här kan det se ut efter en månad</h2>
	<p class="example-disclaimer">
		Påhittat exempel. Siffrorna och texterna nedan är inte dina och kommer inte från någon riktig
		person. När du har ett konto räknas återblicken bara på det du själv sparar.
	</p>

	<div class="example-card">
		<p class="example-card-label">Exempel · Det som ofta fanns med under lättare dagar</p>
		<h3>{EXAMPLE_THEME.label}</h3>
		<p class="example-note">{EXAMPLE_THEME.note}</p>
		<p class="example-comparison">{EXAMPLE_THEME.comparison}</p>
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
				{#each EXAMPLE_THEME.evidence as item (item.day)}
					<li>
						<strong>{item.day} · humör {item.mood} av 10</strong>
						<blockquote>Exempeltext: {item.excerpt}</blockquote>
					</li>
				{/each}
			</ul>
		{/if}
		<p class="example-footnote">
			I din egen återblick visar "Visa underlaget" dina egna inlägg med datum, och du kan byta namn på
			ett tema eller ta bort det. Dina inlägg ändras aldrig.
		</p>
	</div>
</section>

<style>
	.example-preview {
		padding: clamp(1.25rem, 3vw, 2.5rem);
		border: 2px dashed hsl(var(--border));
		border-radius: var(--radius-card, 1.25rem);
		background: hsl(var(--surface));
		min-width: 0;
	}

	.example-badge {
		display: inline-flex;
		margin: 0 0 0.6rem;
		padding: 0.2rem 0.65rem;
		border-radius: 999px;
		background: hsl(var(--foreground));
		color: hsl(var(--background));
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.example-preview h2 {
		margin: 0 0 0.5rem;
		font-size: clamp(1.25rem, 3vw, 1.45rem);
		color: hsl(var(--foreground));
		text-wrap: balance;
	}

	.example-disclaimer,
	.example-comparison,
	.example-footnote {
		max-width: 62ch;
		margin: 0 0 1rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		overflow-wrap: break-word;
	}

	.example-card {
		padding: 1rem 1.1rem;
		border: 1px dashed hsl(var(--border));
		border-radius: 0.9rem;
		background: hsl(var(--muted) / 0.35);
	}

	.example-card-label {
		margin: 0 0 0.4rem;
		color: hsl(var(--muted-foreground));
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		overflow-wrap: break-word;
	}

	.example-card h3 {
		margin: 0 0 0.35rem;
		font-size: 1.1rem;
		color: hsl(var(--foreground));
	}

	.example-note {
		margin: 0 0 0.25rem;
		color: hsl(var(--foreground));
		font-weight: 600;
		line-height: 1.5;
	}

	.example-comparison {
		margin-bottom: 0.75rem;
		font-size: 0.92rem;
	}

	.example-action {
		min-height: 44px;
		padding: 0.5rem 0.9rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--surface));
		color: hsl(var(--foreground));
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
		border-top: 1px solid hsl(var(--border));
		list-style: none;
	}

	.example-evidence strong {
		display: block;
		font-size: 0.88rem;
		color: hsl(var(--foreground));
	}

	.example-evidence blockquote {
		margin: 0.25rem 0 0;
		padding-left: 0.75rem;
		border-left: 3px dashed hsl(var(--border));
		color: hsl(var(--muted-foreground));
		font-style: italic;
		line-height: 1.5;
	}

	.example-footnote {
		margin: 1rem 0 0;
		font-size: 0.9rem;
	}
</style>
