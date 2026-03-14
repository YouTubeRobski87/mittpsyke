<svelte:head>
	<title>Andningsövningar mot ångest | Lugna verktyg online | MittPsyke</title>
	<meta
		name="description"
		content="Prova andningsövningar mot ångest och hitta lugnare verktyg när tankarna snurrar."
	/>
	<meta property="og:title" content="Andningsövningar mot ångest | MittPsyke" />
	<meta
		property="og:description"
		content="När ångesten stiger kan andning och enkla övningar hjälpa dig att landa och ta nästa steg i lugn takt."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/andningsovningar-mot-angest" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Andningsövningar mot ångest</h1>
			<p>
				När kroppen går upp i varv kan det hjälpa att börja med något enkelt och konkret. Här hittar du
				lugna övningar och vägar vidare när ångesten tar mycket plats.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Prata om ångest</a>
			<a class="cta-button ghost" href="/ovningar">Se fler övningar</a>
		</div>

		<section class="section">
			<h2>När du behöver landa i kroppen</h2>
			<p>
				Andningen löser inte allt, men den kan hjälpa dig att sakta ner tillräckligt för att få lite mer
				överblick. Det kan vara ett första steg innan du fortsätter i chatten eller dagboken.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/hjalp-vid-angest-online">Stöd vid ångest online</a> när du behöver börja i samtal.</li>
				<li><a href="/guider/angest">Guide om ångest</a> och <a href="/guider/overtankande">guide om övertänkande</a>.</li>
				<li><a href="/ovningar/daglig-reflektionsmall">Daglig reflektionsmall</a> och fler <a href="/ovningar">övningar</a>.</li>
				<li><a href="/dagbok">Dagbok</a> för att skriva av dig efter övningen.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Konkreta nästa steg</h2>
			<p>
				Om du vill kan du börja i chatten, prova en övning eller skriva ner hur kroppen känns före och
				efter. Små steg räcker.
			</p>
			<p class="links-row">
				<a href="/ovningar">Prova en övning</a>
				<a href="/chat/a">Starta samtal</a>
				<a href="/dagbok">Skriv i dagboken</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Kan jag börja i lugn takt?</h3>
			<p>Ja. Övningarna är till för att användas steg för steg, utan press.</p>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja med att läsa, prova en övning eller öppna chatten direkt.</p>
			<h3>Vad kan hjälpa när tankarna rusar?</h3>
			<p>Andning, skrivande och ett lugnt nästa steg kan göra det lättare att få lite mer överblick.</p>
		</section>
		<!-- Källor och uppdatering -->
		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 14 mars 2026</p>
			<h2>Källor</h2>
			<ul>
				<li><a href="https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/" target="_blank" rel="noopener noreferrer">Ångest – 1177 Vårdguiden</a></li>
				<li><a href="https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa och suicidprevention – Socialstyrelsen</a></li>
				<li><a href="https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/" target="_blank" rel="noopener noreferrer">Psykisk hälsa – Folkhälsomyndigheten</a></li>
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
