<svelte:head>
	<title>Chattstöd psykisk ohälsa | Stöd i lugn takt online | MittPsyke</title>
	<meta
		name="description"
		content="Få chattstöd vid psykisk ohälsa genom samtal, reflektion, guider och övningar i din egen takt."
	/>
	<meta property="og:title" content="Chattstöd psykisk ohälsa | MittPsyke" />
	<meta
		property="og:description"
		content="När något känns tungt kan ett lugnt chattstöd online hjälpa dig att börja, få struktur och hitta nästa steg."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/chattstod-psykisk-ohalsa" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Chattstöd psykisk ohälsa</h1>
			<p>
				När livet känns tungt kan det vara hjälpsamt att börja i text. Här kan du få lugnt chattstöd,
				skriva av dig och hitta nästa steg i din egen takt.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat">Öppna chatten</a>
			<a class="cta-button ghost" href="/psykiskt-stod-online">Läs om psykiskt stöd online</a>
		</div>

		<section class="section">
			<h2>När du behöver en lugn plats att börja på</h2>
			<p>
				Det behöver inte vara en stor berättelse. Ett första steg kan vara några få rader som hjälper dig
				att fånga det som känns mest just nu.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/ai-samtalsstod-online">AI samtalsstöd online</a> och <a href="/chatta-anonymt-med-nagon">chatta anonymt med någon</a>.</li>
				<li><a href="/dagbok">Dagbok</a> när du vill skriva vidare för dig själv.</li>
				<li><a href="/guider">Guider</a> och <a href="/ovningar">övningar</a> som stöd i lugn takt.</li>
				<li><a href="/om-mittpsyke">Om MittPsyke</a> och <a href="/register">skapa konto</a> när du vill spara mer över tid.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Du kan börja i chatten direkt eller läsa vidare om anonymt samtalsstöd om du vill förstå
				alternativen bättre innan du startar.
			</p>
			<p class="links-row">
				<a href="/chat">Starta samtal</a>
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja utan konto och skapa en egen plats senare om du vill.</p>
			<h3>Kan jag ta det i min egen takt?</h3>
			<p>Ja. MittPsyke är byggt för låg tröskel, små steg och ett lugnt tempo.</p>
			<h3>Ersätter detta vård?</h3>
			<p>Nej. Det är ett digitalt samtalsstöd och ett komplement till vård.</p>
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

