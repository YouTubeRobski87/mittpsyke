<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';

	let { data } = $props();

	const articles = $derived(data.articles ?? []);
	const loadError = $derived(Boolean(data.loadError));
	const pagination = $derived(
		data.pagination ?? {
			currentPage: 1,
			totalPages: 1,
			totalArticles: 0,
			hasPrevious: false,
			hasNext: false
		}
	);
	const pageNumbers = $derived(
		Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
	);

	function pageHref(page: number): string {
		return page <= 1 ? '/blogg' : `/blogg?page=${page}`;
	}
</script>

<SEO canonical="https://www.mittpsyke.se/blogg" />

<svelte:head>
	<title>Artiklar om psykiskt mående | MittPsyke</title>
	<meta
		name="description"
		content="Läs artiklar om att skriva av sig, psykiskt mående, oro, stress och återhämtning i din egen takt."
	/>
	<meta property="og:type" content="website" />
	{#if pagination.hasPrevious}
		<link rel="prev" href={`https://www.mittpsyke.se${pageHref(pagination.currentPage - 1)}`} />
	{/if}
	{#if pagination.hasNext}
		<link rel="next" href={`https://www.mittpsyke.se${pageHref(pagination.currentPage + 1)}`} />
	{/if}
</svelte:head>

<main class="blog-page">
	<section class="blog-hero">
		<p class="eyebrow">MittPsyke artiklar</p>
		<h1>Artiklar om psykisk hälsa</h1>
		<p>
			Läs lugna och konkreta texter om att skriva av sig, förstå tankar och hitta små steg framåt.
		</p>
	</section>

	<section class="blog-widget" aria-label="Artiklar">
		<div class="blog-widget-card">
			{#if articles.length}
				<ul class="blog-list">
					{#each articles as article (article.id)}
						<li class="blog-item">
							<a
								class="blog-item-link"
								class:has-image={Boolean(article.imageUrl)}
								href={`/blogg/${encodeURIComponent(article.slug)}`}
							>
								{#if article.imageUrl}
									<img
										class="blog-item-image"
										src={article.imageUrl}
										alt=""
										loading="lazy"
										decoding="async"
									/>
								{/if}
								<div class="blog-item-body">
									<h2 class="blog-item-title">{article.title}</h2>
									{#if article.excerpt}
										<p class="blog-item-excerpt">{article.excerpt}</p>
									{/if}
									{#if article.date}
										<p class="blog-item-meta">Publicerad {article.date}</p>
									{/if}
								</div>
							</a>
						</li>
					{/each}
				</ul>
				{#if pagination.totalPages > 1}
					<nav class="blog-pagination" aria-label="Sidnavigering för artiklar">
						{#if pagination.hasPrevious}
							<a class="pagination-link pagination-edge" href={pageHref(pagination.currentPage - 1)}>
								Föregående
							</a>
						{:else}
							<span class="pagination-link pagination-edge is-disabled" aria-disabled="true">
								Föregående
							</span>
						{/if}

						{#each pageNumbers as pageNumber}
							<a
								class="pagination-link"
								class:is-current={pageNumber === pagination.currentPage}
								href={pageHref(pageNumber)}
								aria-current={pageNumber === pagination.currentPage ? 'page' : undefined}
							>
								{pageNumber}
							</a>
						{/each}

						{#if pagination.hasNext}
							<a class="pagination-link pagination-edge" href={pageHref(pagination.currentPage + 1)}>
								Nästa
							</a>
						{:else}
							<span class="pagination-link pagination-edge is-disabled" aria-disabled="true">
								Nästa
							</span>
						{/if}
					</nav>
				{/if}
			{:else if loadError}
				<p class="blog-fallback">Artiklarna kunde inte laddas just nu. Försök igen om en stund.</p>
			{:else}
				<p class="blog-fallback">Inga artiklar hittades just nu.</p>
			{/if}
		</div>
	</section>
</main>

<style>
	.blog-page {
		max-width: 1040px;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 3.2rem) clamp(1rem, 4vw, 1.4rem) clamp(3rem, 8vw, 4.2rem);
	}

	.blog-hero {
		max-width: 780px;
	}

	.eyebrow,
	.blog-hero h1,
	.blog-hero p,
	.blog-fallback {
		margin: 0;
	}

	.eyebrow {
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #60a5fa;
	}

	.blog-hero h1 {
		margin-top: 0.35rem;
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		font-size: clamp(1.9rem, 1.5rem + 2vw, 2.5rem);
		line-height: 1.08;
	}

	.blog-hero p {
		margin-top: 0.75rem;
		font-family: var(--font-body);
		font-size: 1.02rem;
		line-height: 1.68;
		opacity: 0.84;
	}

	.blog-widget {
		margin-top: 1.35rem;
	}

	.blog-widget-card {
		border: 1px solid rgba(96, 165, 250, 0.22);
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at 88% 8%, rgba(129, 140, 248, 0.16), transparent 32%),
			linear-gradient(135deg, #0f172a, #111827 58%, #17182f);
		padding: clamp(0.75rem, 2vw, 1rem);
		min-height: 280px;
		color: #f8fafc;
		box-shadow: 0 18px 42px rgba(15, 23, 42, 0.16);
	}

	.blog-fallback {
		margin-top: 0.75rem;
		font-family: var(--font-body);
		font-size: 0.95rem;
		line-height: 1.6;
		opacity: 0.78;
	}

	.blog-list {
		display: grid;
		gap: 0.9rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.blog-item {
		margin: 0;
	}

	.blog-item-link {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		gap: 1rem;
		padding: 0.85rem;
		border-radius: var(--radius-card);
		background: rgba(15, 23, 42, 0.64);
		border: 1px solid rgba(147, 197, 253, 0.18);
		text-decoration: none;
		color: inherit;
		transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
	}

	.blog-item-link.has-image {
		grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
	}

	.blog-item-link:hover,
	.blog-item-link:focus-visible {
		transform: translateY(-1px);
		border-color: rgba(147, 197, 253, 0.34);
		box-shadow: 0 12px 24px rgba(15, 23, 42, 0.2);
	}

	.blog-item-image {
		width: 100%;
		height: 100%;
		max-height: 160px;
		object-fit: cover;
		border-radius: calc(var(--radius-card) - 4px);
	}

	.blog-item-body {
		display: grid;
		gap: 0.4rem;
		align-content: start;
	}

	.blog-item-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(1.1rem, 1rem + 0.6vw, 1.3rem);
		line-height: 1.2;
	}

	.blog-item-excerpt {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.98rem;
		line-height: 1.6;
		opacity: 0.85;
	}

	.blog-item-meta {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.85rem;
		opacity: 0.62;
	}

	.blog-pagination {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		margin-top: 1rem;
	}

	.pagination-link {
		display: inline-flex;
		min-width: 2.25rem;
		min-height: 2.25rem;
		align-items: center;
		justify-content: center;
		padding: 0.45rem 0.7rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(147, 197, 253, 0.2);
		background: rgba(15, 23, 42, 0.58);
		color: inherit;
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 600;
		line-height: 1;
		text-decoration: none;
	}

	.pagination-link:hover,
	.pagination-link:focus-visible {
		border-color: rgba(147, 197, 253, 0.38);
		background: rgba(30, 41, 59, 0.78);
		outline: none;
	}

	.pagination-link.is-current {
		background: #2563eb;
		border-color: #60a5fa;
		color: #ffffff;
	}

	.pagination-link.is-disabled {
		pointer-events: none;
		opacity: 0.45;
	}

	.pagination-edge {
		min-width: 5.8rem;
	}

	:global(.dark) .blog-widget-card {
		background:
			radial-gradient(circle at 88% 8%, rgba(129, 140, 248, 0.16), transparent 32%),
			linear-gradient(135deg, #0f172a, #111827 58%, #17182f);
		border-color: rgba(96, 165, 250, 0.22);
	}

	:global(.dark) .blog-item-link {
		background: rgba(15, 23, 42, 0.64);
		border-color: rgba(147, 197, 253, 0.18);
	}

	:global(.dark) .pagination-link {
		background: rgba(15, 23, 42, 0.58);
		border-color: rgba(147, 197, 253, 0.2);
	}

	:global(.dark) .pagination-link:hover,
	:global(.dark) .pagination-link:focus-visible {
		background: rgba(30, 41, 59, 0.78);
		border-color: rgba(147, 197, 253, 0.38);
	}

	:global(.dark) .pagination-link.is-current {
		background: #60a5fa;
		border-color: #bfdbfe;
		color: #0f172a;
	}

	@media (max-width: 640px) {
		.blog-hero p {
			font-size: 1rem;
		}

		.blog-item-link.has-image {
			grid-template-columns: minmax(0, 1fr);
		}

		.blog-item-image {
			max-height: 200px;
		}

		.blog-pagination {
			justify-content: flex-start;
			gap: 0.38rem;
		}

		.pagination-link {
			min-width: 2.15rem;
			min-height: 2.15rem;
			padding: 0.42rem 0.62rem;
		}

		.pagination-edge {
			min-width: auto;
			flex: 1 1 calc(50% - 0.4rem);
		}
	}
</style>
