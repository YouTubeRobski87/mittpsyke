<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SoroBlogEmbed from '$lib/components/SoroBlogEmbed.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<SEO canonical="https://www.mittpsyke.se/blogg" />

<svelte:head>
	<title>Artiklar om psykiskt mående | MittPsyke</title>
	<meta
		name="description"
		content="Läs artiklar om att skriva av sig, psykiskt mående, oro, stress och återhämtning i din egen takt."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<main class="blog-page">
	<section class="blog-hero">
		<p class="eyebrow">MittPsyke artiklar</p>
		<h1>Artiklar om psykisk hälsa</h1>
		<p>
			Läs lugna och konkreta texter om att skriva av sig, förstå tankar och hitta små steg framåt.
		</p>
	</section>

	<section class="blog-list" aria-label="Artiklar">
		{#if data.articles.length > 0}
			<ul class="article-grid">
				{#each data.articles as article (article.id)}
					<li>
						<a href="/blogg/{article.slug}" class="article-card">
							{#if article.imageUrl}
								<img
									src={article.imageUrl}
									alt={article.title}
									class="article-img"
									loading="lazy"
									width="400"
									height="220"
								/>
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
	}
</style>
