<script lang="ts">
	import { canonicalUrl } from '$lib/seo';
	type OpenGraph = {
		title?: string;
		description?: string;
		url?: string;
	};

	type SeoHeadProps = {
		title: string;
		description: string;
		canonical: string;
		og?: OpenGraph;
	};

	let { title, description, canonical, og }: SeoHeadProps = $props();

	const ogTitle = $derived(og?.title ?? title);
	const ogDescription = $derived(og?.description ?? description);
	const ogUrl = $derived(canonicalUrl(og?.url ?? canonical));
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:url" content={ogUrl} />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="robots" content="index, follow" />
</svelte:head>
