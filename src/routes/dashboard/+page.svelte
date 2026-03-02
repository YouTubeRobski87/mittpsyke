<script lang="ts">
	import PortalCard from '$lib/components/PortalCard.svelte';
	import { portals } from '$lib/data/portals';
</script>

<svelte:head>
	<title>Min portal - MittPsyke</title>
</svelte:head>

<section class="container py-10">
	<div class="mx-auto max-w-3xl text-center mb-8">
		<h1 class="text-3xl font-semibold mb-3">Min portal</h1>
		<p class="opacity-75">Valj den inriktning som kanns mest relevant just nu.</p>
	</div>

	<div class="mx-auto max-w-3xl grid gap-3">
		{#each portals as portal, index}
			<PortalCard {portal} active={index === 0} />
		{/each}
	</div>
</section>