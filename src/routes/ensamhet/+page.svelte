<script lang="ts">
	import TopicGuideSection from '$lib/components/TopicGuideSection.svelte';
</script>

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'MedicalWebPage',
		name: 'Hjälp vid ensamhet – prata anonymt',
		url: 'https://www.mittpsyke.se/ensamhet',
		description: 'Få stöd för ensamhet och isolering. Prata anonymt med AI-baserat samtalsstöd dygnet runt.',
		about: { '@type': 'MedicalCondition', name: 'Ensamhet' },
		medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
		specialty: 'https://schema.org/Psychiatric',
		dateModified: '2026-03-14',
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="page">
	<div class="page-container">
		<!-- Hero Section -->
		<header class="hero">
			<h1>Hjälp vid ensamhet – prata anonymt</h1>
			<p>
				Ensamhet kan kännas som att vara en ö – omgiven av andra men helt isolerad. Det kan slå till plötsligt eller växa långsamt,
				och det väger tungt. Du är inte svag för att känna det. Ensamhet är något många bär på, men ofta i tystnad.
				MittPsyke erbjuder ett tillfälle att prata och vara sedd, varsamt och utan krav.
			</p>
		</header>

		<div class="text-block">
			<!-- Support Text -->
			<section class="section">
				<p>
					Ensamhet handlar inte alltid om att vara fysiskt ensam. Det kan vara en känsla av att inte höra hemma,
					eller att ingen riktigt förstår vad du genomlever. Det kan växa ur sjukdom, förflyttning, förlust eller helt enkelt
					från hur människor runt omkring är utformade. Oavsett orsaken förtjänar ensamheten att mötas med värme.
				</p>
			</section>

			<section class="section">
				<p>
					Här kan du ha ett samtal precis som du behöver. Du behöver inte förklara varför du är ensam eller försvara dina känslor.
					Du kan prata om saknad, om längtan, eller bara om hur det känns att inte höra hemma. Samtalsstödet är designat för att
					möta dig genuint, och du kan vara helt anonym medan du sätter ord på det som är svårt.
				</p>
			</section>
		</div>

		<!-- CTA Button -->
		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Starta ett samtal</a>
		</div>

		<!-- Additional Support Info -->
		<aside class="callout" aria-label="Viktigt att veta">
			<h2>Du är inte ensam med ensamheten</h2>
			<p>Många människor känner denna tomhet. Det du söker efter – förbindelse, förståelse, att bli sedd – är helt mänskligt och naturligt. MittPsyke kan vara ett första steg.</p>
		</aside>

		<TopicGuideSection
			topicTitle="Ensamhet"
			guideHref="/guider/ensamhet"
			articleLinks={[
				{ title: 'Känner mig ensam – att bära ensamheten i tystnad', href: '/guider/ensamhet/kanner-mig-ensam' },
				{ title: 'Ensamhet – hjälp och första steg framåt', href: '/guider/ensamhet/ensamhet-hjalp' },
				{ title: 'Orkar ingenting – när krafterna inte räcker', href: '/guider/ensamhet/orkar-ingenting' }
			]}
		/>
		<!-- Källor och uppdatering -->
		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 14 mars 2026</p>
			<h2>Källor</h2>
			<ul>
				<li><a href="https://www.1177.se/liv--halsa/psykisk-halsa/ensamhet/" target="_blank" rel="noopener noreferrer">Ensamhet – 1177 Vårdguiden</a></li>
				<li><a href="https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/" target="_blank" rel="noopener noreferrer">Om psykisk hälsa – Folkhälsomyndigheten</a></li>
				<li><a href="https://dinpsykiskahalsa.se/" target="_blank" rel="noopener noreferrer">Din psykiska hälsa</a></li>
			</ul>
		</section>

	</div>
</main>

<style>
	.page {
		padding: clamp(2.2rem, 6vw, 3rem) clamp(1.25rem, 4vw, 1.5rem) clamp(3.2rem, 8vw, 4rem);
	}

	.page-container {
		max-width: 840px;
		margin: 0 auto;
		display: grid;
		gap: clamp(2rem, 3.5vw, 2.5rem);
	}

	.text-block {
		max-width: 720px;
	}

	.hero {
		max-width: 720px;
		padding: clamp(1rem, 2vw, 1.25rem) 0 0.2rem;
	}

	.section {
		max-width: 720px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.08;
		margin-bottom: 1.5rem;
	}

	p {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.125rem);
		line-height: 1.7;
		letter-spacing: -0.005em;
		margin: 0;
	}

	.cta-container {
		max-width: 720px;
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 2rem;
		border-radius: var(--radius-pill);
		border: 2px solid var(--primary);
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 1rem;
		color: white;
		background: var(--primary);
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(15, 118, 110, 0.3);
	}

	.cta-button:active {
		transform: translateY(0);
	}

	.callout {
		max-width: 720px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: var(--radius-card);
		padding: 1.05rem;
		background: rgba(226, 240, 236, 0.6);
	}

	.callout h2 {
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
		margin-bottom: 0.45rem;
		color: var(--primary);
	}

	.callout p {
		margin: 0;
		font-size: clamp(1rem, 0.96rem + 0.3vw, 1.05rem);
		line-height: 1.65;
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.8rem;
		}

		p {
			font-size: 1.02rem;
		}

		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .callout {
		background: #1a1a1a;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .callout h2 {
		color: #86dfd6;
	}

	:global(.dark) .callout p {
		color: rgba(255, 255, 255, 0.85);
	}

	:global(.dark) .cta-button {
		background: var(--primary);
		border-color: #86dfd6;
		color: white;
	}

	:global(.dark) .cta-button:hover {
		box-shadow: 0 6px 20px rgba(134, 223, 214, 0.3);
	}

	.source-block {
		margin-top: clamp(2rem, 4vw, 3rem);
		padding-top: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.source-block .updated-date {
		font-size: 0.8rem;
		opacity: 0.5;
		margin-bottom: 1rem;
	}

	.source-block h2 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.source-block ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.source-block li {
		font-size: 0.85rem;
	}

	.source-block a {
		color: inherit;
		opacity: 0.7;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.source-block a:hover {
		opacity: 1;
	}
</style>
