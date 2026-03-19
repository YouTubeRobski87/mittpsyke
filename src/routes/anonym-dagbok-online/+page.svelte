<svelte:head>
	<title>Anonym dagbok online | Skriv och följ ditt mående | MittPsyke</title>
	<meta
		name="description"
		content="Använd en anonym dagbok online för att skriva av dig, se mönster och följa ditt mående i lugn takt."
	/>
	<meta property="og:title" content="Anonym dagbok online | MittPsyke" />
	<meta
		property="og:description"
		content="När du bara vill skriva av dig kan en lugn digital dagbok ge mer struktur, reflektion och kontinuitet."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/anonym-dagbok-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Anonym dagbok online</h1>
			<p>
				Ibland är det enklaste första steget att skriva några rader för dig själv. Här kan du använda en
				lugn digital dagbok för att sortera tankar och följa ditt mående över tid.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/dagbok">Öppna dagboken</a>
			<a class="cta-button ghost" href="/digital-dagbok-for-maende">Läs om digital dagbok</a>
		</div>

		<section class="section">
			<h2>När du bara vill skriva av dig</h2>
			<p>
				Det behöver inte vara perfekt eller genomtänkt. Dagboken kan vara en lugn plats för sådant som är
				svårt att säga högt eller svårt att förstå i stunden.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/digital-dagbok-for-maende">Digital dagbok för mående</a> när du vill ha mer struktur.</li>
				<li><a href="/framsteg">Framsteg</a> för att se återkommande mönster över tid.</li>
				<li><a href="/chat">Chatten</a> när du vill reflektera vidare i samtal.</li>
				<li><a href="/hjalp-vid-angest-online">Hjälp vid ångest online</a> och <a href="/om-mittpsyke">Om MittPsyke</a> om du vill läsa vidare.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Om du vill spara historik och få en egen plats över tid kan du <a href="/register">skapa konto</a>.
				Du kan också börja skriva direkt eller öppna chatten om du vill ta nästa steg i samtal.
			</p>
			<p class="links-row">
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/framsteg">Se framsteg</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja varsamt och skapa en egen plats först när du vill spara innehåll över tid.</p>
			<h3>Är detta anonymt?</h3>
			<p>Du kan börja med låg tröskel och använda dagboken i din egen takt.</p>
			<h3>Var börjar jag om jag bara vill skriva av mig?</h3>
			<p>Börja med några få rader. Det räcker långt som första steg.</p>
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

