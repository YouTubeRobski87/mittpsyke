<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import CabinProof from '$lib/components/home/CabinProof.svelte';
	import { trackHomeCtaClick } from '$lib/analytics';
	import { trackTikTokButtonClick } from '$lib/analytics/tiktokPixel';

	// Anonyma skrivytan är kvar som destination - den är ett val inne i
	// produkten, inte startsidans löfte.
	const ANONYMOUS_WRITE_DESTINATION = '/dagbok?action=new';
	const CREATE_PLACE_DESTINATION = '/register';
	// Befintlig, korrekt stödväg. ASCII-värdnamn - aldrig ö i hostname och
	// aldrig punycode-varianten från PDF-exporten.
	const SUPPORT_LINES_URL = 'https://stodlinjer.se';

	function trackHomeCta(section: string, cta: string, href: string) {
		trackHomeCtaClick({ section, cta, href });
		// TikTok-pixeln följer det anonyma skrivandet, oavsett vilken sektion
		// det startas från.
		if (cta === 'skriv_utan_konto') {
			trackTikTokButtonClick('start_writing_anonymously');
		}
	}
</script>

<SEO canonical="https://www.mittpsyke.se/" />

<main class="home">
	<!-- 1. Hero -->
	<section class="home-hero" aria-labelledby="hero-title">
		<div class="home-inner hero-grid">
			<div class="hero-copy">
				<p class="eyebrow">En plats att återvända till</p>
				<h1 id="hero-title">MittPsyke är en lugn plats för dig.</h1>
				<p class="lead">
					Skriv, checka in och följ hur du har det. Platsen förändras med dig. Följeslagaren sitter
					kvar.
				</p>
				<div class="hero-actions">
					<a
						class="cta-primary"
						href={CREATE_PLACE_DESTINATION}
						onclick={() => trackHomeCta('hero', 'skapa_din_plats', CREATE_PLACE_DESTINATION)}
					>
						Skapa din plats
					</a>
					<a
						class="cta-secondary"
						href={ANONYMOUS_WRITE_DESTINATION}
						onclick={() => trackHomeCta('hero', 'skriv_utan_konto', ANONYMOUS_WRITE_DESTINATION)}
					>
						Skriv först, utan konto
					</a>
				</div>
				<p class="boundary">Inte vård. Inte behandling. Inte akuthjälp. Vid fara: <a href="tel:112">112</a>.</p>
			</div>

			<div class="hero-proof">
				<CabinProof variant="hero" priority />
			</div>
		</div>
	</section>

	<!-- 2. Följeslagaren -->
	<section class="home-section section-alt" aria-labelledby="companion-title">
		<div class="home-inner narrow">
			<h2 id="companion-title">Någon sitter kvar</h2>
			<p>
				Björn är kvar där du lämnade honom. Inte en tråd som börjar om. Du skriver när du vill.
				Platsen minns det du valt att spara.
			</p>
			<a
				class="text-link"
				href="/om-mittpsyke"
				onclick={() => trackHomeCta('foljeslagaren', 'sa_fungerar_platsen', '/om-mittpsyke')}
			>
				Så fungerar platsen <span aria-hidden="true">→</span>
			</a>
		</div>
	</section>

	<!-- 3. Kvällsstugan -->
	<section class="home-section" aria-labelledby="evening-title">
		<div class="home-inner">
			<div class="narrow">
				<h2 id="evening-title">En stund där dagen får landa</h2>
				<p>
					Ett steg i taget. Hur är det ikväll. Inget rätt eller fel. Svaren sparas bara om du väljer
					det.
				</p>
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
			<a
				class="text-link"
				href={SUPPORT_LINES_URL}
				target="_blank"
				rel="noopener noreferrer"
				onclick={() => trackHomeCta('kvallsstugan', 'akut_stod', SUPPORT_LINES_URL)}
			>
				Behöver du akut stöd?
			</a>
		</div>
	</section>

	<!-- 4. Över tid -->
	<section class="home-section section-alt" aria-labelledby="over-time-title">
		<div class="home-inner narrow">
			<h2 id="over-time-title">Det du skrivit hör ihop</h2>
			<p>
				Teman ur dina egna texter. Humör du själv satt, från tungt till ljusare. Observationer ur din
				data, inte en bedömning.
			</p>
		</div>
	</section>

	<!-- 5. När du vill skriva utan konto -->
	<section class="home-section" aria-labelledby="anonymous-title">
		<div class="home-inner narrow">
			<h2 id="anonymous-title">Börja där du är</h2>
			<p>
				Inget konto krävs för att skriva av dig. Texten stannar på din enhet tills du väljer något
				annat. Skapa en plats den dag du vill att den ska finnas kvar.
			</p>
			<a
				class="text-link"
				href={ANONYMOUS_WRITE_DESTINATION}
				onclick={() => trackHomeCta('utan_konto', 'skriv_utan_konto', ANONYMOUS_WRITE_DESTINATION)}
			>
				Skriv utan konto <span aria-hidden="true">→</span>
			</a>
		</div>
	</section>

	<!-- 6. Chatten, som funktion -->
	<section class="home-section section-alt" aria-labelledby="chat-title">
		<div class="home-inner narrow">
			<h2 id="chat-title">Hjälp att sortera, när du vill ha det</h2>
			<p>
				Chatten hjälper dig att sortera tankarna i stunden. Det du väljer att spara kan bli en del av
				det du återvänder till. Chatten är ett verktyg i MittPsyke, inte hela platsen.
			</p>
		</div>
	</section>

	<!-- 7. Läsning -->
	<section class="home-section" aria-labelledby="reading-title">
		<div class="home-inner narrow">
			<h2 id="reading-title">Guider när du behöver ord</h2>
			<p>Artiklar och övningar finns om du vill läsa först. De är stöd, inte produkten.</p>
			<a
				class="text-link"
				href="/guider"
				onclick={() => trackHomeCta('lasning', 'till_guiderna', '/guider')}
			>
				Till guiderna <span aria-hidden="true">→</span>
			</a>
		</div>
	</section>

	<!-- 8. Bakom -->
	<section class="home-section section-behind" aria-labelledby="behind-title">
		<div class="home-inner narrow">
			<h2 id="behind-title">Bakom</h2>
			<p>
				MittPsyke är byggt av Robert Claesson. Svensk tjänst. En plats att återvända till när du
				behöver någonstans att landa.
			</p>
			<p>
				<a href={SUPPORT_LINES_URL} target="_blank" rel="noopener noreferrer" onclick={() => trackHomeCta('bakom', 'stodlinjer', SUPPORT_LINES_URL)}>Stödlinjer.se</a>
				drivs av samma avsändare. Där finns nummer till 112, 1177 och stödlinjer.
			</p>
			<p class="safety">
				MittPsyke är ett stöd för reflektion – inte vård, behandling, diagnos eller akuthjälp. Vid
				akut fara: <a href="tel:112">112</a>. För vårdråd:
				<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Vidare
				stöd: <a href={SUPPORT_LINES_URL} target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>.
				<a href="/om-mittpsyke" onclick={() => trackHomeCta('bakom', 'om_mittpsyke', '/om-mittpsyke')}>Om MittPsyke</a>
				och <a href="/integritet">integritet</a>.
			</p>
		</div>
	</section>
