<script lang="ts">
	import { canonicalRequestUrl, canonicalUrl } from '$lib/seo';

	type SEOProps = {
		canonical: string;
		// Behåller frågesträngen, t.ex. ?page=2 i bloggens paginering. Anroparen
		// ansvarar för att bara skicka parametrar som hör till sidans innehåll.
		preserveSearch?: boolean;
	};

	let { canonical, preserveSearch = false }: SEOProps = $props();

	const canonicalHref = $derived(
		preserveSearch ? canonicalRequestUrl(canonical) : canonicalUrl(canonical)
	);
</script>

<svelte:head>
	<link rel="canonical" href={canonicalHref} />
</svelte:head>
