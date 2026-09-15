<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import { dataflowCopy } from '$lib/dataflow-copy';

	// Sidan följer produktidentiteten: en plats för att skriva, återvända och se
	// vad som återkommer i sina egna ord. Ordningen är varför, kärnan, delarna,
	// vad MittPsyke inte är, integritet och vem som står bakom. Chatten är en av
	// fyra delar, inte positioneringen. Dataflöden läses ur $lib/dataflow-copy
	// så att sidan aldrig säger något annat än integritetspolicyn.
</script>

<SEO canonical="https://mittpsyke.se/om-mittpsyke" />

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'Om MittPsyke – en plats för dina egna ord över tid',
		url: 'https://mittpsyke.se/om-mittpsyke',
		description:
			'MittPsyke är en lugn plats för att skriva, spara det du vill, komma tillbaka och se vad som återkommer i dina egna ord.',
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="page">
	<div class="page-container">
		<Breadcrumbs items={[{ label: 'Om MittPsyke' }]} />

		<header class="hero">
			<h1>Om MittPsyke</h1>
			<p>
				MittPsyke är en lugn plats för att skriva av sig, reflektera och kunna återvända till sina egna
				ord över tid. Du behöver inte veta vad du vill säga, och du behöver inte prestera något.
			</p>
		</header>

		<!-- 1. Varför MittPsyke finns -->
		<section class="section" aria-labelledby="why-title">
			<h2 id="why-title">Varför MittPsyke finns</h2>
			<p>
				Det som känns rörigt blir ofta lite lättare att se när det står i ord, och ännu lättare när
				man kan gå tillbaka och läsa det igen. MittPsyke finns för att de orden ska få ligga kvar – så
				att det som återkommer över veckor och månader blir synligt i din egen takt.
			</p>
			<figure class="founder-note">
				<blockquote>
					<p>
						MittPsyke föddes ur en tid i mitt liv då jag själv mådde väldigt dåligt och hade svårt att
						få det stöd jag behövde. Att sätta ord på tankar och känslor blev ett första steg – inte en
						lösning på allt, men ett sätt att inte vara helt ensam i det som kändes tungt. Därför
						skapade jag MittPsyke.
					</p>
				</blockquote>
				<figcaption>Robban (Robert Claesson), som driver MittPsyke</figcaption>
			</figure>
		</section>

		<!-- 2. Kärnan -->
		<section class="section" aria-labelledby="core-title">
			<h2 id="core-title">Kärnan</h2>
			<ol class="steps" role="list">
				<li>
					<span class="step-number" aria-hidden="true">1</span>
					<div>
						<h3>Skriv.</h3>
						<p>Några ord eller en hel sida. Det finns inget rätt sätt.</p>
					</div>
				</li>
				<li>
					<span class="step-number" aria-hidden="true">2</span>
					<div>
						<h3>Spara det du vill.</h3>
						<p>Utan konto stannar texten i din webbläsare. Med konto sparar du det du väljer.</p>
					</div>
				</li>
				<li>
					<span class="step-number" aria-hidden="true">3</span>
					<div>
						<h3>Kom tillbaka när du vill.</h3>
						<p>Ingenting börjar om för att det gått en tid.</p>
					</div>
				</li>
				<li>
					<span class="step-number" aria-hidden="true">4</span>
					<div>
						<h3>Se vad som återkommer.</h3>
						<p>Dina egna ord sammanställda i Framsteg – ingen mätning av hur du sköter dig.</p>
					</div>
				</li>
			</ol>
		</section>

		<!-- 3. Delarna -->
		<section class="section" aria-labelledby="parts-title">
			<h2 id="parts-title">Delarna</h2>
			<div class="parts">
				<article class="part">
					<h3>Dagboken</h3>
					<p>
						Där du skriver, kort eller långt. Det du sparar samlas i Mitt Hem och är underlaget när
						Framsteg visar vad som återkommer.
					</p>
				</article>
				<article class="part">
					<h3>Kvällstugan och Kvällsincheckningen</h3>
					<p>
						Kvällstugan är platsen där dagen får landa. Där gör du Kvällsincheckningen: stäm av kvällen
						och lägg undan det du inte behöver bära vidare just nu.
					</p>
				</article>
				<article class="part">
					<h3>Balder</h3>
					<p>
						Balder är MittPsykes enda följeslagare. Han finns med i Mitt Hem och Kvällstugan som en
						lugn närvaro som följer tiden, årstiden och platsen. Han är ingen mätare på hur du mår och
						inget spel att klara av.
					</p>
				</article>
				<article class="part">
					<h3>AI-chatten, om du vill</h3>
					<p>
						Ett valfritt verktyg för den som hellre vill prata fram tankarna. Du kan öppna chatten utan
						konto och utan att välja tema. Svaren skapas av AI, kan bli fel och ersätter inte vård eller
						en människa.
					</p>
				</article>
			</div>
			<p class="more-link"><a href="/sa-fungerar-mittpsyke">Så fungerar MittPsyke steg för steg</a></p>
		</section>

		<!-- 4. Vad MittPsyke inte är -->
		<section class="section limits" aria-labelledby="limits-title">
			<h2 id="limits-title">Vad MittPsyke inte är</h2>
			<ul>
				<li>
					<strong>Inte vård eller akuthjälp.</strong> Vid akut fara, ring <a href="tel:112">112</a>. För
					vårdråd, kontakta <a href="https://www.1177.se" rel="noopener noreferrer">1177</a>. Vid tecken
					på akut kris visar chatten ett säkerhetssvar med hänvisning till akut hjälp.
				</li>
				<li><strong>Inte terapi.</strong> Ingen behandling eller terapeutisk metod följs här.</li>
				<li><strong>Ingen diagnos.</strong> Ingenting på MittPsyke bedömer eller sätter namn på hur du mår.</li>
				<li><strong>Ingen prestationsmätning.</strong> Det du skriver betygsätts inte.</li>
				<li><strong>Ingen streak.</strong> Det gör inget om du är borta ett tag.</li>
			</ul>
			<p><a href="/ansvar">Läs mer i ansvarsinformationen</a></p>
		</section>

		<!-- 5. Integritet och kontroll -->
		<section class="section" aria-labelledby="privacy-title">
			<h2 id="privacy-title">Integritet och kontroll</h2>
			<ul>
				<li><strong>Utan konto:</strong> {dataflowCopy.anonymousDiary.short}</li>
				<li><strong>Med konto:</strong> bara det du själv väljer att spara sparas.</li>
				<li><strong>AI i dagboken:</strong> {dataflowCopy.savedDiary.aiTransfer}</li>
				<li>Du kan exportera din data och radera ditt konto i Inställningar.</li>
			</ul>
			<p><a href="/integritet">Läs integritetspolicyn</a></p>
		</section>

		<!-- 6. Vem står bakom -->
		<section class="section company-section" aria-labelledby="company-title">
			<h2 id="company-title">Vem står bakom MittPsyke</h2>
			<p>
				MittPsyke utvecklas och drivs av Robert Claesson som enskild näringsverksamhet. Verksamheten
				omfattar utveckling och drift av digitala tjänster och informationsplattformar, bland annat
				MittPsyke och <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>,
				och samarbeten med organisationer inom psykisk hälsa.
			</p>
			<p>
				Guiderna skrivs och uppdateras löpande av Robert. De är inte medicinskt granskade, och externa
				källor som 1177 och Folkhälsomyndigheten anges i varje guide. Hittar du ett fel? Hör av dig.
			</p>
			<p>
				MittPsyke kan också erbjudas frivilligt via organisationer och föreningar.
				<a href="/for-organisationer">Läs om MittPsyke för organisationer</a>
			</p>

			<dl class="company-list">
				<div class="company-row">
					<dt>Företag:</dt>
					<dd>MittPsyke</dd>
				</div>
				<div class="company-row">
					<dt>Organisationsnummer:</dt>
					<dd>198712284895</dd>
				</div>
				<div class="company-row">
					<dt>Verksamhetsform:</dt>
					<dd>Enskild näringsverksamhet</dd>
				</div>
				<div class="company-row">
					<dt>Ansvarig:</dt>
					<dd>Robert "Robban" Claesson</dd>
				</div>
				<div class="company-row">
					<dt>E-post:</dt>
					<dd><a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a></dd>
				</div>
			</dl>
		</section>

		<nav class="section more-links" aria-label="Läs mer">
			<h2>Läs mer</h2>
			<ul role="list">
				<li><a href="/sa-fungerar-mittpsyke">Så fungerar MittPsyke</a></li>
				<li><a href="/digital-dagbok-for-maende">Digital dagbok för mående</a></li>
				<li><a href="/chatta-anonymt-med-nagon">Chatta anonymt med någon</a></li>
				<li><a href="/ansvar">Ansvarsinfo</a></li>
				<li><a href="/integritet">Integritetspolicy</a></li>
				<li><a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Akut hjälp (Stödlinjer)</a></li>
			</ul>
		</nav>
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

	.hero,
	.section {
		max-width: 720px;
		min-width: 0;
	}

	.hero {
		padding: clamp(1rem, 2vw, 1.25rem) 0 0.2rem;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.08;
		margin-bottom: 1.25rem;
	}

	.section > h2 {
		font-size: 1.6rem;
		font-weight: 700;
		line-height: 1.12;
		margin-bottom: 1rem;
		color: var(--primary);
	}

	.section > h2::after {
		content: '';
		display: block;
		width: 40px;
		height: 3px;
		margin-top: 0.45rem;
		border-radius: var(--radius-pill);
		background: color-mix(in srgb, var(--primary) 32%, transparent);
	}

	h3 {
		font-weight: 600;
		font-size: 1.05rem;
		line-height: 1.2;
		margin-bottom: 0.45rem;
	}

	p,
	li {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.125rem);
		line-height: 1.7;
		letter-spacing: -0.005em;
		overflow-wrap: break-word;
	}

	p {
		margin: 0;
	}

	.section p + p,
	.section ul + p {
		margin-top: 0.95rem;
	}

	.section ul {
		margin: 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.5rem;
	}

	.section a {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.founder-note {
		margin: 1.25rem 0 0;
		padding: clamp(1rem, 2.5vw, 1.35rem);
		border-left: 4px solid var(--primary);
		border-radius: var(--radius-card);
		background: rgba(163, 193, 173, 0.12);
	}

	.founder-note blockquote {
		margin: 0;
	}

	.founder-note figcaption {
		margin-top: 0.75rem;
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--primary);
	}

	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.7rem;
	}

	.section .steps {
		padding-left: 0;
	}

	.steps li {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.75rem;
		align-items: start;
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: var(--radius-card);
		padding: 0.9rem 0.95rem;
		background: rgba(248, 250, 252, 0.7);
	}

	.step-number {
		width: 1.9rem;
		height: 1.9rem;
		border-radius: var(--radius-pill);
		background: rgba(15, 118, 110, 0.12);
		color: #145a54;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 0.95rem;
		margin-top: 0.05rem;
	}

	.parts {
		display: grid;
		gap: 0.85rem;
	}

	.part {
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: var(--radius-card);
		padding: 1rem 1rem 1.05rem;
		background: rgba(248, 250, 252, 0.78);
		min-width: 0;
	}

	.more-link {
		margin-top: 1rem;
	}

	.limits {
		padding: clamp(1rem, 2.5vw, 1.35rem);
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: var(--radius-card);
		background: rgba(226, 240, 236, 0.6);
	}

	.limits > h2 {
		margin-top: 0;
	}

	.company-list {
		margin: 1rem 0 0;
		display: grid;
		gap: 0.45rem;
	}

	.company-row {
		display: grid;
		grid-template-columns: minmax(160px, auto) 1fr;
		gap: 0.6rem;
	}

	.company-list dt {
		font-weight: 600;
		margin: 0;
	}

	.company-list dd {
		margin: 0;
		overflow-wrap: anywhere;
	}

	.more-links ul {
		list-style: none;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem 1.25rem;
	}

	@media (min-width: 760px) {
		.steps,
		.parts {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.8rem;
		}

		p,
		li {
			font-size: 1.02rem;
		}

		.company-row {
			grid-template-columns: 1fr;
			gap: 0.12rem;
		}
	}

	:global(.dark) .steps li,
	:global(.dark) .part,
	:global(.dark) .limits {
		background: #1a1a1a;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .steps li h3,
	:global(.dark) .part h3 {
		color: #ffffff;
	}

	:global(.dark) .steps li p,
	:global(.dark) .part p,
	:global(.dark) .limits li,
	:global(.dark) .limits p {
		color: rgba(255, 255, 255, 0.85);
	}

	:global(.dark) .hero h1,
	:global(.dark) .section > h2 {
		color: #86dfd6;
	}

	:global(.dark) .section > h2::after {
		background: rgba(134, 223, 214, 0.5);
	}

	:global(.dark) .founder-note {
		background: rgba(15, 118, 110, 0.12);
	}

	:global(.dark) .founder-note figcaption {
		color: #86dfd6;
	}
</style>
