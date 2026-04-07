<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SeoSupportPage from '$lib/components/SeoSupportPage.svelte';
	import { seoSupportPages } from '$lib/data/seo-support-pages';

	const config = seoSupportPages['anonymt-samtalsstod-online'];
</script>

<SEO canonical="https://www.mittpsyke.se/anonymt-samtalsstod-online" />

<SeoSupportPage {config} />
