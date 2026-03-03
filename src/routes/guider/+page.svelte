<script lang="ts">
	import { pillars } from '$lib/data/seo-architecture';
</script>

<svelte:head>
	<title>Guider | MittPsyke</title>
	<meta
		name="description"
		content="Utforska MittPsykes guider inom angest, stress, sjalvkansla, relationer och mer."
	/>
</svelte:head>

<main class="container guides-page">
	<header class="intro">
		<h1>Guider</h1>
		<p>
			Valj ett omrade och las en samlad, lugn guide med relaterade artiklar och praktiska ovningar.
		</p>
	</header>

	<section class="grid" aria-label="Alla guider">
		{#each pillars as pillar}
			<a class="card" href={`/guider/${pillar.slug}`}>
				<h2>{pillar.title}</h2>
				<p>{pillar.description}</p>
				<span class="meta">{pillar.clusterTopics.length} klusterartiklar</span>
			</a>
		{/each}
	</section>
</main>

<style>
	.guides-page {
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
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.95rem;
	}

	.card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f8fbfa;
		transition: transform 160ms ease, background-color 160ms ease;
	}

	.card:hover {
		transform: translateY(-2px);
		background: #eef6f4;
	}

	.card h2 {
		margin: 0;
		font-size: 1.1rem;
	}

	.card p {
		margin: 0.55rem 0 0;
		font-size: 0.95rem;
		opacity: 0.82;
	}

	.meta {
		display: inline-block;
		margin-top: 0.8rem;
		font-size: 0.83rem;
		opacity: 0.72;
	}

	:global(.dark) .card {
		background: #1a2221;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .card:hover {
		background: #1f2b29;
	}
</style>
