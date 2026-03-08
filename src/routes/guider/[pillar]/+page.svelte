<script lang="ts">
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const jsonLd = $derived({
		"@context": "https://schema.org",
		"@type": "CollectionPage",
		"name": data.pillar.title,
		"description": data.pillar.description,
		"url": `https://mittpsyke.se/guider/${data.pillar.slug}`,
		"breadcrumb": {
			"@type": "BreadcrumbList",
			"itemListElement": [
				{ "@type": "ListItem", "position": 1, "name": "Hem", "item": "https://mittpsyke.se" },
				{ "@type": "ListItem", "position": 2, "name": "Guider", "item": "https://mittpsyke.se/guider" },
				{ "@type": "ListItem", "position": 3, "name": data.pillar.title, "item": `https://mittpsyke.se/guider/${data.pillar.slug}` }
			]
		},
		"publisher": { "@type": "Organization", "name": "MittPsyke", "url": "https://mittpsyke.se" }
	});
</script>

<svelte:head>
	<title>{data.pillar.title} | Guider | MittPsyke</title>
	<meta name="description" content={data.pillar.description} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<main class="container pillar-page">
	<nav class="crumbs" aria-label="Breadcrumb">
		<a href="/">Hem</a>
		<span>/</span>
		<a href="/guider">Guider</a>
		<span>/</span>
		<span>{data.pillar.title}</span>
	</nav>

	<header class="intro">
		<h1>{data.pillar.title}</h1>
		<p>{data.pillar.description}</p>
	</header>

	<section class="block" aria-label="Klusterartiklar">
		<h2>Klusterartiklar</h2>
		<ul>
			{#each data.pillar.clusterTopics as topic}
				<li>{topic}</li>
			{/each}
		</ul>
	</section>

	<section class="block" aria-label="Relaterade övningar">
		<h2>Relaterade &ouml;vningar</h2>
		<div class="tool-grid">
			{#each data.tools as tool}
				<a class="tool-card" href={`/ovningar/${tool.slug}`}>
					<h3>{tool.title}</h3>
					<p>{tool.description}</p>
				</a>
			{/each}
		</div>
	</section>
</main>

<style>
	.pillar-page {
		padding: 1.25rem 1.25rem 3.5rem;
	}

	.crumbs {
		font-size: 0.84rem;
		opacity: 0.72;
		display: flex;
		gap: 0.35rem;
		flex-wrap: wrap;
	}

	.intro {
		margin-top: 0.9rem;
	}

	.intro h1 {
		margin: 0;
		font-size: clamp(1.9rem, 4vw, 2.6rem);
	}

	.intro p {
		margin: 0.75rem 0 0;
		max-width: 66ch;
		opacity: 0.84;
	}

	.block {
		margin-top: 1.5rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f9fcfb;
	}

	.block h2 {
		margin: 0;
		font-size: 1.2rem;
	}

	ul {
		margin: 0.8rem 0 0;
		padding-left: 1rem;
	}

	li + li {
		margin-top: 0.4rem;
	}

	.tool-grid {
		margin-top: 0.9rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.85rem;
	}

	.tool-card {
		padding: 0.85rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #ffffff;
	}

	.tool-card h3 {
		margin: 0;
		font-size: 1rem;
	}

	.tool-card p {
		margin: 0.45rem 0 0;
		font-size: 0.92rem;
		opacity: 0.8;
	}

	:global(.dark) .block {
		background: #1a2221;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .tool-card {
		background: #232c2a;
		border-color: rgba(255, 255, 255, 0.12);
	}
</style>
