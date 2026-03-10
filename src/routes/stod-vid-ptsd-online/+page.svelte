<svelte:head>
	<title>Stöd vid PTSD online | Lugn reflektion och nästa steg | MittPsyke</title>
	<meta
		name="description"
		content="Få stöd vid PTSD online genom varsam reflektion, dagbok och lugna nästa steg i din egen takt."
	/>
	<meta property="og:title" content="Stöd vid PTSD online | MittPsyke" />
	<meta
		property="og:description"
		content="När svåra minnen tar mycket plats kan du börja försiktigt, skriva av dig och hitta ett lugnt nästa steg."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/stod-vid-ptsd-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Stöd vid PTSD online</h1>
			<p>
				När minnen eller reaktioner tar mycket plats kan det vara hjälpsamt att börja försiktigt. Här kan
				du reflektera, skriva av dig och hitta lugna nästa steg i din egen takt.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Starta ett lugnt samtal</a>
			<a class="cta-button ghost" href="/samtalsstod-vid-trauma">Läs om samtalsstöd vid trauma</a>
		</div>

		<section class="section">
			<h2>Varsamt stöd när det känns mycket</h2>
			<p>
				Du behöver inte beskriva allt. Ett första steg kan vara att skriva några rader, stanna upp en
				stund eller bara läsa vidare om hur MittPsyke kan användas lugnt och försiktigt.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/samtalsstod-vid-trauma">Samtalsstöd vid trauma</a> när du vill börja reflektera varsamt.</li>
				<li><a href="/dagbok">Dagbok</a> och <a href="/framsteg">framsteg</a> för kontinuitet över tid.</li>
				<li><a href="/om-mittpsyke">Om MittPsyke</a> om du vill förstå tjänsten bättre innan du börjar.</li>
				<li><a href="/register">Skapa konto</a> om du vill spara historik och återvända till din egen plats.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg i lugn takt</h2>
			<p>
				Om du behöver mänsklig kontakt finns <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
				Du kan också börja i dagboken eller fortsätta i ett lugnt samtal.
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
			<p>Nej. Du kan börja utan konto och spara historik först när du vill.</p>
			<h3>Kan jag börja försiktigt?</h3>
			<p>Ja. MittPsyke är byggt för att du ska kunna börja varsamt och i din egen takt.</p>
			<h3>Är detta akut hjälp?</h3>
			<p>Nej. Vid akut fara eller om någon riskerar att skadas ska du ringa 112 direkt.</p>
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
