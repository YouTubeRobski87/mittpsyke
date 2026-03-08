<script lang="ts">
	import { buildTitle, canonical } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	$: jsonLd = {
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"headline": data.pillar.title,
		"description": data.pillar.description,
		"url": `https://mittpsyke.se/guider-seo/${data.pillar.slug}`,
		"author": {
			"@type": "Organization",
			"name": "MittPsyke",
			"url": "https://mittpsyke.se"
		},
		"inLanguage": "sv-SE"
	};
</script>

<svelte:head>
	<title>{buildTitle(data.pillar.title)}</title>
	<link rel="canonical" href={canonical(`/guider-seo/${data.pillar.slug}`)} />
	<meta name="description" content={data.pillar.description} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<main>
	<nav>
		<a href="/guider-seo">Guider SEO</a>
	</nav>
	<h1>{data.pillar.title}</h1>
	<p>{data.pillar.description}</p>

	<ul>
		{#each data.guides as guide}
			<li>
				<a href={`/guider-seo/${guide.pillarSlug}/${guide.slug}`}>{guide.title}</a>
			</li>
		{/each}
	</ul>
</main>
