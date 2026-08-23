<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';

	let { data } = $props();
	const canonical = $derived(`https://mittpsyke.se/blogg/amne/${data.topic.slug}`);
</script>

<SEO {canonical} />

<main class="topic-page">
	<Breadcrumbs items={[{ label: 'Artiklar', href: '/blogg' }, { label: data.topic.label }]} />
	<header>
		<p class="eyebrow">Artikelämne</p>
		<h1>{data.topic.label}</h1>
		<p>{data.topic.description}</p>
	</header>

	<ul class="article-list">
		{#each data.articles as article (article.url)}
			<li>
				<a href={article.url}>
					<h2>{article.title}</h2>
					<p>{article.description}</p>
				</a>
			</li>
		{/each}
	</ul>
</main>

<style>
	.topic-page { max-width: 900px; margin: 0 auto; padding: clamp(2rem, 6vw, 3.2rem) clamp(1rem, 4vw, 1.4rem) 4rem; }
	header { max-width: 720px; }
	.eyebrow { margin: 0; color: #60a5fa; font-family: var(--font-heading); font-size: .82rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
	h1 { margin: .4rem 0 0; font-family: var(--font-heading); font-size: clamp(1.9rem, 1.5rem + 2vw, 2.5rem); line-height: 1.08; }
	header > p:last-child { margin: .75rem 0 0; line-height: 1.7; opacity: .84; }
	.article-list { display: grid; gap: .85rem; list-style: none; margin: 1.5rem 0 0; padding: 0; }
	.article-list a { display: block; padding: 1.15rem; border: 1px solid hsl(var(--border)); border-radius: var(--radius-card); background: hsl(var(--surface)); color: inherit; text-decoration: none; transition: border-color .18s ease, box-shadow .18s ease; }
	.article-list a:hover { border-color: rgba(96, 165, 250, .5); box-shadow: 0 12px 28px var(--shadow-color); }
	.article-list h2, .article-list p { margin: 0; }
	.article-list h2 { font-family: var(--font-heading); font-size: 1.08rem; }
	.article-list p { margin-top: .4rem; line-height: 1.6; opacity: .78; }
</style>
