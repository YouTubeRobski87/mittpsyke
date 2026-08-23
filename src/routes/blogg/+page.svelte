<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import SoroBlogEmbed from '$lib/components/SoroBlogEmbed.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO canonical="https://mittpsyke.se/blogg" />

<svelte:head>
	<title>Artiklar om psykiskt mående | MittPsyke</title>
	<meta
		name="description"
		content="Läs artiklar om att skriva av sig, psykiskt mående, oro, stress och återhämtning i din egen takt."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<main class="blog-page">
	<Breadcrumbs items={[{ label: 'Artiklar' }]} />

	<section class="blog-hero">
		<p class="eyebrow">MittPsyke artiklar</p>
		<h1>Artiklar om psykisk hälsa</h1>
		<p>
			Läs lugna och konkreta texter om att skriva av sig, förstå tankar och hitta små steg framåt.
		</p>
		<nav class="content-switcher" aria-label="Växla mellan artiklar och guider">
			<a class="content-switcher-link content-switcher-link--active" href="/blogg" aria-current="page">
				Artiklar
			</a>
			<a class="content-switcher-link" href="/guider">Guider</a>
		</nav>
	</section>

	<section class="blog-list" aria-label="Artiklar">
		{#if data.articles.length > 0}
			<ul class="article-grid">
				{#each data.articles as article (article.id)}
					<li>
						<a href={article.href} class="article-card">
							{#if article.imageUrl}
								<!-- Dekorativ bild: rubriken står i <h2> direkt under, så en alt-text
									 hade fått skärmläsare att läsa samma budskap två gånger per kort.
									 Låg tidigare på alt={article.title}. -->
								<img
									src={article.imageUrl}
									alt=""
									class="article-img"
									loading="lazy"
									width="400"
									height="220"
								/>
							{:else}
								<div class="article-img-placeholder" aria-hidden="true"></div>
							{/if}
							<div class="article-body">
								<h2 class="article-title">{article.title}</h2>
								{#if article.excerpt}
									<p class="article-excerpt">{article.excerpt}</p>
								{/if}
								{#if article.date}
									<time class="article-date" datetime={article.isoDate}>{article.date}</time>
								{/if}
							</div>
						</a>
					</li>
				{/each}
			</ul>
			{#if data.pagination.totalPages > 1}
				<nav class="blog-pagination" aria-label="Paginering för artiklar">
					{#if data.pagination.hasPreviousPage && data.pagination.previousPageHref}
						<a class="pagination-link" href={data.pagination.previousPageHref}>Föregående</a>
					{:else}
						<span class="pagination-link pagination-link--disabled" aria-disabled="true">Föregående</span>
					{/if}
					<div class="pagination-pages" aria-label="Sidor">
						{#each data.pagination.pageItems as item (item.type === 'page' ? `page-${item.page}` : item.key)}
							{#if item.type === 'page'}
								<a
									class="pagination-link pagination-link--number"
									class:pagination-link--current={item.isCurrent}
									href={item.href}
									aria-label={`Sida ${item.page}`}
									aria-current={item.isCurrent ? 'page' : undefined}
								>
									{item.page}
								</a>
							{:else}
								<span class="pagination-ellipsis" aria-hidden="true">...</span>
							{/if}
						{/each}
					</div>
					<span class="pagination-status">Sida {data.pagination.currentPage} av {data.pagination.totalPages}</span>
					{#if data.pagination.hasNextPage && data.pagination.nextPageHref}
						<a class="pagination-link" href={data.pagination.nextPageHref}>Nästa</a>
					{:else}
						<span class="pagination-link pagination-link--disabled" aria-disabled="true">Nästa</span>
					{/if}
				</nav>
			{/if}
		{:else}
			<div class="blog-widget-card">
				<SoroBlogEmbed />
			</div>
		{/if}
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
	.blog-hero p {
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

	.content-switcher {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		margin-top: 1.1rem;
		padding: 0.25rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--surface));
	}

	.content-switcher-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.75rem;
		padding: 0.5rem 0.9rem;
		border-radius: 999px;
		color: inherit;
		font-family: var(--font-body);
		font-size: 0.92rem;
		font-weight: 600;
		line-height: 1.2;
		text-decoration: none;
	}

	.content-switcher-link:hover {
		background: hsl(var(--surface-muted));
	}

	.content-switcher-link--active {
		background: hsl(var(--foreground));
		color: hsl(var(--background));
	}

	.content-switcher-link--active:hover {
		background: hsl(var(--foreground));
	}

	.content-switcher-link:focus-visible {
		outline: 3px solid rgba(96, 165, 250, 0.7);
		outline-offset: 2px;
	}

	:global(.dark) .content-switcher-link:hover {
		background: rgba(148, 163, 184, 0.16);
	}

	:global(.dark) .content-switcher-link--active,
	:global(.dark) .content-switcher-link--active:hover {
		background: #e2e8f0;
		color: #0f172a;
	}

	.blog-list {
		margin-top: 1.35rem;
	}

	.article-grid {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
		gap: 1.25rem;
	}

	.article-card {
		display: flex;
		flex-direction: column;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--surface));
		box-shadow: 0 18px 42px var(--shadow-color);
		text-decoration: none;
		color: inherit;
		overflow: hidden;
		transition: box-shadow 0.18s ease, border-color 0.18s ease;
	}

	.article-card:hover {
		box-shadow: 0 22px 52px var(--shadow-color);
		border-color: rgba(96, 165, 250, 0.45);
	}

	.article-img {
		width: 100%;
		height: 180px;
		object-fit: cover;
		display: block;
	}

	.article-img-placeholder {
		width: 100%;
		/* Samma höjd som .article-img. En platshållare ska hålla just den plats
		   bilden tar, annars blir kortet synligt kortare än sina grannar i
		   rutnätet. Låg tidigare på 100px. */
		height: 180px;
		background: linear-gradient(135deg, rgba(58, 123, 213, 0.18) 0%, rgba(99, 102, 241, 0.12) 100%);
		border-bottom: 1px solid rgba(96, 165, 250, 0.15);
	}

	:global(.dark) .article-img-placeholder {
		background: linear-gradient(135deg, rgba(58, 123, 213, 0.22) 0%, rgba(99, 102, 241, 0.18) 100%);
		border-bottom-color: rgba(96, 165, 250, 0.2);
	}

	.article-body {
		padding: 1.1rem 1.15rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex: 1;
	}

	.article-title {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.05rem;
		font-weight: 700;
		line-height: 1.28;
		letter-spacing: -0.01em;
	}

	.article-excerpt {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.9rem;
		line-height: 1.6;
		opacity: 0.78;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.article-date {
		margin-top: auto;
		padding-top: 0.5rem;
		font-family: var(--font-body);
		font-size: 0.8rem;
		opacity: 0.55;
	}

	.blog-pagination {
		margin-top: 1.5rem;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.85rem;
		flex-wrap: wrap;
	}

	.pagination-link,
	.pagination-status,
	.pagination-ellipsis {
		font-family: var(--font-body);
		font-size: 0.9rem;
		line-height: 1;
	}

	.pagination-pages {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.pagination-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.35rem;
		padding: 0.7rem 0.95rem;
		border: 1px solid hsl(var(--border));
		border-radius: 999px;
		background: hsl(var(--surface));
		color: inherit;
		text-decoration: none;
		transition:
			border-color 0.18s ease,
			box-shadow 0.18s ease,
			opacity 0.18s ease;
	}

	.pagination-link:hover {
		border-color: rgba(96, 165, 250, 0.45);
		box-shadow: 0 12px 28px var(--shadow-color);
	}

	.pagination-link--number {
		min-width: 2.35rem;
		padding-inline: 0.75rem;
	}

	.pagination-link--current {
		border-color: rgba(96, 165, 250, 0.58);
		background: rgba(96, 165, 250, 0.14);
		font-weight: 700;
	}

	.pagination-link--disabled {
		opacity: 0.45;
		pointer-events: none;
	}

	.pagination-ellipsis {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 1.25rem;
		opacity: 0.62;
	}

	.pagination-status {
		flex-basis: 100%;
		text-align: center;
		opacity: 0.75;
	}

	.blog-widget-card {
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--surface));
		padding: clamp(0.75rem, 2vw, 1rem);
		min-height: 280px;
		color: hsl(var(--foreground));
		box-shadow: 0 18px 42px var(--shadow-color);
	}

	:global(.dark) .article-card {
		background:
			radial-gradient(circle at 88% 8%, rgba(129, 140, 248, 0.1), transparent 32%),
			linear-gradient(135deg, #0f172a, #111827 58%, #17182f);
		border-color: rgba(96, 165, 250, 0.18);
		color: #f8fafc;
	}

	:global(.dark) .article-card:hover {
		border-color: rgba(96, 165, 250, 0.42);
	}

	:global(.dark) .pagination-link {
		background: rgba(15, 23, 42, 0.78);
		border-color: rgba(96, 165, 250, 0.2);
		color: #f8fafc;
	}

	:global(.dark) .pagination-link:hover {
		border-color: rgba(96, 165, 250, 0.44);
	}

	:global(.dark) .pagination-link--current {
		background: rgba(96, 165, 250, 0.2);
		border-color: rgba(96, 165, 250, 0.62);
	}

	:global(.dark) .blog-widget-card {
		background:
			radial-gradient(circle at 88% 8%, rgba(129, 140, 248, 0.16), transparent 32%),
			linear-gradient(135deg, #0f172a, #111827 58%, #17182f);
		border-color: rgba(96, 165, 250, 0.22);
		color: #f8fafc;
	}

	@media (max-width: 640px) {
		.blog-hero p {
			font-size: 1rem;
		}

		.blog-pagination {
			justify-content: stretch;
			gap: 0.65rem;
		}

		.pagination-link {
			flex: 1 1 7rem;
		}

		.pagination-pages {
			flex: 1 0 100%;
			order: -1;
		}

		.pagination-link--number {
			flex: 0 0 auto;
		}

		.pagination-status {
			flex: 1 0 100%;
			text-align: center;
		}
	}
</style>
