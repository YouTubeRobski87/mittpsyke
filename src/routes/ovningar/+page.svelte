<script lang="ts">
	import { pillars, tools } from '$lib/data/seo-architecture';

	const pillarLabelBySlug = Object.fromEntries(pillars.map((pillar) => [pillar.slug, pillar.title]));
</script>

<svelte:head>
	<title>Övningar | Verktyg i lugn takt | MittPsyke</title>
	<meta
		name="description"
		content="Praktiska övningar för ångest, stress, självkänsla, relationer och mental återhämtning i lugn takt."
	/>
	<meta property="og:title" content="Övningar | Verktyg i lugn takt | MittPsyke" />
	<meta
		property="og:description"
		content="Utforska lugna övningar för reflektion, ångest, oro och återhämtning. Börja där du är och ta små steg."
	/>
	<link rel="canonical" href="https://mittpsyke.se/ovningar" />
</svelte:head>

<main class="container tools-page">
	<header class="intro">
		<h1>&Ouml;vningar</h1>
		<p>V&auml;lkomponerade steg-f&ouml;r-steg-&ouml;vningar som du kan anv&auml;nda direkt i vardagen.</p>
	</header>

	<section class="links-block" aria-label="Fördjupning">
		<p>
			Om du vill börja med ångestrelaterade verktyg kan du läsa mer om
			<a href="/andningsovningar-mot-angest">andningsövningar mot ångest</a> eller
			<a href="/ovningar-mot-angest-online">övningar mot ångest online</a>.
		</p>
	</section>

	<section class="grid" aria-label="Alla övningar">
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

	.links-block {
		margin-top: 1.3rem;
		max-width: 62ch;
		opacity: 0.84;
	}

	.links-block a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.card {
		padding: 1rem;
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

	:global(.dark) .card {
		background: #192127;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .card:hover {
		background: #1f2a31;
	}
</style>
