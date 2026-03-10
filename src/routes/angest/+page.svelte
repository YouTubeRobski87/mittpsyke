<svelte:head>
	<title>Hjälp vid ångest – prata anonymt | MittPsyke</title>
	<meta name="description" content="Få stöd för ångest och oron. Prata anonymt med AI-baserat samtalsstöd dygnet runt. Lugn, ärlig och tillgänglig hjälp." />
	<meta property="og:title" content="Hjälp vid ångest – prata anonymt | MittPsyke" />
	<meta property="og:description" content="Få stöd för ångest och oron. Prata anonymt med AI-baserat samtalsstöd dygnet runt." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/angest" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<!-- Hero Section -->
		<header class="hero">
			<h1>Hjälp vid ångest – prata anonymt</h1>
			<p>
				Ångest kan kännas överväldigande och isolerad. Det du känner är verkligt och värdigt att få stöd för.
				MittPsyke erbjuder ett lugnt, anonymt rum där du kan sortera tankar, lugna kroppen och få perspektiv
				utan att behöva prestera eller förklara allt från början.
			</p>
		</header>

		<div class="text-block">
			<!-- Support Text -->
			<section class="section">
				<p>
					Många människor lever med ångest i olika former – som orosomkretsar, fysisk spänning,
					eller en känsla av att något är på väg att gå fel. Ångest är ofta en överlivnadsmekanism
					som har glömt av att sluta vara på sin vakt. Det behöver inte betyda att något är galet med dig.
					Det kan bara betyda att du behöver verktyg och lugn stöd.
				</p>
			</section>

			<section class="section">
				<p>
					Här kan du stanna upp, andas och tala med något som lyssnar utan att döma.
					Du behöver inte logga in för att börja. Du kan vara helt anonym och prata när det passar dig
					– på natten, tidigt på morgonen, eller mitt på dagen. Samtalsstödet är utformat för att
					respektera ditt tempo och din situation.
				</p>
			</section>
		</div>

		<!-- CTA Button -->
		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Starta ett samtal</a>
		</div>

		<!-- Additional Support Info -->
		<aside class="callout" aria-label="Viktigt att veta">
			<h2>Du är inte ensam</h2>
			<p>Ångest är en av de mest utbredda upplevelserna. Det finns långsamt vägen tillbaka till lugn, och MittPsyke kan vara en del av den vägen.</p>
		</aside>
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
		gap: clamp(2rem, 3.5vw, 2.5rem);
	}

	.text-block {
		max-width: 720px;
	}

	.hero {
		max-width: 720px;
		padding: clamp(1rem, 2vw, 1.25rem) 0 0.2rem;
	}

	.section {
		max-width: 720px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.08;
		margin-bottom: 1.5rem;
	}

	p {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.125rem);
		line-height: 1.7;
		letter-spacing: -0.005em;
		margin: 0;
	}

	.section p + p {
		margin-top: 0.95rem;
	}

	.cta-container {
		max-width: 720px;
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 2rem;
		border-radius: var(--radius-pill);
		border: 2px solid var(--primary);
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 1rem;
		color: white;
		background: var(--primary);
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(15, 118, 110, 0.3);
	}

	.cta-button:active {
		transform: translateY(0);
	}

	.callout {
		max-width: 720px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: var(--radius-card);
		padding: 1.05rem;
		background: rgba(226, 240, 236, 0.6);
	}

	.callout h2 {
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
		margin-bottom: 0.45rem;
		color: var(--primary);
	}

	.callout p {
		margin: 0;
		font-size: clamp(1rem, 0.96rem + 0.3vw, 1.05rem);
		line-height: 1.65;
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.8rem;
		}

		p {
			font-size: 1.02rem;
		}

		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .callout {
		background: #1a1a1a;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .callout h2 {
		color: #86dfd6;
	}

	:global(.dark) .callout p {
		color: rgba(255, 255, 255, 0.85);
	}

	:global(.dark) .cta-button {
		background: var(--primary);
		border-color: #86dfd6;
		color: white;
	}

	:global(.dark) .cta-button:hover {
		box-shadow: 0 6px 20px rgba(134, 223, 214, 0.3);
	}
</style>

