<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { trackArticleView } from '$lib/analytics';

	let { data } = $props();

	const article = $derived(data.article);
	const canonical = $derived(`https://www.mittpsyke.se/blogg/${article.slug}`);
	const ogImage = $derived(article.image ?? 'https://www.mittpsyke.se/og-image.png');
	const schema = $derived({
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: article.title,
		description: article.excerpt,
		image: ogImage,
		datePublished: article.isoDate,
		dateModified: article.isoDate,
		inLanguage: 'sv-SE',
		author: {
			'@type': 'Person',
			name: 'Robert Claesson',
			url: 'https://www.mittpsyke.se/om-mittpsyke'
		},
		publisher: {
			'@type': 'Organization',
			name: 'MittPsyke',
			logo: {
				'@type': 'ImageObject',
				url: 'https://www.mittpsyke.se/og-image.png'
			}
		},
		mainEntityOfPage: canonical
	});
	const jsonLd = $derived(
		JSON.stringify(schema)
			.replace(/</g, '\\u003c')
			.replace(/\u2028/g, '\\u2028')
			.replace(/\u2029/g, '\\u2029')
	);

	onMount(() => {
		trackArticleView({
			article_slug: article.slug,
			category: 'blogg'
		});
	});
</script>

<SEO {canonical} />

<svelte:head>
	<title>{article.title} | MittPsyke</title>
	<meta property="og:type" content="article" />
	<meta property="og:title" content={article.title} />
	<meta property="og:description" content={article.excerpt} />
	<meta property="og:image" content={ogImage} />
	{@html `<script type="application/ld+json">${jsonLd}<\/script>`}
</svelte:head>

<article class="soro-article">
	<a class="back-link" href="/blogg">Tillbaka till artiklarna</a>

	<header class="article-header">
		<p class="eyebrow">MittPsyke artiklar</p>
		<h1>{article.title}</h1>
		<p class="lead">{article.excerpt}</p>
		<p class="meta">Publicerad {article.date}</p>
	</header>

	{#if article.image}
		<img class="featured-image" src={article.image} alt={article.title} loading="eager" decoding="async" />
	{/if}

	<div class="article-content">
		{@html article.content}
		{#if article.slug === 'chatta-anonymt-utan-konto'}
			<p>Vill du börja direkt kan du <a href="/chatta-anonymt">chatta anonymt utan konto</a> i lugn takt hos MittPsyke.</p>
		{/if}
	</div>
</article>

<style>
	.soro-article {
		max-width: 820px;
		margin: 0 auto;
		padding: clamp(2.2rem, 6vw, 3rem) clamp(1.05rem, 4vw, 1.4rem) clamp(3.2rem, 8vw, 4rem);
	}

	.back-link {
		display: inline-flex;
		margin-bottom: 1.2rem;
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		opacity: 0.78;
	}

	.article-header {
		max-width: 720px;
	}

	.eyebrow,
	.article-header h1,
	.lead,
	.meta {
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

	.article-header h1 {
		margin-top: 0.55rem;
		font-family: var(--font-heading);
		font-size: clamp(1.95rem, 1.55rem + 2.2vw, 2.6rem);
		line-height: 1.08;
	}

	.lead {
		margin-top: 0.9rem;
		font-size: clamp(1.03rem, 0.99rem + 0.5vw, 1.16rem);
		line-height: 1.72;
		opacity: 0.88;
	}

	.meta {
		margin-top: 0.7rem;
		font-size: 0.9rem;
		opacity: 0.64;
	}

	.featured-image {
		width: 100%;
		max-height: 420px;
		margin-top: 1.35rem;
		border-radius: var(--radius-card);
		object-fit: cover;
	}

	.article-content {
		max-width: 720px;
		margin-top: 1.65rem;
		display: grid;
		gap: 1.15rem;
	}

	.article-content :global(h2) {
		margin: 1.1rem 0 0;
		font-family: var(--font-heading);
		font-size: clamp(1.38rem, 1.2rem + 0.7vw, 1.62rem);
		line-height: 1.2;
		color: #2563eb;
	}

	.article-content :global(p),
	.article-content :global(li) {
		margin: 0;
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.96rem + 0.35vw, 1.08rem);
		line-height: 1.75;
	}

	.article-content :global(ul),
	.article-content :global(ol) {
		margin: 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.45rem;
	}

	.article-content :global(a) {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.dark) .article-content :global(h2) {
		color: #93c5fd;
	}
</style>
