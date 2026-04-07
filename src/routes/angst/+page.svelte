<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import type { PageData } from './$types';
	import AnxietyLandingPage from '$lib/components/landing/AnxietyLandingPage.svelte';

	let { data }: { data: PageData } = $props();

	type LandingPageData = {
		pageId: string;
		pageRecordId: string | null;
		name: string;
		slug: string;
		description: string;
		seoTitle: string;
		seoMeta: string;
		h1Heading: string;
		ctaText: string;
		keywords: string[];
		htmlContent: string | null;
		canonicalUrl: string;
	};

	function getLandingData() {
		return data as unknown as LandingPageData;
	}
</script>

<SEO canonical={getLandingData().canonicalUrl} />

<AnxietyLandingPage data={getLandingData()} />
