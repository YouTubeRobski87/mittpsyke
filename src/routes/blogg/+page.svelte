<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';

	let { data } = $props();

	const articles = $derived(data.articles ?? []);
	const loadError = $derived(Boolean(data.loadError));
</script>

<SEO canonical="https://www.mittpsyke.se/blogg" />

<svelte:head>
	<title>Blogg – artiklar om psykiskt mående | MittPsyke</title>
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
		color: #5f8170;
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
		border: 1px solid rgba(77, 95, 86, 0.16);
		border-radius: var(--radius-card);
		background: #f6fbf9;
		padding: clamp(0.75rem, 2vw, 1rem);
		min-height: 280px;
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
		background: #ffffff;
		border: 1px solid rgba(77, 95, 86, 0.14);
		text-decoration: none;
		color: inherit;
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.blog-item-link.has-image {
		grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
	}

	.blog-item-link:hover,
	.blog-item-link:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 6px 18px rgba(24, 79, 74, 0.08);
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

	:global(.dark) .blog-widget-card {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .blog-item-link {
		background: #1f2a27;
		border-color: rgba(255, 255, 255, 0.1);
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
	}
</style>
