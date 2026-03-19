<svelte:head>
	<title>Samtalsstöd utan väntetid | Ett lugnt första steg | MittPsyke</title>
	<meta
		name="description"
		content="Få samtalsstöd utan väntetid genom lugna samtal, dagbok och nästa steg i din egen takt."
	/>
	<meta property="og:title" content="Samtalsstöd utan väntetid | MittPsyke" />
	<meta
		property="og:description"
		content="När du behöver stöd nu kan du börja lugnt, skriva av dig och hitta rätt ingång utan att vänta."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/samtalsstod-utan-vantetid" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Samtalsstöd utan väntetid</h1>
			<p>
				Ibland går det inte att vänta på rätt läge. Här kan du börja direkt, prata anonymt online och ta
				ett lugnt första steg när något känns tungt.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat">Öppna chatten</a>
			<a class="cta-button ghost" href="/prata-anonymt-online">Läs om att prata anonymt</a>
		</div>

		<section class="section">
			<h2>När du behöver börja nu</h2>
			<p>
				Du behöver inte ha allt klart för dig. Välj den ingång som passar bäst just nu och låt samtalet
				börja där du är.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/chat/a">Samtal om ångest</a>, <a href="/chat/b">nedstämdhet</a> eller <a href="/chat/e">stress och oro</a>.</li>
				<li><a href="/dagbok">Dagbok</a> när du vill skriva i stället för att prata.</li>
				<li><a href="/om-mittpsyke">Om MittPsyke</a> om du vill förstå tjänsten bättre innan du börjar.</li>
				<li><a href="/register">Skapa konto</a> för att spara historik och få en egen plats över tid.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg i lugn takt</h2>
			<p>
				Om du behöver mänsklig kontakt finns <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
				Du kan också börja med dagboken och återvända när du behöver.
			</p>
			<p class="links-row">
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/register">Skapa konto</a>
				<a href="/chat/e">Prata om oro</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja utan konto och skapa en egen plats senare om du vill spara historik.</p>
			<h3>Kan jag börja i lugn takt?</h3>
			<p>Ja. MittPsyke är byggt för små steg och ett lugnt tempo.</p>
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

