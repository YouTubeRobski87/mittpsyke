<script lang="ts">
	import SeoPillarLanding from '$lib/components/SeoPillarLanding.svelte';
	import { buildTitle, canonical } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const pageTitle = $derived(data.landing?.seoTitle ?? data.pillar.title);
	const pageDescription = $derived(data.landing?.seoDescription ?? data.pillar.description);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'CollectionPage',
				headline: data.landing?.h1 ?? data.pillar.title,
				description: pageDescription,
				url: `https://www.mittpsyke.se/guider-seo/${data.pillar.slug}`,
				author: [
					{ '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' },
					{
						'@type': 'Person',
						name: 'Robert Claesson',
						jobTitle: 'Grundare',
						url: 'https://www.mittpsyke.se/om-mittpsyke'
					}
				],
				inLanguage: 'sv-SE'
			},
			{
				'@type': 'BreadcrumbList',
				itemListElement: [
					{ '@type': 'ListItem', position: 1, name: 'Hem', item: 'https://www.mittpsyke.se' },
					{ '@type': 'ListItem', position: 2, name: 'Guider', item: 'https://www.mittpsyke.se/guider' },
					{
						'@type': 'ListItem',
						position: 3,
						name: data.pillar.title,
						item: `https://www.mittpsyke.se/guider-seo/${data.pillar.slug}`
					}
				]
			}
		]
	});
</script>

<svelte:head>
	<title>{buildTitle(pageTitle)}</title>
	<link rel="canonical" href={canonical(`/guider-seo/${data.pillar.slug}`)} />
	<meta name="description" content={pageDescription} />
	<meta property="og:title" content={buildTitle(pageTitle)} />
	<meta property="og:description" content={pageDescription} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<SeoPillarLanding pillar={data.pillar} guides={data.guides} landing={data.landing} />

