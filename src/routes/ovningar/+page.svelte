<script lang="ts">
	import { pillars, tools } from '$lib/data/seo-architecture';

	const pillarLabelBySlug = Object.fromEntries(pillars.map((pillar) => [pillar.slug, pillar.title]));
</script>

<svelte:head>
	<title>Övningar mot ångest och stress – steg för steg | MittPsyke</title>
	<meta
		name="description"
		content="Steg-för-steg-övningar mot ångest, stress, sömn och självkänsla. Konkreta verktyg för vardagen – börja i din egen takt."
	/>
	<meta property="og:title" content="Övningar mot ångest och stress | MittPsyke" />
	<meta
		property="og:description"
		content="Steg-för-steg-övningar mot ångest, stress, sömn och självkänsla. Konkreta verktyg för vardagen – börja i din egen takt."
	/>
	<link rel="canonical" href="https://www.mittpsyke.se/ovningar" />
</svelte:head>

<main class="container tools-page">
	<header class="intro">
		<h1>Övningar mot ångest och stress</h1>
		<p>Steg-för-steg-övningar som hjälper dig att landa, sortera tankar och ta små steg i vardagen.</p>
		<p class="intro-note">
			Övningarna är tänkta som stöd för reflektion och lugn. De ersätter inte vård,
			diagnos eller behandling.
		</p>
	</header>

	<section class="links-block" aria-label="Börja här om du söker övningar mot ångest">
		<p class="links-title">Om du söker övningar mot ångest kan du börja här:</p>
		<div class="links-list">
			<a href="/andningsovningar-mot-angest">Andningsövningar mot ångest</a>
			<a href="/ovningar-mot-angest-online">Övningar mot ångest online</a>
			<a href="/4-7-8-andning-ovning">4-7-8 andning</a>
			<a href="/exponering-ovningar-mot-angest">Exponeringsövningar mot ångest</a>
		</div>
	</section>

	<section class="grid" aria-label="Alla övningar">
		{#each tools as tool}
			<a class="card" href={`/ovningar/${tool.slug}`}>
				<h2>{tool.title}</h2>
				<p>{tool.description}</p>
				<span class="meta">För {pillarLabelBySlug[tool.pillarSlug]}</span>
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
		line-height: 1.65;
		opacity: 0.84;
	}

	.intro-note {
		font-size: 0.94rem;
	}

	.links-block {
		margin-top: 1.4rem;
		max-width: 62ch;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		background: #f5f8fb;
		border: 1px solid rgba(0, 0, 0, 0.06);
	}

	.links-title {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 600;
		opacity: 0.88;
	}

	.links-list {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 0.65rem;
		margin-top: 0.8rem;
	}

	.links-list a {
		display: block;
		padding: 0.7rem 0.8rem;
		border-radius: 12px;
		background: #ffffff;
		border: 1px solid rgba(0, 0, 0, 0.06);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.grid {
		margin-top: 1.6rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.05rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		padding: 1.1rem 1rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f7fbff;
		transition: transform 160ms ease, background-color 160ms ease;
	}

	.card:hover {
		transform: translateY(-2px);
		background: #eef5fb;
	}

	.card h2 {
		margin: 0;
		font-size: 1.04rem;
		line-height: 1.35;
	}

	.card p {
		margin: 0.6rem 0 0;
		font-size: 0.94rem;
		line-height: 1.6;
		opacity: 0.82;
		display: -webkit-box;
		line-clamp: 3;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.meta {
		display: inline-flex;
		align-self: flex-start;
		margin-top: 0.9rem;
		padding: 0.34rem 0.58rem;
		border-radius: 999px;
		background: rgba(67, 110, 143, 0.1);
		font-size: 0.82rem;
		opacity: 0.8;
	}

	:global(.dark) .links-block {
		background: #1b2329;
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .links-list a {
		background: #202a31;
		border-color: rgba(255, 255, 255, 0.1);
	}

	:global(.dark) .card {
		background: #192127;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .card:hover {
		background: #1f2a31;
	}

	:global(.dark) .meta {
		background: rgba(86, 148, 201, 0.16);
	}

	@media (max-width: 640px) {
		.tools-page {
			padding: 1.25rem 1rem 3rem;
		}

		.links-block {
			padding: 0.9rem;
		}

		.links-list {
			grid-template-columns: 1fr;
			gap: 0.55rem;
		}

		.grid {
			gap: 0.85rem;
		}

		.card {
			padding: 1rem 0.95rem 0.95rem;
		}
	}
</style>

