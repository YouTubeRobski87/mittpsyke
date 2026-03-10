<svelte:head>
	<title>Hjälp vid depression online | Samtal, dagbok och framsteg | MittPsyke</title>
	<meta
		name="description"
		content="Få hjälp vid depression online genom lugnt samtalsstöd, dagbok och möjlighet att följa små steg över tid."
	/>
	<meta property="og:title" content="Hjälp vid depression online | MittPsyke" />
	<meta
		property="og:description"
		content="När allt känns tungt kan du börja varsamt, skriva av dig och hitta stöd i din egen takt."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/hjalp-vid-depression-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Hjälp vid depression online</h1>
			<p>
				När orken är låg kan det vara svårt att ta första steget. Här kan du börja lugnt, prata om
				nedstämdhet och hitta ett sätt att hålla kontakt med det som känns viktigt.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/b">Starta samtal om nedstämdhet</a>
			<a class="cta-button ghost" href="/guider/depression">Läs guide om depression</a>
		</div>

		<section class="section">
			<h2>Det behöver inte gå fort</h2>
			<p>
				Ibland räcker det att börja med några ord. Du kan skriva i chatten, använda dagboken eller bara
				läsa något som hjälper dig att sortera det som känns tungt.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke kan erbjuda</h2>
			<ul>
				<li><a href="/chat/b">Samtalsstöd vid nedstämdhet</a> i lugn takt.</li>
				<li><a href="/dagbok">Dagbok</a> för tankar, känslor och små steg framåt.</li>
				<li><a href="/framsteg">Framsteg</a> för att se sådant som förändras över tid.</li>
				<li><a href="/guider/depression">Guider</a> och <a href="/om-mittpsyke">tydlig information om hur MittPsyke fungerar</a>.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg i din takt</h2>
			<p>
				Om du vill kan du skapa konto för att spara historik och återvända till din egen plats. Behöver
				du mänsklig kontakt finns <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
			</p>
			<p class="links-row">
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/framsteg">Följ framsteg</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja utan konto och skapa en egen plats senare om du vill spara historik.</p>
			<h3>Är detta anonymt?</h3>
			<p>Du kan börja utan att logga in och använda stödet i din egen takt.</p>
			<h3>Vad gör jag om läget blir akut?</h3>
			<p>Vid akut fara eller om någon riskerar att skadas ska du ringa 112 direkt.</p>
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
