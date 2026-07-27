<script lang="ts">
	import { page } from '$app/state';
	import { trackEvent, trackSearchUsed } from '$lib/analytics';

	type LegacyResult = {
		href: string;
		title: string;
		description: string;
	};
	type ArticleResult = {
		slug: string;
		title: string;
		excerpt: string;
	};
	type HybridContentType = 'article' | 'guide' | 'pillar' | 'faq' | 'support-line';
	type HybridResult = {
		contentType: HybridContentType;
		title: string;
		url: string;
		snippet: string;
		score: number;
	};
	type SearchResponse = {
		results: HybridResult[];
		page: number;
		pageSize: number;
		total: number;
		mode: string;
	};

	const CONTENT_TYPE_LABELS: Record<HybridContentType, string> = {
		article: 'Artikel',
		guide: 'Guide',
		pillar: 'Ämne',
		faq: 'Vanlig fråga',
		'support-line': 'Stödlinje'
	};

	let { data } = $props<{
		data: {
			articles?: ArticleResult[];
			loadError?: boolean;
		};
	}>();

	let query = $state(page.url.searchParams.get('q') ?? '');
	let lastTrackedSearchQuery = '';

	const PAGE_SIZE = 10;
	let hybridResults = $state<HybridResult[]>([]);
	let hybridTotal = $state(0);
	let hybridLoading = $state(false);
	let hybridError = $state(false);
	let currentPage = $state(1);

	// Håll query synkad med URL vid SvelteKit client-side navigation (GET-formulär utan use:enhance).
	// $state()-initialvärdet evalueras bara en gång vid mount – om komponenten redan är monterad
	// (samma rutt, ny sökning) uppdateras inte query automatiskt. Denna effekt fångar URL-ändringar.
	$effect(() => {
		query = page.url.searchParams.get('q') ?? '';
	});

	// Statiska artiklar som varken ingår i Soro-flödet eller det embeddingindexerade
	// artikelkollektivet (src/content/articles) – hålls kvar som enkel
	// keyword-fallback så de inte försvinner ur sökningen.
	const localBlogArticles: LegacyResult[] = [
		{
			href: '/blogg/ai-hjalper-dig-bearbeta-kanslor',
			title: 'Hur AI kan hjälpa dig sortera känslor – utan att ersätta terapi',
			description:
				'AI kan stötta med reflektion, frågor och mönster över tid. Vi går igenom vad AI kan göra för mental hälsa, vad det inte kan ersätta och hur MittPsyke arbetar ansvarsfullt.'
		},
		{
			href: '/blogg/kbt-dagbok-vs-fri-journalforing',
			title: 'KBT-dagbok eller fritt skrivande – vad passar dig?',
			description:
				'KBT-dagbok är strukturerad, fritt skrivande är öppet. Här jämför vi fördelar och nackdelar och visar hur AI kan hjälpa dig kombinera båda.'
		},
		{
			href: '/blogg/vad-ar-journalterapi',
			title: 'Vad är journalterapi – och fungerar det egentligen?',
			description:
				'Journalterapi kan vara ett sätt att sortera tankar och förstå ditt mående bättre. Vi går igenom forskning, praktiska tips och hur MittPsyke kan stötta.'
		}
	];

	const normalizedQuery = $derived(query.trim().toLowerCase());
	const showResults = $derived(normalizedQuery.length > 0);

	const legacyResults = $derived.by(() => [
		...localBlogArticles,
		...(data.articles ?? []).map((article: ArticleResult) => ({
			href: `/blogg/${encodeURIComponent(article.slug)}`,
			title: article.title,
			description: article.excerpt
		}))
	]);
	const filteredLegacyResults = $derived.by(() => filterLegacy(legacyResults, normalizedQuery));
	const totalPages = $derived(Math.max(1, Math.ceil(hybridTotal / PAGE_SIZE)));
	const hasResults = $derived(hybridResults.length > 0 || filteredLegacyResults.length > 0);

	async function fetchHybridResults(q: string, requestedPage: number, signal?: AbortSignal) {
		hybridLoading = true;
		hybridError = false;

		try {
			const response = await fetch(
				`/api/search?q=${encodeURIComponent(q)}&page=${requestedPage}&pageSize=${PAGE_SIZE}`,
				{ signal }
			);
			if (!response.ok) throw new Error('search request failed');

			const payload = (await response.json()) as SearchResponse;
			hybridResults = payload.results;
			hybridTotal = payload.total;
			currentPage = requestedPage;
		} catch (err) {
			if ((err as Error).name === 'AbortError') return;
			hybridError = true;
			hybridResults = [];
			hybridTotal = 0;
		} finally {
			hybridLoading = false;
		}
	}

	// Debounce:ad sökning mot /api/search när frågan ändras.
	$effect(() => {
		const q = normalizedQuery;

		if (q.length === 0) {
			hybridResults = [];
			hybridTotal = 0;
			hybridError = false;
			currentPage = 1;
			return;
		}

		const controller = new AbortController();
		const timeout = window.setTimeout(() => {
			void fetchHybridResults(q, 1, controller.signal);
		}, 350);

		return () => {
			window.clearTimeout(timeout);
			controller.abort();
		};
	});

	function loadPage(nextPage: number) {
		if (!normalizedQuery || hybridLoading || nextPage < 1 || nextPage > totalPages) return;
		void fetchHybridResults(normalizedQuery, nextPage);
	}

	$effect(() => {
		if (normalizedQuery.length < 2) return;

		const timeout = window.setTimeout(() => {
			if (normalizedQuery === lastTrackedSearchQuery) return;
			lastTrackedSearchQuery = normalizedQuery;
			trackSearchUsed({ query_length: normalizedQuery.length });
		}, 800);

		return () => window.clearTimeout(timeout);
	});

	function filterLegacy(results: LegacyResult[], q: string) {
		if (!q) return [];
		return results.filter((result) =>
			`${result.href} ${result.title} ${result.description}`.toLowerCase().includes(q)
		);
	}

	// Hybrid-resultat har absoluta URL:er (så de går att embedda/länka utan tvetydighet
	// server-side). Gör om egna sidor till relativa href så SvelteKits client-side-routing
	// tar över, men lämna externa länkar (tel:, andra domäner) orörda.
	function toHref(absoluteUrl: string): string {
		try {
			const parsed = new URL(absoluteUrl);
			if (parsed.hostname === 'www.mittpsyke.se' || parsed.hostname === 'mittpsyke.se') {
				return `${parsed.pathname}${parsed.search}${parsed.hash}`;
			}
			return absoluteUrl;
		} catch {
			return absoluteUrl;
		}
	}

	function trackHybridResultClick(result: HybridResult, position: number) {
		if (!normalizedQuery) return;
		trackEvent('search_result_click', {
			query: normalizedQuery.slice(0, 120),
			resultType: result.contentType,
			href: result.url,
			position
		});
	}

	function trackLegacyResultClick(result: LegacyResult, position: number) {
		if (!normalizedQuery) return;
		trackEvent('search_result_click', {
			query: normalizedQuery.slice(0, 120),
			resultType: 'article',
			href: result.href,
			position
		});
	}
