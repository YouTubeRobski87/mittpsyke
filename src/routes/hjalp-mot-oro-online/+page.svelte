<svelte:head>
	<title>Hjälp mot oro online | Reflektion, guider och övningar | MittPsyke</title>
	<meta
		name="description"
		content="Få hjälp mot oro online genom samtal, dagbok, guider och övningar. Ett lugnt stöd när tankarna snurrar."
	/>
	<meta property="og:title" content="Hjälp mot oro online | MittPsyke" />
	<meta
		property="og:description"
		content="När oron tar mycket plats kan du börja varsamt, skriva av dig och hitta nästa steg i lugn takt."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/hjalp-mot-oro-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Hjälp mot oro online</h1>
			<p>
				Oro kan ta mycket plats, särskilt när tankarna börjar gå i cirklar. Här kan du stanna upp, skriva
				av dig och hitta stöd som hjälper dig att sortera det som pågår.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/e">Starta samtal om oro</a>
			<a class="cta-button ghost" href="/guider/overtankande">Läs guide om övertänkande</a>
		</div>

		<section class="section">
			<h2>När tankarna snurrar</h2>
			<p>
				Det är vanligt att fastna i frågor, scenarier och sådant som känns svårt att släppa. Ett lugnt
				första steg kan vara att skriva ner vad som faktiskt pågår just nu.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/chat/e">Samtalsstöd vid oro</a> när du behöver landa.</li>
				<li><a href="/dagbok">Dagbok</a> för att se mönster i tankar och känslor.</li>
				<li><a href="/guider/overtankande">Guide om övertänkande</a> och <a href="/guider/existentiell-oro">guide om existentiell oro</a>.</li>
				<li><a href="/ovningar">Övningar</a> för att bryta grubblande och skapa struktur.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Om du vill veta mer om tjänsten finns <a href="/om-mittpsyke">Om MittPsyke</a>. Du kan också
				börja skriva direkt eller läsa vidare i en guide som matchar det du går igenom.
			</p>
			<p class="links-row">
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/ovningar">Prova en övning</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto för att börja?</h3>
			<p>Nej. Du kan börja i chatten direkt och skapa konto först om du vill spara innehållet.</p>
			<h3>Vad kan hjälpa vid oro?</h3>
			<p>Att skriva av sig, få struktur och välja ett lugnt nästa steg kan göra oron mer hanterbar.</p>
			<h3>När ska jag söka akut hjälp?</h3>
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
