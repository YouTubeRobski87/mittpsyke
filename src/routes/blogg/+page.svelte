<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { blogPosts } from '$lib/data/blogg';

	const blogJsonLd = {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: 'MittPsykes blogg om mental hälsa',
		description: 'Artiklar om journalföring, mental hälsa och självreflektion – skrivet för att vara lätt att ta till sig i vardagen.',
		url: 'https://www.mittpsyke.se/blogg',
		inLanguage: 'sv-SE',
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' },
		blogPost: blogPosts.map((p) => ({
			'@type': 'BlogPosting',
			headline: p.title,
			url: `https://www.mittpsyke.se/blogg/${p.slug}`
		}))
	};
</script>

<SEO canonical="https://www.mittpsyke.se/blogg" />

<svelte:head>
	<title>Blogg om mental hälsa och journalföring | MittPsyke</title>
	<meta
		name="description"
		content="Artiklar om journalföring, mental hälsa och självreflektion. Skrivet för att vara lätt att ta till sig i en vardag som redan kan kännas full."
	/>
	<meta property="og:title" content="Blogg om mental hälsa | MittPsyke" />
	<meta
		property="og:description"
		content="Artiklar om journalföring, mental hälsa och självreflektion. Skrivet för att vara lätt att ta till sig i en vardag som redan kan kännas full."
	/>
	<meta property="og:type" content="website" />
	{@html `<script type="application/ld+json">${JSON.stringify(blogJsonLd)}<\/script>`}
</svelte:head>

<main class="blog-index">
	<header class="blog-index-header">
		<h1>Blogg</h1>
		<p>
			Här samlar vi artiklar om journalföring, mental hälsa och självreflektion. Allt är skrivet för att vara
			lätt att ta till sig i en vardag som redan kan kännas full.
		</p>
	</header>

	<section class="blog-grid" aria-label="Senaste artiklar">
		{#each blogPosts as post}
			<article class="blog-card">
				<p class="blog-card-meta">{post.publishedLabel} · {post.readTime}</p>
				<h2>{post.title}</h2>
				<p>{post.excerpt}</p>
				<a href={`/blogg/${post.slug}`}>Läs artikel</a>
			</article>
		{/each}
	</section>
</main>

<style>
	.blog-index {
		max-width: 1080px;
		margin: 0 auto;
		padding: clamp(2.1rem, 6vw, 3rem) clamp(1rem, 4vw, 1.4rem) clamp(3rem, 8vw, 4rem);
	}

	.blog-index-header {
		max-width: 760px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-size: clamp(1.9rem, 1.5rem + 2vw, 2.5rem);
		line-height: 1.08;
	}

	.blog-index-header p {
		margin: 0.8rem 0 0;
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.96rem + 0.35vw, 1.08rem);
		line-height: 1.72;
		opacity: 0.84;
	}

	.blog-grid {
		margin-top: 1.5rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1rem;
	}

	.blog-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f6fbf9;
		display: grid;
		gap: 0.7rem;
	}

	.blog-card-meta {
		margin: 0;
		font-size: 0.82rem;
		opacity: 0.64;
	}

	.blog-card h2 {
		font-size: 1.2rem;
		line-height: 1.28;
	}

	.blog-card p {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.96rem;
		line-height: 1.65;
		opacity: 0.84;
	}

	.blog-card a {
		display: inline-flex;
		align-self: start;
		padding: 0.38rem 0.68rem;
		border-radius: var(--radius-pill);
		background: rgba(95, 129, 112, 0.12);
		font-family: var(--font-heading);
		font-size: 0.86rem;
		font-weight: 600;
		text-decoration: none;
	}

	:global(.dark) .blog-card {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .blog-card a {
		background: rgba(134, 223, 214, 0.16);
	}
</style>
