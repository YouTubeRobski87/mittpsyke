<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { page } from '$app/stores';
	import SeoHead from '$lib/components/SeoHead.svelte';
	import { formatToolMinutes, getToolsByNeed } from '$lib/data/seo-architecture';

	// Övningarna visas efter behov, så att den som mår dåligt hittar något som
	// passar utan att läsa igenom alla. Längd och skrivande syns på kortet.
	const groups = getToolsByNeed();
</script>

<SEO canonical="https://mittpsyke.se/ovningar" />

<SeoHead
	title="Övningar mot ångest och stress – steg för steg | MittPsyke"
	description="Steg-för-steg-övningar mot ångest, stress, sömn och självkänsla. Konkreta verktyg för vardagen i lugn takt."
	canonical={`https://mittpsyke.se${$page.url.pathname}`}
/>

<div class="container tools-page">
	<Breadcrumbs items={[{ label: 'Övningar' }]} />

	<header class="intro">
		<h1>Övningar mot ångest och stress</h1>
		<p>Steg-för-steg-övningar som hjälper dig att landa, sortera tankar och ta små steg i vardagen.</p>
		<p class="intro-note">
			Övningarna är tänkta som stöd för reflektion och lugn. De ersätter inte vård,
			diagnos eller behandling.
		</p>
	</header>

	{#each groups as group (group.id)}
		<section class="need-group" aria-labelledby={`behov-${group.id}`}>
			<h2 id={`behov-${group.id}`}>{group.title}</h2>
			<p class="need-description">{group.description}</p>
			<ul class="grid">
				{#each group.tools as tool (tool.slug)}
					<li>
						<a class="card" href={`/ovningar/${tool.slug}`}>
							<h3>{tool.title}</h3>
							<p>{tool.description}</p>
							<span class="meta">
								{formatToolMinutes(tool)}{#if tool.involvesWriting}<span aria-hidden="true">&nbsp;·&nbsp;</span
									><span class="sr-only">, </span>Med skrivande{/if}
							</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/each}

	<section class="links-block" aria-labelledby="las-mer-angest">
		<h2 id="las-mer-angest" class="links-title">Läs mer om övningar mot ångest</h2>
		<div class="links-list">
			<a href="/andningsovningar-mot-angest">Andningsövningar mot ångest</a>
			<a href="/ovningar-mot-angest-online">Övningar mot ångest online</a>
			<a href="/4-7-8-andning-ovning">4-7-8 andning</a>
			<a href="/exponering-ovningar-mot-angest">Exponeringsövningar mot ångest</a>
		</div>
	</section>
</div>

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

	.need-group {
		margin-top: 2.2rem;
	}

	.need-group h2 {
		margin: 0;
		font-size: 1.3rem;
		line-height: 1.35;
	}

	.need-description {
		margin: 0.4rem 0 0;
		max-width: 62ch;
		line-height: 1.6;
		opacity: 0.84;
	}

	.links-block {
		margin-top: 2.6rem;
		max-width: 62ch;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		background: #f4f7ff;
		border: 1px solid rgba(37, 99, 235, 0.14);
	}

	.links-title {
		margin: 0;
		line-height: 1.4;
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
		border: 1px solid rgba(37, 99, 235, 0.12);
		color: #1d4ed8;
		text-decoration: underline;
		text-underline-offset: 2px;
		transition: background-color 160ms ease, border-color 160ms ease, color 160ms ease;
	}

	.links-list a:hover,
	.links-list a:focus-visible {
		background: #eff6ff;
		border-color: rgba(29, 78, 216, 0.28);
		color: #1e40af;
	}

	.grid {
		margin: 0.9rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 1.05rem;
	}

	.grid li {
		display: flex;
	}

	.card {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: 1.1rem 1rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(37, 99, 235, 0.14);
		background: #f7fbff;
		transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease,
			box-shadow 160ms ease;
	}

	.card:hover {
		transform: translateY(-2px);
		border-color: rgba(29, 78, 216, 0.32);
		background: #eef4ff;
		box-shadow: 0 12px 26px rgba(30, 64, 175, 0.08);
	}

	.card:focus-visible {
		outline: 3px solid rgba(37, 99, 235, 0.28);
		outline-offset: 3px;
	}

	.card h3 {
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
		margin-top: auto;
		padding-top: 0.8rem;
		font-size: 0.86rem;
		opacity: 0.86;
	}

	@media (prefers-reduced-motion: reduce) {
		.card {
			transition: none;
		}

		.card:hover {
			transform: none;
		}
	}

	:global(.dark) .links-block {
		background: #111827;
		border-color: rgba(96, 165, 250, 0.18);
	}

	:global(.dark) .links-list a {
		background: #172033;
		border-color: rgba(147, 197, 253, 0.18);
		color: #bfdbfe;
	}

	:global(.dark) .links-list a:hover,
	:global(.dark) .links-list a:focus-visible {
		background: #1e293b;
		border-color: rgba(147, 197, 253, 0.34);
		color: #dbeafe;
	}

	:global(.dark) .card {
		background: #111827;
		border-color: rgba(96, 165, 250, 0.18);
	}

	:global(.dark) .card:hover {
		border-color: rgba(147, 197, 253, 0.34);
		background: #172033;
		box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
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

