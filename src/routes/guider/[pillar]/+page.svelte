<script lang="ts">
	import { page } from '$app/stores';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import SeoPillarLanding from '$lib/components/SeoPillarLanding.svelte';
	import { buildTitle } from '$lib/seo-kit/seo';
	import { PUBLIC_SITE_ORIGIN } from '$lib/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	function withBrand(value: string): string {
		return value.includes('MittPsyke') ? value : buildTitle(value);
	}

	const headline = $derived(data.landing?.h1 ?? data.pillar.title);
	const pageDescription = $derived(data.landing?.seoDescription ?? data.pillar.description);
	const pageTitle = $derived(withBrand(data.landing?.seoTitle ?? data.pillar.title));
	const articleSchema = $derived({
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		headline,
		description: pageDescription,
		url: `${PUBLIC_SITE_ORIGIN}${$page.url.pathname}`,
		publisher: {
			'@type': 'Organization',
			name: 'MittPsyke',
			url: PUBLIC_SITE_ORIGIN
		},
		inLanguage: 'sv-SE'
	});
	const faqSchema = $derived(
		data.landing?.faqs?.length
			? {
					'@context': 'https://schema.org',
					'@type': 'FAQPage',
					mainEntity: data.landing.faqs.map((faq: { question: string; answer: string }) => ({
						'@type': 'Question',
						name: faq.question,
						acceptedAnswer: {
							'@type': 'Answer',
							text: faq.answer
						}
					}))
				}
			: null
	);
</script>

<SEO canonical={`https://mittpsyke.se${$page.url.pathname}`} />

<SeoHead
	title={pageTitle}
	description={pageDescription}
	canonical={`https://mittpsyke.se${$page.url.pathname}`}
/>
<BreadcrumbSchema
	crumbs={[
		{ name: 'Hem', url: '/' },
		{ name: 'Guider', url: '/guider' },
		{ name: data.pillar.title, url: $page.url.pathname }
	]}
/>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}<\/script>`}
	{#if faqSchema}
		{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}<\/script>`}
	{/if}
</svelte:head>

<SeoPillarLanding pillar={data.pillar} guides={data.guides} landing={data.landing} />
