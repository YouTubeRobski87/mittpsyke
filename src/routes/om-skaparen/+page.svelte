<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';

	const creatorEmail = 'rbsthh@gmail.com';
	const creatorMailto = `mailto:${creatorEmail}`;
	const githubUrl = 'https://github.com/YouTubeRobski87';

	const techItems = [
		{
			title: 'SvelteKit',
			text: 'Appen är byggd med SvelteKit och Svelte, med fokus på snabb laddning, tydliga vyer och en lugn användarupplevelse.'
		},
		{
			title: 'Supabase',
			text: 'Supabase används som teknisk grund för konto, databas och funktioner som behöver sparas över tid.'
		},
		{
			title: 'Render och Vercel',
			text: 'Nuvarande projektkonfiguration använder Render som Node-deployment. Repoet har även Vercel-konfiguration för redirects och domänlogik.'
		},
		{
			title: 'Modern frontend',
			text: 'Gränssnittet byggs mobil först med återanvändbara komponenter, tydlig typografi och återhållna visuella beslut.'
		},
		{
			title: 'AI-stöd',
			text: 'AI används som textbaserat reflektionsstöd. Det ska hjälpa användaren att sortera tankar, inte ersätta vård eller mänskligt stöd.'
		},
		{
			title: 'Tillgänglighetsfokus',
			text: 'Sidor och flöden utvecklas med läsbarhet, kontrast, enkel svenska och lugna steg som viktiga principer.'
		}
	] as const;

	const processItems = [
		'Stegvis utveckling där funktioner byggs, testas och förbättras i små delar.',
		'Testning med fokus på att sidan fungerar, känns begriplig och inte skapar onödig friktion.',
		'Förbättringar efter verkliga behov, användarperspektiv och sådant som märks i praktisk användning.',
		'Fokus på trygg UX, enkelhet och trovärdighet före snabba effekter eller överlastade flöden.'
	] as const;

	const structuredData = {
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'Om skaparen',
		url: 'https://www.mittpsyke.se/om-skaparen',
		description:
			'Presentation av Robert "Robban" Claesson, personen bakom MittPsyke.',
		mainEntity: {
			'@type': 'Person',
			name: 'Robert Claesson',
			alternateName: 'Robban',
			url: githubUrl,
			sameAs: [githubUrl],
			knowsAbout: [
				'SvelteKit',
				'Supabase',
				'modern frontend',
				'AI-stöd',
				'tillgänglighet',
				'digital psykisk hälsa'
			]
		},
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	};
</script>

<SEO canonical="https://www.mittpsyke.se/om-skaparen" />

<svelte:head>
	<title>Om skaparen | MittPsyke</title>
	<meta
		name="description"
		content='Lär känna Robert "Robban" Claesson, personen bakom MittPsyke, och hur projektet byggs med egen erfarenhet, teknik och trygg UX.'
	/>
	{@html `<script type="application/ld+json">${JSON.stringify(structuredData)}<\/script>`}
</svelte:head>

