<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import HeroShowcase from '$lib/components/home/HeroShowcase.svelte';
	import MittHemTeaser from '$lib/components/home/MittHemTeaser.svelte';
	import {
		trackHomeCtaClick,
		trackScrollToHowItWorks
	} from '$lib/analytics';
	import { trackTikTokButtonClick } from '$lib/analytics/tiktokPixel';

	let { data }: { data: Record<string, unknown> } = $props();
	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;
	let quickFlowEl: HTMLElement | null = null;

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

	const quickFlowSteps = [
		{
			title: 'Skriv vad som känns svårt',
			text: 'Börja med det som är nära just nu.'
		},
		{
			title: 'Få lugnt samtalsstöd',
			text: 'Sortera tankar och hitta ett litet nästa steg.'
		},
		{
			title: 'Spara om du vill',
			text: 'Följ ditt mående över tid när du har konto.'
		}
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
				<div class="hero-actions">
					<a href="/dagbok" class="hero-cta hero-cta-primary" onclick={() => trackHomeCta('hero', 'borja_skriva_anonymt_nu', '/dagbok')}>Börja skriva</a>
					<a href="/register" class="hero-cta hero-cta-secondary" onclick={() => trackHomeCta('hero', 'skapa_konto', '/register')}>Skapa konto</a>
				</div>
			</div>
			<HeroShowcase />
		</div>
	</section>

	<!-- 2. Samlad trygghet -->
	<section class="early-trust" aria-labelledby="early-trust-title">
		<div class="cards-narrow early-trust-inner">
			<p class="early-trust-eyebrow">Trygg start</p>
			<h2 id="early-trust-title">Känn dig trygg innan du börjar</h2>
			<p class="early-trust-intro">Du väljer själv vad du vill dela och kan pausa när du vill.</p>
			<ul class="early-trust-grid">
				{#each trustHighlights as item}
					<li>
						<a
							class="early-trust-item"
							href={item.href}
							onclick={() => trackHomeCta('early_trust', item.trackCta, item.href)}
						>
							{item.text}
						</a>
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

	<section id="sa-fungerar-det" class="quick-flow" aria-labelledby="quick-flow-title" bind:this={quickFlowEl}>
		<div class="cards-narrow quick-flow-inner">
			<h2 id="quick-flow-title">Så fungerar MittPsyke</h2>
			<ol class="quick-flow-grid">
				{#each quickFlowSteps as step, index}
					<li class="quick-flow-item">
						<p class="quick-flow-step">Steg {index + 1}</p>
						<h3>{step.title}</h3>
						<p>{step.text}</p>
					</li>
				{/each}
			</ol>
		</div>
	</section>

	<MittHemTeaser />

	<!-- 5. Artiklar och vidare stöd -->
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
		</div>
	</section>

	<!-- 6. Social proof -->
	<section class="review-section" aria-labelledby="review-section-title">
		<div class="cards-narrow review-inner">
			<p class="review-origin">Citaten kommer från frivillig feedback som delats direkt med MittPsyke och visas anonymiserat.</p>
			<h2 id="review-section-title">Så beskriver andra sin upplevelse</h2>
			<div class="review-grid">
				<blockquote class="review-card">
					<p>&ldquo;Jag skrev i några minuter och kände mig mindre uppjagad.&rdquo;</p>
					<cite>Anonym användare</cite>
				</blockquote>
				<blockquote class="review-card">
					<p>&ldquo;Frågorna hjälpte mig sortera vad som var viktigast just då.&rdquo;</p>
					<cite>Anonym användare</cite>
				</blockquote>
				<blockquote class="review-card">
					<p>&ldquo;När jag kom tillbaka såg jag mönster i sömn och stress.&rdquo;</p>
					<cite>Anonym användare</cite>
				</blockquote>
			</div>
		</div>
	</section>

	<!-- 7. Slutlig CTA -->
	<section class="important-section final-cta" aria-labelledby="final-cta-title">
		<div class="cards-narrow important-inner final-cta-inner">
			<h2 id="final-cta-title">Börja där du är</h2>
			<p>Du behöver inte ha rätt ord. Vi tar det i din takt.</p>
			<a href="/dagbok" class="hero-cta hero-cta-primary" onclick={() => trackHomeCta('final_cta', 'borja_skriva', '/dagbok')}>Börja skriva</a>
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

	.hero-cta-secondary {
		background: transparent;
		color: rgba(255, 255, 255, 0.88);
		border: 1.5px solid rgba(255, 255, 255, 0.32);
		box-shadow: none;
	}

	.hero-cta-secondary:hover,
	.hero-cta-secondary:focus-visible {
		background: rgba(255, 255, 255, 0.08);
		border-color: rgba(255, 255, 255, 0.55);
		transform: translateY(-1px);
	}

	.hero-actions {
		margin-top: 1.7rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
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

	.quick-flow {
		scroll-margin-top: 80px;
		padding: clamp(2.3rem, 6vw, 3.6rem) 1.25rem;
		padding-bottom: clamp(2.9rem, 7.5vw, 4.4rem);
		background: var(--home-section-bg-soft);
		color: var(--home-text-soft);
	}

	.quick-flow-inner h2 {
		margin: 0;
		color: var(--home-text-strong);
		font-size: clamp(1.45rem, 2.9vw, 2rem);
	}

	.quick-flow-grid {
		margin: 1rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
	}

	.quick-flow-item {
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at top left, var(--home-card-bg-accent), transparent 42%),
			linear-gradient(180deg, var(--home-card-bg-start), var(--home-card-bg-end));
		border: 1px solid var(--home-card-border);
	}

	.quick-flow-step {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.81rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--home-text-blue-muted-strong);
	}

	.quick-flow-item h3 {
		margin: 0.45rem 0 0;
		font-size: 1.02rem;
		line-height: 1.35;
		color: var(--home-text-strong);
	}

	.quick-flow-item p {
		margin: 0.5rem 0 0;
		font-size: 0.94rem;
		line-height: 1.62;
		color: var(--home-text-muted-body);
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


	/* ── Social proof ── */
	.review-section {
		padding: clamp(2.8rem, 7vw, 5rem) 1.25rem;
		background: var(--home-section-bg-alt);
		color: var(--home-text-inverted);
	}

	.review-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	.review-origin {
		margin: 0.7rem auto 0;
		max-width: 42rem;
		text-align: center;
		font-size: 0.95rem;
		line-height: 1.6;
		color: var(--home-text-muted-mid);
	}

	.review-inner h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.55rem, 3vw, 2.2rem);
		color: var(--home-text-review);
	}

	.review-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
		margin-top: 1.4rem;
	}

	.review-card {
		margin: 0;
		padding: 1rem 1.1rem;
		background:
			radial-gradient(circle at top left, var(--home-card-bg-accent), transparent 42%),
			linear-gradient(180deg, var(--home-card-bg-start), var(--home-card-bg-end));
		border: 1px solid var(--home-card-border);
		border-radius: var(--radius-card);
	}

	.review-card p {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.97rem;
		line-height: 1.7;
		color: var(--home-quote-text);
		font-style: italic;
	}

	.review-card cite {
		display: block;
		margin-top: 0.55rem;
		font-size: 0.82rem;
		font-style: normal;
		color: var(--home-quote-cite);
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

		.hero-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.hero-cta {
			width: 100%;
		}
	}

	@media (min-width: 680px) {
		.review-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1rem;
		}
	}

	@media (min-width: 700px) {
		.quick-flow-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
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
			grid-template-columns: minmax(0, 1fr) minmax(20rem, 23rem);
		}

		.quick-flow-grid,
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
	:global(.dark) .early-trust { background: var(--home-dark-bg); }
	:global(.dark) .quick-flow { background: var(--home-dark-bg-soft); }
	:global(.dark) .how-it-works { background: var(--home-dark-bg); }
	:global(.dark) .review-section { background: var(--home-dark-bg-alt); }
	:global(.dark) .important-section { background: var(--home-dark-bg-important); }
</style>
