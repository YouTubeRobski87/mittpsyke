<svelte:head>
	<title>Hjälp vid ångest online | Samtal, dagbok och övningar | MittPsyke</title>
	<meta
		name="description"
		content="Få hjälp vid ångest online med samtalsstöd, dagbok, guider och övningar. Ett tryggt första steg när ångest tar mycket plats."
	/>
	<meta property="og:title" content="Hjälp vid ångest online | MittPsyke" />
	<meta
		property="og:description"
		content="När ångest känns överväldigande kan du börja anonymt och få stöd i lugn takt."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/hjalp-vid-angest-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Hjälp vid ångest online</h1>
			<p>
				Ångest kan kännas intensivt i både kropp och tanke. Här kan du börja anonymt, sortera det som
				pågår och hitta verktyg som hjälper dig att landa steg för steg.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Starta samtal om ångest</a>
			<a class="cta-button ghost" href="/guider/angest">Läs guide om ångest</a>
		</div>

		<section class="section">
			<h2>Det är okej att börja enkelt</h2>
			<p>
				Det behöver inte vara perfekt formulerat. Skriv några rader i chatten eller dagboken. Små steg
				kan göra det lättare att få syn på mönster och vad som hjälper just dig.
			</p>
		</section>

		<section class="section">
			<h2>Stöd som kan hjälpa vid ångest</h2>
			<ul>
				<li><a href="/chat/a">Anonym chatt om ångest</a> när oron är stark.</li>
				<li><a href="/dagbok">Dagbok</a> för att skriva av dig och följa återkommande mönster.</li>
				<li><a href="/guider/overtankande">Guide om övertänkande</a> och oro.</li>
				<li><a href="/andningsovningar-mot-angest">Andningsövningar mot ångest</a> när du behöver landa i kroppen.</li>
				<li><a href="/4-7-8-andning-ovning">4-7-8 andning övning</a> för ett enkelt första steg.</li>
				<li><a href="/exponering-ovningar-mot-angest">Exponering övningar mot ångest</a> om undvikande tar mycket plats.</li>
				<li><a href="/ovningar/cbt-katastroftankar">Övning mot katastroftankar</a>.</li>
				<li><a href="/ovningar/daglig-reflektionsmall">Daglig reflektionsmall</a> för struktur.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg i din takt</h2>
			<p>
				Om du vill behålla kontinuitet kan du skapa konto och spara dagbok, historik och framsteg.
				Behöver du mänsklig kontakt finns
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
			</p>
			<p class="links-row">
				<a href="/register">Skapa konto</a>
				<a href="/framsteg">Se framsteg</a>
				<a href="/ovningar">Fler övningar</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Kan jag få hjälp vid ångest dygnet runt?</h3>
			<p>Du kan använda chatten när du behöver, i din egen takt.</p>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Konto behövs först när du vill spara innehåll över tid.</p>
			<h3>Vad gör jag vid akut fara?</h3>
			<p>Vid akut fara eller risk att skada dig själv eller någon annan: ring 112 direkt.</p>
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
