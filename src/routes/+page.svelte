<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import CabinProof from '$lib/components/home/CabinProof.svelte';
	import SignedInHome from '$lib/components/home/SignedInHome.svelte';
	import { trackHomeCtaClick } from '$lib/analytics';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	// Anonyma skrivytan är kvar som destination - den är ett val inne i
	// produkten, inte startsidans löfte.
	const ANONYMOUS_WRITE_DESTINATION = '/dagbok?action=new';
	// Hero-sekundären är ett ankare inom sidan, inte en andra destination.
	// Registreringen låg här tidigare och konkurrerade med den primära CTA:n
	// trots att den kostar besökaren ett konto. Den finns kvar i headern och
	// har sin plats i avslutande CTA, efter att sidan förklarat vad kontot ger.
	//
	// Länktexten följer målrubriken ("Så ser platsen ut"), inte tvärtom. En
	// länk som lovar "Så fungerar det" och landar på en rubrik som säger något
	// annat bryter förväntan direkt efter första klicket.
	const PLACE_MAP_ANCHOR = '#map-title';
	// Den riktiga kvällsincheckningen ligger i Kvällsstugan och kräver konto.
	// Den publika startsidan visas bara för utloggade, så länken går via
	// inloggningen med ?redirect= - samma mönster som övriga skyddade sidor -
	// i stället för att låta /dashboard/kvallsstugan kasta bort destinationen.
	const EVENING_CHECKIN_DESTINATION = '/login?redirect=/dashboard/kvallsstugan';
	// Avslutande CTA:ns sekundära väg. Registreringen tar med gästens utkast
	// (readDiaryDraft i /register) och Mitt Hem erbjuder "Fortsätt skriva".
	const REGISTER_DESTINATION = '/register';
	// Integritetspolicyn beskriver både anonymt läge och vad som sparas med
	// konto, och är den länk som tidigare låg i Bakom-sektionen.
	const PRIVACY_DESTINATION = '/integritet';
	// Befintlig, korrekt stödväg. ASCII-värdnamn - aldrig ö i hostname och
	// aldrig punycode-varianten från PDF-exporten.
	const SUPPORT_LINES_URL = 'https://stodlinjer.se';

	function trackHomeCta(section: string, cta: string, href: string) {
		trackHomeCtaClick({ section, cta, href });
	}

	/**
	 * Hero-ankaret sköts i JS, för att webbläsarens hash-navigering bara
	 * fungerar en gång: efter första klicket är hashen redan `#map-title`,
	 * ingen navigering utlöses, och besökaren som scrollat upp igen möter en
	 * död länk. scrollIntoView kan köras hur många gånger som helst.
	 *
	 * href ligger kvar, så hoppet fungerar även utan JS. Offseten mot den
	 * sticky headern kommer från scroll-padding-top på html i app.css och
	 * respekteras av båda vägarna - den ska inte upprepas här.
	 */
	function scrollToPlaceMap(event: MouseEvent) {
		trackHomeCta('hero', 'se_platsen', PLACE_MAP_ANCHOR);

		const target = document.getElementById('map-title');
		if (!target) return;

		event.preventDefault();

		// Ingen behavior anges medvetet: app.css styr mjuk scroll via
		// html[data-smooth-scroll] bakom prefers-reduced-motion. Ett explicit
		// 'smooth' här hade kringgått båda grindarna.
		target.scrollIntoView({ block: 'start' });
		// preventScroll: fokus ska inte konkurrera med scrollen.
		target.focus({ preventScroll: true });
	}
</script>

<SEO canonical="https://mittpsyke.se/" />