<main class="creator-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Om skaparen' }]} />

	<header class="creator-hero">
		<div class="creator-hero-copy">
			<p class="creator-eyebrow">Bakom MittPsyke</p>
			<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Om skaparen</h1>
			<p class="creator-lead opacity-80 leading-relaxed">
				MittPsyke är byggt av Robert "Robban" Claesson, med målet att göra psykisk
				hälsa mer begriplig, tillgänglig och mänsklig.
			</p>
		</div>

		<aside class="creator-snapshot" aria-label='Kort om Robert "Robban" Claesson'>
			<span class="creator-monogram" aria-hidden="true">RC</span>
			<div>
				<p class="snapshot-name">Robert "Robban" Claesson</p>
				<p class="snapshot-text">Grundare, utvecklare och personen bakom MittPsyke.</p>
			</div>
		</aside>
	</header>

	<section class="creator-quick" aria-label="Kort sammanfattning">
		<h2 class="text-lg font-semibold mt-0 mb-2">Kort sammanfattning</h2>
		<ul>
			<li>MittPsyke är ett verkligt projekt under aktiv utveckling.</li>
			<li>Projektet bygger på egna erfarenheter, användarperspektiv och modern webbutveckling.</li>
			<li>Syftet är att skapa ett lugnt första steg, inte att ersätta vård.</li>
		</ul>
	</section>

	<section>
		<h2 class="text-lg font-semibold mt-8 mb-2">Varför MittPsyke skapades</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			MittPsyke skapades ur en enkel tanke: det ska vara lättare att börja prata om
			det som känns svårt. Alla har inte ork, språk eller tillgång till stöd precis när
			behovet dyker upp. Då kan en lugn digital plats göra tröskeln lägre.
		</p>
		<p class="opacity-80 leading-relaxed mb-3">
			Roberts arbete med MittPsyke bygger på egna erfarenheter av psykisk belastning,
			ett tydligt användarperspektiv och teknisk förmåga att bygga produkten steg för
			steg. Målet är inte att göra något kliniskt eller kallt, utan något som känns
			begripligt, varsamt och användbart i vardagen.
		</p>
		<p class="opacity-80 leading-relaxed mb-3">
			MittPsyke ersätter inte vård, diagnos eller behandling. Plattformen är tänkt som
			en första lågtrösklig ingång för reflektion, struktur och vidare vägledning när
			annan hjälp behövs.
		</p>
	</section>

	<section>
		<h2 class="text-lg font-semibold mt-8 mb-2">Teknik bakom MittPsyke</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			Projektet kombinerar modern webbteknik med ett tydligt fokus på trygghet,
			läsbarhet och enkelhet. Tekniken ska bära upp upplevelsen utan att ta över den.
		</p>

		<div class="tech-grid">
			{#each techItems as item}
				<article class="info-card">
					<h3>{item.title}</h3>
					<p>{item.text}</p>
				</article>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-lg font-semibold mt-8 mb-2">Utvecklingsprocess</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			MittPsyke utvecklas praktiskt och långsiktigt. Nya delar tas fram i små steg,
			provas mot verkliga behov och justeras när något kan göras tydligare, tryggare
			eller enklare.
		</p>

		<ol class="process-list">
			{#each processItems as item, index}
				<li>
					<span class="process-number">{index + 1}</span>
					<span>{item}</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="contact-panel" aria-labelledby="creator-contact">
		<h2 id="creator-contact" class="text-lg font-semibold mt-0 mb-2">Kontakt</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			För frågor om MittPsyke, samarbeten, arbete eller investerarkontakt går det just
			nu bra att mejla Robert direkt.
		</p>
		<ul>
			<li>
				<strong>E-post:</strong>
				<a href={creatorMailto} class="underline hover:no-underline">{creatorEmail}</a>
			</li>
			<li>
				<strong>GitHub:</strong>
				<a href={githubUrl} target="_blank" rel="noopener noreferrer" class="underline hover:no-underline">
					github.com/YouTubeRobski87
				</a>
			</li>
		</ul>
	</section>
</main>

<style>
	.creator-content {
		max-width: 820px;
	}

	.creator-content p,
	.creator-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: 0;
	}

	.creator-content p {
		margin-bottom: 1rem;
	}

	.creator-content h1,
	.creator-content h2,
	.creator-content h3 {
		font-family: var(--font-heading);
		letter-spacing: 0;
	}

	.creator-content h1 {
		font-weight: 850;
		line-height: 1.1;
	}

	.creator-content h2 {
		font-weight: 700;
		line-height: 1.15;
	}

	.creator-content h3 {
		margin: 0 0 0.45rem;
		font-size: 1rem;
		font-weight: 700;
		line-height: 1.2;
	}

	.creator-hero {
		display: grid;
		gap: 1rem;
		align-items: stretch;
		margin-top: 0.5rem;
	}

	.creator-hero-copy {
		min-width: 0;
	}

	.creator-eyebrow {
		margin: 0 0 0.45rem;
		color: var(--primary);
		font-family: var(--font-heading);
		font-size: 0.86rem;
		font-weight: 700;
		line-height: 1.3;
	}

	.creator-lead {
		max-width: 660px;
		font-size: clamp(1rem, 0.96rem + 0.25vw, 1.1rem);
	}

	.creator-snapshot,
	.creator-quick,
	.info-card,
	.contact-panel {
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--surface-soft));
	}

	.creator-snapshot {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.85rem;
		align-items: center;
		padding: 1rem;
	}

	.creator-monogram {
		display: inline-flex;
		width: 3rem;
		height: 3rem;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-input);
		background: var(--primary-soft);
		color: var(--primary);
		font-family: var(--font-heading);
		font-weight: 850;
		line-height: 1;
	}

	.snapshot-name {
		margin: 0 0 0.2rem;
		font-family: var(--font-heading);
		font-weight: 700;
		line-height: 1.25;
	}

	.snapshot-text {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.creator-quick {
		margin-top: 1.15rem;
		padding: 1rem;
	}

	.creator-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.tech-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
		margin-top: 1rem;
	}

	.info-card {
		padding: 1rem;
	}

	.info-card p {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.98rem;
		line-height: 1.65;
	}

	.process-list {
		list-style: none;
		margin: 1rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.75rem;
	}

	.process-list li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
		align-items: start;
		padding: 0.85rem 0;
		border-top: 1px solid hsl(var(--border));
	}

	.process-list li:last-child {
		border-bottom: 1px solid hsl(var(--border));
	}

	.process-number {
		display: inline-flex;
		width: 1.8rem;
		height: 1.8rem;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		background: var(--primary-soft);
		color: var(--primary);
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 800;
		line-height: 1;
	}

	.contact-panel {
		margin-top: 2rem;
		padding: 1rem;
	}

	.contact-panel ul {
		margin: 0.75rem 0 0;
		padding: 0;
		display: grid;
		gap: 0.45rem;
		list-style: none;
	}

	@media (min-width: 760px) {
		.creator-hero {
			grid-template-columns: minmax(0, 1fr) minmax(260px, 0.45fr);
			gap: 1.25rem;
		}

		.tech-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.creator-content {
			padding-top: 2rem;
			padding-bottom: 2.8rem;
		}

		.creator-snapshot,
		.creator-quick,
		.info-card,
		.contact-panel {
			padding: 0.9rem;
		}
	}

	:global(.dark) .creator-monogram,
	:global(.dark) .process-number {
		background: var(--primary-dark-soft);
		color: var(--primary-dark);
	}
</style>
