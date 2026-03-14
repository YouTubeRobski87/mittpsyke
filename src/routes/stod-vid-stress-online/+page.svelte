<svelte:head>
	<title>Stöd vid stress online | Samtal, dagbok och återhämtning | MittPsyke</title>
	<meta
		name="description"
		content="Få stöd vid stress online genom lugna samtal, reflektionsövningar och en dagbok för att följa återhämtning över tid."
	/>
	<meta property="og:title" content="Stöd vid stress online | MittPsyke" />
	<meta
		property="og:description"
		content="När stressen tar mycket plats kan du landa, sortera tankar och hitta nästa steg i ett lugnt tempo."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/stod-vid-stress-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Stöd vid stress online</h1>
			<p>
				När tempot blir för högt kan det vara svårt att höra vad du själv behöver. Här kan du sakta ner,
				sätta ord på stressen och hitta mer hållbara nästa steg.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/e">Starta samtal om stress</a>
			<a class="cta-button ghost" href="/guider/stress-utmattning">Läs guide om stress</a>
		</div>

		<section class="section">
			<h2>Börja där du är</h2>
			<p>
				Du behöver inte ha sorterat allt först. MittPsyke kan hjälpa dig att få syn på mönster, behov av
				vila och små sätt att skapa mer luft i vardagen.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/chat/e">Samtalsstöd vid stress</a> och hög belastning.</li>
				<li><a href="/ovningar/daglig-reflektionsmall">Daglig reflektionsmall</a> för att stanna upp.</li>
				<li><a href="/dagbok">Dagbok</a> och <a href="/framsteg">framsteg</a> för återkommande mönster.</li>
				<li><a href="/guider/stress-utmattning">Guider om stress och utmattning</a>.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Välj nästa steg</h2>
			<p>
				Om du vill läsa mer om tjänsten finns <a href="/om-mittpsyke">Om MittPsyke</a>. Du kan också
				börja skriva direkt eller använda en enkel övning för att få mer struktur.
			</p>
			<p class="links-row">
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/framsteg">Följ framsteg</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Kan jag börja utan konto?</h3>
			<p>Ja. Du kan börja i chatten och skapa konto först om du vill spara det du skriver.</p>
			<h3>Vad kan hjälpa när stressen är hög?</h3>
			<p>Att stanna upp, skriva av sig och ta ett litet steg i taget kan göra det lättare att få överblick.</p>
			<h3>Är detta akut hjälp?</h3>
			<p>Nej. Vid akut fara ska du alltid ringa 112.</p>
		</section>
		<!-- Källor och uppdatering -->
		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 14 mars 2026</p>
			<h2>Källor</h2>
			<ul>
				<li><a href="https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/" target="_blank" rel="noopener noreferrer">Stress – 1177 Vårdguiden</a></li>
				<li><a href="https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa – Folkhälsomyndigheten</a></li>
				<li><a href="https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa och suicidprevention – Socialstyrelsen</a></li>
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
