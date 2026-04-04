<script lang="ts">
	import SeoSupportPage from '$lib/components/SeoSupportPage.svelte';
	import { seoSupportPages } from '$lib/data/seo-support-pages';

	const config = seoSupportPages['hjalp-mot-oro-online'];
</script>

<SeoSupportPage {config} />