</script>

<main class="search-page">
	<header class="search-hero">
		<h1>Sök på MittPsyke</h1>
		<p>Hitta guider, artiklar och stöd om psykiskt mående i lugn takt.</p>
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
			{#if hybridError}
				<p class="hint">Sökningen svarade inte just nu. Här är ändå det vi hittar direkt:</p>
			{/if}

			{#if hybridResults.length}
				<section aria-labelledby="hybrid-results">
					<h2 id="hybrid-results">Resultat</h2>
					<ul class="result-list">
						{#each hybridResults as result, index}
							<li>
								<a
									class="result-link"
									href={toHref(result.url)}
									onclick={() => trackHybridResultClick(result, (currentPage - 1) * PAGE_SIZE + index + 1)}
								>
									<span class="result-type">{CONTENT_TYPE_LABELS[result.contentType]}</span>
									<strong>{result.title}</strong>
									<span>{result.snippet}</span>
								</a>
							</li>
						{/each}
					</ul>

					{#if totalPages > 1}
						<div class="pagination">
							<button
								type="button"
								onclick={() => loadPage(currentPage - 1)}
								disabled={currentPage <= 1 || hybridLoading}
							>
								Föregående
							</button>
							<span>Sida {currentPage} av {totalPages}</span>
							<button
								type="button"
								onclick={() => loadPage(currentPage + 1)}
								disabled={currentPage >= totalPages || hybridLoading}
							>
								Nästa
							</button>
						</div>
					{/if}
				</section>
			{:else if hybridLoading}
				<p class="hint">Söker...</p>
			{/if}

			{#if filteredLegacyResults.length}
				<section aria-labelledby="legacy-results">
					<h2 id="legacy-results">Fler artiklar</h2>
					<ul class="result-list">
						{#each filteredLegacyResults as result, index}
							<li>
								<a class="result-link" href={result.href} onclick={() => trackLegacyResultClick(result, index + 1)}>
									<strong>{result.title}</strong>
									<span>{result.description}</span>
								</a>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if !hasResults && !hybridLoading}
				<p class="empty">Inga resultat hittades.</p>
			{/if}
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

	.result-type {
		display: inline-block;
		width: fit-content;
		padding: 0.15rem 0.5rem;
		border-radius: 999px;
		background: rgba(37, 99, 235, 0.12);
		color: #1d4ed8;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		opacity: 1;
	}

	.pagination {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		margin-top: 1rem;
		font-size: 0.9rem;
	}

	.pagination button {
		padding: 0.4rem 0.85rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.14);
		background: #f8fafb;
		cursor: pointer;
	}

	.pagination button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
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

	:global(.dark) .result-type {
		background: rgba(147, 197, 253, 0.16);
		color: #93c5fd;
	}

	:global(.dark) .pagination button {
		background: #1a2128;
		border-color: rgba(255, 255, 255, 0.12);
		color: inherit;
	}
</style>
