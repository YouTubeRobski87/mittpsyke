<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SeoSupportPage from '$lib/components/SeoSupportPage.svelte';
	import { seoSupportPages } from '$lib/data/seo-support-pages';

	const config = seoSupportPages['stod-vid-ptsd-online'];
</script>

<SEO canonical="https://mittpsyke.se/stod-vid-ptsd-online" />

<SeoSupportPage {config} />