</main>

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

	.home-inner {
		width: min(1080px, 100%);
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

	.eyebrow {
		margin: 0 0 0.5rem;
		font-family: var(--font-heading);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--home-text-blue-muted-strong);
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
		padding: 0.7rem 0.25rem;
		color: var(--home-link);
		text-underline-offset: 3px;
	}

	.boundary {
		margin: 1.15rem 0 0;
		max-width: 46ch;
		font-size: 0.88rem;
		line-height: 1.6;
		color: var(--home-text-muted);
	}

	.boundary a {
		color: var(--home-text-cool);
		text-decoration: underline;
		text-underline-offset: 3px;
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
	}

	@media (max-width: 759px) {
		/* Den breda originalbilden behöver lite extra höjd på smala skärmar för
		   att fortfarande kännas som en plats, inte som en tunn bildremsa. */
		.evening-scene img {
			height: max(12.5rem, 56.25vw);
			aspect-ratio: auto;
			object-fit: cover;
		}
	}

	/* ── Dark mode — basen är redan mörk, fördjupa bara något ── */
	:global(.dark) .home-hero { background: var(--home-dark-bg); }
	:global(.dark) .home-section { background: var(--home-dark-bg); }
	:global(.dark) .section-alt { background: var(--home-dark-bg-soft); }
	:global(.dark) .section-behind { background: var(--home-dark-bg-important); }
</style>
