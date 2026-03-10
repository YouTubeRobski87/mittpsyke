<svelte:head>
	<title>Anonymt samtalsstöd online | MittPsyke</title>
	<meta
		name="description"
		content="Prata anonymt online i lugn takt. MittPsyke ger tryggt samtalsstöd, dagbok och guider när du behöver stöd i stunden."
	/>
	<meta property="og:title" content="Anonymt samtalsstöd online | MittPsyke" />
	<meta
		property="og:description"
		content="Ett tryggt digitalt stödrum där du kan chatta anonymt, skriva av dig och hitta väg vidare vid behov."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/anonymt-samtalsstod-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Anonymt samtalsstöd online</h1>
			<p>
				Ibland är det lättare att börja utan press. Här kan du prata anonymt online, sätta ord på det som
				känns och få stöd i ett lugnt tempo.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Prata anonymt nu</a>
			<a class="cta-button ghost" href="/dagbok">Skriv i dagboken</a>
		</div>

		<section class="section">
			<h2>När text känns som första steget</h2>
			<p>
				Du behöver inte förklara allt perfekt. Börja där du är. Om du vill kan du senare skapa konto och
				spara din historik för att få mer kontinuitet över tid.
			</p>
		</section>

		<section class="section">
			<h2>Det här kan du göra här</h2>
			<ul>
				<li><a href="/chat">Chatta anonymt</a> när du behöver stöd i stunden.</li>
				<li>Få struktur med <a href="/ovningar/daglig-reflektionsmall">enkla övningar</a>.</li>
				<li>Läs <a href="/guider/overtankande">guider om övertänkande</a> och oro.</li>
				<li>Skapa konto för dagbok, historik och framsteg.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Väg vidare när du behöver mer</h2>
			<p>
				Om du vill prata med en människa kan du gå vidare till
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
				Vid akut fara ska du alltid ringa 112.
			</p>
			<p class="links-row">
				<a href="/chat/a">Chatta om ångest</a>
				<a href="/chat/b">Chatta om nedstämdhet</a>
				<a href="/chat/e">Chatta om stress</a>
				<a href="/om-mittpsyke">Om MittPsyke</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag logga in för att börja?</h3>
			<p>Nej, du kan börja anonymt direkt i chatten.</p>
			<h3>Är detta samma sak som vård?</h3>
			<p>Nej, det här är ett digitalt samtalsstöd för reflektion och nästa steg.</p>
			<h3>Kan jag spara det jag skriver?</h3>
			<p>Ja, med konto får du en egen plats för dagbok och historik.</p>
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
