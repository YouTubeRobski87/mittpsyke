<script lang="ts">
	import { page } from '$app/state';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { readDiaryDraft, writeDiaryPromptHandoff } from '$lib/diary-draft';
	import type { PageData } from './$types';

	// Månadens ord ska kännas som ett stilla vykort: ett ord, några rader, en
	// fråga. Ingen räknare, ingen påminnelse och inget som säger att man borde
	// göra något. Sidan fungerar utan konto.

	let { data }: { data: PageData } = $props();

	// Rotlayouten lämnar den inloggade användaren som `authenticatedUser`. Sidan
	// läste tidigare `session`, ett fält som inte finns, och behandlade därför
	// alla som utloggade.
	const isSignedIn = $derived(Boolean(page.data.authenticatedUser));
	const diaryHref = $derived(isSignedIn ? '/dagbok/checkin#skriv-sjalv' : '/dagbok?action=new');

	/**
	 * Frågan följer med till dagboken via samma engångsöverlämning som
	 * Spegelvattnet använder: sessionStorage, aldrig URL:en. Den visas där som
	 * en separat rad och skrivs aldrig in i textfältet.
	 *
	 * Inloggad med ett utkast kvar: då lämnas frågan inte över. Den inloggade
	 * editorn visar annars frågan i stället för utkastet, och utkastet ska
	 * alltid gå före.
	 */
	function carryQuestionToDiary() {
		if (isSignedIn && readDiaryDraft().trim().length > 0) return;
		writeDiaryPromptHandoff(data.entry.question);
	}
</script>

<SEO canonical="https://mittpsyke.se/manadens-ord" />

<div class="page">
	<div class="page-container monthly-word">
		<Breadcrumbs items={[{ label: 'Månadens ord' }]} />

		<article class="postcard" aria-labelledby="monthly-word-heading">
			<p class="eyebrow">Månadens ord · {data.entry.monthLabel}</p>
			<h1 id="monthly-word-heading">{data.entry.word}</h1>
			<p class="reflection">{data.entry.reflection}</p>

			<div class="question-block">
				<p class="question-label">En fråga, om du vill ha en</p>
				<p class="question">{data.entry.question}</p>
			</div>

			<div class="actions">
				<a class="primary-action" href={diaryHref} onclick={carryQuestionToDiary}>
					Skriv i dagboken
				</a>
				<p class="action-note">
					Frågan följer med som ett förslag. Du kan dölja den och skriva om något helt annat.
					{#if !isSignedIn}Inget konto behövs, och texten stannar i din webbläsare.{/if}
				</p>
			</div>

			{#if data.article}
				<p class="article-link">
					Vill du läsa mer?
					<a href={data.article.url}>{data.article.title}</a>
				</p>
			{/if}
		</article>

		<p class="footnote">
			Ett nytt ord kommer varje månad. Det finns ingenting att hinna med och ingenting att ta igen.
		</p>
	</div>
</div>

<style>
	.monthly-word {
		max-width: 40rem;
		margin: 0 auto;
		padding: 1rem 1rem 2.5rem;
	}

	.postcard {
		display: grid;
		gap: 1.1rem;
		margin-top: 1rem;
		padding: clamp(1.25rem, 5vw, 2.25rem);
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card, 1rem);
		background: hsl(var(--surface));
	}

	.eyebrow {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.85rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(2rem, 1.4rem + 3vw, 2.9rem);
		line-height: 1.1;
		letter-spacing: -0.02em;
		overflow-wrap: anywhere;
	}

	.reflection {
		margin: 0;
		font-size: 1.08rem;
		line-height: 1.65;
	}

	.question-block {
		display: grid;
		gap: 0.3rem;
		padding: 1rem 1.1rem;
		border-left: 3px solid var(--theme-accent, var(--primary));
		border-radius: 0 0.75rem 0.75rem 0;
		background: hsl(var(--surface-soft));
	}

	.question-label {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.85rem;
	}

	.question {
		margin: 0;
		font-size: 1.15rem;
		font-weight: 600;
		line-height: 1.45;
	}

	.actions {
		display: grid;
		gap: 0.55rem;
		justify-items: start;
	}

	.primary-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.6rem 1.25rem;
		border: 1px solid hsl(var(--foreground) / 0.3);
		border-radius: var(--radius-pill, 999px);
		background: hsl(var(--foreground) / 0.06);
		color: hsl(var(--foreground));
		font-weight: 650;
		text-decoration: none;
		transition: background-color 0.16s ease, border-color 0.16s ease;
	}

	.primary-action:hover {
		border-color: hsl(var(--foreground) / 0.55);
		background: hsl(var(--foreground) / 0.1);
	}

	.action-note,
	.footnote {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.9rem;
		line-height: 1.55;
	}

	.article-link {
		margin: 0;
		padding-top: 1rem;
		border-top: 1px solid hsl(var(--border));
		line-height: 1.55;
	}

	.article-link a {
		color: hsl(var(--foreground));
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.footnote {
		margin-top: 1.25rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.primary-action {
			transition: none;
		}
	}
</style>
