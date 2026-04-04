<script lang="ts">
	import SeoSupportPage from '$lib/components/SeoSupportPage.svelte';
	import { seoSupportPages } from '$lib/data/seo-support-pages';

	const config = seoSupportPages['samtalsstod-utan-vantetid'];
</script>

<SeoSupportPage {config} />
