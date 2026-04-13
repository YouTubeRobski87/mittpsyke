<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { buildTitle } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<SEO canonical="https://www.mittpsyke.se/guider" />

<svelte:head>
	<title>{buildTitle('Guider')}</title>
	<meta name="description" content="Utforska guider inom ångest, depression, stress, trauma och beroende." />
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<main>
	<h1>Guider SEO</h1>
	<ul>
		{#each data.pillars as pillar}
			<li>
				<a href={`/guider-seo/${pillar.slug}`}>{pillar.title}</a>
			</li>
		{/each}
	</ul>
</main>
