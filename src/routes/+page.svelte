<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import HomeSafetyStrip from '$lib/components/HomeSafetyStrip.svelte';
	import VoiceSupport from '$lib/components/VoiceSupport.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import { trackHeroCtaPrimaryClick, trackHeroCtaSecondaryClick, trackHomeCtaClick } from '$lib/analytics';

	let { data }: { data: Record<string, unknown> } = $props();
	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;

	const entryPaths = [
		{
			title: 'Börja skriva',
			description: 'Skriv av dig anonymt och få lugnt stöd direkt.',
			href: '/skriv',
			cta: 'Börja skriva nu',
			featured: true
		},
		{
			title: 'Följ ditt mående',
			description: 'Spara och följ mönster över tid.',
			href: '/register',
			cta: 'Skapa konto för att spara'
		},
		{
			title: 'Prova en övning',
			description: 'Ta ett konkret steg här och nu.',
			href: '/ovningar',
			cta: 'Starta en övning'
		},
		{
			title: 'Läs guider',
			description: 'Få mer förståelse i din egen takt.',
			href: '/guider',
			cta: 'Läs guider'
		}
	];

	const supportPoints = [
		{
			label: 'Direkt stöd',
			text: 'Du får lugna svar, hjälp att sätta ord på det du känner och små nästa steg.'
		},
		{
			label: 'Helt anonymt',
			text: 'Inget konto behövs. Ingen data kopplas till dig som person.'
		},
		{
			label: 'I din egen takt',
			text: 'Skriv när du vill, så lite eller mycket du vill. Inget schema, inga krav.'
		},
		{
			label: 'Inte vård',
			text: 'Ett stöd för reflektion i vardagen — inte ersättning för professionell hjälp.'
		}
	];

	const trustHighlights = [
		'Börja skriva anonymt utan konto',
		'MittPsyke är stöd för reflektion, inte vård eller akuthjälp',
		'Se hur data hanteras innan du börjar',
		'Med konto finns möjlighet till export och radering',
		'Vid akut läge hänvisas du vidare till rätt hjälp'
	];

	const quickFlowSteps = [
		{
			title: 'Börja skriva direkt',
			text: 'Du kan skriva anonymt utan konto och komma igång i lugn takt.'
		},
		{
			title: 'Få stöd i text',
			text: 'Sätt ord på det som känns svårt, rörigt eller tungt.'
		},
		{
			title: 'Spara om du vill fortsätta',
			text: 'Med konto kan du spara historik, använda dagbok och följa ditt mående över tid.'
		},
		{
			title: 'Använd det som hjälper mest',
			text: 'Fortsätt med guider, övningar och verktyg när du vill ha mer struktur.'
		}
	];

	const usageModes = [
		{
			title: 'Anonymt utan konto',
			points: [
				'Börja skriva direkt',
				'Låg tröskel att testa',
				'Passar när du bara vill få ur dig det som känns tungt',
				'Ingen registrering för att komma igång'
			]
		},
		{
			title: 'Med konto',
			points: [
				'Spara historik och fortsätt senare',
				'Använd dagbok och uppföljning',
				'Få bättre överblick över ditt mående över tid',
				'Samla det som hjälper dig på ett ställe'
			]
		}
	];

	const features = [
		{
			title: 'Skrivstöd i text',
			description: 'Skriv av dig anonymt och få hjälp att sortera tankar, känslor och nästa steg.',
			href: '/skriv'
		},
		{
			title: 'Dagbok med reflektion',
			description: 'Skriv om dagen, följ upp det som återkommer och bygg förståelse över tid.',
			href: '/dagbok'
		},
		{
			title: 'Humörspårning',
			description: 'Följ psykiskt mående över tid och upptäck mönster som annars är lätta att missa.',
			href: '/humorsparning'
		},
		{
			title: 'Guider och övningar',
			description: 'Läs guider och prova övningar för stress, ångest, sömn och återhämtning.',
			href: '/guider'
		}
	];

	function trackHomeCta(section: string, cta: string, href: string) {
		trackHomeCtaClick({ section, cta, href });
	}

	onMount(() => {
		if (!heroEl || !bgEl) return;
		if (window.innerWidth < 768) return;
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

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
			window.removeEventListener('scroll', onScroll);
		};
	});
