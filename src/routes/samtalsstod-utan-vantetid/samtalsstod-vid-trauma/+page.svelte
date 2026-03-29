<svelte:head>
	<title>Samtalsstöd vid trauma | Lugn reflektion och nästa steg | MittPsyke</title>
	<meta
		name="description"
		content="Få samtalsstöd vid trauma i lugn takt genom reflektion, dagbok och varsamma nästa steg online."
	/>
	<meta property="og:title" content="Samtalsstöd vid trauma | MittPsyke" />
	<meta
		property="og:description"
		content="När svåra minnen tar plats kan du börja varsamt, skriva av dig och hitta ett lugnt nästa steg."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/samtalsstod-utan-vantetid/samtalsstod-vid-trauma" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Samtalsstöd vid trauma</h1>
			<p>
				När något svårt har satt sig i kroppen eller tankarna kan det vara hjälpsamt att börja försiktigt.
				Här kan du skriva av dig, reflektera och hitta ett lugnt nästa steg i din egen takt.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Starta ett lugnt samtal</a>
			<a class="cta-button ghost" href="/trauma">Läs mer om trauma</a>
		</div>

		<section class="section">
			<h2>Det är okej att ta det steg för steg</h2>
			<p>
				Du behöver inte berätta allt på en gång. MittPsyke är till för reflektion, struktur och stöd när
				du vill börja varsamt och behålla kontroll över tempot.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/chat/a">Samtalsstöd</a> när du behöver sätta ord på det som känns svårt.</li>
				<li><a href="/stod-vid-ptsd-online">Stöd vid PTSD online</a> om du vill läsa vidare i lugn takt.</li>
				<li><a href="/dagbok">Dagbok</a> för att skriva i lugn takt och få mer kontinuitet.</li>
				<li><a href="/framsteg">Framsteg</a> för att följa små förändringar över tid.</li>
				<li><a href="/om-mittpsyke">Om MittPsyke</a> om du vill förstå tjänsten bättre innan du börjar.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg i din takt</h2>
			<p>
				Om du vill spara dagbok och historik kan du <a href="/register">skapa konto</a>. Behöver du
				mänsklig kontakt finns <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
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
			<p>Nej. Du kan börja utan konto och skapa en egen plats först när du vill spara det du skriver.</p>
			<h3>Är detta akut hjälp?</h3>
			<p>Nej. Vid akut fara eller om någon riskerar att skadas ska du ringa 112 direkt.</p>
			<h3>Kan jag börja anonymt?</h3>
			<p>Ja, du kan börja försiktigt och använda stödet i din egen takt.</p>
		</section>
		<!-- Källor och uppdatering -->
		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 14 mars 2026</p>
			<h2>Källor</h2>
			<ul>
				<li><a href="https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/" target="_blank" rel="noopener noreferrer">Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden</a></li>
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

