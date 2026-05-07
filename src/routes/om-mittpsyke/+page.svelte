<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import ResearchEvidenceCard from '$lib/components/ResearchEvidenceCard.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/om-mittpsyke" />

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'Om MittPsyke – Skapad av erfarenhet, inte teori',
		url: 'https://www.mittpsyke.se/om-mittpsyke',
		description: 'MittPsyke skapades av Robert Claesson – av egna erfarenheter av psykisk ohälsa och återhämtning.',
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="page">
	<div class="page-container">

		<!-- 1) Hero -->
		<header class="hero">
			<h1>Om MittPsyke</h1>
			<p>
				MittPsyke är en svensk plattform för digitalt samtalsstöd, skapad för människor som
				lever med psykisk belastning i olika former. Tanken är att erbjuda ett tryggt och tillgängligt
				rum där det går att stanna upp, sätta ord på det som känns svårt och få
				stöd i stunden — utan att behöva prestera eller förklara allt från början.
			</p>
		</header>

		<section class="trust-overview" aria-label="Snabbt om MittPsyke">
			<h2>Snabbt om MittPsyke</h2>
			<ul>
				<li><strong>Är detta vård?</strong> Nej. MittPsyke är ett AI-baserat samtalsstöd i text, inte vård, diagnos, behandling eller akuthjälp.</li>
				<li><strong>Vad används tjänsten till?</strong> Ett första steg för reflektion och struktur i vardagen när du vill börja någonstans.</li>
				<li><strong>Vad gäller i akut läge?</strong> Ring 112 vid akut fara. För vårdråd, kontakta 1177.</li>
				<li><strong>Vem står bakom?</strong> MittPsyke drivs av Robert Claesson som enskild näringsverksamhet (org.nr 198712284895).</li>
					<li><strong>Hur kontaktar man er?</strong> <a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a></li>
			</ul>
		</section>

		<section class="section" id="metod">
			<h2>Metod och förhållningssätt</h2>
			<p>
				MittPsyke använder ett lugnt, stödjande och reflekterande samtalsupplägg. Svaren är utformade
				för att hjälpa användaren att sätta ord på det som känns svårt, sortera tankar, göra
				överväldigande mer greppbart och hitta nästa lilla steg.
			</p>
			<p>
				Samtalsstödet kan innehålla inslag som påminner om psykoedukation, grounding, mindfulnessnära
				uppmärksamhet och KBT-inspirerad struktur, men ersätter inte terapi eller annan professionell vård.
			</p>
			<ul>
				<li><strong>Traumamedvetet och lågtröskligt bemötande</strong> – möta dig utan krav på förklaring eller prestation.</li>
				<li><strong>Stöd för reflektion och lugn</strong> – hjälpa dig att sätta ord på det som känns och sortera tankar.</li>
				<li><strong>Grounding och struktur</strong> – lugnande samtalsstöd med fokus på nästa lilla steg.</li>
				<li><strong>Inte vård, diagnos eller behandling</strong> – tjänsten följer inte ett specifikt terapeutiskt protokoll och är inte evidensbaserad behandling i klinisk mening.</li>
			</ul>

			<p class="crisis-note">
				MittPsyke kan vid vissa tecken på akut kris visa ett särskilt säkerhetssvar med hänvisning till akut hjälp. Tjänsten är inte en akuttjänst och ska inte användas som enda stöd i en nödsituation.
			</p>
		</section>

		<ResearchEvidenceCard />

		<section class="section" id="innehall">
			<h2>Innehåll och kvalitet</h2>
			<p>
				MittPsykes guider och texter är skrivna för att vara begripliga, lugna och stödjande –
				utan medicinsk jargong eller onödig komplexitet.
			</p>
			<p>
				Innehållet tas fram och underhålls av Robert Claesson, grundare av MittPsyke. Det
				beskrivs inte som medicinskt granskat eftersom MittPsyke i nuläget inte har en namngiven
				medicinsk granskare eller klinisk redaktion.
			</p>
			<ul>
				<li>
					<strong>Hur tas innehållet fram?</strong><br />
					Guiderna utgår från tillgänglig och välkänd information om psykisk hälsa. Relevanta externa
					källor – som 1177 och Folkhälsomyndigheten – anges direkt i varje guide.
				</li>
				<li>
					<strong>Uppdateras innehållet?</strong><br />
					Ja. Guider granskas och uppdateras löpande. Senast uppdaterat-datum visas i botten av varje
					guide.
				</li>
				<li>
					<strong>Ersätter innehållet vård?</strong><br />
					Nej. Allt innehåll är till för reflektion och vägledning, inte vård, diagnos eller behandling.
				</li>
				<li>
					<strong>Fel eller förbättringsförslag?</strong><br />
					Hör av dig till
						<a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a> – vi tar emot rättelser och
					förbättringsförslag löpande.
				</li>
			</ul>
		</section>

		<!-- 2) Personlig story -->
		<section class="story-section">
			<div class="story-inner">
				<div class="story-label">GRUNDAREN BERÄTTAR</div>
				<h2 class="story-heading">Varför MittPsyke finns</h2>

				<div class="story-text">
					<p>
						MittPsyke föddes ur en tid i mitt liv då jag själv mådde väldigt dåligt och hade svårt att få det stöd jag behövde. När hjälpen kändes långt borta började jag småprata med AI. Det som först bara var några enkla samtal blev med tiden ett sätt att sätta ord på tankar, känslor och sådant som annars var svårt att bära ensam.
					</p>
					<p>
						Det var inte en lösning på allt. Men det blev ett första steg. Ett sätt att känna sig hörd, att stanna upp, att reflektera och att inte vara helt ensam i det som kändes tungt.
					</p>
					<p>
						Den erfarenheten stannade kvar i mig. Jag tänkte att om ett sådant stöd kunde hjälpa mig att ta mig vidare, så borde fler människor få samma möjlighet. Därför skapade jag MittPsyke.
					</p>
					<p>
						Min vision är enkel: att erbjuda en trygg, personlig och tillgänglig plats där man kan skriva av sig, tänka klart och få stöd i stunden. En plats som känns som ens egen. Utan krav, utan dömande och med låg tröskel att börja.
					</p>
					<p>
						MittPsyke ersätter inte vård eller akut hjälp. Men det kan vara ett första steg, ett komplement och en plats för reflektion när man behöver någonstans att börja.
					</p>

					<blockquote class="story-quote">
						"Om MittPsyke kan ge någon annan samma känsla av att bli tagen på allvar som jag själv en gång behövde, då har det redan fyllt ett viktigt syfte."
						<cite>— Robban (Robert Claesson), grundare av MittPsyke</cite>
					</blockquote>
				</div>
			</div>
		</section>

		<div class="text-block">
			<section class="section">
				<h2>Trygghet, ansvar och metod</h2>
				<p>
					MittPsyke är skapat ur egen erfarenhet av psykisk belastning, men tjänsten bygger också på tydliga gränser. Syftet är att erbjuda AI-baserat stöd för reflektion, lugn och struktur i vardagen — inte att ställa diagnoser, ge akutvård eller ersätta kontakt med legitimerad vårdpersonal.
				</p>
				<ul>
					<li>
						<strong>Tydliga ramar</strong><br />
						MittPsyke är till för samtalsstöd, egen reflektion och vardagsnära vägledning. Tjänsten är inte avsedd att ersätta vård, behandling eller professionell bedömning och ska inte vara enda underlag för medicinska beslut.
					</li>
					<li>
						<strong>Ansvar och öppenhet</strong><br />
						Det ska vara tydligt för användaren vad tjänsten är till för, vilka begränsningar som finns och när annan hjälp behövs. Därför finns också tydlig ansvarsinfo och hänvisningar vidare.
					</li>
					<li>
						<strong>Lugn och respektfull metod</strong><br />
						Samtalen är utformade för att möta människor med lugn, respekt och låg tröskel. Fokus ligger på att hjälpa användaren att stanna upp, sätta ord på det som känns och få struktur i stunden.
					</li>
					<li>
						<strong>När annan hjälp behövs</strong><br />
						Vid akut fara, allvarlig psykisk kris eller behov av medicinsk bedömning ska användaren alltid vända sig till vården, 1177 eller 112 beroende på situation.
					</li>
				</ul>
				<p>
					<a href="/ansvar">Läs mer i ansvarsinformationen</a>
				</p>
			</section>

			<!-- 3) Vad ar MittPsyke -->
			<section class="section">
				<h2>Vad är MittPsyke?</h2>
				<p>
					Plattformen fungerar som vardagsnära stöd för reflektion — också för dig som har, väntar på
					eller har haft kontakt med vården. I centrum finns ett AI-baserat samtalsstöd som är utformat för att svara med
					lugn, respekt och empati.
				</p>
				<p>
					Målet är inte att ersätta professionell behandling, utan att göra det lättare att
					reflektera, sortera tankar och vid behov hitta vidare till rätt resurser.
				</p>
			</section>

			<!-- 4) For vem -->
			<section class="section">
				<h2>För vem är det här?</h2>
				<p>
					MittPsyke är skapat för människor som vill ha ett lugnt, tillgängligt och respektfullt
					samtalsstöd i vardagen.
				</p>
				<ul>
					<li>För dig som lever med psykisk belastning i olika former.</li>
					<li>För dig som vill stanna upp och sätta ord på det som känns svårt.</li>
					<li>För dig som vill ta steg i egen takt, utan dömande ton eller krav på snabba svar.</li>
				</ul>
			</section>
		</div>

		<!-- 5) Cards -->
		<section class="section">
			<h2>Vad du kan göra här</h2>
			<div class="feature-grid">
				<article class="feature-card">
					<h3>Dagbok</h3>
					<p>
						Skriv reflektioner i vardagen och bygg en personlig historik av det som varit viktigt för
						dig.
					</p>
				</article>
				<article class="feature-card">
					<h3>Statistik</h3>
					<p>
						Få mer kontinuitet över tid genom att kunna se mönster i dina anteckningar och
						reflektioner.
					</p>
				</article>
				<article class="feature-card">
					<h3>Trygg chat</h3>
					<p>
						Samtala i ett AI-baserat stöd som är utformat för att svara med lugn, respekt och
						empati.
					</p>
				</article>
			</div>
		</section>

		<!-- 6) Hur det funkar -->
		<section class="section">
			<h2>Hur det funkar</h2>
			<ol class="steps">
				<li>
					<span class="step-number">1</span>
					<div>
						<h3>Välj ingång</h3>
						<p>
							Börja i ett tema som känns relevant direkt: Ångest, Depression eller Trauma &amp;
							våld.
						</p>
					</div>
				</li>
				<li>
					<span class="step-number">2</span>
					<div>
						<h3>Reflektera i din takt</h3>
						<p>
							Stanna upp, sortera tankar och få stöd i stunden utan att behöva prestera eller
							förklara allt från början.
						</p>
					</div>
				</li>
				<li>
					<span class="step-number">3</span>
					<div>
						<h3>Följ din kontinuitet</h3>
						<p>
							Om du vill kan du logga in och spara samtal över tid, så att plattformen blir ett
							personligt samtalsrum.
						</p>
					</div>
				</li>
			</ol>
		</section>

		<div class="text-block">
			<!-- 7) Trygghet och integritet -->
			<section class="section">
				<h2>Trygghet och integritet</h2>
				<p>
					MittPsykes värdegrund bygger på integritet, frivillighet och mänsklig sårbarhet.
					Användaren ska kunna mötas utan dömande ton, utan krav på att må bättre snabbt och
					utan känslan av att bli reducerad till ett symptom.
				</p>
				<p>
					Du kan börja utan konto om du vill ta ett försiktigt första steg. För den som önskar
					mer kontinuitet finns möjlighet till inloggning, där samtal kan sparas över tid. Vissa tekniska uppgifter hanteras enligt integritetspolicyn.
				</p>
				<p>
					Designfilosofin är avskalad, mjuk och icke-klinisk — för att minska stress, undvika onödiga
					distraktioner och skapa en känsla av närvaro.
				</p>
			</section>
		</div>

		<!-- 8) Callout -->
		<aside class="callout" aria-label="Viktigt att veta">
			<h2>Viktigt att veta</h2>
			<p>Vid akut fara, ring 112. För vårdråd, kontakta 1177. Läs mer om begränsningar och ansvar innan du använder tjänsten.</p>
			<a class="callout-link" href="/ansvar">Gå till Ansvarsinfo</a>
		</aside>

		<!-- 9) Kontakt och lankar -->
		<section class="section links-section">
			<h2>Kontakt och viktiga länkar</h2>
			<p>Här hittar du vägar in till tjänsten och till information om ansvar, integritet och akut stöd.</p>
			<ul>
				<li><a href="/ansvar">Ansvarsinfo</a></li>
				<li><a href="/integritet">Integritetspolicy</a></li>
				<li><a href="/chat">Öppna chatten</a></li>
				<li><a href="/dagbok">Läs om dagboken</a></li>
				<li><a href="/digital-dagbok-for-maende">Digital dagbok för mående</a></li>
				<li><a href="/chatta-anonymt-med-nagon">Chatta anonymt med någon</a></li>
				<li>
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">
						Akut hjälp (Stödlinjer)
					</a>
				</li>
			</ul>
		</section>

		<!-- 10) Verksamhet och utveckling -->
		<section class="section" id="verksamhet">
			<h2>Om verksamheten</h2>
			<p>
				MittPsyke är en digital plattform under utveckling som syftar till att erbjuda verktyg
				för självreflektion, mental återhämtning och informationsstöd kring psykisk hälsa.
			</p>
			<p>
				Plattformen utvecklas och drivs självständigt av Robert Claesson och är en del av en
				verksamhet inriktad på utveckling av digitala tjänster, webbapplikationer och
				informationsplattformar på internet.
			</p>
			<p>
				Verksamheten omfattar utveckling, drift och vidareutveckling av digitala tjänster,
				däribland webbplattformar som MittPsyke och informationssajten
				<a href="https://stodlinjer.se" target="_blank" rel="noopener">stodlinjer.se</a>.
			</p>
			<p>
				Målsättningen är att på sikt erbjuda digitala funktioner, samarbeten och tjänster
				kopplade till dessa plattformar.
			</p>
		</section>

		<!-- 11) Tjänster och samarbeten -->
		<section class="section" id="tjanster">
			<h2>Tjänster och samarbeten</h2>
			<p>
				Verksamheten erbjuder och utvecklar tjänster inom följande områden:
			</p>
			<ul>
				<li>Digitala verktyg och plattformar för psykisk hälsa och självreflektion</li>
				<li>Utveckling och drift av webbplattformar och webbapplikationer</li>
				<li>Samarbeten med organisationer och verksamheter inom psykisk hälsa</li>
				<li>Informationsplattformar och digitala guider</li>
			</ul>
			<p>
					För samarbeten eller frågor kring plattformen, kontakta
					<a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a>.
			</p>
		</section>

		<!-- 12) Företagsinformation -->
		<section class="section company-section" aria-labelledby="foretagsinformation">
			<h2 id="foretagsinformation">Företagsinformation</h2>
			<p>MittPsyke drivs som enskild näringsverksamhet.</p>

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
			</dl>

			<h3>Kontakt</h3>
			<address class="company-address">
				<p>
						<strong>E-post:</strong>
						<a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a>
					</p>
				<p>
					<strong>Webbplats:</strong>
					<a href="https://www.mittpsyke.se" target="_blank" rel="noopener noreferrer">https://www.mittpsyke.se</a>
				</p>
			</address>
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

	.trust-overview {
		max-width: 720px;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid rgba(15, 23, 42, 0.1);
		background: rgba(248, 250, 252, 0.82);
	}

	.trust-overview h2 {
		font-size: 1.2rem;
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 0.55rem;
		color: var(--primary);
	}

	.trust-overview ul {
		margin: 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.4rem;
	}

	.trust-overview li {
		font-size: clamp(0.98rem, 0.94rem + 0.35vw, 1.05rem);
		line-height: 1.65;
	}

	.section {
		max-width: 720px;
	}

	h1,
	h2,
	h3 {
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

	.section > h2 {
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.12;
		margin-top: 3rem;
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
		background: rgba(15, 118, 110, 0.28);
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
	}

	p {
		margin: 0;
	}

	.section p + p {
		margin-top: 0.95rem;
	}

	.section ul {
		margin: 0.6rem 0 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.35rem;
	}

	/* Story section */
	.story-section {
		max-width: 720px;
	}

	.story-inner {
		background: linear-gradient(135deg, rgba(163, 193, 173, 0.15) 0%, rgba(195, 230, 203, 0.1) 100%);
		border: 1px solid rgba(15, 118, 110, 0.15);
		border-left: 4px solid var(--primary);
		border-radius: var(--radius-card);
		padding: clamp(1.5rem, 3vw, 2.2rem);
	}

	.story-label {
		font-family: var(--font-heading);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--primary);
		margin-bottom: 0.6rem;
		opacity: 0.85;
	}

	.story-heading {
		font-family: var(--font-heading);
		font-size: clamp(1.4rem, 1.2rem + 1vw, 1.75rem);
		font-weight: 750;
		letter-spacing: -0.02em;
		line-height: 1.12;
		color: var(--primary);
		margin-bottom: 1.4rem;
	}

	.story-text p {
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.1rem);
		line-height: 1.75;
		color: #2d3748;
	}

	.story-text p + p {
		margin-top: 1rem;
	}

	.story-quote {
		margin: 1.8rem 0 0;
		padding: 1.2rem 1.4rem;
		background: rgba(255, 255, 255, 0.6);
		border-radius: calc(var(--radius-card) - 2px);
		border: 1px solid rgba(15, 118, 110, 0.12);
		font-style: italic;
		font-size: clamp(1rem, 0.95rem + 0.3vw, 1.05rem);
		line-height: 1.65;
		color: #2d3748;
	}

	.story-quote cite {
		display: block;
		margin-top: 0.8rem;
		font-style: normal;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--primary);
		opacity: 0.85;
	}

	.feature-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
	}

	.feature-card {
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: var(--radius-card);
		padding: 1rem 1rem 1.05rem;
		background: rgba(248, 250, 252, 0.78);
	}

	.feature-card p {
		font-size: clamp(1rem, 0.96rem + 0.3vw, 1.05rem);
		line-height: 1.65;
	}

	.steps {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		gap: 0.7rem;
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
		letter-spacing: -0.01em;
		margin-top: 0.05rem;
	}

	.callout {
		max-width: 720px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: var(--radius-card);
		padding: 1.05rem;
		background: rgba(226, 240, 236, 0.6);
	}

	.callout h2 {
		margin-bottom: 0.45rem;
	}

	.callout p {
		margin-bottom: 0.85rem;
	}

	.callout-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.45rem 0.8rem;
		border-radius: var(--radius-pill);
		border: 1px solid rgba(20, 90, 84, 0.24);
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 0.95rem;
		color: #145a54;
		background: rgba(255, 255, 255, 0.75);
	}

	.links-section ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: grid;
		gap: 0.65rem;
	}

	.links-section p {
		margin-bottom: 0.8rem;
	}

	.links-section a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.company-section h3 {
		margin-top: 1rem;
		margin-bottom: 0.45rem;
	}

	.company-list {
		margin: 0.55rem 0 0;
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
	}

	.company-address {
		margin: 0.4rem 0 0;
		font-style: normal;
		display: grid;
		gap: 0.35rem;
	}

	.company-address p {
		margin: 0;
	}

	@media (min-width: 760px) {
		.feature-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.steps {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.steps li {
			grid-template-columns: 1fr;
			gap: 0.6rem;
		}
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.8rem;
		}

		.trust-overview {
			padding: 0.9rem;
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

	:global(.dark) .feature-card,
	:global(.dark) .steps li,
	:global(.dark) .callout {
		background: #1a1a1a;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .trust-overview {
		background: #1a1a1a;
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .feature-card h3,
	:global(.dark) .steps li h3,
	:global(.dark) .callout h2 {
		color: #ffffff;
	}

	:global(.dark) .feature-card p,
	:global(.dark) .steps li p,
	:global(.dark) .callout p {
		color: rgba(255, 255, 255, 0.85);
	}

	:global(.dark) .hero h1,
	:global(.dark) .section > h2,
	:global(.dark) .links-section h2 {
		color: #86dfd6;
	}

	:global(.dark) .section > h2::after {
		background: rgba(134, 223, 214, 0.5);
	}

	:global(.dark) .story-inner {
		background: linear-gradient(135deg, rgba(15, 118, 110, 0.12) 0%, rgba(15, 118, 110, 0.06) 100%);
		border-color: rgba(134, 223, 214, 0.2);
	}

	:global(.dark) .story-text p {
		color: rgba(255, 255, 255, 0.85);
	}

	:global(.dark) .story-quote {
		background: rgba(255, 255, 255, 0.05);
		color: rgba(255, 255, 255, 0.85);
		border-color: rgba(134, 223, 214, 0.15);
	}

	.crisis-note {
		margin-top: 1rem;
		padding: 0.75rem 1rem;
		border-radius: var(--radius-card);
		border-left: 3px solid rgba(15, 118, 110, 0.4);
		background: rgba(226, 240, 236, 0.5);
		font-size: clamp(0.95rem, 0.92rem + 0.25vw, 1rem);
		line-height: 1.6;
		color: #2d3748;
	}
</style>
