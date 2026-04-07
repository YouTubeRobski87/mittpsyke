<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SeoSupportPage from '$lib/components/SeoSupportPage.svelte';
	import { seoSupportPages } from '$lib/data/seo-support-pages';

	const config = seoSupportPages['chatta-anonymt-med-nagon'];
</script>

<SEO canonical="https://www.mittpsyke.se/chatta-anonymt-med-nagon" />

<SeoSupportPage {config} />
