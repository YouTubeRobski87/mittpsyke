<script lang="ts">
	import SeoCta from '$lib/seo-kit/SeoCta.svelte';
	import { buildTitle, canonical } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const jsonLdArticle = $derived({
		"@context": "https://schema.org",
		"@type": "Article",
		"headline": data.guide.title,
		"description": data.guide.description,
		"url": `https://mittpsyke.se/guider-seo/${data.pillar.slug}/${data.guide.slug}`,
		"author": {
			"@type": "Organization",
			"name": "MittPsyke",
			"url": "https://mittpsyke.se"
		},
		"publisher": {
			"@type": "Organization",
			"name": "MittPsyke",
			"url": "https://mittpsyke.se"
		},
		"inLanguage": "sv-SE"
	});

	const jsonLdFaq = $derived(data.guide.faqs?.length ? {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		"mainEntity": data.guide.faqs.map((faq: { question: string; answer: string }) => ({
			"@type": "Question",
			"name": faq.question,
			"acceptedAnswer": {
				"@type": "Answer",
				"text": faq.answer
			}
		}))
	} : null);
</script>

<svelte:head>
	<title>{buildTitle(data.guide.title)}</title>
	<link rel="canonical" href={canonical(`/guider-seo/${data.pillar.slug}/${data.guide.slug}`)} />
	<meta name="description" content={data.guide.description} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLdArticle)}<\/script>`}
	{#if jsonLdFaq}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLdFaq)}<\/script>`}
	{/if}
</svelte:head>

<main>
	<nav>
		<a href="/guider-seo">Guider SEO</a>
		<span> / </span>
		<a href={`/guider-seo/${data.pillar.slug}`}>{data.pillar.title}</a>
	</nav>

	<h1>{data.guide.title}</h1>
	<p>{data.guide.description}</p>

	<section aria-label="Om innehållet">
		<p><strong>Innehåll från MittPsyke</strong></p>
		<p>Det här är stödjande information för reflektion och egen förståelse. Det ersätter inte vård, diagnos eller behandling.</p>
		{#if data.guide.relatedArticles?.length}
			<p>Källa och vidare läsning: relaterade artiklar inom MittPsyke finns längre ned på sidan.</p>
		{/if}
	</section>

	<h2>Vanliga fragor</h2>
	<ul>
		{#each data.guide.faqs as faq}
			<li>
				<strong>{faq.question}</strong>
				<p>{faq.answer}</p>
			</li>
		{/each}
	</ul>

	{#if data.guide.relatedArticles?.length}
		<h2>Relaterade artiklar</h2>
		<p>Fördjupning och vidare läsning inom samma område.</p>
		<ul>
			{#each data.guide.relatedArticles as article}
				<li>
					<a href={article.href}>{article.title}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<SeoCta chatPath={data.pillar.chatPath} />
</main>
