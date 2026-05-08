<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import HomeSafetyStrip from '$lib/components/HomeSafetyStrip.svelte';
	import VoiceSupport from '$lib/components/VoiceSupport.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import {
		trackHeroCtaPrimaryClick,
		trackHeroCtaSecondaryClick,
		trackHomeCtaClick,
		trackScrollToHowItWorks
	} from '$lib/analytics';

	let { data }: { data: Record<string, unknown> } = $props();
	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;
	let quickFlowEl: HTMLElement | null = null;

	const trustHighlights = [
		{
			text: 'Börja anonymt: Du kan skriva direkt utan konto.',
			href: '/chatta-anonymt',
			trackCta: 'chatta_anonymt_utan_konto'
		},
		{
			text: 'Tydliga gränser: MittPsyke är ett första steg i text, inte vård, behandling, diagnos eller akuthjälp.',
			href: '/om-mittpsyke',
			trackCta: 'tydliga_granser'
		},
		{
			text: 'Spara om du vill: Skapa konto senare om du vill spara historik och följa ditt mående över tid.',
			href: '/integritet',
			trackCta: 'integritet'
		}
	];

	const quickFlowSteps = [
		{
			title: 'Skriv det som känns',
			text: 'Du behöver inte formulera dig perfekt. Börja med det som snurrar just nu.'
		},
		{
			title: 'Få svar och struktur',
			text: 'MittPsyke hjälper dig att sortera tankar, se mönster och hitta små nästa steg.'
		},
		{
			title: 'Spara om du vill',
			text: 'Du kan börja utan konto. Skapa konto senare om du vill spara historik, följa ditt mående över tid och återvända till tidigare reflektioner.'
		}
	];

	function trackHomeCta(section: string, cta: string, href: string) {
		trackHomeCtaClick({ section, cta, href });
	}

	function trackStartAnonymous() {
		trackHeroCtaPrimaryClick();
	}

	function trackStartDiary() {
		trackHeroCtaSecondaryClick();
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
		<img
			class="hero-bg"
			bind:this={bgEl}
			src="/assets/home/MittpsykeTree.webp"
			alt="Stilla träd i mjukt ljus"
			width="3379"
			height="1843"
			aria-hidden="true"
			decoding="async"
			fetchpriority="high"
		/>
		<div class="hero-shell">
			<div class="hero-content">
				<h1>Få hjälp att sortera tankar i lugn takt</h1>
				<p>Anonymt stöd när tankarna snurrar. Börja direkt i chatten eller skriv i dagboken i din egen takt.</p>
				<div class="hero-actions">
					<a href="/chat" class="hero-cta hero-cta-primary" onclick={() => trackStartAnonymous()}>Chatta anonymt</a>
					<a href="/dagbok" class="hero-cta hero-cta-primary" onclick={() => trackStartDiary()}>Skriv dagbok</a>
				</div>
				<p class="hero-trust-note">Din text sparas inte.</p>
			</div>
		</div>
	</section>

	<!-- 2. Börja där det känns lättast -->
	<section class="early-trust" aria-labelledby="early-trust-title">
		<div class="cards-narrow early-trust-inner">
			<p class="early-trust-eyebrow">Trygg start</p>
			<h2 id="early-trust-title">Känn dig trygg innan du börjar</h2>
			<p class="early-trust-intro">
				Här ser du ramarna innan du börjar. Du kan starta anonymt direkt och skapa konto senare bara om du vill spara och följa över tid.
			</p>
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
			</p>
		</div>
	</section>

	<section id="sa-fungerar-det" class="quick-flow" aria-labelledby="quick-flow-title" bind:this={quickFlowEl}>
		<div class="cards-narrow quick-flow-inner">
			<h2 id="quick-flow-title">Så fungerar MittPsyke</h2>
			<p class="quick-flow-intro">
				Skriv först. Få struktur i text. Spara bara om du vill komma tillbaka senare. Inte vård, diagnos eller akuthjälp.
			</p>
			<ol class="quick-flow-grid">
				{#each quickFlowSteps as step, index}
					<li class="quick-flow-item">
						<p class="quick-flow-step">Steg {index + 1}</p>
						<h3>{step.title}</h3>
						<p>{step.text}</p>
					</li>
				{/each}
			</ol>
			<p class="quick-flow-cta-row">
				<span class="quick-flow-cta-label">Nästa steg:</span>
				<a href="/skriv" onclick={() => trackHomeCta('quick_flow', 'borja_skriva_anonymt', '/skriv')}>
					Börja skriva anonymt
				</a>
				<span aria-hidden="true"> • </span>
				<a href="/register" onclick={() => trackHomeCta('quick_flow', 'fortsatt_over_tid', '/register')}>
					Skapa konto senare
				</a>
			</p>
		</div>
	</section>

	<!-- 4. Mer än en chatt -->
	<section id="sa-fungerar-det-fordjupning" class="how-it-works" aria-labelledby="how-it-works-title">
		<div class="cards-narrow how-inner">
			<p class="how-eyebrow">Fördjupning</p>
			<h2 id="how-it-works-title">Mer än en chatt</h2>
			<p class="how-intro">
				Här finns verktygen för att få struktur, följa ditt mående och hitta det som hjälper i vardagen.
			</p>
			<div class="how-grid">
				<article class="how-card">
					<h3>Dagbok och reflektion</h3>
					<p>Skriv mer sammanhängande och sätt ord på det som återkommer.</p>
					<a class="how-card-cta" href="/dagbok" onclick={() => trackHomeCta('how_it_works', 'oppna_dagboken', '/dagbok')}>Öppna dagboken</a>
				</article>
				<article class="how-card">
					<h3>Uppföljning över tid</h3>
					<p>Se mönster i hur du mår och få bättre överblick över perioder.</p>
					<a class="how-card-cta" href="/humorsparning" onclick={() => trackHomeCta('how_it_works', 'folj_maendet', '/humorsparning')}>Följ måendet</a>
				</article>
				<article class="how-card">
					<h3>Guider och övningar</h3>
					<p>Få tydliga förklaringar och konkreta övningar för vardagens utmaningar.</p>
					<a class="how-card-cta" href="/guider" onclick={() => trackHomeCta('how_it_works', 'utforska_stod', '/guider')}>Utforska stöd</a>
				</article>
				<article class="how-card">
					<h3>Stöd att återvända till</h3>
					<p>Samla det som hjälper dig så att du lätt kan fortsätta där du var.</p>
					<a class="how-card-cta" href="/register" onclick={() => trackHomeCta('how_it_works', 'fortsatt_over_tid', '/register')}>Fortsätt över tid</a>
				</article>
			</div>
		</div>
	</section>

	<!-- 6. Social proof -->
	<section class="review-section" aria-labelledby="review-section-title">
		<div class="cards-narrow review-inner">
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

	<VoiceSupport />

	<!-- 7. Trygghet och avgränsning -->
	<section class="trust-section" aria-labelledby="trust-title">
		<div class="cards-narrow trust-inner">
			<img src="/assets/home/Tryggplats.webp" alt="Illustration av en trygg plats i naturen" width="492" height="531" loading="lazy" decoding="async" class="trust-image" />
			<div class="trust-copy">
				<h2 id="trust-title">För stöd i text, reflektion och struktur — inte vård eller akuthjälp</h2>
				<p>
					MittPsyke är tänkt som ett första steg när du vill börja någonstans. Här kan du skriva av dig, sortera tankar och få struktur i text. Det är inte vård, behandling, diagnos eller akuthjälp.
				</p>
				<p class="trust-privacy">
					Du kan börja helt anonymt utan konto. Vill du spara historik, följa ditt mående över tid eller återvända till tidigare reflektioner kan du skapa konto senare. Du kan också läsa hur integritet och data fungerar innan du delar något.
					<a href="/integritet" onclick={() => trackHomeCta('trust_section', 'integritetspolicy', '/integritet')}>Läs integritetspolicyn</a>.
				</p>
				<p class="trust-research">
					Vid akut fara, ring <a href="tel:112">112</a>. För vårdråd, kontakta
					<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. För vidare stöd finns
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
				</p>
				<div class="trust-facts" aria-label="Avsändare och ansvar">
					<p><strong>Drivs i Sverige av:</strong> Robert Claesson</p>
					<p><strong>Kontakt:</strong> <a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a></p>
					<p><strong>Viktigt:</strong> Inte vård, diagnos, behandling eller akuthjälp</p>
				</div>
			</div>
		</div>
	</section>

	<!-- 8. Viktigt att veta -->
	<section class="important-section" aria-label="Viktigt att veta">
		<div class="cards-narrow important-inner">
			<HomeSafetyStrip />
		</div>
	</section>
</main>

<style>
	.staging-look {
		width: 100%;
		color: #f5f5f2;
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

	.hero img {
		width: 100%;
		height: auto;
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
				rgba(76, 122, 150, 0.18),
				transparent 60%
			),
			linear-gradient(
				180deg,
				rgba(14, 22, 33, 0.65) 0%,
				rgba(14, 22, 33, 0.85) 60%,
				rgba(14, 22, 33, 0.95) 100%
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
		align-items: start;
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
		color: rgba(255, 255, 255, 0.9);
	}

	.hero-cta {
		display: inline-block;
		padding: 0.62rem 1rem;
		font-family: var(--font-heading);
		font-size: 0.85rem;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: #3a7bd5;
		color: #ffffff;
		font-weight: 700;
		border-radius: var(--radius-pill);
		transition: transform 0.15s ease, box-shadow 0.15s ease;
	}

	.hero-trust-note {
		margin-top: 0.9rem;
		font-size: 0.88rem;
		color: rgba(255, 255, 255, 0.72);
		letter-spacing: 0.01em;
	}

	.hero-actions {
		margin-top: 1.7rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
	}

	.hero-cta-primary {
		background: #3a7bd5;
		color: #ffffff;
		box-shadow: 0 6px 18px rgba(30, 58, 138, 0.18);
	}

	.hero-cta-primary:hover,
	.hero-cta-primary:focus-visible {
		transform: translateY(-1px);
		box-shadow: 0 8px 22px rgba(30, 58, 138, 0.22);
	}

	/* ── Sektion 2: Första steget ── */
	.early-trust {
		padding: clamp(2.2rem, 6vw, 3.4rem) 1.25rem;
		background: #162236;
		color: #e0e4ea;
	}

	.early-trust-inner h2 {
		margin: 0;
		color: #eef1f6;
		font-size: clamp(1.45rem, 2.8vw, 1.95rem);
	}

	.early-trust-eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(160, 185, 220, 0.9);
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
		border: 1px solid rgba(148, 163, 184, 0.12);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.1), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		color: rgba(220, 225, 235, 0.9);
		font-size: 0.94rem;
		line-height: 1.55;
		text-decoration: none;
		transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
	}

	.early-trust-item:hover,
	.early-trust-item:focus-visible {
		border-color: rgba(148, 163, 184, 0.28);
		box-shadow: 0 4px 14px rgba(15, 23, 42, 0.22);
		transform: translateY(-1px);
	}

	.early-trust-note {
		margin: 0.9rem 0 0;
		max-width: 72ch;
		font-size: 0.9rem;
		line-height: 1.6;
		color: rgba(220, 225, 235, 0.78);
	}

	.early-trust-intro {
		margin: 0.55rem 0 0;
		max-width: 66ch;
		font-size: 0.96rem;
		line-height: 1.6;
		color: rgba(220, 225, 235, 0.86);
	}

	.early-trust-note a {
		color: #d7e7ff;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.quick-flow {
		scroll-margin-top: 80px;
		padding: clamp(2.3rem, 6vw, 3.6rem) 1.25rem;
		padding-bottom: clamp(2.9rem, 7.5vw, 4.4rem);
		background: #141e2e;
		color: #e0e4ea;
	}

	.quick-flow-inner h2 {
		margin: 0;
		color: #eef1f6;
		font-size: clamp(1.45rem, 2.9vw, 2rem);
	}

	.quick-flow-intro {
		margin: 0.7rem 0 0;
		max-width: 66ch;
		font-size: 0.96rem;
		line-height: 1.65;
		color: rgba(220, 225, 235, 0.78);
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
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.12);
	}

	.quick-flow-step {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.81rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: rgba(160, 185, 220, 0.92);
	}

	.quick-flow-item h3 {
		margin: 0.45rem 0 0;
		font-size: 1.02rem;
		line-height: 1.35;
		color: #eef1f6;
	}

	.quick-flow-item p {
		margin: 0.5rem 0 0;
		font-size: 0.94rem;
		line-height: 1.62;
		color: rgba(220, 225, 235, 0.74);
	}

	.quick-flow-cta-row {
		margin: 1.15rem 0 0;
		font-size: 0.9rem;
		color: rgba(220, 225, 235, 0.82);
	}

	.quick-flow-cta-label {
		color: rgba(220, 225, 235, 0.72);
	}

	.quick-flow-cta-row a {
		color: #d7e7ff;
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
		background: #162236;
		color: #e0e4ea;
	}

	.how-eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: rgba(160, 185, 220, 0.9);
	}

	.how-inner h2 {
		margin: 0;
		color: #eef1f6;
		font-size: clamp(1.55rem, 3vw, 2.05rem);
	}

	.how-intro {
		margin: 0.75rem 0 0;
		max-width: 66ch;
		color: rgba(220, 225, 235, 0.78);
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
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.12);
	}

	.how-card h3 {
		margin: 0.8rem 0 0;
		color: #eef1f6;
		font-size: 1.06rem;
		line-height: 1.3;
	}

	.how-card p {
		margin: 0.55rem 0 0;
		color: rgba(220, 225, 235, 0.72);
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.how-card-cta {
		display: inline-flex;
		align-items: center;
		margin-top: 0.9rem;
		padding: 0.42rem 0.78rem;
		border-radius: var(--radius-pill);
		background: rgba(58, 123, 213, 0.15);
		color: #7db4e8;
		font-family: var(--font-heading);
		font-size: 0.83rem;
		font-weight: 600;
		letter-spacing: 0.005em;
	}


	/* ── Social proof ── */
	.review-section {
		padding: clamp(2.8rem, 7vw, 5rem) 1.25rem;
		background: #1b2b3a;
		color: #f5f5f2;
	}

	.review-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	.review-inner h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.55rem, 3vw, 2.2rem);
		color: #f3f8fd;
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
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.12);
		border-radius: var(--radius-card);
	}

	.review-card p {
		margin: 0;
		font-family: var(--font-body);
		font-size: 0.97rem;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.88);
		font-style: italic;
	}

	.review-card cite {
		display: block;
		margin-top: 0.55rem;
		font-size: 0.82rem;
		font-style: normal;
		color: rgba(255, 255, 255, 0.5);
	}

	/* ── Sektion 7: Trygghet ── */
	.trust-section {
		padding: clamp(3rem, 8vw, 6rem) 1.25rem;
		background: #1b2b3a;
		color: #f5f5f2;
	}

	.trust-inner {
		max-width: 1080px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 1.6rem;
		align-items: center;
	}

	.trust-image {
		width: 100%;
		height: clamp(220px, 30vw, 340px);
		object-fit: cover;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}

	.trust-copy h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.trust-copy p {
		margin: 0.85rem 0 0;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.9);
	}

	.trust-privacy a,
	.trust-research a {
		color: #93c5fd;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.trust-research {
		font-size: 0.88rem;
		opacity: 0.72;
	}

	.trust-facts {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		display: grid;
		gap: 0.45rem;
	}

	.trust-facts p {
		margin: 0;
		font-size: 0.94rem;
		color: rgba(255, 255, 255, 0.84);
	}

	.trust-facts a {
		color: #d7e7ff;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	/* ── Sektion 8: Viktigt att veta ── */
	.important-section {
		padding: clamp(2rem, 5vw, 3.5rem) 1.25rem;
		background: #1a2530;
		color: #f5f5f2;
	}

	.important-inner {
		max-width: 1080px;
		margin: 0 auto;
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
		.trust-inner {
			grid-template-columns: 1fr;
		}

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
		.early-trust-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.8rem;
		}

		.how-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}

	}

	/* ── Dark mode — base is already dark, just deepen slightly ── */
	:global(.dark) .early-trust { background: #0e1826; }
	:global(.dark) .quick-flow { background: #0d1520; }
	:global(.dark) .how-it-works { background: #0e1826; }
	:global(.dark) .review-section { background: #0a1018; }
	:global(.dark) .trust-section { background: #0a1018; }
	:global(.dark) .important-section { background: #080e16; }
</style>
