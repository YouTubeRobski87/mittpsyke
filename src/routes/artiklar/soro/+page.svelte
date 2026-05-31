<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import SoroBlogEmbed from '$lib/components/SoroBlogEmbed.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/artiklar/soro" />

<svelte:head>
	<title>Artiklar från Stödlinjer.se | MittPsyke</title>
	<meta
		name="description"
		content="Artiklar från Stödlinjer.se om stödvägar, psykiskt mående och hjälp i vardagen."
	/>
</svelte:head>

<main class="soro-page">
	<section class="soro-panel" aria-labelledby="soro-heading">
		<div class="soro-header">
			<p class="eyebrow">Stödlinjer.se</p>
			<h1 id="soro-heading">Artiklar från Stödlinjer.se</h1>
			<p>Fördjupande texter om stödvägar, psykiskt mående och hjälp i vardagen.</p>
		</div>
		<SoroBlogEmbed />
	</section>
</main>

<style>
	.soro-page {
		max-width: 1040px;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 3.5rem) clamp(1rem, 4vw, 1.5rem) clamp(3rem, 8vw, 4.5rem);
	}

	.soro-panel {
		border: 1px solid rgba(77, 95, 86, 0.16);
		border-radius: var(--radius-card);
		background: #f6fbf9;
		padding: clamp(1.1rem, 3vw, 1.6rem);
	}

	.soro-header {
		max-width: 680px;
		margin-bottom: 1.2rem;
	}

	.eyebrow,
	.soro-header h1,
	.soro-header p {
		margin: 0;
	}

	.eyebrow {
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #5f8170;
	}

	.soro-header h1 {
		margin-top: 0.35rem;
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 1.45rem + 1.6vw, 2.45rem);
		line-height: 1.08;
	}

	.soro-header p {
		margin-top: 0.75rem;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.65;
		color: rgba(22, 33, 28, 0.76);
	}

	:global(.dark) .soro-panel {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .soro-header p {
		color: rgba(245, 247, 245, 0.76);
	}
</style>
