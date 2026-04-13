<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { page } from '$app/stores';
	import BreadcrumbSchema from '$lib/components/BreadcrumbSchema.svelte';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { guides, pillars } from '$lib/seo-kit/content';

	const guideCountByPillar = Object.fromEntries(
		pillars.map((pillar) => [
			pillar.slug,
			guides.filter((guide) => guide.pillarSlug === pillar.slug).length
		])
	);
</script>

<SEO canonical="https://www.mittpsyke.se/guider" />

<SeoHead
	title="Guider om psykisk hälsa – ångest, stress och mer | MittPsyke"
	description="Samlade guider om ångest, stress, nedstämdhet, sömn, självkänsla och beroende. Skrivet för reflektion och förståelse i lugn takt."
	canonical={`https://www.mittpsyke.se${$page.url.pathname}`}
/>
<BreadcrumbSchema crumbs={[{ name: 'Guider', url: '/guider' }]} />

<main class="container guides-page">
	<header class="intro">
		<h1>Guider om psykisk hälsa</h1>
		<p>Välj ett område och läs en samlad guide med artiklar och övningar i lugn takt.</p>
		<p class="intro-note">
			Innehållet är sammanställt av MittPsyke som stöd för reflektion och ökad förståelse.
			Det ersätter inte vård eller behandling.
		</p>
	</header>

	<section class="grid" aria-label="Alla guider">
		{#each pillars as pillar}
			<a class="card" href={`/guider/${pillar.slug}`}>
				<h2>{pillar.title}</h2>
				<p>{pillar.description}</p>
				<span class="meta">{guideCountByPillar[pillar.slug] ?? 0} artiklar att utforska</span>
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
		line-height: 1.65;
		opacity: 0.84;
	}

	.intro-note {
		font-size: 0.94rem;
	}

	.grid {
		margin-top: 1.8rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.05rem;
	}

	.card {
		display: flex;
		flex-direction: column;
		padding: 1.1rem 1rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f8fafb;
		transition: transform 160ms ease, background-color 160ms ease;
	}

	.card:hover {
		transform: translateY(-2px);
		background: #eef3f8;
	}

	.card h2 {
		margin: 0;
		font-size: 1.1rem;
		line-height: 1.3;
	}

	.card p {
		margin: 0.6rem 0 0;
		font-size: 0.95rem;
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

	:global(.dark) .card {
		background: #1a2128;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .card:hover {
		background: #1f2530;
	}

	:global(.dark) .meta {
		background: rgba(67, 110, 143, 0.16);
	}

	@media (max-width: 640px) {
		.guides-page {
			padding: 1.25rem 1rem 3rem;
		}

		.grid {
			margin-top: 1.45rem;
			gap: 0.85rem;
		}

		.card {
			padding: 1rem 0.95rem 0.95rem;
		}
	}
</style>
