<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import AccountValuePreview from '$lib/components/home/AccountValuePreview.svelte';
	import {
		trackHomeCtaClick,
		trackScrollToHowItWorks
	} from '$lib/analytics';
	import { trackTikTokButtonClick } from '$lib/analytics/tiktokPixel';
	import { storeHeroChatHandoff } from '$lib/chat-handoff';
	import { writeDiaryDraftHandoff } from '$lib/diary-draft';

	type HomePageData = {
		contentStats?: {
			guideCount: number;
		};
	};

	const DIARY_START_DESTINATION = '/dagbok?action=new';

	let { data }: { data: HomePageData } = $props();
	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;
	let quickFlowEl: HTMLElement | null = null;
	let heroDraft = $state('');

	function submitHeroQuickStart(event: SubmitEvent) {
		event.preventDefault();
		const text = heroDraft.trim();
		if (!text) return;

		// Texten lämnas över till den anonyma skrivytan i dagboken. Överlämningen
		// ligger i sessionStorage och konsumeras där en gång, så den kan inte bli
		// ett andra utkast vid sidan av det riktiga.
		writeDiaryDraftHandoff(text);

		trackHomeCta('hero', 'borja_skriva', DIARY_START_DESTINATION);
		goto(DIARY_START_DESTINATION);
	}

	function handleHeroChatClick() {
		// Chatten är kvar som ett fullt fungerande andraval. Har användaren redan
		// skrivit något följer texten med in i chattingången i stället för att
		// försvinna — men den skickas aldrig automatiskt.
		const text = heroDraft.trim();
		if (text) {
			storeHeroChatHandoff(text);
		}
		trackHomeCta('hero', 'oppna_chatten', '/chat');
	}

	const trustHighlights = [
		{
			text: 'Börja anonymt utan konto.',
			href: '/chatta-anonymt',
			trackCta: 'chatta_anonymt_utan_konto'
		},
		{
			text: 'Skapa konto först om du vill spara och följa ditt mående.',
			href: '/integritet',
			trackCta: 'integritet'
		}
	];

	// Mitt Hem-showcase: samma vy vid sjön genom dygnet och året. Rena
	// stämningsbilder — ingen räknare, ingen progress, ingen CTA. Blocket ska
	// läsas som ett löfte.
	const homeShowcaseScenes = [
		{
			src: '/assets/home/hem-rav-morgon-720.webp',
			label: 'Morgon',
			alt: 'Räven vilar under trädet vid sjön medan solen går upp över bergen.'
		},
		{
			src: '/assets/home/hem-rav-var-720.webp',
			label: 'Vår',
			alt: 'Samma plats om våren. Räven ligger i en äng av blommor vid den lugna sjön.'
		},
		{
			src: '/assets/home/hem-rav-host-720.webp',
			label: 'Höst',
			alt: 'Samma plats om hösten. Trädet har gula löv och räven vilar i kvällssolen.'
		},
		{
			src: '/assets/home/hem-rav-vinter-720.webp',
			label: 'Vinter',
			alt: 'Samma plats om vintern. Snö över marken och norrsken över den frusna sjön.'
		}
	];

	const productSteps = [
		{ number: '01', title: 'Skriv', text: 'Sätt ord på det som är nära just nu.' },
		{ number: '02', title: 'Sortera', text: 'Möt lugna frågor som hjälper dig vidare.' },
		{ number: '03', title: 'Spara när du vill', text: 'Behåll reflektionen om du har konto.' },
		{ number: '04', title: 'Följ', text: 'Se anteckningar och mående samlat över tid.' }
	];

	const beyondChatPoints = [
		'En plats för dina anteckningar, inte en tråd som försvinner',
		'Reflektioner du kan återvända till',
		'Mående och teman samlat över tid',
		'Svensk tjänst med tydliga gränser för vad den är'
	];

	const guideTopics = [
		{ label: 'Ångest', href: '/guider/angest' },
		{ label: 'Stress', href: '/guider/stress' },
		{ label: 'Sömn', href: '/guider/sovproblem' },
		{ label: 'Depression', href: '/guider/depression' },
		{ label: 'Trauma', href: '/guider/trauma' }
	];

	function trackHomeCta(section: string, cta: string, href: string) {
		trackHomeCtaClick({ section, cta, href });
		if (cta === 'borja_skriva' || cta === 'borja_skriva_anonymt_nu') {
			trackTikTokButtonClick('start_writing_anonymously');
		}
	}

	onMount(() => {
		let observer: IntersectionObserver | null = null;
		let hasTrackedHowItWorks = false;

		if (quickFlowEl) {
			observer = new IntersectionObserver(
				(entries) => {
					if (hasTrackedHowItWorks || !entries.some((entry) => entry.isIntersecting)) return;
					hasTrackedHowItWorks = true;
					trackScrollToHowItWorks();
					observer?.disconnect();
				},
				{ threshold: 0.35 }
			);
			observer.observe(quickFlowEl);
		}

		if (!heroEl || !bgEl) {
			return () => observer?.disconnect();
		}
		if (window.innerWidth < 768 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
			return () => observer?.disconnect();
		}

		const speed = 0.14;
		const maxOffset = 24;
		let ticking = false;

		const update = () => {
			const y = window.scrollY || window.pageYOffset;
			const offset = Math.max(-maxOffset, Math.min(maxOffset, y * speed));
			bgEl!.style.transform = `translate3d(0, ${offset}px, 0)`;
			ticking = false;
		};

		const onScroll = () => {
			if (ticking) return;
			ticking = true;
			window.requestAnimationFrame(update);
		};

		update();
		window.addEventListener('scroll', onScroll, { passive: true });

		return () => {
			observer?.disconnect();
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<SEO canonical="https://www.mittpsyke.se/" />

<main class="staging-look">
	<!-- 1. Hero -->
	<section class="hero-section hero" aria-label="Introduktion till MittPsyke" bind:this={heroEl}>
		<picture class="hero-picture">
			<source
				type="image/webp"
				srcset="/assets/home/rav-tryggplats-hero-720.webp 720w, /assets/home/rav-tryggplats-hero-1200.webp 1200w, /assets/home/rav-tryggplats-hero-1695.webp 1695w"
				sizes="100vw"
			/>
			<img
				class="hero-bg"
				bind:this={bgEl}
				src="/assets/home/rav-tryggplats-hero-1200.webp"
				alt=""
				width="1200"
				height="657"
				aria-hidden="true"
				decoding="async"
				fetchpriority="high"
			/>
		</picture>
		<!-- Ett mjukt skimmer över vattnet. Ska inte dra uppmärksamhet: låg
		     opacitet, långsam cykel, och helt av vid reduced motion och på mobil. -->
		<span class="hero-shimmer" aria-hidden="true"></span>
		<div class="hero-shell">
			<div class="hero-content">
				<h1>En plats som väntar på dig</h1>
				<p>
					Räven sitter vid sjön, oavsett hur länge du är borta. Skriv anonymt, utan konto. Texten
					stannar på din enhet tills du väljer något annat.
				</p>

				<form class="hero-quick-start" onsubmit={submitHeroQuickStart}>
					<label for="hero-quick-start-input" class="hero-quick-start-label">Vad tänker du på just nu?</label>
					<textarea
						id="hero-quick-start-input"
						bind:value={heroDraft}
						class="hero-quick-start-input"
						rows="3"
						required
						placeholder="Några rader räcker."
						aria-describedby="hero-quick-start-hint"
					></textarea>
					<p id="hero-quick-start-hint" class="hero-quick-start-hint">
						Inget skickas någonstans förrän du väljer det.
					</p>
					<button type="submit" class="hero-quick-start-submit" disabled={!heroDraft.trim()}>
						Börja skriva
					</button>
				</form>

				<div class="hero-secondary-actions">
					<a href="/chat" class="context-link" onclick={handleHeroChatClick}>
						Hellre ett samtal? Öppna chatten
					</a>
				</div>
			</div>
		</div>
	</section>

	<!-- 2. Mitt Hem — showcase. Stämning, inte uppmaning: ingen räknare,
	     ingen progress, medvetet ingen CTA. -->
	<section class="home-showcase" aria-labelledby="home-showcase-title">
		<div class="cards-narrow home-showcase-inner">
			<div class="section-heading">
				<p class="section-eyebrow">Mitt Hem</p>
				<h2 id="home-showcase-title">Mer än en anteckning</h2>
				<p>
					Din plats förändras i takt med dygnet och årstiderna, precis som du. Räven finns kvar där
					du lämnade den.
				</p>
			</div>
			<ul class="home-showcase-strip">
				{#each homeShowcaseScenes as scene}
					<li class="home-showcase-scene">
						<figure>
							<img
								src={scene.src}
								alt={scene.alt}
								width="720"
								height="360"
								loading="lazy"
								decoding="async"
							/>
							<figcaption>{scene.label}</figcaption>
						</figure>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- B. Så fungerar det. Verkliga produktsteg, utan exempeldata -->
	<section id="sa-fungerar-det" class="product-demo" aria-labelledby="product-demo-title" bind:this={quickFlowEl}>
		<div class="cards-narrow product-demo-inner">
			<div class="section-heading">
				<p class="section-eyebrow">Så fungerar det</p>
				<h2 id="product-demo-title">Från första rad till egen överblick</h2>
			</div>
			<figure class="product-flow">
				<ol class="product-flow-grid">
					{#each productSteps as step}
						<li class="product-flow-step">
							<span class="product-flow-number" aria-hidden="true">{step.number}</span>
							<div>
								<h3>{step.title}</h3>
								<p>{step.text}</p>
							</div>
						</li>
					{/each}
				</ol>
				<figcaption>Ingen användardata visas här.</figcaption>
			</figure>
			<a class="context-link" href="/dagbok?action=new" onclick={() => trackHomeCta('product_demo', 'borja_skriva', '/dagbok?action=new')}>Börja skriva <span aria-hidden="true">→</span></a>
		</div>
	</section>

	<!-- C. Kontot gör det möjligt att följa det som växer fram över tid. -->
	<AccountValuePreview />

	<!-- D. Skillnaden mot en vanlig AI-chatt -->
	<section class="beyond-chat" aria-labelledby="beyond-chat-title">
		<div class="cards-narrow beyond-chat-inner">
			<div class="section-heading">
				<p class="section-eyebrow">Mer än en AI-chatt</p>
				<h2 id="beyond-chat-title">Varför inte bara en AI-chatt?</h2>
				<p>
					En AI-chatt börjar om varje gång. MittPsyke är byggt som en dagbok: det du skriver hör
					ihop, i din takt, på ett ställe som är ditt. Du får hjälp att sortera tankar när du vill ha
					det, men det du skrivit finns kvar även när samtalet är slut.
				</p>
			</div>
			<ul class="beyond-chat-list">
				{#each beyondChatPoints as point}
					<li>{point}</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- E. Förtroende: grundare, verifierat innehållsmått, integritet och vårdgräns -->
	<section class="early-trust" aria-labelledby="early-trust-title">
		<div class="cards-narrow early-trust-inner">
			<p class="early-trust-eyebrow">Trygg start</p>
			<h2 id="early-trust-title">Bakom MittPsyke</h2>
			<p class="early-trust-intro">
				MittPsyke är byggt av Robert Claesson, som själv har erfarenhet av psykisk ohälsa och saknade
				en lugn plats att skriva på när vården kändes långt borta. Det är en svensk tjänst, byggd för
				att kännas trygg att återvända till.
			</p>
			<ul class="early-trust-grid">
				{#each trustHighlights as item}
					<li>
						<a class="early-trust-item" href={item.href} onclick={() => trackHomeCta('early_trust', item.trackCta, item.href)}>{item.text}</a>
					</li>
				{/each}
				{#if data.contentStats}
					<li>
						<a class="early-trust-item" href="/guider" onclick={() => trackHomeCta('early_trust', 'guider', '/guider')}>
							<strong>{data.contentStats.guideCount}</strong> publicerade guider att läsa i din takt.
						</a>
					</li>
				{/if}
			</ul>
			<p class="early-trust-note">
				MittPsyke är ett stöd för reflektion – inte vård, behandling, diagnos eller akuthjälp.
				Vid akut fara: <a href="tel:112">112</a>. För vårdråd:
				<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Vidare stöd:
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>.
				<a href="/om-mittpsyke" onclick={() => trackHomeCta('early_trust', 'om_mittpsyke', '/om-mittpsyke')}>Om MittPsyke</a> och
				<a href="/integritet">integritet</a>.
			</p>
		</div>
	</section>

	<!-- F. Guider och artiklar. Sekundärt, efter kärnprodukten -->
	<section id="innehall" class="how-it-works" aria-labelledby="how-it-works-title">
		<div class="cards-narrow how-inner">
			<h2 id="how-it-works-title">Läs och hitta vidare stöd</h2>
			<nav class="content-links" aria-label="Innehåll">
				<a class="how-card-cta" href="/guider" onclick={() => trackHomeCta('how_it_works', 'guider', '/guider')}>Se guider</a>
				<a class="how-card-cta" href="/ovningar" onclick={() => trackHomeCta('how_it_works', 'ovningar', '/ovningar')}>Se övningar</a>
				<a class="how-card-cta" href="/blogg" onclick={() => trackHomeCta('how_it_works', 'artiklar', '/blogg')}>Läs artiklar</a>
			</nav>
			<nav class="topic-links" aria-label="Vanliga ämnen">
				{#each guideTopics as topic}
					<a href={topic.href} onclick={() => trackHomeCta('guide_topics', topic.label.toLowerCase(), topic.href)}>{topic.label}</a>
				{/each}
			</nav>
		</div>
	</section>

	<!-- G. Slutlig CTA -->
	<section class="important-section final-cta" aria-labelledby="final-cta-title">
		<div class="cards-narrow important-inner final-cta-inner">
			<h2 id="final-cta-title">Börja där du är</h2>
			<p>Du behöver inte ha rätt ord. Vi tar det i din takt.</p>
			<div class="final-cta-actions">
				<a href="/dagbok?action=new" class="hero-cta hero-cta-primary" onclick={() => trackHomeCta('final_cta', 'borja_skriva', '/dagbok?action=new')}>Börja skriva</a>
				<a href="/register" class="final-secondary-link" onclick={() => trackHomeCta('final_cta', 'skapa_konto', '/register')}>Skapa konto</a>
			</div>
		</div>
	</section>
</main>

<style>
	:global(:root) {
		--home-text-inverted: #f5f5f2;
		--home-text-strong: #eef1f6;
		--home-text-soft: #e0e4ea;
		--home-text-cool: #d7e7ff;
		--home-text-review: #f3f8fd;
		--home-text-on-primary: #ffffff;
		--home-text-muted: rgba(220, 225, 235, 0.78);
		--home-text-muted-bright: rgba(220, 225, 235, 0.9);
		--home-text-muted-strong: rgba(220, 225, 235, 0.86);
		--home-text-muted-mid: rgba(220, 225, 235, 0.82);
		--home-text-muted-body: rgba(220, 225, 235, 0.74);
		--home-text-muted-soft: rgba(220, 225, 235, 0.72);
		--home-text-muted-faint: rgba(220, 225, 235, 0.7);
		--home-text-blue-muted: rgba(160, 185, 220, 0.9);
		--home-text-blue-muted-strong: rgba(160, 185, 220, 0.92);
		--home-section-bg: #162236;
		--home-section-bg-soft: #141e2e;
		--home-section-bg-alt: #1b2b3a;
		--home-section-bg-important: #1a2530;
		--home-dark-bg: #0e1826;
		--home-dark-bg-soft: #0d1520;
		--home-dark-bg-alt: #0a1018;
		--home-dark-bg-important: #080e16;
		/* Mörkad från #3a7bd5 så vit text på knappen når WCAG AA (4,5:1) — den
		   ursprungliga tonen gav bara 4,22:1. Ny kontrast: ~5:1. */
		--home-primary: #346fc0;
		--home-primary-rgb: 52, 111, 192;
		--home-primary-soft: rgba(var(--home-primary-rgb), 0.15);
		--home-primary-text: #7db4e8;
		--home-link: #93c5fd;
		--home-card-border: rgba(148, 163, 184, 0.12);
		--home-card-border-soft: rgba(148, 163, 184, 0.14);
		--home-card-border-hover: rgba(148, 163, 184, 0.28);
		--home-card-border-blue: rgba(147, 197, 253, 0.34);
		--home-card-bg-accent: rgba(15, 118, 110, 0.12);
		--home-card-bg-accent-soft: rgba(15, 118, 110, 0.1);
		--home-card-bg-accent-alt: rgba(99, 102, 241, 0.12);
		--home-card-bg-start: rgba(15, 23, 42, 0.98);
		--home-card-bg-start-soft: rgba(15, 23, 42, 0.96);
		--home-card-bg-end: rgba(2, 6, 23, 0.98);
		--home-card-shadow: rgba(15, 23, 42, 0.22);
		--home-card-text: rgba(238, 241, 246, 0.92);
		--home-hero-accent: rgba(76, 122, 150, 0.18);
		--home-hero-overlay-start: rgba(14, 22, 33, 0.65);
		--home-hero-overlay-mid: rgba(14, 22, 33, 0.85);
		--home-hero-overlay-end: rgba(14, 22, 33, 0.95);
		--home-hero-text: rgba(255, 255, 255, 0.9);
		--home-hero-note: rgba(255, 255, 255, 0.72);
		--home-quote-text: rgba(255, 255, 255, 0.88);
		--home-quote-cite: rgba(255, 255, 255, 0.5);
		--home-trust-border: rgba(255, 255, 255, 0.25);
		--home-trust-divider: rgba(255, 255, 255, 0.12);
		--home-trust-fact: rgba(255, 255, 255, 0.84);
		--home-cta-shadow: rgba(30, 58, 138, 0.18);
		--home-cta-shadow-hover: rgba(30, 58, 138, 0.22);
	}

	.staging-look {
		width: 100%;
		color: var(--home-text-inverted);
	}

	/* ── Hero ── */
	.hero-section {
		min-height: 65vh;
		display: grid;
		place-items: center;
		padding: 2rem 1.25rem;
	}

	.hero {
		position: relative;
		overflow: hidden;
	}

	.hero-picture {
		position: absolute;
		inset: 0;
		z-index: 0;
		pointer-events: none;
	}

	.hero-picture img {
		width: 100%;
		object-fit: cover;
		object-position: 42% center;
		filter: saturate(0.75) brightness(0.85) contrast(1.05);
	}

	.hero-bg {
		position: absolute;
		left: 0;
		top: -24px;
		height: calc(100% + 48px);
		transform: translate3d(0, 0, 0);
		will-change: transform;
		pointer-events: none;
		display: block;
		z-index: 0;
	}

	.hero::before {
		content: '';
		position: absolute;
		inset: 0;
		background:
			linear-gradient(
				90deg,
				rgba(9, 17, 27, 0.58) 0%,
				rgba(9, 17, 27, 0.48) 42%,
				rgba(9, 17, 27, 0.2) 66%,
				rgba(9, 17, 27, 0.08) 100%
			),
			radial-gradient(
				800px 400px at 50% 20%,
				var(--home-hero-accent),
				transparent 60%
			),
			linear-gradient(
				180deg,
				var(--home-hero-overlay-start) 0%,
				var(--home-hero-overlay-mid) 60%,
				var(--home-hero-overlay-end) 100%
			);
		pointer-events: none;
		z-index: 1;
	}

	/* Skimret ligger över hero-överlägget men under innehållet. Positionen är
	   satt mot vattenytan i hero-bilden, inte mot en exakt pixel. */
	.hero-shimmer {
		position: absolute;
		left: 2%;
		top: 66%;
		width: 52%;
		height: 22%;
		z-index: 1;
		pointer-events: none;
		border-radius: 50%;
		background: linear-gradient(
			100deg,
			transparent 8%,
			rgba(255, 247, 225, 0.5) 38%,
			rgba(226, 240, 255, 0.34) 58%,
			transparent 88%
		);
		filter: blur(14px);
		mix-blend-mode: soft-light;
		opacity: 0;
		will-change: transform, opacity;
		animation: heroShimmer 17s ease-in-out infinite;
	}

	@keyframes heroShimmer {
		0%,
		100% {
			opacity: 0;
			transform: translate3d(-6%, 0, 0) scaleX(0.94);
		}
		38% {
			opacity: 0.45;
		}
		62% {
			opacity: 0.34;
		}
		90% {
			opacity: 0;
			transform: translate3d(7%, -1%, 0) scaleX(1.06);
		}
	}

	.hero-shell {
		position: relative;
		z-index: 2;
		width: min(1280px, 100%);
		display: grid;
		grid-template-columns: 1fr;
		justify-items: center;
		align-items: center;
		gap: clamp(1.5rem, 5vw, 3.5rem);
	}

	.hero-content {
		justify-self: center;
		align-self: start;
		width: min(640px, 100%);
		text-align: center;
		padding: 0;
	}

	h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 850;
		font-size: clamp(2rem, 3.9vw, 3.2rem);
		line-height: 1.05;
		letter-spacing: -0.025em;
	}

	.hero-content p {
		margin: 0.95rem auto 0;
		max-width: 45ch;
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 1.7vw, 1.15rem);
		line-height: 1.65;
		letter-spacing: -0.005em;
		color: var(--home-hero-text);
	}

.hero-quick-start {
		margin: 1.4rem auto 0;
		max-width: 480px;
		display: grid;
		gap: 0.5rem;
		text-align: left;
	}

	.hero-quick-start-label {
		font-family: var(--font-heading);
		font-size: 0.85rem;
		font-weight: 650;
		color: var(--home-hero-text);
	}

	.hero-quick-start-input {
		width: 100%;
		min-height: 4.5rem;
		resize: vertical;
		border-radius: 14px;
		border: 1px solid rgba(255, 255, 255, 0.28);
		background: rgba(8, 16, 29, 0.55);
		color: var(--home-text-inverted);
		padding: 0.7rem 0.85rem;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.55;
		box-sizing: border-box;
	}

	.hero-quick-start-input::placeholder {
		color: rgba(245, 245, 242, 0.55);
	}

	.hero-quick-start-input:focus-visible {
		outline: 2px solid var(--home-primary);
		outline-offset: 2px;
	}

	.hero-quick-start-hint {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--home-text-muted);
	}

	.hero-quick-start-submit {
		justify-self: start;
		padding: 0.65rem 1.2rem;
		border-radius: var(--radius-pill);
		border: none;
		background: var(--home-primary);
		color: var(--home-text-on-primary);
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
		box-shadow: 0 6px 18px var(--home-cta-shadow);
	}

	.hero-quick-start-submit:hover:not(:disabled),
	.hero-quick-start-submit:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 8px 22px var(--home-cta-shadow-hover);
	}

	.hero-quick-start-submit:disabled {
		opacity: 0.55;
		cursor: not-allowed;
		box-shadow: none;
	}

	.hero-cta {
		display: inline-block;
		padding: 0.7rem 1.3rem;
		font-family: var(--font-heading);
		font-size: 0.9rem;
		letter-spacing: 0.01em;
		font-weight: 700;
		border-radius: var(--radius-pill);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.hero-secondary-actions {
		margin-top: 1.4rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem 1.3rem;
		justify-content: center;
	}

	.hero-secondary-actions .context-link {
		margin-top: 0;
	}

	.hero-cta-primary {
		background: var(--home-primary);
		color: var(--home-text-on-primary);
		box-shadow: 0 6px 18px var(--home-cta-shadow);
	}

	.hero-cta-primary:hover,
	.hero-cta-primary:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 8px 22px var(--home-cta-shadow-hover);
	}

	.section-heading {
		max-width: 42rem;
	}

	.section-heading h2 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: clamp(1.5rem, 3vw, 2.1rem);
	}

	.section-heading > p:last-child {
		margin: 0.7rem 0 0;
		color: var(--home-text-muted-strong);
		font-size: 0.96rem;
		line-height: 1.65;
	}

	.section-eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--home-text-blue-muted-strong);
	}

	.context-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		margin-top: 1rem;
		color: var(--home-link);
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 650;
		text-underline-offset: 3px;
	}

	/* ── Sektion 2: Mitt Hem — showcase ── */
	.home-showcase {
		padding: clamp(2.4rem, 6vw, 4rem) 1.25rem;
		background: var(--home-section-bg-soft);
		color: var(--home-text-soft);
	}

	.home-showcase-strip {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
		margin: 1.4rem 0 0;
		padding: 0;
		list-style: none;
	}

	.home-showcase-scene figure {
		margin: 0;
	}

	.home-showcase-scene img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 2 / 1;
		object-fit: cover;
		border-radius: var(--radius-card);
		border: 1px solid var(--home-card-border-soft);
	}

	.home-showcase-scene figcaption {
		margin-top: 0.5rem;
		font-family: var(--font-heading);
		font-size: 0.78rem;
		font-weight: 650;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--home-text-muted-faint);
	}

	.product-demo {
		scroll-margin-top: 80px;
		padding: clamp(2.1rem, 6vw, 3.8rem) 1.25rem;
		background: var(--home-section-bg);
		color: var(--home-text-soft);
	}

	.product-flow {
		margin: 1rem 0 0;
		padding: clamp(0.65rem, 2vw, 1rem);
		border: 1px solid var(--home-card-border-soft);
		border-radius: clamp(1rem, 3vw, 1.5rem);
		background: linear-gradient(145deg, rgba(20, 34, 52, 0.98), rgba(8, 16, 29, 0.98));
		box-shadow: 0 18px 44px rgba(3, 8, 18, 0.2);
	}

	.product-flow-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.55rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.product-flow-step {
		display: flex;
		align-items: flex-start;
		gap: 0.65rem;
		min-width: 0;
		padding: 0.7rem;
		border: 1px solid var(--home-card-border);
		border-radius: var(--radius-card);
		background: rgba(255, 255, 255, 0.035);
	}

	.product-flow-number {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		border-radius: 999px;
		background: var(--home-primary-soft);
		color: var(--home-primary-text);
		font-size: 0.72rem;
		font-weight: 750;
		flex: 0 0 auto;
	}

	.product-flow-step h3 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: 0.98rem;
	}

	.product-flow-step p {
		margin: 0.25rem 0 0;
		color: var(--home-text-muted-body);
		font-size: 0.86rem;
		line-height: 1.48;
	}

	.product-flow figcaption {
		margin-top: 0.8rem;
		color: var(--home-text-muted-faint);
		font-size: 0.78rem;
		line-height: 1.5;
	}

	/* ── Sektion D: Mer än en AI-chatt ── */
	.beyond-chat {
		padding: clamp(2.2rem, 6vw, 3.6rem) 1.25rem;
		background: var(--home-section-bg-alt);
		color: var(--home-text-soft);
	}

	.beyond-chat-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.6rem;
		margin: 1.15rem 0 0;
		padding: 0;
		list-style: none;
	}

	.beyond-chat-list li {
		padding-left: 1rem;
		border-left: 2px solid rgba(var(--home-primary-rgb), 0.55);
		color: var(--home-text-muted-body);
		font-size: 0.94rem;
		line-height: 1.6;
	}

	/* ── Sektion E: Förtroende ── */
	.early-trust {
		padding: clamp(2.2rem, 6vw, 3.4rem) 1.25rem;
		background: var(--home-section-bg);
		color: var(--home-text-soft);
	}

	.early-trust-inner h2 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: clamp(1.45rem, 2.8vw, 1.95rem);
	}

	.early-trust-eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--home-text-blue-muted);
	}

	.early-trust-grid {
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	.early-trust-grid li {
		display: flex;
	}

	.early-trust-item {
		display: block;
		height: 100%;
		margin: 0;
		padding: 0.75rem 0.85rem;
		border-radius: var(--radius-card);
		border: 1px solid var(--home-card-border);
		background:
			radial-gradient(circle at top left, var(--home-card-bg-accent-soft), transparent 42%),
			linear-gradient(180deg, var(--home-card-bg-start), var(--home-card-bg-end));
		color: var(--home-text-muted-bright);
		font-size: 0.94rem;
		line-height: 1.55;
		text-decoration: none;
		transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
	}

	.early-trust-item:hover,
	.early-trust-item:focus-visible {
		border-color: var(--home-card-border-hover);
		box-shadow: 0 4px 14px var(--home-card-shadow);
		transform: translateY(-1px);
	}

	.early-trust-note {
		margin: 0.9rem 0 0;
		max-width: 72ch;
		font-size: 0.9rem;
		line-height: 1.6;
		color: var(--home-text-muted);
	}

	.early-trust-intro {
		margin: 0.55rem 0 0;
		max-width: 66ch;
		font-size: 0.96rem;
		line-height: 1.6;
		color: var(--home-text-muted-strong);
	}

	.early-trust-note a {
		color: var(--home-text-cool);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.cards-narrow {
		width: min(1080px, 100%);
		margin: 0 auto;
	}

	.early-trust-item strong {
		color: var(--home-text-strong);
		font-family: var(--font-heading);
		font-weight: 800;
	}

	/* ── Sektion F: Guider och artiklar ── */
	.how-it-works {
		padding: clamp(2.8rem, 8vw, 4.4rem) 1.25rem;
		background: var(--home-section-bg);
		color: var(--home-text-soft);
	}

	.how-inner h2 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: clamp(1.55rem, 3vw, 2.05rem);
	}

	.content-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
		margin-top: 1.1rem;
	}

	.how-card-cta {
		display: inline-flex;
		align-items: center;
		padding: 0.42rem 0.78rem;
		border-radius: var(--radius-pill);
		background: var(--home-primary-soft);
		color: var(--home-primary-text);
		font-family: var(--font-heading);
		font-size: 0.83rem;
		font-weight: 600;
		letter-spacing: 0.005em;
	}

	.topic-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
		margin-top: 1.1rem;
	}

	.topic-links a {
		padding: 0.42rem 0.72rem;
		border: 1px solid var(--home-card-border-blue);
		border-radius: var(--radius-pill);
		color: var(--home-link);
		font-size: 0.82rem;
		text-decoration: none;
	}

	/* ── Sektion 8: Viktigt att veta ── */
	.important-section {
		padding: clamp(2rem, 5vw, 3.5rem) 1.25rem;
		background: var(--home-section-bg-important);
		color: var(--home-text-inverted);
	}

	.important-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	.final-cta-inner {
		text-align: center;
	}

	.final-cta-inner p {
		margin: 0.75rem auto 1.25rem;
		max-width: 38rem;
		color: var(--home-text-muted-bright);
		line-height: 1.6;
	}

	.final-cta-inner .hero-cta {
		width: auto;
	}

	.final-cta-actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 0.9rem;
	}

	.final-secondary-link {
		color: var(--home-link);
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 650;
		text-underline-offset: 3px;
	}

	/* ── Gemensamma typografi ── */
	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	/* ── Responsivt ── */
	@media (max-width: 900px) {
		.hero-content {
			padding: 0;
		}

		.hero-cta {
			width: 100%;
		}
	}

	/* Skimret hör ihop med hero-parallaxen och stängs av på samma villkor:
	   ingen extra rörelse på mobil eller vid reduced motion. */
	@media (max-width: 767px) {
		.hero-picture img {
			object-position: 58% center;
		}

		.hero-shimmer {
			display: none;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-shimmer {
			display: none;
		}
	}

	/* Fyra scener: 2x2 på surfplatta, en rad på desktop. */
	@media (min-width: 560px) {
		.home-showcase-strip {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.9rem;
		}
	}

	@media (min-width: 700px) {
		.product-flow-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.beyond-chat-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.8rem 1.1rem;
		}

		.early-trust-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (min-width: 1040px) {
		.home-showcase-strip {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.hero-shell {
			grid-template-columns: minmax(0, 44%) minmax(0, 1fr);
			justify-items: start;
		}

		.hero-content {
			justify-self: start;
			width: min(34rem, 100%);
			box-sizing: border-box;
			padding-left: clamp(1rem, 2vw, 2rem);
			text-align: left;
		}

		.hero-content p {
			margin-left: 0;
			margin-right: 0;
		}

		.hero-quick-start {
			margin-left: 0;
			margin-right: 0;
		}

		.hero-secondary-actions {
			justify-content: flex-start;
		}

		.product-flow-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.early-trust-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.8rem;
		}
	}

	/* ── Dark mode — base is already dark, just deepen slightly ── */
	:global(.dark) .home-showcase { background: var(--home-dark-bg-soft); }
	:global(.dark) .product-demo { background: var(--home-dark-bg); }
	:global(.dark) .early-trust { background: var(--home-dark-bg); }
	:global(.dark) .beyond-chat { background: var(--home-dark-bg-alt); }
	:global(.dark) .how-it-works { background: var(--home-dark-bg); }
	:global(.dark) .important-section { background: var(--home-dark-bg-important); }
</style>
