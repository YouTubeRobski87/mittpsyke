<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/chat" />

<svelte:head>
	<meta name="robots" content="noindex, nofollow" />
	<title>AI-samtalsstöd för ångest och stress – chatta anonymt | MittPsyke</title>
	<meta
		name="description"
		content="Anonymt AI-samtalsstöd för ångest, nedstämdhet och stress. Välj en ingång och börja i din egen takt – utan konto och utan väntetid."
	/>
	<meta property="og:title" content="AI-samtalsstöd – chatta anonymt | MittPsyke" />
	<meta
		property="og:description"
		content="Anonymt AI-samtalsstöd för ångest, nedstämdhet och stress. Välj en ingång och börja i din egen takt – utan konto och utan väntetid."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebPage",
		"name": "AI-samtalsstöd för ångest och stress – chatta anonymt | MittPsyke",
		"description": "Anonymt AI-samtalsstöd för ångest, nedstämdhet och stress. Välj en ingång och börja i din egen takt – utan konto och utan väntetid.",
		"url": "https://www.mittpsyke.se/chat",
		"about": { "@type": "Thing", "name": "Psykisk hälsa och samtalsstöd" },
		"inLanguage": "sv-SE",
		"provider": { "@type": "Organization", "name": "MittPsyke", "url": "https://www.mittpsyke.se" }
	})}<\/script>`}
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Välj en lugn väg in i chatten</h1>
			<p>
				Du behöver inte veta exakt hur du ska börja. Välj det som känns närmast just nu och låt samtalet
				ta form i din egen takt.
				MittPsyke är ett AI-baserat samtalsstöd för reflektion och stöd i vardagen. Det ersätter inte vård
				eller kontakt med psykolog, läkare eller annan legitimerad vårdpersonal.
			</p>
		</header>

		<section class="choices" aria-label="Välj ingång till chatten">
			<a class="choice-card" href="/chat/a">
				<h2>Ångest</h2>
				<p>För oro, ångest och tankar som snurrar.</p>
			</a>
			<a class="choice-card" href="/chat/b">
				<h2>Nedstämdhet</h2>
				<p>För tunga dagar, låg ork och sådant som känns mörkt.</p>
			</a>
			<a class="choice-card" href="/chat/e">
				<h2>Stress och oro</h2>
				<p>För hög belastning, inre tryck och behov av att landa.</p>
			</a>
		</section>

		<section class="section">
			<p>
				Du kan börja utan konto. Vissa tekniska uppgifter hanteras enligt <a href="/integritet">integritetspolicyn</a>.
				Om du vill läsa mer först finns <a href="/prata-anonymt-online">prata anonymt online</a>. Vid akut fara, ring 112. För vårdråd, kontakta 1177. Behöver du mänsklig kontakt finns
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
			</p>
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
		gap: clamp(1.3rem, 3vw, 1.8rem);
	}

	.hero,
	.section {
		max-width: 720px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		line-height: 1.08;
	}

	h2 {
		font-size: 1.2rem;
	}

	p {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.7;
		margin: 0;
	}

	.choices {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.85rem;
		max-width: 720px;
	}

	.choice-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #f9fcfb;
		color: inherit;
		text-decoration: none;
		transition: transform 0.18s ease, background-color 0.18s ease;
	}

	.choice-card:hover {
		transform: translateY(-2px);
		background: #f1f8f5;
	}

	.choice-card p {
		margin-top: 0.45rem;
		font-size: 0.95rem;
		opacity: 0.82;
	}

	.section a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	:global(.dark) .choice-card {
		background: #1a2221;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .choice-card:hover {
		background: #1f2a28;
	}
</style>
