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

<main class="mx-auto max-w-3xl px-4 py-10">
	<nav class="mb-5 text-sm opacity-75">
		<a class="hover:underline" href="/guider-seo">Guider SEO</a>
		<span> / </span>
		<a class="hover:underline" href={`/guider-seo/${data.pillar.slug}`}>{data.pillar.title}</a>
	</nav>

	<h1 class="text-3xl font-semibold tracking-tight">{data.guide.title}</h1>
	<p class="mt-3 leading-relaxed text-black/75">{data.guide.description}</p>

	<section class="mt-6 rounded-xl border border-black/10 bg-black/[0.02] p-4" aria-label="Om innehållet">
		<p class="text-sm"><strong>Innehåll från MittPsyke</strong></p>
		<p class="mt-2 text-sm leading-relaxed text-black/80">Det här är stödjande information för reflektion och egen förståelse. Det ersätter inte vård, diagnos eller behandling.</p>
		{#if data.guide.relatedArticles?.length}
			<p class="mt-2 text-sm leading-relaxed text-black/80">Källa och vidare läsning: relaterade artiklar inom MittPsyke finns längre ned på sidan.</p>
		{/if}
	</section>

	<h2 class="mt-8 text-xl font-semibold">Vanliga frågor</h2>
	<ul class="mt-4 space-y-3">
		{#each data.guide.faqs as faq}
			<li class="rounded-lg border border-black/10 p-4">
				<strong>{faq.question}</strong>
				<p class="mt-2 leading-relaxed text-black/80">{faq.answer}</p>
			</li>
		{/each}
	</ul>

	{#if data.guide.relatedArticles?.length}
		<h2 class="mt-8 text-xl font-semibold">Relaterade artiklar</h2>
		<p class="mt-2 leading-relaxed text-black/75">Fördjupning och vidare läsning inom samma område.</p>
		<ul class="mt-3 space-y-2">
			{#each data.guide.relatedArticles as article}
				<li>
					<a class="hover:underline" href={article.href}>{article.title}</a>
				</li>
			{/each}
		</ul>
	{/if}

	<div class="mt-10">
		<SeoCta chatPath={data.pillar.chatPath} />
	</div>
</main>
