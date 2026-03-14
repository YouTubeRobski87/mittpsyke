<svelte:head>
	<title>Självkänsla – samtalsstöd och stöd i din takt | MittPsyke</title>
	<meta name="description" content="Låg självkänsla är tyst men tung. Prata anonymt och utforska din relation till dig själv – utan dömande ton, utan krav." />
	<meta property="og:title" content="Självkänsla – samtalsstöd och stöd i din takt | MittPsyke" />
	<meta property="og:description" content="Låg självkänsla är tyst men tung. Prata anonymt och utforska din relation till dig själv." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/sjalvkansla" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Självkänsla – ett rum att utforska dig själv</h1>
			<p>
				Låg självkänsla är tyst. Den syns sällan utifrån, men inifrån kan den färga hela tillvaron
				– hur du talar till dig själv, om du tillåter dig att ta plats, om du tror att du förtjänar stöd.
			</p>
		</header>

		<div class="text-block">
			<section class="section">
				<p>
					Det är vanligare än du tror. Och det är något du kan börja utforska, i din egen takt,
					utan att behöva prestera eller förklara allt från början.
				</p>
			</section>

			<section class="section">
				<p>
					Här kan du samtala om din relation till dig själv. Inga rätta svar, inget dömande
					– bara ett utrymme att sätta ord på hur du egentligen mår.
					Du kan vara anonym och börja direkt, utan att skapa konto.
				</p>
			</section>
		</div>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Starta ett samtal</a>
		</div>

		<aside class="callout" aria-label="Viktigt att veta">
			<h2>Du förtjänar att bli lyssnad på</h2>
			<p>Självkänsla formas av erfarenheter och relationer – och den kan förändras. Det börjar ofta med att någon faktiskt lyssnar, utan att döma.</p>
		</aside>

		<!-- Guide links -->
		<section class="guide-links" aria-label="Läs mer om självkänsla">
			<h2>Läs mer i våra guider</h2>
			<ul>
				<li><a href="/guider-seo/sjalvkansla/dalig-sjalvkansla">Dålig självkänsla – att känna sig otillräcklig</a></li>
				<li><a href="/guider-seo/sjalvkansla/sjalvkritiska-tankar">Självkritiska tankar – när den inre rösten är hård</a></li>
				<li><a href="/guider-seo/sjalvkansla/hur-far-man-battre-sjalvkansla">Hur får man bättre självkänsla? Konkreta steg</a></li>
			</ul>
			<a href="/guider-seo/sjalvkansla" class="guide-link-all">Se alla guider om självkänsla →</a>
		</section>
		<!-- Källor och uppdatering -->
		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 14 mars 2026</p>
			<h2>Källor</h2>
			<ul>
				<li><a href="https://www.1177.se/liv--halsa/psykisk-halsa/sjalvkansla/" target="_blank" rel="noopener noreferrer">Självkänsla – 1177 Vårdguiden</a></li>
				<li><a href="https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/" target="_blank" rel="noopener noreferrer">Om psykisk hälsa – Folkhälsomyndigheten</a></li>
				<li><a href="https://dinpsykiskahalsa.se/" target="_blank" rel="noopener noreferrer">Din psykiska hälsa</a></li>
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

	.guide-links {
		max-width: 720px;
	}

	.guide-links h2 {
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		margin-bottom: 0.75rem;
		color: var(--primary);
	}

	.guide-links ul {
		list-style: none;
		padding: 0;
		margin: 0 0 0.85rem;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.guide-links ul li a {
		font-family: var(--font-body);
		font-size: clamp(0.95rem, 0.92rem + 0.25vw, 1.05rem);
		color: var(--primary);
		text-decoration: underline;
		text-decoration-color: rgba(15, 118, 110, 0.35);
		text-underline-offset: 3px;
	}

	.guide-links ul li a:hover {
		text-decoration-color: var(--primary);
	}

	.guide-link-all {
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--primary);
		text-decoration: none;
		opacity: 0.8;
	}

	.guide-link-all:hover {
		opacity: 1;
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

	:global(.dark) .guide-links h2 {
		color: #86dfd6;
	}

	:global(.dark) .guide-links ul li a,
	:global(.dark) .guide-link-all {
		color: #86dfd6;
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
