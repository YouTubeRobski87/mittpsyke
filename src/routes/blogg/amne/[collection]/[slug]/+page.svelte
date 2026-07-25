<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';

	let { data } = $props();
	const article = $derived(data.article);
	const topic = $derived(data.topic);
	const canonical = $derived(`https://www.mittpsyke.se${article.url}`);
	const jsonLd = $derived(JSON.stringify({
		'@context': 'https://schema.org',
		'@type': article.type === 'guide' ? 'HowTo' : 'BlogPosting',
		headline: article.title,
		description: article.description,
		image: article.image
			? `https://www.mittpsyke.se${article.image}`
			: 'https://www.mittpsyke.se/og-image.png',
		datePublished: article.date,
		dateModified: article.updated ?? article.date,
		inLanguage: 'sv-SE',
		author: { '@type': 'Person', name: article.author },
		publisher: {
			'@type': 'Organization',
			name: 'MittPsyke',
			logo: { '@type': 'ImageObject', url: 'https://www.mittpsyke.se/logo.png' }
		},
		articleSection: topic.label,
		mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }
	}).replace(/</g, '\\u003c'));
</script>

<SEO {canonical} />

<svelte:head>
	{@html `<script type="application/ld+json">${jsonLd}<\\/script>`}
</svelte:head>

<article class="article-page">
	<Breadcrumbs items={[{ label: 'Artiklar', href: '/blogg' }, { label: topic.label, href: `/blogg/amne/${topic.slug}` }, { label: article.title }]} />
	<a class="back-link" href={`/blogg/amne/${topic.slug}`}>Tillbaka till {topic.label.toLowerCase()}</a>
	<header>
		<p class="eyebrow">{article.type === 'guide' ? 'Guide' : 'Artikel'} · {topic.label}</p>
		<h1>{article.title}</h1>
		<p class="lead">{article.description}</p>
		<p class="meta">Publicerad {article.dateLabel}{article.updatedLabel ? ` · Uppdaterad ${article.updatedLabel}` : ''}</p>
		{#if article.readingTime}<p class="meta">{article.readingTime}</p>{/if}
	</header>

	{#if article.image}
		<img class="featured-image" src={article.image} alt={article.imageAlt ?? article.title} loading="eager" decoding="async" />
	{/if}

	<div class="article-content">{@html article.content}</div>

	{#if article.references.length > 0}
		<section class="article-section" aria-labelledby="references-heading">
			<h2 id="references-heading">Källor</h2>
			<ul>
				{#each article.references as reference}
					<li><a href={reference.url} target="_blank" rel="noopener noreferrer">{reference.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if article.relatedArticles.length > 0}
		<section class="article-section" aria-labelledby="related-heading">
			<h2 id="related-heading">Läs vidare</h2>
			<ul>{#each article.relatedArticles as related}<li><a href={related.url}>{related.title}</a></li>{/each}</ul>
		</section>
	{/if}
</article>

<style>
	.article-page { max-width: 820px; margin: 0 auto; padding: clamp(2rem, 6vw, 3rem) clamp(1rem, 4vw, 1.4rem) 4rem; }
	.back-link { display: inline-flex; margin: 1.2rem 0; font-family: var(--font-heading); font-weight: 600; text-decoration: underline; text-underline-offset: 3px; opacity: .78; }
	.eyebrow, h1, .lead, .meta { margin: 0; }
	.eyebrow { color: #60a5fa; font-family: var(--font-heading); font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
	h1 { margin-top: .55rem; font-family: var(--font-heading); font-size: clamp(1.95rem, 1.55rem + 2.2vw, 2.6rem); line-height: 1.08; }
	.lead { margin-top: .9rem; font-size: clamp(1.03rem, .99rem + .5vw, 1.16rem); line-height: 1.72; opacity: .88; }
	.meta { margin-top: .7rem; font-size: .9rem; opacity: .64; }
	.featured-image { display: block; width: 100%; max-height: 460px; margin-top: 1.35rem; border-radius: var(--radius-card); object-fit: cover; }
	.article-content { display: grid; gap: 1.15rem; max-width: 70ch; margin-top: 1.65rem; overflow-wrap: anywhere; word-break: break-word; }
	.article-content :global(h2), .article-section h2 { margin: 1.1rem 0 0; color: #2563eb; font-family: var(--font-heading); font-size: clamp(1.38rem, 1.2rem + .7vw, 1.62rem); line-height: 1.2; }
	.article-content :global(h3) { margin: .85rem 0 0; font-family: var(--font-heading); font-size: clamp(1.12rem, 1.05rem + .35vw, 1.28rem); line-height: 1.3; }
	.article-content :global(p), .article-content :global(li), .article-section li { margin: 0; font-size: clamp(1rem, .96rem + .35vw, 1.08rem); line-height: 1.75; }
	.article-content :global(ul), .article-content :global(ol), .article-section ul { display: grid; gap: .45rem; margin: 0; padding-left: 1.2rem; }
	.article-content :global(a), .article-section a { color: #2563eb; font-weight: 600; overflow-wrap: anywhere; text-decoration: underline; text-decoration-thickness: 1.5px; text-underline-offset: 2px; }
	.article-content :global(a:hover), .article-content :global(a:focus-visible), .article-section a:hover, .article-section a:focus-visible { color: #1d4ed8; outline: 2px solid currentColor; outline-offset: 3px; }
	.article-content :global(blockquote) { margin: 0; padding: .35rem 0 .35rem 1rem; border-left: 3px solid #60a5fa; color: inherit; font-size: clamp(1rem, .96rem + .35vw, 1.08rem); font-style: italic; line-height: 1.75; opacity: .9; }
	.article-content :global(hr) { width: 100%; height: 1px; margin: .5rem 0; border: 0; background: hsl(var(--border)); }
	.article-content :global(table) { display: block; width: 100%; max-width: 100%; overflow: auto; -webkit-overflow-scrolling: touch; border-collapse: collapse; border: 1px solid hsl(var(--border)); border-radius: var(--radius-card); font-size: clamp(.92rem, .89rem + .2vw, 1rem); }
	.article-content :global(th), .article-content :global(td) { padding: 10px 12px; min-width: 9rem; line-height: 1.5; text-align: left; overflow-wrap: normal; word-break: normal; white-space: normal; border: 1px solid hsl(var(--border)); }
	.article-content :global(th) { font-weight: 700; background: rgba(37, 99, 235, .12); }
	.article-content :global(tbody tr:nth-child(even) td) { background: hsl(var(--muted-foreground) / .1); }
	.article-section { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid hsl(var(--border)); }
	.article-section h2 { margin-top: 0; }
	.article-section ul { margin-top: .75rem; }
	:global(.dark) .article-content :global(h2), :global(.dark) .article-section h2 { color: #93c5fd; }
	:global(.dark) .article-content :global(a), :global(.dark) .article-section a { color: #93c5fd; }
	:global(.dark) .article-content :global(th) { background: rgba(147, 197, 253, .14); }
	:global(.dark) .article-content :global(tbody tr:nth-child(even) td) { background: hsl(var(--muted-foreground) / .14); }
</style>
