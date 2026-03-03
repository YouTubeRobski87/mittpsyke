<script lang="ts">
	import { pillars, tools } from '$lib/data/seo-architecture';

	const pillarLabelBySlug = Object.fromEntries(pillars.map((pillar) => [pillar.slug, pillar.title]));
</script>

<svelte:head>
	<title>Ovningar | MittPsyke</title>
	<meta
		name="description"
		content="Praktiska ovningar for angest, stress, sjalvkansla, relationer och mental aterhamtning."
	/>
</svelte:head>

<main class="container tools-page">
	<header class="intro">
		<h1>Ovningar</h1>
		<p>Valkomponerade steg-for-steg-ovningar som du kan anvanda direkt i vardagen.</p>
	</header>

	<section class="grid" aria-label="Alla ovningar">
		{#each tools as tool}
			<a class="card" href={`/ovningar/${tool.slug}`}>
				<h2>{tool.title}</h2>
				<p>{tool.description}</p>
				<span class="meta">{pillarLabelBySlug[tool.pillarSlug]}</span>
			</a>
		{/each}
	</section>
</main>

<style>
	.tools-page {
		padding: 1.5rem 1.25rem 3.5rem;
	}

	.intro h1 {
		margin: 0;
		font-size: clamp(1.9rem, 4vw, 2.5rem);
	}

	.intro p {
		margin: 0.8rem 0 0;
		max-width: 62ch;
		opacity: 0.84;
	}

	.grid {
		margin-top: 1.6rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 0.95rem;
	}

	.card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(255, 255, 255, 0.05);
		background: var(--bg-card);
		box-shadow: var(--shadow-elevated);
		transition: transform 160ms ease, background-color 160ms ease;
	}

	.card:hover {
		transform: translateY(-2px);
		background: #1c2c3f;
	}

	.card h2 {
		margin: 0;
		font-size: 1.04rem;
	}

	.card p {
		margin: 0.55rem 0 0;
		font-size: 0.94rem;
		opacity: 0.82;
	}

	.meta {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.83rem;
		opacity: 0.74;
	}

</style>