{#if data.isSignedInHome}
	<SignedInHome overview={data.homeOverview} />
{:else}
<main class="home">
	<!-- 1. Hero -->
	<section class="home-hero" aria-labelledby="hero-title">
		<div class="home-inner hero-grid">
			<div class="hero-copy">
				<h1 id="hero-title">Skriv av dig. Se mönster över tid.</h1>
				<p class="lead">
					MittPsyke är ett digitalt stöd där du kan skriva, reflektera och följa hur du har det över
					tid. Det du väljer att spara finns kvar när du återvänder, så att återkommande tankar och
					förändringar blir lättare att upptäcka.
				</p>
				<div class="hero-actions">
					<a
						class="cta-primary"
						href={ANONYMOUS_WRITE_DESTINATION}
						onclick={() => trackHomeCta('hero', 'skriv_utan_konto', ANONYMOUS_WRITE_DESTINATION)}
					>
						Börja skriva
					</a>
					<a class="cta-secondary" href={PLACE_MAP_ANCHOR} onclick={scrollToPlaceMap}>
						Se platsen <span aria-hidden="true">↓</span>
					</a>
				</div>
				<!-- Ligger direkt under CTA-raden, där den sänker tröskeln för att
					 klicka. Samma sak stod tidigare i en egen sektion fem skärmar
					 längre ner, alltså långt efter att beslutet redan fattats.
					 Formuleringen är kontrollerad mot implementationen: anonyma
					 utkast skrivs bara till localStorage i diary-draft.ts och
					 skickas aldrig till servern. -->
				<p class="cta-micro">Inget konto behövs. Texten stannar i din webbläsare.</p>
				<p class="product-path" aria-label="Så fungerar det: skriv, spara det du vill och se vad som återkommer.">
					<span aria-hidden="true">Skriv → spara det du vill → se vad som återkommer</span>
				</p>
				<p class="promise">Du behöver inte prestera något här. Inget bryts om du är borta.</p>
				<!-- Gränsdragningen ("inte vård", 112) står samlad i trygghetssektionen
					 längre ner, och layoutens sidfot upprepar 112/1177 på varje sida. -->
			</div>

			<!-- Bara scenen. Stegkortet har flyttat till Kvällsstugan, så heron
				 bär stämning och inget ligger ovanpå personen, björnen eller
				 elden i någon bredd. -->
			<div class="hero-proof">
				<CabinProof variant="scene" priority />
			</div>
		</div>
	</section>

	<!-- 2. Så fungerar det. Ersätter de två tidigare sektionerna "Skillnaden mot
		 ett anteckningsblock" och "Efter ett tag syns mönstren", som sa halva
		 berättelsen var. Stegen är kontrollerade mot produkten: steg 2 säger vad
		 som gäller utan konto (GuestQuickEntry autosparar till localStorage,
		 diary-draft.ts) och med konto (inlägg sparas bara när du väljer det). -->
	<section class="home-section section-alt" aria-labelledby="how-title">
		<div class="home-inner">
			<div class="narrow">
				<h2 id="how-title">Fyra steg, och sedan börjar det om</h2>
				<p>
					I ett anteckningsblock ligger det du skrivit kvar, men du får själv leta upp det. Här möter
					det dig igen.
				</p>
			</div>
			<!-- role="list" behåller listsemantiken i Safari, som annars tappar den
				 när list-style tas bort. -->
			<ol class="place-map how-steps" role="list">
				<li>
					<h3>Skriv.</h3>
					<p>Några ord eller en hel sida. Det finns inget rätt sätt.</p>
				</li>
				<li>
					<h3>Spara det du vill.</h3>
					<p>Utan konto stannar texten i din webbläsare. Med konto sparar du det du väljer.</p>
				</li>
				<li>
					<h3>Kom tillbaka när du vill.</h3>
					<p>Ingenting börjar om för att det gått en tid.</p>
				</li>
				<li>
					<h3>Se vad som återkommer.</h3>
					<p>Dina egna ord sammanställda — ingen mätning av hur du sköter dig.</p>
				</li>
			</ol>
		</div>
	</section>

	<!-- 3. Platsens karta. Ligger efter stegen så besökaren först vet hur det
		 fungerar och sedan var det händer. -->
	<section class="home-section" aria-labelledby="map-title">
		<div class="home-inner">
			<div class="narrow">
				<!-- Mål för hero-ankaret. tabindex="-1" gör att tangentbordsfokus
					 faktiskt flyttas hit vid hopp - utan den scrollar sidan men
					 fokus står kvar i heron, så nästa Tab fortsätter från fel
					 ställe. Avståndet till den sticky headern kommer från
					 scroll-padding-top på html i app.css. -->
				<h2 id="map-title" tabindex="-1">Så ser platsen ut</h2>
				<p>
					Tre ställen, inte fler. Du behöver inte lära dig något system: det handlar om att skriva,
					svara kort när du orkar, och hitta tillbaka till det du lämnat.
				</p>
			</div>
			<ul class="place-map">
				<li>
					<h3>Mitt Hem</h3>
					<p>
						Din utgångspunkt. Det du skrivit, hur du haft det, allt samlat på ett ställe. Härifrån
						går du vidare dit du vill.
					</p>
				</li>
				<li>
					<h3>Kvällsstugan</h3>
					<p>
						En kort incheckning på kvällen: hur kvällen känns, några ord om du vill skriva dem, och
						vad du vill göra med det för ikväll. Inget måste besvaras.
					</p>
				</li>
				<li>
					<h3>Följeslagaren</h3>
					<p>
						Ett djur du väljer själv, ungefär som en profilbild – fast det syns i platsen när du
						loggar in. Det ber dig aldrig om något, och står kvar som du lämnade det.
					</p>
				</li>
			</ul>
			<!-- Chatten står utanför listan: den är ett verktyg, inte ett av de tre
				 ställena, så "Tre ställen, inte fler" stämmer fortfarande. Den ligger
				 som en fjärde rad i samma form, men får aldrig bära berättelsen. -->
			<div class="place-map-tool">
				<h3>Chatten</h3>
				<p>Vill du hellre prata fram tankarna finns en chatt. Du kan använda MittPsyke helt utan den.</p>
			</div>
		</div>
	</section>

	<!-- 4. Kvällsstugan -->
	<section class="home-section section-alt" aria-labelledby="evening-title">
		<div class="home-inner evening-inner">
			<div class="narrow">
				<h2 id="evening-title">En kort incheckning när dagen ska landa</h2>
				<p>
					Fyra steg, ett i taget, på någon minut. Det finns inget rätt svar, textrutan får lämnas
					tom, och ingenting sparas om du inte väljer att spara det. Du gör den i Kvällsstugan när
					du loggat in.
				</p>
			</div>
			<!-- Produktbeviset. Låg tidigare som överlägg i heron och doldes helt
				 under 1120px; här syns det i alla bredder, och interiörbilden är
				 redan sektionens scen så landskapet upprepas inte. -->
			<div class="evening-proof">
				<CabinProof variant="card" />
			</div>
			<figure class="evening-scene">
				<img
					srcset="/images/scenes/cabin-interior-evening-v1-800.webp 800w, /images/scenes/cabin-interior-evening-v1-1200.webp 1200w, /images/scenes/cabin-interior-evening-v1.webp 1672w"
					sizes="(max-width: 1129px) calc(100vw - 2.5rem), 1080px"
					src="/images/scenes/cabin-interior-evening-v1-1200.webp"
					alt="Inne i Kvällsstugan: en lampa lyser i en stuga och genom fönstret syns en sjö i skymningen."
					width="1672"
					height="941"
					loading="lazy"
					decoding="async"
				/>
			</figure>
			<div class="evening-actions">
				<a
					class="text-link"
					href={EVENING_CHECKIN_DESTINATION}
					onclick={() =>
						trackHomeCta('kvallsstugan', 'oppna_kvallsincheckningen', EVENING_CHECKIN_DESTINATION)}
				>
					Öppna kvällsincheckningen <span aria-hidden="true">→</span>
				</a>
				<!-- Stödlänken till Stödlinjer.se låg tidigare här. Akutvägarna står
					 nu samlade i trygghetssektionen längre ner. -->
			</div>
		</div>
	</section>

	<!-- Sektionen "Börja där du är" låg här. Den gick till samma destination som
		 hero-knappen och sa samma sak som mikrotexten under den, så den var en
		 ren dubblett. Integritetstexten (dataflowCopy.anonymousDiary.short) är
		 inte borttagen från sajten: den står kvar i sin fulla form på
		 /integritet, /anonym-dagbok-online, /skriv, /sa-fungerar-mittpsyke och
		 i dagbokens egen FAQ - alltså även på sidan besökaren landar på. -->

	<!-- 5. Läsning -->
	<section class="home-section" aria-labelledby="reading-title">
		<div class="home-inner narrow">
			<h2 id="reading-title">Guider när du behöver ord</h2>
			<p>Artiklar och övningar finns här om du hellre vill läsa än skriva just nu.</p>
			<a
				class="text-link"
				href="/guider"
				onclick={() => trackHomeCta('lasning', 'till_guiderna', '/guider')}
			>
				Till guiderna <span aria-hidden="true">→</span>
			</a>
		</div>
	</section>

	<!-- 6. Trygghet. Samlar det som tidigare stod på fyra ställen: heroens
		 gränsdragning, Kvällsstugans akutlänk och Bakom-sektionens avsändare och
		 säkerhetsstycke. Upprepningen är borta, inte säkerheten: 112, 1177 och
		 Stödlinjer.se står kvar, och layoutens sidfot upprepar 112/1177 på varje
		 sida. Avsändaren följer det sajten redan säger - "Svensk tjänst" och att
		 Stödlinjer.se drivs av samma avsändare. -->
	<section class="home-section section-behind" aria-labelledby="trust-title">
		<div class="home-inner narrow">
			<h2 id="trust-title">Vad det här är och inte är</h2>
			<p>
				MittPsyke är ett stöd för reflektion — inte vård, behandling, diagnos eller akuthjälp.
				Tjänsten är svensk och byggd av Robert Claesson, som också driver Stödlinjer.se.
			</p>
			<p class="safety">
				Vid akut fara: <a href="tel:112">112</a>. Vårdråd:
				<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Fler
				stödlinjer:
				<a href={SUPPORT_LINES_URL} target="_blank" rel="noopener noreferrer" onclick={() => trackHomeCta('bakom', 'stodlinjer', SUPPORT_LINES_URL)}>Stödlinjer.se</a>
			</p>
			<a class="text-link" href={PRIVACY_DESTINATION}>
				Så hanteras det du skriver <span aria-hidden="true">→</span>
			</a>
		</div>
	</section>

	<!-- 7. Avslutande CTA. Kontot erbjuds först här, efter att sidan förklarat
		 vad det ger. Mikrotexten är kontrollerad mot produkten: registreringen
		 visar gästens utkast, och med konto sparas inlägg så att de går att se
		 tillbaka på. Skrivandet utan konto är fortfarande den primära vägen. -->
	<section class="home-section section-alt" aria-labelledby="closing-title">
		<div class="home-inner narrow">
			<h2 id="closing-title">Börja med en mening</h2>
			<p>Du behöver inte veta vad du vill säga innan du börjar.</p>
			<div class="closing-actions">
				<a class="cta-primary" href={ANONYMOUS_WRITE_DESTINATION}>Börja skriva</a>
				<a class="cta-secondary" href={REGISTER_DESTINATION}>
					Skapa konto för att spara <span aria-hidden="true">→</span>
				</a>
			</div>
			<p class="cta-micro">Med konto kan du spara det du skrivit och se tillbaka på det senare.</p>
		</div>
	</section>
</main>
{/if}

<style>
	:global(:root) {
		--home-text-inverted: #f5f5f2;
		--home-text-strong: #eef1f6;
		--home-text-soft: #e0e4ea;
		--home-text-cool: #d7e7ff;
		--home-text-on-primary: #ffffff;
		--home-text-muted: rgba(220, 225, 235, 0.78);
		--home-text-muted-strong: rgba(220, 225, 235, 0.86);
		--home-text-blue-muted-strong: rgba(160, 185, 220, 0.92);
		/* Behålls trots att startsidan inte längre använder dem: MittHemTeaser
		   refererar dem, och de här variablerna definieras globalt här. */
		--home-text-muted-body: rgba(220, 225, 235, 0.74);
		--home-text-muted-faint: rgba(220, 225, 235, 0.7);
		--home-card-border-soft: rgba(148, 163, 184, 0.14);
		--home-primary-soft: rgba(var(--home-primary-rgb), 0.15);
		--home-primary-text: #7db4e8;
		--home-section-bg: #162236;
		--home-section-bg-soft: #141e2e;
		--home-section-bg-important: #1a2530;
		--home-dark-bg: #0e1826;
		--home-dark-bg-soft: #0d1520;
		--home-dark-bg-important: #080e16;
		/* Mörkad från #3a7bd5 så vit text på knappen når WCAG AA (4,5:1) — den
		   ursprungliga tonen gav bara 4,22:1. Ny kontrast: ~5:1. */
		--home-primary: #346fc0;
		--home-primary-rgb: 52, 111, 192;
		--home-link: #93c5fd;
		--home-cta-shadow: rgba(30, 58, 138, 0.18);
		--home-cta-shadow-hover: rgba(30, 58, 138, 0.22);
	}

	.home {
		width: 100%;
		color: var(--home-text-inverted);
	}

	/* Gemensam desktop-container. Under ~1280px viewport löser min() ut till
	   100%, så mobil och surfplatta beter sig exakt som förut. */
	.home-inner {
		width: min(1280px, 100%);
		margin: 0 auto;
	}

	.narrow {
		max-width: 46rem;
	}

	.home-hero,
	.home-section {
		padding: clamp(2.2rem, 6vw, 3.8rem) 1.25rem;
		background: var(--home-section-bg);
		color: var(--home-text-soft);
	}

	.section-alt {
		background: var(--home-section-bg-soft);
	}

	.section-behind {
		background: var(--home-section-bg-important);
	}

	h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 850;
		font-size: clamp(1.9rem, 4vw, 3rem);
		line-height: 1.06;
		letter-spacing: -0.025em;
		color: var(--home-text-inverted);
	}

	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.5rem, 3vw, 2.1rem);
		line-height: 1.12;
		letter-spacing: -0.02em;
		color: var(--home-text-strong);
	}

	.home-section p {
		margin: 0.8rem 0 0;
		font-size: 0.98rem;
		line-height: 1.65;
		color: var(--home-text-muted-strong);
	}

	.lead {
		margin: 1rem 0 0;
		max-width: 42ch;
		font-size: clamp(1rem, 1.7vw, 1.12rem);
		line-height: 1.65;
		color: var(--home-text-muted-strong);
	}

	/* Löftesraden ligger mellan ingressen och disclaimern i visuell tyngd: något
	   mindre och svagare än .lead, men tydligt starkare än .boundary. Marginalen
	   nedåt håller den fri från CTA-raden så de två små, dämpade raderna i heron
	   inte läses som ett block. */
	.promise {
		margin: 0.85rem 0 0.35rem;
		max-width: 42ch;
		font-size: 0.95rem;
		line-height: 1.6;
		color: rgba(220, 225, 235, 0.82);
	}

	.product-path {
		margin: 1rem 0 0;
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 650;
		line-height: 1.5;
		color: var(--home-text-cool);
	}

	/* ── Platsens karta ── */
	/* Ingen scroll-margin-top här: app.css sätter redan scroll-padding-top på
	   html för den sticky headern, safe-area inräknad. En marginal här hade
	   adderats ovanpå den och lagt rubriken dubbelt så långt ner. */

	/* Programmatiskt fokusmål, inte en kontroll - ingen synlig ring behövs när
	   fokus flyttas hit av ankaret. Rubriken är aldrig nåbar med Tab. */
	#map-title:focus {
		outline: none;
	}

	.place-map {
		display: grid;
		gap: clamp(1rem, 2.4vw, 1.5rem);
		margin: clamp(1.5rem, 3.4vw, 2.2rem) 0 0;
		padding: 0;
		list-style: none;
	}

	/* Medvetet utan ikoner, siffror och ramar: korten ska läsas som tre platser,
	   inte som en funktionslista. Linjen till vänster är hela markeringen. */
	.place-map li,
	.place-map-tool {
		padding-left: clamp(0.9rem, 1.6vw, 1.15rem);
		border-left: 1px solid rgba(148, 163, 184, 0.22);
	}

	/* Chatten som fjärde rad: samma form som ställena, men under dem och i
	   full bredd - ett verktyg bland flera, inte en fjärde plats. */
	.place-map-tool {
		margin-top: clamp(1rem, 2.4vw, 1.5rem);
	}

	.place-map h3,
	.place-map-tool h3 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.05rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--home-text-strong);
	}

	.place-map p,
	.place-map-tool p {
		margin: 0.45rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--home-text-muted);
	}

	@media (min-width: 760px) {
		.place-map {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	/* ── Så fungerar det ── */
	/* Återanvänder platskartans form. Fyra steg ryms inte i tre kolumner, så
	   de ligger två och två på mellanbredder och på en rad först när varje
	   steg får plats utan att texten bryts i smala remsor. Siffran gör
	   ordningen skanningsbar; den är dekor (ol:en bär numreringen) och
	   döljs därför för skärmläsare med alt-texten "". */
	.how-steps {
		counter-reset: how-step;
	}

	.how-steps li::before {
		counter-increment: how-step;
		content: counter(how-step) / '';
		display: block;
		margin-bottom: 0.3rem;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--home-text-cool);
	}

	@media (min-width: 760px) {
		.how-steps {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1100px) {
		.how-steps {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}
	}

	/* ── Hero ── */
	/* Heron får en egen, bredare container än övriga sektioner (1080px). Utan
	   den krympte proofen till en miniatyr på 1440/1920 medan sidorna fylldes
	   med tom yta. Taket ligger kvar långt under viewportbredden på stora
	   skärmar, så heron blir större utan att fylla hela ytan. */
	.home-hero .home-inner {
		width: min(1320px, 100%);
	}

	.hero-grid {
		display: grid;
		gap: clamp(1.6rem, 4vw, 2.5rem);
		align-items: center;
	}

	/* Läsbredden hålls kvar nära den tidigare (~506px) även när kolumnen växer,
	   så rubrik → ingress → CTA behåller sin hierarki. */
	.hero-copy {
		max-width: 30rem;
	}

	.hero-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.1rem;
		margin-top: 1.5rem;
	}

	.cta-primary,
	.cta-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		font-family: var(--font-heading);
		font-size: 0.92rem;
		font-weight: 700;
		border-radius: var(--radius-pill);
	}

	.cta-primary {
		padding: 0.7rem 1.35rem;
		background: var(--home-primary);
		color: var(--home-text-on-primary);
		box-shadow: 0 6px 18px var(--home-cta-shadow);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.cta-primary:hover,
	.cta-primary:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 8px 22px var(--home-cta-shadow-hover);
	}

	.cta-secondary {
		/* inline-flex kollapsar blankstegen mellan barnen, så pilen klistrade
		   i texten ("det↓"). Samma gap som .text-link använder. */
		gap: 0.4rem;
		padding: 0.7rem 0.25rem;
		color: var(--home-link);
		text-underline-offset: 3px;
	}

	/* Ligger under CTA-raden och ska läsas efter knappen, inte konkurrera med
	   den: minsta storleken i heron och samma dämpade ton som gränsdragningen. */
	.cta-micro {
		margin: 0.5rem 0 0;
		max-width: 42ch;
		font-size: 0.86rem;
		line-height: 1.55;
		color: var(--home-text-muted);
	}

	/* ── Avslutande CTA ── */
	/* Samma knappar som heron. Mikrotexten ligger i en .home-section, vars
	   styckestil annars skulle göra den lika stor som brödtexten. */
	.closing-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.75rem 1.1rem;
		margin-top: 1.4rem;
	}

	.home-section .cta-micro {
		margin-top: 0.6rem;
		font-size: 0.86rem;
		line-height: 1.55;
		color: var(--home-text-muted);
	}

	/* ── Gemensamma länkar ── */
	.text-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		min-height: 44px;
		margin-top: 0.9rem;
		color: var(--home-link);
		font-family: var(--font-heading);
		font-size: 0.92rem;
		font-weight: 650;
		text-underline-offset: 3px;
	}

	/* Vägen in i den riktiga incheckningen. Stödlänken som stod bredvid finns
	   nu i trygghetssektionen; raden behåller sin 44px träffyta. */
	.evening-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0 1.75rem;
	}

	.evening-actions .text-link {
		margin-top: 0.9rem;
	}

	.evening-scene {
		margin-top: 1.5rem;
		margin-bottom: 0;
		overflow: hidden;
		border: 1px solid rgb(92 72 47 / 0.34);
		border-radius: 1.2rem;
		background: #17110e;
	}

	.evening-scene img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: cover;
	}

	.safety {
		max-width: 72ch;
		font-size: 0.9rem;
		color: var(--home-text-muted);
	}

	.section-behind a {
		color: var(--home-text-cool);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ── Responsivt ── */
	@media (min-width: 900px) {
		.hero-grid {
			grid-template-columns: minmax(0, 2fr) minmax(0, 3fr);
			gap: clamp(2rem, 3vw, 2.75rem);
		}

		/* Textsektionerna låg tidigare som en 46rem-kolumn centrerad i
		   viewporten - på 1440/1920 blev det en mobilstrimma i en tom yta.
		   Här delas de i stället upp redaktionellt: rubriken i en egen vänster-
		   kolumn, brödtext och länk till höger. Ytan används av layouten, inte
		   av längre rader. */
		.home-section .home-inner.narrow {
			max-width: none;
			display: grid;
			grid-template-columns: minmax(0, 24rem) minmax(0, 1fr);
			column-gap: clamp(2rem, 4vw, 4rem);
			align-items: start;
		}

		.home-section .home-inner.narrow > h2 {
			grid-column: 1;
			grid-row: 1;
		}

		.home-section .home-inner.narrow > :not(h2) {
			grid-column: 2;
		}

		/* Första stycket ska ligga i linje med rubrikens överkant. */
		.home-section .home-inner.narrow > p:first-of-type {
			margin-top: 0;
		}

		/* Raderna hålls läsbara även när kolumnen är bred. Tidigare gav
		   .narrow (46rem) ~94 tecken per rad; 62ch ger ~75. Kortare, inte längre. */
		.home-section p {
			max-width: 62ch;
		}

		/* Kvällsstugan: texten och den befintliga stugbilden sida vid sida i
		   stället för bild staplad under en smal textklump. */
		.evening-inner {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
			column-gap: clamp(2rem, 4vw, 3.5rem);
			align-items: center;
		}

		.evening-inner > .narrow {
			grid-column: 1;
			grid-row: 1;
			max-width: none;
		}

		/* Stegkortet under texten, i samma kolumn. Interiörbilden till höger är
		   sektionens scen och spänner nu över alla tre raderna. */
		.evening-inner > .evening-proof {
			grid-column: 1;
			grid-row: 2;
			margin-top: 1.25rem;
		}

		.evening-inner > .evening-actions {
			grid-column: 1;
			grid-row: 3;
		}

		.evening-inner > .evening-actions .text-link {
			margin-top: 1.1rem;
		}

		.evening-inner > .evening-scene {
			grid-column: 2;
			grid-row: 1 / span 3;
			margin-top: 0;
		}
	}

	/* Under brytpunkten är .evening-inner vanligt blockflöde: text, stegkort,
	   stödlänkar. Marginalen sätts här eftersom grid-gap inte gäller då. */
	@media (max-width: 899px) {
		.evening-proof {
			margin-top: 1.25rem;
		}

		/* Interiörbilden döljs på smal skärm - stegkortet ovanför är sektionens
		   produktinnehåll och ska inte behöva samsas med en andra bild.
		   Produktbeviset självt döljs aldrig i någon bredd. */
		.evening-scene {
			display: none;
		}
	}

	/* ── Dark mode — basen är redan mörk, fördjupa bara något ── */
	:global(.dark) .home-hero { background: var(--home-dark-bg); }
	:global(.dark) .home-section { background: var(--home-dark-bg); }
	:global(.dark) .section-alt { background: var(--home-dark-bg-soft); }
	:global(.dark) .section-behind { background: var(--home-dark-bg-important); }
</style>
