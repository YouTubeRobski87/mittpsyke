<script lang="ts">
	// "Det som börjar synas i dina anteckningar" på Framsteg.
	//
	// Användarens egna ord kommer först. Varje tema är redan godkänt av servern
	// (samma trösklar som resten av analysen) och bär sina anteckningar: antal,
	// datum och ordagranna utdrag. Inget här är skrivet av en språkmodell, och
	// ingen text säger vad ett tema betyder eller orsakar - bara att det nämns.
	//
	// Utdragen renderas alltid som text, aldrig som HTML. Inget av dem lämnar
	// sidan: inga utdrag i länkar, URL:er eller analyshändelser. Länken till
	// anteckningen i Dagboken bär bara dess id.
	//
	// Kortets ram (klassen .card) ägs av Framsteg-sidan, som lägger komponenten
	// i en <section aria-labelledby="recurring-themes-heading">.
	import { diaryEntryHref } from '$lib/diary-entry-link';
	import {
		previewQuotes,
		recurringThemeCountCopy,
		recurringThemeEvidenceCopy,
		recurringThemePeriodCopy,
		type RecurringTheme
	} from '$lib/progress-recurring-themes';

	let {
		themes,
		periodLabel
	}: {
		/** Högst tre teman, i serverns ordning. */
		themes: RecurringTheme[];
		/** T.ex. "den senaste månaden". */
		periodLabel: string;
	} = $props();

	let openEvidence = $state<Record<string, boolean>>({});

	function toggle(id: string) {
		openEvidence = { ...openEvidence, [id]: !openEvidence[id] };
	}
</script>

