<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import MittHemTeaser from '$lib/components/home/MittHemTeaser.svelte';
	import {
		trackHomeCtaClick,
		trackScrollToHowItWorks
	} from '$lib/analytics';
	import { trackTikTokButtonClick } from '$lib/analytics/tiktokPixel';

	type HomePageData = {
		contentStats?: {
			guideCount: number;
		};
	};

	const HERO_QUICK_START_KEY = 'mittpsyke_hero_quick_start';

	let { data }: { data: HomePageData } = $props();
	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;
	let quickFlowEl: HTMLElement | null = null;
	let heroDraft = $state('');

	function submitHeroQuickStart(event: SubmitEvent) {
		event.preventDefault();
		const text = heroDraft.trim();
		if (!text) return;

		try {
			localStorage.setItem(HERO_QUICK_START_KEY, text);
		} catch {
			// Fortsätter ändå — texten följer bara inte med om lagring är blockerad.
		}

		trackHomeCta('hero', 'skriv_till_chatten', '/chat');
		goto('/chat');
	}

	const trustHighlights = [
		{
			text: 'Börja anonymt utan konto.',
			href: '/chatta-anonymt',
			trackCta: 'chatta_anonymt_utan_konto'
		},
		{
			text: 'MittPsyke är ett första steg i text – inte vård, behandling, diagnos eller akuthjälp.',
			href: '/om-mittpsyke',
			trackCta: 'tydliga_granser'
		},
		{
			text: 'Skapa konto först om du vill spara och följa ditt mående.',
			href: '/integritet',
			trackCta: 'integritet'
		}
	];

	const productSteps = [
		{ number: '01', title: 'Skriv', text: 'Sätt ord på det som är nära just nu.' },
		{ number: '02', title: 'Få svar', text: 'Möt lugna frågor som hjälper dig att sortera.' },
		{ number: '03', title: 'Spara', text: 'Behåll en reflektion om du har konto.' },
		{ number: '04', title: 'Följ', text: 'Se anteckningar och mående samlat över tid.' }
	];

	const outcomeItems = [
		{
			title: 'Se vad som återkommer',
			text: 'Dina anteckningar visar mönster mellan sömn, stress och hur du mår.'
		},
		{
			title: 'Minnas det som hjälper',
			text: 'Du samlar reflektioner och kan återvända till det som gav lugn eller struktur.'
		},
		{
			title: 'Få en tydligare överblick',
			text: 'Med tiden ser du förändringar utan att behöva minnas allt själv.'
		}
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
		if (cta === 'borja_skriva_anonymt_nu') {
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
				type="image/jpeg"
				srcset="/assets/home/Bjorn-tryggplats-hero-720.jpg 720w, /assets/home/Bjorn-tryggplats-hero-1200.jpg 1200w, /assets/home/Bjorn-tryggplats-hero-1695.jpg 1695w"
				sizes="100vw"
			/>
			<img
				class="hero-bg"
				bind:this={bgEl}
				src="/assets/home/Bjorn-tryggplats-hero-1200.jpg"
				alt=""
				width="1200"
				height="657"
				aria-hidden="true"
				decoding="async"
				fetchpriority="high"
			/>
		</picture>
		<div class="hero-shell">
			<div class="hero-content">
				<h1>Skriv anonymt och få stöd</h1>
				<p>Du behöver inte förklara allt perfekt. Skriv några rader anonymt – vi tar det i din takt.</p>

				<form class="hero-quick-start" onsubmit={submitHeroQuickStart}>
					<label for="hero-quick-start-input" class="hero-quick-start-label">Skriv din första rad</label>
					<textarea
						id="hero-quick-start-input"
						bind:value={heroDraft}
						class="hero-quick-start-input"
						rows="3"
						required
						placeholder="Vad snurrar det i huvudet just nu?"
						aria-describedby="hero-quick-start-hint"
					></textarea>
					<p id="hero-quick-start-hint" class="hero-quick-start-hint">
						Texten sparas tillfälligt på din enhet tills du fortsätter i chatten.
					</p>
					<button type="submit" class="hero-quick-start-submit" disabled={!heroDraft.trim()}>
						Skicka till chatten
					</button>
				</form>

				<div class="hero-secondary-actions">
					<a href="/dagbok" class="context-link" onclick={() => trackHomeCta('hero', 'borja_skriva_anonymt_nu', '/dagbok')}>Börja skriva</a>
					<a href="/register" class="context-link" onclick={() => trackHomeCta('hero', 'skapa_konto', '/register')}>Skapa konto</a>
				</div>
			</div>
		</div>
	</section>

	<!-- 2. Kompakt produktvisning byggd av verkliga produktsteg, utan exempeldata -->
	<section id="sa-fungerar-det" class="product-demo" aria-labelledby="product-demo-title" bind:this={quickFlowEl}>
		<div class="cards-narrow product-demo-inner">
			<div class="section-heading">
				<p class="section-eyebrow">En lugn väg genom tjänsten</p>
				<h2 id="product-demo-title">Från första rad till egen överblick</h2>
				<p>En förenklad visning av flödet i chatten, dagboken och Mitt hem.</p>
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
				<figcaption>Visningen innehåller ingen användardata eller påhittad konversation.</figcaption>
			</figure>
			<a class="context-link" href="/dagbok" onclick={() => trackHomeCta('product_demo', 'borja_skriva', '/dagbok')}>Börja skriva <span aria-hidden="true">→</span></a>
		</div>
	</section>

	<!-- 3. Försiktigt formulerad nytta över tid -->
	<section class="outcomes-section" aria-labelledby="outcomes-title">
		<div class="cards-narrow outcomes-inner">
			<div class="section-heading">
				<p class="section-eyebrow">Med tiden</p>
				<h2 id="outcomes-title">Låt det du skriver bli lättare att se</h2>
			</div>
			<ul class="outcomes-grid">
				{#each outcomeItems as item}
					<li>
						<h3>{item.title}</h3>
						<p>{item.text}</p>
					</li>
				{/each}
			</ul>
		</div>
	</section>

	<!-- 5. Endast verifierbara publicerade innehållsmått -->
	{#if data.contentStats}
		<section class="proof-section" aria-labelledby="proof-title">
			<div class="cards-narrow proof-inner">
				<div>
					<p class="section-eyebrow">Innehåll som finns att använda</p>
					<h2 id="proof-title">Fördjupa dig i din takt</h2>
				</div>
				<dl class="proof-grid">
					<div>
						<dt>{data.contentStats.guideCount}</dt>
						<dd>publicerade guider</dd>
					</div>
				</dl>
			</div>
		</section>
	{/if}

	<!-- 6. Verifierad grundarberättelse -->
	<section class="founder-section" aria-labelledby="founder-title">
		<div class="cards-narrow founder-inner">
			<div class="founder-mark" aria-hidden="true">RC</div>
			<div class="founder-copy">
				<p class="section-eyebrow">Bakom MittPsyke</p>
				<h2 id="founder-title">Översikt och syfte med MittPsyke</h2>
				<p>MittPsyke är en svensk digital plattform för samtalsstöd, skapad för personer som lever med psykisk belastning i olika former. Här kan du stanna upp, sätta ord på det som känns svårt och få stöd i stunden – utan krav på prestation eller att förklara allt från början. Grundaren, Robert Claesson, har själv erfarenhet av psykisk ohälsa och skapade MittPsyke utifrån egna behov av stöd när traditionell hjälp kändes långt borta. Målet är en personlig och tillgänglig plats för reflektion, struktur och stöd, där du kan känna dig hörd och tagen på allvar.</p>
				<p>MittPsyke är inte en vårdtjänst och erbjuder inte diagnos, behandling eller akut hjälp. Det är ett första steg för reflektion och struktur i vardagen, inte en ersättning för professionell vård. Vid akuta situationer hänvisar vi alltid till <a href="tel:112">112</a> eller <a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>.</p>
				<a class="context-link" href="/om-mittpsyke" onclick={() => trackHomeCta('founder', 'om_mittpsyke', '/om-mittpsyke')}>Läs varför MittPsyke finns <span aria-hidden="true">→</span></a>
			</div>
		</div>
	</section>

	<MittHemTeaser />

	<!-- 8. Samlad trygghet -->
	<section class="early-trust" aria-labelledby="early-trust-title">
		<div class="cards-narrow early-trust-inner">
			<p class="early-trust-eyebrow">Trygg start</p>
			<h2 id="early-trust-title">Känn dig trygg innan du börjar</h2>
			<p class="early-trust-intro">Du väljer själv vad du vill dela och kan pausa när du vill.</p>
			<ul class="early-trust-grid">
				{#each trustHighlights as item}
					<li>
						<a class="early-trust-item" href={item.href} onclick={() => trackHomeCta('early_trust', item.trackCta, item.href)}>{item.text}</a>
					</li>
				{/each}
			</ul>
			<p class="early-trust-note">
				Vid akut fara: <a href="tel:112">112</a>. För vårdråd:
				<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Vidare stöd:
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>.
				<a href="/integritet">Läs om integritet</a>.
			</p>
		</div>
	</section>

	<!-- 9. Artiklar och vidare stöd -->
	<section id="sa-fungerar-det-fordjupning" class="how-it-works" aria-labelledby="how-it-works-title">
		<div class="cards-narrow how-inner">
			<h2 id="how-it-works-title">Läs och hitta vidare stöd</h2>
			<p class="how-intro">Välj det som känns hjälpsamt just nu.</p>
			<div class="how-grid">
				<article class="how-card">
					<h3>Guider</h3>
					<p>Läs enkla förklaringar om känslor och mående.</p>
					<a class="how-card-cta" href="/guider" onclick={() => trackHomeCta('how_it_works', 'guider', '/guider')}>Se guider</a>
				</article>
				<article class="how-card">
					<h3>Övningar</h3>
					<p>Prova något konkret för att landa eller sortera tankar.</p>
					<a class="how-card-cta" href="/ovningar" onclick={() => trackHomeCta('how_it_works', 'ovningar', '/ovningar')}>Se övningar</a>
				</article>
				<article class="how-card">
					<h3>Artiklar</h3>
					<p>Fördjupa dig i lugn och ro, utan att behöva börja ett samtal.</p>
					<a class="how-card-cta" href="/blogg" onclick={() => trackHomeCta('how_it_works', 'artiklar', '/blogg')}>Läs artiklar</a>
				</article>
			</div>
			<nav class="topic-links" aria-label="Vanliga ämnen">
				{#each guideTopics as topic}
					<a href={topic.href} onclick={() => trackHomeCta('guide_topics', topic.label.toLowerCase(), topic.href)}>{topic.label}</a>
				{/each}
			</nav>
		</div>
	</section>

	<!-- 10. Slutlig CTA -->
	<section class="important-section final-cta" aria-labelledby="final-cta-title">
		<div class="cards-narrow important-inner final-cta-inner">
			<h2 id="final-cta-title">Börja där du är</h2>
			<p>Du behöver inte ha rätt ord. Vi tar det i din takt.</p>
			<div class="final-cta-actions">
				<a href="/dagbok" class="hero-cta hero-cta-primary" onclick={() => trackHomeCta('final_cta', 'borja_skriva', '/dagbok')}>Börja skriva</a>
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
		--home-primary: #3a7bd5;
		--home-primary-rgb: 58, 123, 213;
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

	.section-heading h2,
	.founder-copy h2,
	.proof-inner h2 {
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

	.outcomes-section {
		padding: clamp(2.5rem, 7vw, 4rem) 1.25rem;
		background: var(--home-section-bg);
		color: var(--home-text-soft);
	}

	.outcomes-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.9rem;
		margin: 1.25rem 0 0;
		padding: 0;
		list-style: none;
	}

	.outcomes-grid li {
		padding-left: 1rem;
		border-left: 2px solid rgba(var(--home-primary-rgb), 0.55);
	}

	.outcomes-grid h3 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: 1rem;
	}

	.outcomes-grid p {
		margin: 0.45rem 0 0;
		color: var(--home-text-muted-body);
		font-size: 0.94rem;
		line-height: 1.62;
	}

	.proof-section {
		padding: clamp(2.2rem, 6vw, 3.5rem) 1.25rem;
		background: var(--home-section-bg-alt);
		color: var(--home-text-soft);
	}

	.proof-inner {
		display: grid;
		gap: 1.25rem;
		align-items: center;
	}

	.proof-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr);
		max-width: 14rem;
		gap: 0.75rem;
		margin: 0;
	}

	.proof-grid div {
		padding: 0.9rem;
		border: 1px solid var(--home-card-border-soft);
		border-radius: var(--radius-card);
		background: rgba(10, 18, 30, 0.45);
	}

	.proof-grid dt {
		color: var(--home-text-strong);
		font-family: var(--font-heading);
		font-size: clamp(1.55rem, 4vw, 2.1rem);
		font-weight: 800;
	}

	.proof-grid dd {
		margin: 0.2rem 0 0;
		color: var(--home-text-muted);
		font-size: 0.84rem;
		line-height: 1.4;
	}

	.founder-section {
		padding: clamp(2.5rem, 7vw, 4rem) 1.25rem;
		background: var(--home-section-bg-soft);
		color: var(--home-text-soft);
	}

	.founder-inner {
		display: grid;
		gap: 1.1rem;
		align-items: start;
	}

	.founder-mark {
		display: grid;
		place-items: center;
		width: 4rem;
		height: 4rem;
		border: 1px solid rgba(147, 197, 253, 0.22);
		border-radius: 50%;
		background: var(--home-primary-soft);
		color: var(--home-primary-text);
		font-family: var(--font-heading);
		font-weight: 800;
		letter-spacing: 0.04em;
	}

	.founder-copy {
		max-width: 46rem;
	}

	.founder-copy > p:not(.section-eyebrow) {
		margin: 0.8rem 0 0;
		color: var(--home-text-muted-strong);
		font-size: 0.96rem;
		line-height: 1.7;
	}

	/* ── Sektion 2: Första steget ── */
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

	/* ── Sektion 4: Så fungerar det ── */
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

	.how-intro {
		margin: 0.75rem 0 0;
		max-width: 66ch;
		color: var(--home-text-muted);
		font-size: 0.96rem;
		line-height: 1.65;
	}

	.how-grid {
		margin-top: 1.2rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.95rem;
	}

	.how-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at top left, var(--home-card-bg-accent), transparent 42%),
			linear-gradient(180deg, var(--home-card-bg-start), var(--home-card-bg-end));
		border: 1px solid var(--home-card-border);
	}

	.how-card h3 {
		margin: 0.8rem 0 0;
		color: var(--home-text-strong);
		font-size: 1.06rem;
		line-height: 1.3;
	}

	.how-card p {
		margin: 0.55rem 0 0;
		color: var(--home-text-muted-soft);
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.how-card-cta {
		display: inline-flex;
		align-items: center;
		margin-top: 0.9rem;
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

	@media (min-width: 700px) {
		.product-flow-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.outcomes-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.proof-inner {
			grid-template-columns: minmax(0, 1fr) minmax(20rem, 0.8fr);
		}

		.founder-inner {
			grid-template-columns: 4rem minmax(0, 1fr);
			gap: 1.4rem;
		}

		.early-trust-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.how-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.05rem;
		}
	}

	@media (min-width: 1040px) {
		.hero-shell {
			grid-template-columns: minmax(0, 1fr);
		}

		.product-flow-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.how-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}

		.early-trust-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.8rem;
		}

		.how-grid { gap: 1.1rem; }

	}

	/* ── Dark mode — base is already dark, just deepen slightly ── */
	:global(.dark) .product-demo { background: var(--home-dark-bg); }
	:global(.dark) .early-trust { background: var(--home-dark-bg); }
	:global(.dark) .outcomes-section { background: var(--home-dark-bg); }
	:global(.dark) .proof-section { background: var(--home-dark-bg-alt); }
	:global(.dark) .founder-section { background: var(--home-dark-bg-soft); }
	:global(.dark) .how-it-works { background: var(--home-dark-bg); }
	:global(.dark) .important-section { background: var(--home-dark-bg-important); }
</style>