</script>

<SEO canonical="https://www.mittpsyke.se/" />

<svelte:head>
	<title>MittPsyke – skriv av dig anonymt och få lugnt stöd direkt</title>
	<meta
		name="description"
		content="Skriv av dig anonymt och få lugnt stöd direkt. MittPsyke hjälper dig att förstå psykiskt mående med dagbok, övningar och guider i din egen takt."
	/>
	<meta property="og:title" content="MittPsyke – skriv av dig anonymt och få lugnt stöd direkt" />
	<meta
		property="og:description"
		content="Skriv av dig anonymt och få lugnt stöd direkt. MittPsyke hjälper dig att förstå psykiskt mående med dagbok, övningar och guider i din egen takt."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />

</svelte:head>

<main class="staging-look">
	<!-- 1. Hero -->
	<section class="hero-section hero" aria-label="Introduktion till MittPsyke" bind:this={heroEl}>
		<img
			class="hero-bg"
			bind:this={bgEl}
			src="/assets/home/MittpsykeTree.jpg"
			alt=""
			aria-hidden="true"
			decoding="async"
			fetchpriority="high"
		/>
		<div class="hero-shell">
			<div class="hero-content">
				<p class="hero-eyebrow">Anonymt stöd i text</p>
				<h1>Skriv av dig anonymt och få lugnt stöd direkt</h1>
				<p>Sätt ord på det som känns svårt. Få ett lugnt svar, hjälp att sortera tankarna och små nästa steg — utan konto.</p>
				<div class="hero-actions">
					<a href="/skriv" class="hero-cta hero-cta-primary" onclick={() => trackHeroCtaPrimaryClick()}>Börja skriva anonymt</a>
					<a href="#sa-fungerar-det" class="hero-cta-link" onclick={() => trackHeroCtaSecondaryClick()}>Se hur det fungerar</a>
				</div>
				<p class="hero-trust-note">Börja utan konto. I din egen takt. Inte vård eller akuttjänst.</p>
			</div>
		</div>
	</section>

	<!-- 2. Börja där det känns lättast -->
	<section class="early-trust" aria-labelledby="early-trust-title">
		<div class="cards-narrow early-trust-inner">
			<p class="early-trust-eyebrow">Trygg start</p>
			<h2 id="early-trust-title">Känn dig trygg innan du börjar</h2>
			<ul class="early-trust-grid">
				{#each trustHighlights as item}
					<li class="early-trust-item">{item}</li>
				{/each}
			</ul>
			<p class="early-trust-note">
				Vid akut fara: <a href="tel:112">112</a>. För vårdråd:
				<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Vidare stöd:
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
			</p>
						<p class="early-trust-link">
				<a href="/integritet" onclick={() => trackHomeCta('early_trust', 'integritet', '/integritet')}>
					L�s om hur vi hanterar integritet och data
				</a>
				<span aria-hidden="true"> � </span>
				<a href="/chatta-anonymt" onclick={() => trackHomeCta('early_trust', 'chatta_anonymt_utan_konto', '/chatta-anonymt')}>
					L�s om att chatta anonymt utan konto
				</a>
			</p>
		</div>
	</section>

	<section id="sa-fungerar-det" class="quick-flow" aria-labelledby="quick-flow-title">
		<div class="cards-narrow quick-flow-inner">
			<h2 id="quick-flow-title">Så fungerar MittPsyke</h2>
			<p class="quick-flow-intro">
				Börja anonymt om du vill. Fortsätt med konto om du vill spara, följa ditt mående och komma tillbaka över tid.
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
		</div>
	</section>

	<section class="usage-compare" aria-labelledby="usage-compare-title">
		<div class="cards-narrow usage-compare-inner">
			<h2 id="usage-compare-title">Börja anonymt — fortsätt med konto om du vill</h2>
			<p class="usage-compare-intro">
				Du kan börja direkt utan konto. Om du vill spara, följa ditt mående och komma tillbaka över tid kan du skapa konto senare.
			</p>
			<div class="usage-compare-grid">
				{#each usageModes as mode}
					<article class="usage-compare-card">
						<h3>{mode.title}</h3>
						<ul>
							{#each mode.points as point}
								<li>{point}</li>
							{/each}
						</ul>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<section class="entry-paths" aria-labelledby="entry-paths-title">
		<div class="cards-narrow entry-inner">
			<h2 id="entry-paths-title">Börja där det känns lättast</h2>
			<p class="entry-intro">
				Välj det som hjälper mest just nu.
			</p>
			<div class="entry-grid">
				{#each entryPaths as path}
					<a
						class:entry-card-primary={path.featured}
						class="entry-card"
						href={path.href}
						onclick={() => trackHomeCta('entry_paths', path.title, path.href)}
					>
						<h3>{path.title}</h3>
						<p>{path.description}</p>
						<span class="entry-card-cta">{path.cta}</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- 3. Ett första steg, i din egen takt -->
	<section class="first-step" aria-labelledby="first-step-title">
		<div class="cards-narrow first-step-inner">
			<h2 id="first-step-title">Vad MittPsyke är</h2>
			<p class="first-step-body">
				Ett digitalt verktyg där du kan skriva av dig, reflektera och förstå ditt psykiska mående bättre. Du får stöd i text i din egen takt, helt anonymt om du vill. MittPsyke är inte vård eller behandling.
			</p>
			<div class="support-points">
				{#each supportPoints as point}
					<div class="support-point">
						<p class="support-label">{point.label}</p>
						<p class="support-text">{point.text}</p>
					</div>
				{/each}
			</div>
		</div>
	</section>

	<!-- 4. Mer än en chatt -->
	<section id="sa-fungerar-det-fordjupning" class="how-it-works" aria-labelledby="how-it-works-title">
		<div class="cards-narrow how-inner">
			<p class="how-eyebrow">Fördjupning</p>
			<h2 id="how-it-works-title">Mer än en chatt</h2>
			<p class="how-intro">
				När du vill fortsätta finns fler sätt att få struktur, följa ditt mående och hitta sådant som hjälper i vardagen.
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

	<!-- 5. Vad du kan använda MittPsyke till -->
	<section class="features-section" aria-labelledby="features-title">
		<div class="cards-narrow features-inner">
			<h2 id="features-title">Verktyg som hjälper dig att förstå hur du mår</h2>
			<p class="features-intro">Skriv, reflektera, följ ditt mående och ta små steg i din egen takt.</p>
			<div class="features-grid">
				{#each features as feature}
					<a class="feature-card" href={feature.href} onclick={() => trackHomeCta('features', feature.title, feature.href)}>
						<h3>{feature.title}</h3>
						<p>{feature.description}</p>
						<span class="feature-card-cta">Öppna verktyget</span>
					</a>
				{/each}
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
			<img src="/assets/home/Tryggplats.png" alt="Illustration av en trygg plats i naturen" loading="lazy" class="trust-image" />
			<div class="trust-copy">
				<h2 id="trust-title">För stöd och reflektion — inte för vård eller diagnos</h2>
				<p>
					Du kan börja anonymt utan konto och få lugnt stöd i text direkt. När du vill fortsätta finns dagbok, övningar och guider för mer struktur över tid.
				</p>
				<p class="trust-privacy">
					Du kan läsa hur integritet och data fungerar innan du delar något. Med konto kan du begära export och radering.
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
					<p><strong>Viktigt:</strong> Inte vård, diagnos, behandling eller akuttjänst</p>
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

	<!-- 9. Avslutande CTA -->
	<section class="final-cta-section" aria-label="Kom igång">
		<div class="final-cta-inner">
			<h2>Du behöver inte veta vad du ska säga.</h2>
			<p>Börja skriva direkt utan konto. Få stöd i text och fortsätt i din egen takt.</p>
			<div class="final-cta-actions">
				<a href="/skriv" class="hero-cta hero-cta-primary" onclick={() => trackHomeCta('final_cta', 'borja_skriva_nu', '/skriv')}>Börja skriva nu</a>
				<a href="/guider" class="hero-cta-link" onclick={() => trackHomeCta('final_cta', 'las_guider', '/guider')}>Läs guider</a>
			</div>
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
	}

	.hero-eyebrow {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.75);
		font-weight: 400;
		margin-bottom: 0.4rem;
		letter-spacing: 0.01em;
	}

	.hero-trust-note {
		margin-top: 0.85rem;
		font-size: 0.88rem;
		color: rgba(255, 255, 255, 0.72);
		letter-spacing: 0.01em;
	}

	.hero-actions {
		margin-top: 1.2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
	}

	.hero-cta-primary {
		background: #3a7bd5;
		color: #ffffff;
	}

	.hero-cta-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		align-self: center;
		padding: 0.35rem 0.15rem;
		font-family: var(--font-body);
		font-size: 0.92rem;
		font-weight: 500;
		letter-spacing: 0;
		color: rgba(255, 255, 255, 0.82);
		text-decoration: underline;
		text-underline-offset: 3px;
		opacity: 0.9;
	}

	.hero-cta-link:hover,
	.hero-cta-link:focus-visible {
		opacity: 1;
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

	.early-trust-item {
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
	}

	.early-trust-note {
		margin: 0.9rem 0 0;
		max-width: 72ch;
		font-size: 0.9rem;
		line-height: 1.6;
		color: rgba(220, 225, 235, 0.78);
	}

	.early-trust-note a,
	.early-trust-link a {
		color: #d7e7ff;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.early-trust-link {
		margin: 0.55rem 0 0;
		font-size: 0.9rem;
	}

	.quick-flow {
		padding: clamp(2.3rem, 6vw, 3.6rem) 1.25rem;
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

	.usage-compare {
		padding: clamp(2.3rem, 6vw, 3.6rem) 1.25rem;
		background: #111a28;
		color: #e0e4ea;
	}

	.usage-compare-inner h2 {
		margin: 0;
		color: #eef1f6;
		font-size: clamp(1.45rem, 2.9vw, 2rem);
	}

	.usage-compare-intro {
		margin: 0.72rem 0 0;
		max-width: 68ch;
		font-size: 0.96rem;
		line-height: 1.64;
		color: rgba(220, 225, 235, 0.78);
	}

	.usage-compare-grid {
		margin-top: 1rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.9rem;
	}

	.usage-compare-card {
		padding: 0.95rem 1rem;
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.12);
	}

	.usage-compare-card h3 {
		margin: 0;
		font-size: 1.02rem;
		line-height: 1.3;
		color: #eef1f6;
	}

	.usage-compare-card ul {
		margin: 0.65rem 0 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.42rem;
	}

	.usage-compare-card li {
		position: relative;
		padding-left: 0.95rem;
		font-size: 0.93rem;
		line-height: 1.56;
		color: rgba(220, 225, 235, 0.74);
	}

	.usage-compare-card li::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0.6em;
		width: 0.35rem;
		height: 0.35rem;
		border-radius: 999px;
		background: rgba(125, 180, 232, 0.86);
	}

	.first-step {
		padding: clamp(2.5rem, 7vw, 4rem) 1.25rem;
		background: #141e2e;
		color: #e0e4ea;
	}

	.first-step-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	.first-step-inner h2 {
		margin: 0;
		color: #eef1f6;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.first-step-body {
		margin: 0.75rem 0 0;
		max-width: 58ch;
		color: rgba(220, 225, 235, 0.78);
		font-family: var(--font-body);
		line-height: 1.7;
	}

	.support-points {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.85rem;
		margin-top: 1.4rem;
	}

	.support-point {
		padding: 0.9rem 1rem;
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.12);
		border-radius: var(--radius-card);
	}

	.support-label {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: rgba(160, 185, 220, 0.9);
	}

	.support-text {
		margin: 0.3rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: rgba(220, 225, 235, 0.72);
	}

	/* ── Sektion 3: Ingångar ── */
	.entry-paths {
		padding: clamp(2.8rem, 8vw, 4.4rem) 1.25rem;
		background: #111a28;
		color: #e0e4ea;
	}

	.cards-narrow {
		width: min(1080px, 100%);
		margin: 0 auto;
	}

	.entry-inner h2 {
		margin: 0;
		color: #eef1f6;
		font-size: clamp(1.55rem, 3vw, 2.1rem);
	}

	.entry-intro {
		margin: 0.75rem 0 0;
		max-width: 58ch;
		color: rgba(220, 225, 235, 0.78);
	}

	.entry-grid {
		margin-top: 1.2rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.95rem;
	}

	.entry-card {
		display: block;
		padding: 1rem;
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.12);
		color: #e0e4ea;
		transition:
			transform 180ms ease,
			border-color 180ms ease;
	}

	.entry-card:hover {
		transform: translateY(-2px);
		border-color: rgba(148, 163, 184, 0.22);
	}

	.entry-card-primary {
		border-color: rgba(125, 180, 232, 0.32);
		background:
			radial-gradient(circle at top left, rgba(58, 123, 213, 0.18), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
	}

	.entry-card h3 {
		margin: 0;
		color: #eef1f6;
		font-size: 1.08rem;
		line-height: 1.3;
	}

	.entry-card p {
		margin: 0.55rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: rgba(220, 225, 235, 0.72);
	}

	.entry-card-cta {
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


	/* ── Sektion 5: Funktioner ── */
	.features-section {
		padding: clamp(2.5rem, 7vw, 3.9rem) 1.25rem;
		background: #111a28;
		color: #e0e4ea;
	}

	.features-inner h2 {
		margin: 0;
		color: #eef1f6;
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.features-intro {
		margin: 0.75rem 0 0;
		max-width: 58ch;
		color: rgba(220, 225, 235, 0.78);
	}

	.features-grid {
		margin-top: 1.1rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.95rem;
	}

	.feature-card {
		display: block;
		padding: 1rem;
		border-radius: var(--radius-card);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
		border: 1px solid rgba(148, 163, 184, 0.12);
		color: #e0e4ea;
		transition: transform 180ms ease, border-color 180ms ease;
	}

	.feature-card:hover {
		transform: translateY(-2px);
		border-color: rgba(148, 163, 184, 0.22);
	}

	.feature-card h3 {
		margin: 0;
		color: #eef1f6;
		font-size: 1.08rem;
		line-height: 1.35;
	}

	.feature-card p {
		margin: 0.55rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: rgba(220, 225, 235, 0.72);
	}

	.feature-card-cta {
		display: inline-flex;
		align-items: center;
		align-self: start;
		margin-top: 0.9rem;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		color: #7db4e8;
		font-size: 0.88rem;
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

	/* ── Sektion 9: Avslutande CTA ── */
	.final-cta-section {
		padding: clamp(3rem, 8vw, 5.5rem) 1.25rem;
		background: #141e2e;
		color: #e0e4ea;
		text-align: center;
	}

	.final-cta-inner {
		max-width: 560px;
		margin: 0 auto;
	}

	.final-cta-inner h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		color: #eef1f6;
	}

	.final-cta-inner p {
		margin: 0.75rem 0 0;
		font-family: var(--font-body);
		line-height: 1.7;
		color: rgba(220, 225, 235, 0.78);
	}

	.final-cta-actions {
		margin-top: 1.4rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
	}

	.final-cta-actions .hero-cta {
		background: #3a7bd5;
		color: #ffffff;
	}

	.final-cta-actions .hero-cta-link {
		color: rgba(220, 225, 235, 0.82);
		text-decoration: underline;
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
		.support-points {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.9rem;
		}

		.review-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1rem;
		}
	}

	@media (min-width: 700px) {
		.usage-compare-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.quick-flow-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.early-trust-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.entry-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.05rem;
		}

		.how-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.05rem;
		}

		.features-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.05rem;
		}
	}

	@media (min-width: 1040px) {
		.early-trust-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.8rem;
		}

		.support-points {
			grid-template-columns: repeat(4, minmax(0, 1fr));
		}

		.entry-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.how-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.features-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}

	}

	/* ── Dark mode — base is already dark, just deepen slightly ── */
	:global(.dark) .first-step { background: #0d1520; }
	:global(.dark) .early-trust { background: #0e1826; }
	:global(.dark) .quick-flow { background: #0d1520; }
	:global(.dark) .usage-compare { background: #0b1320; }
	:global(.dark) .entry-paths { background: #0b1320; }
	:global(.dark) .how-it-works { background: #0e1826; }
	:global(.dark) .features-section { background: #0b1320; }
	:global(.dark) .final-cta-section { background: #0d1520; }
	:global(.dark) .review-section { background: #0a1018; }
	:global(.dark) .trust-section { background: #0a1018; }
	:global(.dark) .important-section { background: #080e16; }
</style>

