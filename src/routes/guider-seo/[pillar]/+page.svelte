<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SeoPillarLanding from '$lib/components/SeoPillarLanding.svelte';
	import { buildTitle } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const pageTitle = $derived(data.landing?.seoTitle ?? data.pillar.title);
	const pageDescription = $derived(data.landing?.seoDescription ?? data.pillar.description);

</script>

<SEO canonical={`https://mittpsyke.se/guider/${data.pillar.slug}`} />

<svelte:head>
	<title>{buildTitle(pageTitle)}</title>
	<meta name="description" content={pageDescription} />
	<meta name="robots" content="noindex, follow" />
	<meta property="og:title" content={buildTitle(pageTitle)} />
	<meta property="og:description" content={pageDescription} />
</svelte:head>

<SeoPillarLanding pillar={data.pillar} guides={data.guides} landing={data.landing} />