<div class="recurring-themes">
	<h2 id="recurring-themes-heading">Det som börjar synas i dina anteckningar</h2>
	<p class="recurring-themes-intro">
		Teman som återkommer i det du själv har skrivit {periodLabel}, med dina egna ord. Det
		beskriver vad som nämns, inte varför eller vad det betyder för dig.
	</p>

	<ul class="recurring-themes-list">
		{#each themes as theme, index (theme.id)}
			{@const quotes = previewQuotes(theme)}
			<li class="recurring-theme" data-testid="recurring-theme">
				<h3>{theme.label}</h3>
				<p class="recurring-theme-count">{recurringThemeCountCopy(theme)}</p>
				<p class="recurring-theme-period">{recurringThemePeriodCopy(theme)}</p>

				{#if quotes.length > 0}
					<ul class="recurring-theme-quotes" aria-label={`Ur dina anteckningar om ${theme.label}`}>
						{#each quotes as quote (`${quote.entryId ?? quote.date}-${quote.dateLabel}`)}
							<li>
								<blockquote>{quote.excerpt}</blockquote>
								<time datetime={quote.date}>{quote.dateLabel}</time>
								{#if diaryEntryHref(quote.entryId)}
									<a
										class="recurring-theme-entry-link"
										href={diaryEntryHref(quote.entryId)}
										aria-label={`Läs hela anteckningen från ${quote.dateLabel}`}
									>Läs hela anteckningen</a>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}

				<button
					type="button"
					class="recurring-theme-action"
					aria-expanded={openEvidence[theme.id] === true}
					aria-controls={`recurring-evidence-${index}`}
					onclick={() => toggle(theme.id)}
				>
					{openEvidence[theme.id] ? 'Dölj underlaget' : 'Vad bygger det här på?'}
				</button>

				{#if openEvidence[theme.id]}
					<div class="recurring-theme-evidence" id={`recurring-evidence-${index}`}>
						<p>{recurringThemeEvidenceCopy(theme)}</p>
						<ul>
							{#each theme.evidence as item (`${item.entryId ?? item.date}-${item.dateLabel}`)}
								<li>
									<time datetime={item.date}>{item.dateLabel}</time>
									{#if item.excerpt}
										<blockquote>{item.excerpt}</blockquote>
									{:else}
										<small>Utdraget visas inte här. Anteckningen finns kvar i din dagbok.</small>
									{/if}
									{#if diaryEntryHref(item.entryId)}
										<a
											class="recurring-theme-entry-link"
											href={diaryEntryHref(item.entryId)}
											aria-label={`Läs hela anteckningen från ${item.dateLabel}`}
										>Läs hela anteckningen</a>
									{/if}
								</li>
							{/each}
						</ul>
						<p class="recurring-theme-muted">
							{theme.firstHalfCount} av anteckningarna är från början av perioden och
							{theme.secondHalfCount} från senare delen. Temat räknas fram ur orden i dina anteckningar
							och dina egna taggar, utan AI.
						</p>
						<a class="recurring-theme-link" href="/dagbok">Öppna dagboken</a>
					</div>
				{/if}
			</li>
		{/each}
	</ul>

	<p class="recurring-theme-muted recurring-themes-closing">
		Du kan återvända hit när du vill. Det finns inget att hålla igång.
	</p>
</div>

<style>
	.recurring-themes h2 {
		margin: 0 0 0.6rem;
		font-size: 1.45rem;
		color: hsl(var(--foreground));
	}

	.recurring-themes-intro,
	.recurring-theme-muted,
	.recurring-theme-period {
		max-width: 62ch;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		overflow-wrap: break-word;
	}

	.recurring-themes-intro {
		margin: 0 0 1rem;
	}

	.recurring-themes-list {
		display: grid;
		gap: 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.recurring-theme {
		padding: 1rem 1.1rem;
		border: 1px solid var(--color-dashboard-border, hsl(var(--border)));
		border-radius: 0.9rem;
		background: hsl(var(--surface-soft, var(--muted)) / 0.5);
		min-width: 0;
	}

	.recurring-theme h3 {
		margin: 0 0 0.35rem;
		font-size: 1.1rem;
		color: hsl(var(--foreground));
		overflow-wrap: anywhere;
	}

	.recurring-theme-count {
		margin: 0 0 0.2rem;
		color: hsl(var(--foreground));
		font-weight: 600;
		line-height: 1.5;
	}

	.recurring-theme-period {
		margin: 0 0 0.75rem;
		font-size: 0.92rem;
	}

	.recurring-theme-quotes,
	.recurring-theme-evidence ul {
		display: grid;
		gap: 0.7rem;
		margin: 0 0 0.8rem;
		padding: 0;
		list-style: none;
	}

	.recurring-theme blockquote {
		margin: 0;
		padding-left: 0.75rem;
		border-left: 3px solid hsl(var(--border));
		color: hsl(var(--foreground));
		line-height: 1.5;
		overflow-wrap: break-word;
	}

	.recurring-theme time {
		display: block;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
	}

	.recurring-theme-quotes time {
		margin-top: 0.2rem;
		padding-left: 0.75rem;
	}

	.recurring-theme-quotes .recurring-theme-entry-link {
		margin-left: 0.75rem;
	}

	.recurring-theme-evidence time {
		font-weight: 600;
		color: hsl(var(--foreground));
	}

	.recurring-theme-evidence small {
		color: hsl(var(--muted-foreground));
	}

	.recurring-theme-action {
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

	.recurring-theme-action:focus-visible,
	.recurring-theme-link:focus-visible {
		outline: 2px solid hsl(var(--ring, var(--primary)));
		outline-offset: 2px;
	}

	.recurring-theme-entry-link {
		display: inline-block;
		margin-top: 0.3rem;
		font-size: 0.88rem;
		color: hsl(var(--primary));
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	.recurring-theme-entry-link:focus-visible {
		outline: 2px solid hsl(var(--ring, var(--primary)));
		outline-offset: 2px;
	}

	.recurring-theme-evidence {
		margin-top: 0.9rem;
		padding-top: 0.8rem;
		border-top: 1px solid hsl(var(--border));
	}

	.recurring-theme-evidence > p:first-child {
		margin: 0 0 0.5rem;
		color: hsl(var(--foreground));
	}

	.recurring-theme-link {
		display: inline-block;
		margin-top: 0.6rem;
		color: hsl(var(--primary));
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.recurring-themes-closing {
		margin: 1rem 0 0;
		font-size: 0.9rem;
	}

	@media (max-width: 640px) {
		.recurring-themes h2 {
			font-size: 1.2rem;
		}

		.recurring-theme {
			padding: 0.9rem;
		}
	}
</style>
