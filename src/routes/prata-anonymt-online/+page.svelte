<svelte:head>
	<title>Prata anonymt online | Ett lugnt första steg | MittPsyke</title>
	<meta
		name="description"
		content="Prata anonymt online genom lugnt samtalsstöd, dagbok och guider. Ett tryggt första steg när något känns svårt."
	/>
	<meta property="og:title" content="Prata anonymt online | MittPsyke" />
	<meta
		property="og:description"
		content="När du vill börja utan press kan du prata anonymt, skriva av dig och hitta rätt nästa steg."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/prata-anonymt-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Prata anonymt online</h1>
			<p>
				Ibland är det lättare att börja utan att behöva förklara allt. Här kan du prata anonymt online,
				skriva av dig och hitta stöd i ett lugnt tempo.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat">Öppna chatten</a>
			<a class="cta-button ghost" href="/om-mittpsyke">Så fungerar MittPsyke</a>
		</div>

		<section class="section">
			<h2>Ett första steg utan press</h2>
			<p>
				Du kan börja där du är. Välj en ingång som passar det du bär på just nu, eller skriv några rader
				i dagboken om det känns lättare än att börja prata direkt.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/chatta-anonymt-med-nagon">Chatta anonymt med någon</a> eller <a href="/chattstod-psykisk-ohalsa">läs om chattstöd psykisk ohälsa</a>.</li>
				<li><a href="/chat/a">Chatta om ångest</a>, <a href="/chat/b">nedstämdhet</a> eller <a href="/chat/e">stress och oro</a>.</li>
				<li><a href="/dagbok">Dagbok</a> när du vill skriva av dig i stället för att prata.</li>
				<li><a href="/register">Skapa konto</a> för att spara historik och få en egen plats över tid.</li>
				<li><a href="/om-mittpsyke">Om MittPsyke</a> om du vill förstå tjänsten bättre innan du börjar.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Om du behöver mänsklig kontakt finns <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
				Du kan också börja i dagboken eller välja den chattingång som känns närmast.
			</p>
			<p class="links-row">
				<a href="/chatta-anonymt-med-nagon">Chatta anonymt med någon</a>
				<a href="/chattstod-psykisk-ohalsa">Läs om chattstöd</a>
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag logga in för att börja?</h3>
			<p>Nej. Du kan börja utan konto och skapa en egen plats senare om du vill spara historik.</p>
			<h3>Vad kan jag prata om här?</h3>
			<p>Du kan börja med det som känns närmast: ångest, nedstämdhet, stress, oro eller bara en tung dag.</p>
			<h3>Är detta akut hjälp?</h3>
			<p>Nej. Vid akut fara ska du alltid ringa 112 direkt.</p>
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
	h2,
	h3 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		line-height: 1.08;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.6rem;
	}

	h3 {
		font-size: 1rem;
		margin-top: 0.9rem;
	}

	p,
	li {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.7;
		margin: 0;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.cta-container {
		max-width: 720px;
		display: flex;
		gap: 0.7rem;
		flex-wrap: wrap;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.35rem;
		border-radius: var(--radius-pill);
		background: var(--primary);
		border: 2px solid var(--primary);
		color: white;
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
	}

	.cta-button.ghost {
		background: transparent;
		color: var(--primary);
	}

	.links-row {
		margin-top: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}

	.faq p + h3 {
		margin-top: 1rem;
	}

	@media (max-width: 640px) {
		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .cta-button.ghost {
		color: #86dfd6;
		border-color: #86dfd6;
	}
</style>

