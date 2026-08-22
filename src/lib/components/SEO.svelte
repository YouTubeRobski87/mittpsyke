<script lang="ts">
	import { canonicalUrl } from '$lib/seo';

	type SEOProps = {
		canonical: string;
	};

	let { canonical }: SEOProps = $props();

	const canonicalHref = $derived(canonicalUrl(canonical));
</script>

<svelte:head>
	<link rel="canonical" href={canonicalHref} />
</svelte:head>
