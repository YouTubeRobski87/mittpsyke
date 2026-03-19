<script lang="ts">
	import GuideActionCta from '$lib/components/GuideActionCta.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	const pillarUpdatedAt = '2026-03-08';
	const chatPathByPillar: Record<string, string> = {
		angest: '/chat/a',
		depression: '/chat/b',
		'stress-utmattning': '/chat/e',
		overtankande: '/chat/e',
		sjalvkansla: '/chat/a',
		sovproblem: '/chat/a',
		'social-angest': '/chat/a',
		relationsproblem: '/chat/b',
		'existentiell-oro': '/chat/e'
	};

	const chatPath = $derived(chatPathByPillar[data.pillar.slug] ?? '/chat');
	const guideExercise = $derived(data.tools[0]);
	const guideExerciseHref = $derived(
		guideExercise ? `/ovningar/${guideExercise.slug}` : '/ovningar'
	);
	const guideExerciseLabel = $derived(
		guideExercise ? `Prova: ${guideExercise.title}` : 'Gör en enkel övning'
	);

	const jsonLd = $derived({
		'@context': 'https://schema.org',
		'@graph': [
			{
				'@type': 'BreadcrumbList',
				'itemListElement': [
					{ '@type': 'ListItem', position: 1, name: 'Hem', item: 'https://www.mittpsyke.se' },
					{ '@type': 'ListItem', position: 2, name: 'Guider', item: 'https://www.mittpsyke.se/guider' },
					{
						'@type': 'ListItem',
						position: 3,
						name: data.pillar.title,
						item: `https://www.mittpsyke.se/guider/${data.pillar.slug}`
					}
				]
			},
			{
				'@type': 'Article',
				headline: data.pillar.title,
				description: data.pillar.description,
				image: 'https://www.mittpsyke.se/og-image.png',
				author: [
					{
						'@type': 'Organization',
						name: 'MittPsyke',
						url: 'https://www.mittpsyke.se'
					},
					{
						'@type': 'Person',
						name: 'Robert Claesson',
						jobTitle: 'Grundare',
						url: 'https://www.mittpsyke.se/om-mittpsyke'
					}
				],
				publisher: {
					'@type': 'Organization',
					name: 'MittPsyke',
					logo: {
						'@type': 'ImageObject',
						url: 'https://www.mittpsyke.se/favicon.png'
					}
				},
				datePublished: pillarUpdatedAt,
				mainEntityOfPage: {
					'@type': 'WebPage',
					'@id': `https://www.mittpsyke.se/guider/${data.pillar.slug}`
				}
			}
		]
	});
</script>

