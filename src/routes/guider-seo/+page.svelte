<script lang="ts">
	import { buildTitle, canonical } from '$lib/seo-kit/seo';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
</script>

<svelte:head>
	<title>{buildTitle('Guider SEO')}</title>
	<link rel="canonical" href={canonical('/guider-seo')} />
	<meta
		name="description"
		content="Översikt över guider inom ångest, depression och trauma under ett separat SEO-skelett."
	/>
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
