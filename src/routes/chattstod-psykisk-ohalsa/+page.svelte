<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SeoSupportPage from '$lib/components/SeoSupportPage.svelte';
	import { seoSupportPages } from '$lib/data/seo-support-pages';

	const config = seoSupportPages['chattstod-psykisk-ohalsa'];
</script>

<SEO canonical="https://mittpsyke.se/chattstod-psykisk-ohalsa" />

<SeoSupportPage {config} />