<svelte:head>
	<title>{data.pillar.title} | Guider | MittPsyke</title>
	<meta name="description" content={data.pillar.description} />
	<meta property="og:title" content={`${data.pillar.title} | Guider | MittPsyke`} />
	<meta property="og:description" content={data.pillar.description} />
	<link rel="canonical" href={`https://www.mittpsyke.se/guider/${data.pillar.slug}`} />
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}<\/script>`}
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

	<section class="info-box" aria-label="Om innehållet">
		<p><strong>Senast uppdaterad: 14 mars 2026</strong></p>
		<p>Författare: MittPsyke-redaktionen</p>
		<p>Faktagranskad mot: <a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177 Vårdguiden</a>, <a href="https://www.socialstyrelsen.se" target="_blank" rel="noopener noreferrer">Socialstyrelsen</a>, <a href="https://www.folkhalsomyndigheten.se" target="_blank" rel="noopener noreferrer">Folkhälsomyndigheten</a></p>
		<p>Innehållet är informationsbaserat och ersätter inte vård, diagnos eller individuell medicinsk bedömning.</p>
		<p class="om-innehall-link"><a href="/sa-arbetar-vi-med-innehall">Läs mer om hur vi arbetar med innehåll →</a></p>
	</section>

	<section class="block" aria-label="Artiklar i guiden">
		<h2>Artiklar i guiden</h2>
		<ul class="stack-list">
			{#each data.pillar.clusterTopics as topic}
				<li>{topic}</li>
			{/each}
		</ul>
	</section>

	<section class="block" aria-label="Övningar i samma område">
		<h2>Övningar i samma område</h2>
		<div class="tool-grid">
			{#each data.tools as tool}
				<a class="tool-card" href={`/ovningar/${tool.slug}`}>
					<h3>{tool.title}</h3>
					<p>{tool.description}</p>
				</a>
			{/each}
		</div>
	</section>

	{#if data.pillar.relatedArticles?.length}
		<section class="block" aria-label="Relaterade artiklar">
			<h2>Relaterade artiklar</h2>
			<ul class="stack-list stack-list-links stack-list-choices">
				{#each data.pillar.relatedArticles as article}
					<li><a href={article.href}>{article.title}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if data.pillar.slug === 'angest'}
		<section class="block" aria-label="Nästa steg vid ångest">
			<h2>Nästa steg vid ångest</h2>
			<p class="block-note">Om du vill ta det vidare kan du välja det som känns mest hjälpsamt just nu.</p>
			<ul class="stack-list stack-list-links stack-list-choices">
				<li><a href="/chat/a">Starta samtal om ångest</a></li>
				<li><a href="/hjalp-vid-angest-online">Läs mer om hjälp vid ångest online</a></li>
				<li><a href="/andningsovningar-mot-angest">Se andningsövningar mot ångest</a></li>
				<li><a href="/ovningar-mot-angest-online">Utforska övningar mot ångest online</a></li>
				<li><a href="/ovningar/cbt-katastroftankar">Prova övning mot katastroftankar</a></li>
				<li><a href="/dagbok">Skriv i dagboken</a></li>
				<li><a href="/framsteg">Följ mönster över tid</a></li>
			</ul>
		</section>
	{/if}

	{#if data.pillar.slug === 'depression'}
		<section class="block" aria-label="Nästa steg vid nedstämdhet">
			<h2>Nästa steg vid nedstämdhet</h2>
			<p class="block-note">Du kan börja lugnt och välja det som känns möjligt just idag.</p>
			<ul class="stack-list stack-list-links stack-list-choices">
				<li><a href="/chat/b">Starta samtal om nedstämdhet</a></li>
				<li><a href="/hjalp-vid-depression-online">Läs mer om hjälp vid depression online</a></li>
				<li><a href="/dagbok">Skriv i dagboken</a></li>
				<li><a href="/framsteg">Följ förändring över tid</a></li>
				<li><a href="/om-mittpsyke">Läs om hur MittPsyke fungerar</a></li>
			</ul>
		</section>
	{/if}

	{#if data.pillar.slug === 'stress-utmattning'}
		<section class="block" aria-label="Nästa steg vid stress">
			<h2>Nästa steg vid stress</h2>
			<p class="block-note">När belastningen är hög kan det hjälpa att välja ett litet nästa steg.</p>
			<ul class="stack-list stack-list-links stack-list-choices">
				<li><a href="/chat/e">Starta samtal om stress</a></li>
				<li><a href="/stod-vid-stress-online">Läs mer om stöd vid stress online</a></li>
				<li><a href="/ovningar/daglig-reflektionsmall">Prova daglig reflektionsmall</a></li>
				<li><a href="/dagbok">Skriv i dagboken</a></li>
				<li><a href="/framsteg">Följ återkommande mönster</a></li>
			</ul>
		</section>
	{/if}

	{#if data.pillar.slug === 'overtankande'}
		<section class="block" aria-label="Nästa steg vid oro och grubblande">
			<h2>Nästa steg vid oro och grubblande</h2>
			<p class="block-note">Om tankarna går runt kan det hjälpa att växla från analys till ett lugnt nästa steg.</p>
			<ul class="stack-list stack-list-links">
				<li><a href="/chat/e">Starta samtal om oro</a></li>
				<li><a href="/hjalp-mot-oro-online">Läs mer om hjälp mot oro online</a></li>
				<li><a href="/andningsovningar-mot-angest">Se andningsövningar mot ångest</a></li>
				<li><a href="/ovningar-mot-angest-online">Utforska övningar mot ångest online</a></li>
				<li><a href="/guider/existentiell-oro">Läs vidare om existentiell oro</a></li>
				<li><a href="/dagbok">Skriv i dagboken</a></li>
				<li><a href="/ovningar">Prova en övning</a></li>
			</ul>
		</section>
	{/if}

	<GuideActionCta
		pillarSlug={data.pillar.slug}
		chatHref={chatPath}
		exerciseHref={guideExerciseHref}
		exerciseLabel={guideExerciseLabel}
	/>
</main>

<style>
	.pillar-page {
		padding: 1.25rem 1.25rem 3.5rem;
	}

	.crumbs {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		font-size: 0.84rem;
		opacity: 0.72;
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
		line-height: 1.65;
		opacity: 0.84;
	}

	.block {
		margin-top: 1.45rem;
		padding: 1.1rem 1rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f9fcfb;
	}

	.info-box {
		margin-top: 1rem;
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #f4f8f6;
	}

	.info-box p {
		margin: 0;
		font-size: 0.93rem;
		line-height: 1.6;
		opacity: 0.84;
	}

	.info-box p + p {
		margin-top: 0.45rem;
	}

	.om-innehall-link {
		margin-top: 0.5rem;
	}
	.om-innehall-link a {
		font-size: 0.85rem;
		opacity: 0.8;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.block h2 {
		margin: 0;
		font-size: 1.18rem;
		line-height: 1.35;
	}

	.block-note {
		margin: 0.55rem 0 0;
		max-width: 58ch;
		line-height: 1.6;
		opacity: 0.82;
	}

	.stack-list {
		display: grid;
		gap: 0.65rem;
		margin: 0.85rem 0 0;
		padding: 0;
		list-style: none;
	}

	.stack-list li {
		padding: 0.8rem 0.9rem;
		border-radius: 12px;
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #ffffff;
		line-height: 1.55;
	}

	.stack-list-links a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.stack-list-choices {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
	}

	.tool-grid {
		margin-top: 0.9rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.tool-card {
		display: flex;
		flex-direction: column;
		padding: 0.95rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(0, 0, 0, 0.08);
		background: #ffffff;
	}

	.tool-card h3 {
		margin: 0;
		font-size: 1rem;
		line-height: 1.35;
	}

	.tool-card p {
		margin: 0.5rem 0 0;
		font-size: 0.92rem;
		line-height: 1.6;
		opacity: 0.8;
	}

	:global(.dark) .block {
		background: #1a2221;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .info-box {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .stack-list li,
	:global(.dark) .tool-card {
		background: #232c2a;
		border-color: rgba(255, 255, 255, 0.12);
	}

	@media (max-width: 640px) {
		.pillar-page {
			padding: 1.1rem 1rem 3rem;
		}

		.block,
		.info-box {
			padding: 0.95rem 0.9rem;
		}

		.stack-list {
			gap: 0.55rem;
		}

		.stack-list-choices {
			grid-template-columns: 1fr;
		}

		.stack-list li,
		.tool-card {
			padding: 0.8rem 0.85rem;
		}

		.tool-grid {
			grid-template-columns: 1fr;
			gap: 0.8rem;
		}

	}
</style>

