<script lang="ts">
	import { guides, pillars } from '$lib/seo-kit/content';

	type SearchResult = {
		href: string;
		title: string;
		description: string;
	};

	let query = $state('');

	const guideResults: SearchResult[] = [
		...pillars.map((pillar) => ({
			href: `/guider/${pillar.slug}`,
			title: pillar.title,
			description: pillar.description
		})),
		...guides.map((guide) => ({
			href: `/guider/${guide.pillarSlug}/${guide.slug}`,
			title: guide.title,
			description: guide.description
		}))
	];
	const articleResults: SearchResult[] = [];

	const normalizedQuery = $derived(query.trim().toLowerCase());
	const showResults = $derived(normalizedQuery.length > 0);
	const filteredGuides = $derived.by(() => filterResults(guideResults, normalizedQuery));
	const filteredArticles = $derived.by(() => filterResults(articleResults, normalizedQuery));

	function filterResults(results: SearchResult[], q: string) {
		if (!q) return [];
		return results.filter((result) =>
			`${result.title} ${result.description}`.toLowerCase().includes(q)
		);
	}
</script>

<main class="search-page">
	<header class="search-hero">
		<h1>Sök på MittPsyke</h1>
		<p>Hitta guider och artiklar om psykiskt mående i lugn takt.</p>
		<input
			type="search"
			bind:value={query}
			placeholder="Sök guider och artiklar..."
			aria-label="Sök bland guider och artiklar"
			class="search-input"
		/>
	</header>

	{#if showResults}
		<div class="results">
			<section aria-labelledby="guide-results">
				<h2 id="guide-results">Guider</h2>
				{#if filteredGuides.length}
					<ul class="result-list">
						{#each filteredGuides as result}
							<li>
								<a class="result-link" href={result.href}>
									<strong>{result.title}</strong>
									<span>{result.description}</span>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="empty">Inga guider hittades.</p>
				{/if}
			</section>

			<section aria-labelledby="article-results">
				<h2 id="article-results">Artiklar</h2>
				{#if filteredArticles.length}
					<ul class="result-list">
						{#each filteredArticles as result}
							<li>
								<a class="result-link" href={result.href}>
									<strong>{result.title}</strong>
									<span>{result.description}</span>
								</a>
							</li>
						{/each}
					</ul>
				{:else}
					<p class="empty">Bloggartiklar ingår inte i sökningen just nu.</p>
				{/if}
			</section>
		</div>
	{:else}
		<p class="hint">Skriv ett ord eller en fras för att börja söka.</p>
	{/if}
</main>

<style>
	.search-page {
		max-width: 980px;
		margin: 0 auto;
		padding: 1.5rem 1.25rem 3.5rem;
	}

	.search-hero {
		max-width: 680px;
	}

	.search-hero h1,
	.search-hero p,
	.hint,
	.empty {
		margin: 0;
	}

	.search-hero h1 {
		font-size: clamp(1.9rem, 4vw, 2.5rem);
	}

	.search-hero p {
		margin-top: 0.8rem;
		line-height: 1.65;
		opacity: 0.84;
	}

	.search-input {
		width: 100%;
		margin-top: 1.4rem;
		padding: 0.62rem 0.85rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f8fafb;
		font: inherit;
	}

	.results {
		margin-top: 2rem;
		display: grid;
		gap: 1.7rem;
	}

	.results h2 {
		margin: 0 0 0.8rem;
		font-size: 1.15rem;
	}

	.result-list {
		display: grid;
		gap: 0.75rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.result-link {
		display: grid;
		gap: 0.35rem;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f8fafb;
		color: inherit;
		text-decoration: none;
	}

	.result-link:hover,
	.result-link:focus-visible {
		background: #eef3f8;
		outline: none;
	}

	.result-link span,
	.hint,
	.empty {
		line-height: 1.6;
		opacity: 0.78;
	}

	.hint {
		margin-top: 1.2rem;
	}

	:global(.dark) .search-input,
	:global(.dark) .result-link {
		background: #1a2128;
		border-color: rgba(255, 255, 255, 0.12);
		color: inherit;
	}

	:global(.dark) .result-link:hover,
	:global(.dark) .result-link:focus-visible {
		background: #1f2530;
	}
</style>
