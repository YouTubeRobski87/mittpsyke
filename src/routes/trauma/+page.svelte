<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import PublicTrustPanel from '$lib/components/PublicTrustPanel.svelte';
	import TopicGuideSection from '$lib/components/TopicGuideSection.svelte';
</script>

<SEO canonical="https://mittpsyke.se/trauma" />

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'MedicalWebPage',
		name: 'Samtalsstöd vid trauma – Bearbeta i din egen takt',
		url: 'https://mittpsyke.se/trauma',
		description: 'Vi erbjuder samtalsstöd vid trauma i ett tryggt rum där du kan börja utan konto och reflektera i din egen takt.',
		about: { '@type': 'MedicalCondition', name: 'Trauma' },
		medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
		specialty: 'https://schema.org/Psychiatric',
		dateModified: '2026-03-14',
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="page">
	<div class="page-container">
		<!-- Hero Section -->
		<header class="hero">
			<h1>Samtalsstöd vid trauma – Bearbeta i din egen takt</h1>
			<p>
				Att leva med svåra minnen kräver rätt förutsättningar. Här finns ett lugnt samtalsstöd där du kan börja utan konto och ta ett första steg i din egen takt.
			</p>
		</header>

		<div class="text-block">
			<section class="section">
				<h2>Varsamt stöd och anonymitet</h2>
				<p>
					Här kan du få stöd att hantera posttraumatisk stress och återfå kontrollen över din vardag.
				</p>
				<p>
					Tjänsten är till för reflektion och stöd i vardagen. Den ersätter inte vård, ställer inte diagnos och ska inte vara enda underlag för medicinska beslut. Du behöver aldrig förklara allt på en gång – du sätter tempot.
				</p>
			</section>

			<section class="section">
				<p>
					Trauma kan ta sig många uttryck – minnesbilder som dyker upp, svårigheter att lita på omgivningen, eller en känsla av att kroppen är fastlåst i det som hände. Det är normala reaktioner på onormala händelser. Du är inte trasig.
				</p>
			</section>
		</div>

		<!-- CTA Button -->
		<div class="cta-container">
			<a class="cta-button" href="/chat/angest">Starta ett samtal</a>
		</div>

		<!-- Callout -->
		<aside class="callout" aria-label="Viktigt att veta">
			<h2>Din berättelse är viktig</h2>
			<p>Trauma behöver inte hanteras ensamt. Att sätta ord på det som hänt – även lite i taget – kan vara ett viktigt första steg mot att må bättre.</p>
		</aside>
		<TopicGuideSection topicTitle="Trauma" guideHref="/guider/trauma" />
		<PublicTrustPanel
			updatedDate="14 mars 2026"
			sources={[
				{
					label: 'Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden',
					href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/'
				},
				{
					label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen',
					href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/'
				},
				{
					label: 'Psykisk hälsa – Folkhälsomyndigheten',
					href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/'
				}
			]}
		/>

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

	.section + .section {
		margin-top: 1.5rem;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.08;
		margin-bottom: 1.5rem;
	}

	h2 {
		font-size: 1.35rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	p {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.125rem);
		line-height: 1.7;
		letter-spacing: -0.005em;
		margin: 0;
	}

	.section p + p {
		margin-top: 0.95rem;
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

</style>
