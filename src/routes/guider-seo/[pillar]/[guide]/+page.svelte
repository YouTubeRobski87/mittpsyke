<script lang="ts">
	import SeoCta from '$lib/seo-kit/SeoCta.svelte';
	import { buildTitle, canonical } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	$: jsonLdArticle = {
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
	};

	$: jsonLdFaq = data.guide.faqs?.length ? {
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
	} : null;
</script>

<svelte:head>
	<title>{buildTitle(data.guide.title)}</title>
	<link rel="canonical" href={canonical(`/guider-seo/${data.pillar.slug}/${data.guide.slug}`)} />
	<meta name="description" content={data.guide.description} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLdArticle)}</script>`}
	{#if jsonLdFaq}
		{@html `<script type="application/ld+json">${JSON.stringify(jsonLdFaq)}</script>`}
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

	<h2>Vanliga fragor</h2>
	<ul>
		{#each data.guide.faqs as faq}
			<li>
				<strong>{faq.question}</strong>
				<p>{faq.answer}</p>
			</li>
		{/each}
	</ul>

	<SeoCta chatPath={data.pillar.chatPath} />
</main>
