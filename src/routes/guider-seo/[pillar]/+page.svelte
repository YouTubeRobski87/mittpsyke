<script lang="ts">
	import GuideActionCta from '$lib/components/GuideActionCta.svelte';
	import { buildTitle, canonical } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const jsonLd = $derived({
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"headline": data.pillar.title,
		"description": data.pillar.description,
		"url": `https://mittpsyke.se/guider-seo/${data.pillar.slug}`,
		"author": [
			{
				"@type": "Organization",
				"name": "MittPsyke",
				"url": "https://mittpsyke.se"
			},
			{
				"@type": "Person",
				"name": "Robert Claesson",
				"jobTitle": "Grundare",
				"url": "https://mittpsyke.se/om-mittpsyke"
			}
		],
		"inLanguage": "sv-SE"
	});
</script>

<svelte:head>
	<title>{buildTitle(data.pillar.title)}</title>
	<link rel="canonical" href={canonical(`/guider-seo/${data.pillar.slug}`)} />
	<meta name="description" content={data.pillar.description} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
</svelte:head>

<main class="mx-auto max-w-3xl px-4 py-10">
	<nav class="text-sm opacity-75">
		<a class="hover:underline" href="/guider-seo">Guider SEO</a>
	</nav>
	<h1 class="mt-3 text-3xl font-semibold tracking-tight">{data.pillar.title}</h1>
	<p class="mt-3 leading-relaxed text-black/75">{data.pillar.description}</p>

	<ul class="mt-5 space-y-2">
		{#each data.guides as guide}
			<li>
				<a class="hover:underline" href={`/guider-seo/${guide.pillarSlug}/${guide.slug}`}>{guide.title}</a>
			</li>
		{/each}
	</ul>

	<GuideActionCta
		layout="compact"
		pillarSlug={data.pillar.slug}
		chatHref={data.pillar.chatPath}
		exerciseHref="/ovningar"
		exerciseLabel="Se alla övningar"
	/>
</main>
