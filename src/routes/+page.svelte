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
			title: 'BÃ¶rja skriva',
			description: 'Skriv av dig anonymt och fÃ¥ lugnt stÃ¶d direkt.',
			href: '/skriv',
			cta: 'BÃ¶rja skriva nu',
			featured: true
		},
		{
			title: 'FÃ¶lj ditt mÃ¥ende',
			description: 'Spara och fÃ¶lj mÃ¶nster Ã¶ver tid.',
			href: '/register',
			cta: 'Skapa konto fÃ¶r att spara'
		},
		{
			title: 'Prova en Ã¶vning',
			description: 'Ta ett konkret steg hÃ¤r och nu.',
			href: '/ovningar',
			cta: 'Starta en Ã¶vning'
		},
		{
			title: 'LÃ¤s guider',
			description: 'FÃ¥ mer fÃ¶rstÃ¥else i din egen takt.',
			href: '/guider',
			cta: 'LÃ¤s guider'
		}
	];

	const supportPoints = [
		{
			label: 'Direkt stÃ¶d',
			text: 'Du fÃ¥r lugna svar, hjÃ¤lp att sÃ¤tta ord pÃ¥ det du kÃ¤nner och smÃ¥ nÃ¤sta steg.'
		},
		{
			label: 'Helt anonymt',
			text: 'Inget konto behÃ¶vs. Ingen data kopplas till dig som person.'
		},
		{
			label: 'I din egen takt',
			text: 'Skriv nÃ¤r du vill, sÃ¥ lite eller mycket du vill. Inget schema, inga krav.'
		},
		{
			label: 'Inte vÃ¥rd',
			text: 'Ett stÃ¶d fÃ¶r reflektion i vardagen â€” inte ersÃ¤ttning fÃ¶r professionell hjÃ¤lp.'
		}
	];

	const trustHighlights = [
		'BÃ¶rja skriva anonymt utan konto',
		'MittPsyke Ã¤r stÃ¶d fÃ¶r reflektion, inte vÃ¥rd eller akuthjÃ¤lp',
		'Se hur data hanteras innan du bÃ¶rjar',
		'Med konto finns mÃ¶jlighet till export och radering',
		'Vid akut lÃ¤ge hÃ¤nvisas du vidare till rÃ¤tt hjÃ¤lp'
	];

	const quickFlowSteps = [
		{
			title: 'BÃ¶rja skriva direkt',
			text: 'Du kan skriva anonymt utan konto och komma igÃ¥ng i lugn takt.'
		},
		{
			title: 'FÃ¥ stÃ¶d i text',
			text: 'SÃ¤tt ord pÃ¥ det som kÃ¤nns svÃ¥rt, rÃ¶rigt eller tungt.'
		},
		{
			title: 'Spara om du vill fortsÃ¤tta',
			text: 'Med konto kan du spara historik, anvÃ¤nda dagbok och fÃ¶lja ditt mÃ¥ende Ã¶ver tid.'
		},
		{
			title: 'AnvÃ¤nd det som hjÃ¤lper mest',
			text: 'FortsÃ¤tt med guider, Ã¶vningar och verktyg nÃ¤r du vill ha mer struktur.'
		}
	];

	const usageModes = [
		{
			title: 'Anonymt utan konto',
			points: [
				'BÃ¶rja skriva direkt',
				'LÃ¥g trÃ¶skel att testa',
				'Passar nÃ¤r du bara vill fÃ¥ ur dig det som kÃ¤nns tungt',
				'Ingen registrering fÃ¶r att komma igÃ¥ng'
			]
		},
		{
			title: 'Med konto',
			points: [
				'Spara historik och fortsÃ¤tt senare',
				'AnvÃ¤nd dagbok och uppfÃ¶ljning',
				'FÃ¥ bÃ¤ttre Ã¶verblick Ã¶ver ditt mÃ¥ende Ã¶ver tid',
				'Samla det som hjÃ¤lper dig pÃ¥ ett stÃ¤lle'
			]
		}
	];

	const features = [
		{
			title: 'SkrivstÃ¶d i text',
			description: 'Skriv av dig anonymt och fÃ¥ hjÃ¤lp att sortera tankar, kÃ¤nslor och nÃ¤sta steg.',
			href: '/skriv'
		},
		{
			title: 'Dagbok med reflektion',
			description: 'Skriv om dagen, fÃ¶lj upp det som Ã¥terkommer och bygg fÃ¶rstÃ¥else Ã¶ver tid.',
			href: '/dagbok'
		},
		{
			title: 'HumÃ¶rspÃ¥rning',
			description: 'FÃ¶lj psykiskt mÃ¥ende Ã¶ver tid och upptÃ¤ck mÃ¶nster som annars Ã¤r lÃ¤tta att missa.',
			href: '/humorsparning'
		},
		{
			title: 'Guider och Ã¶vningar',
			description: 'LÃ¤s guider och prova Ã¶vningar fÃ¶r stress, Ã¥ngest, sÃ¶mn och Ã¥terhÃ¤mtning.',
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
	<title>MittPsyke â€“ skriv av dig anonymt och fÃ¥ lugnt stÃ¶d direkt</title>
	<meta
		name="description"
		content="Skriv av dig anonymt och fÃ¥ lugnt stÃ¶d direkt. MittPsyke hjÃ¤lper dig att fÃ¶rstÃ¥ psykiskt mÃ¥ende med dagbok, Ã¶vningar och guider i din egen takt."
	/>
	<meta property="og:title" content="MittPsyke â€“ skriv av dig anonymt och fÃ¥ lugnt stÃ¶d direkt" />
	<meta
		property="og:description"
		content="Skriv av dig anonymt och fÃ¥ lugnt stÃ¶d direkt. MittPsyke hjÃ¤lper dig att fÃ¶rstÃ¥ psykiskt mÃ¥ende med dagbok, Ã¶vningar och guider i din egen takt."
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
				<p class="hero-eyebrow">Anonymt stÃ¶d i text</p>
				<h1>Skriv av dig anonymt och fÃ¥ lugnt stÃ¶d direkt</h1>
				<p>SÃ¤tt ord pÃ¥ det som kÃ¤nns svÃ¥rt. FÃ¥ ett lugnt svar, hjÃ¤lp att sortera tankarna och smÃ¥ nÃ¤sta steg â€” utan konto.</p>
				<div class="hero-actions">
					<a href="/skriv" class="hero-cta hero-cta-primary" onclick={() => trackHeroCtaPrimaryClick()}>BÃ¶rja skriva anonymt</a>
					<a href="#sa-fungerar-det" class="hero-cta-link" onclick={() => trackHeroCtaSecondaryClick()}>Se hur det fungerar</a>
				</div>
				<p class="hero-trust-note">BÃ¶rja utan konto. I din egen takt. Inte vÃ¥rd eller akuttjÃ¤nst.</p>
			</div>
		</div>
	</section>

	<!-- 2. BÃ¶rja dÃ¤r det kÃ¤nns lÃ¤ttast -->
	<section class="early-trust" aria-labelledby="early-trust-title">
		<div class="cards-narrow early-trust-inner">
			<p class="early-trust-eyebrow">Trygg start</p>
			<h2 id="early-trust-title">KÃ¤nn dig trygg innan du bÃ¶rjar</h2>
			<ul class="early-trust-grid">
				{#each trustHighlights as item}
					<li class="early-trust-item">{item}</li>
				{/each}
			</ul>
			<p class="early-trust-note">
				Vid akut fara: <a href="tel:112">112</a>. FÃ¶r vÃ¥rdrÃ¥d:
				<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Vidare stÃ¶d:
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
			</p>
						<p class="early-trust-link">
				<a href="/integritet" onclick={() => trackHomeCta('early_trust', 'integritet', '/integritet')}>
					Läs om hur vi hanterar integritet och data
				</a>
				<span aria-hidden="true"> · </span>
				<a href="/chatta-anonymt" onclick={() => trackHomeCta('early_trust', 'chatta_anonymt_utan_konto', '/chatta-anonymt')}>
					Läs om att chatta anonymt utan konto
				</a>
			</p>
		</div>
	</section>

	<section id="sa-fungerar-det" class="quick-flow" aria-labelledby="quick-flow-title">
		<div class="cards-narrow quick-flow-inner">
			<h2 id="quick-flow-title">SÃ¥ fungerar MittPsyke</h2>
			<p class="quick-flow-intro">
				BÃ¶rja anonymt om du vill. FortsÃ¤tt med konto om du vill spara, fÃ¶lja ditt mÃ¥ende och komma tillbaka Ã¶ver tid.
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
			<h2 id="usage-compare-title">BÃ¶rja anonymt â€” fortsÃ¤tt med konto om du vill</h2>
			<p class="usage-compare-intro">
				Du kan bÃ¶rja direkt utan konto. Om du vill spara, fÃ¶lja ditt mÃ¥ende och komma tillbaka Ã¶ver tid kan du skapa konto senare.
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
			<h2 id="entry-paths-title">BÃ¶rja dÃ¤r det kÃ¤nns lÃ¤ttast</h2>
			<p class="entry-intro">
				VÃ¤lj det som hjÃ¤lper mest just nu.
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

	<!-- 3. Ett fÃ¶rsta steg, i din egen takt -->
	<section class="first-step" aria-labelledby="first-step-title">
		<div class="cards-narrow first-step-inner">
			<h2 id="first-step-title">Vad MittPsyke Ã¤r</h2>
			<p class="first-step-body">
				Ett digitalt verktyg dÃ¤r du kan skriva av dig, reflektera och fÃ¶rstÃ¥ ditt psykiska mÃ¥ende bÃ¤ttre. Du fÃ¥r stÃ¶d i text i din egen takt, helt anonymt om du vill. MittPsyke Ã¤r inte vÃ¥rd eller behandling.
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

	<!-- 4. Mer Ã¤n en chatt -->
	<section id="sa-fungerar-det-fordjupning" class="how-it-works" aria-labelledby="how-it-works-title">
		<div class="cards-narrow how-inner">
			<p class="how-eyebrow">FÃ¶rdjupning</p>
			<h2 id="how-it-works-title">Mer Ã¤n en chatt</h2>
			<p class="how-intro">
				NÃ¤r du vill fortsÃ¤tta finns fler sÃ¤tt att fÃ¥ struktur, fÃ¶lja ditt mÃ¥ende och hitta sÃ¥dant som hjÃ¤lper i vardagen.
			</p>
			<div class="how-grid">
				<article class="how-card">
					<h3>Dagbok och reflektion</h3>
					<p>Skriv mer sammanhÃ¤ngande och sÃ¤tt ord pÃ¥ det som Ã¥terkommer.</p>
					<a class="how-card-cta" href="/dagbok" onclick={() => trackHomeCta('how_it_works', 'oppna_dagboken', '/dagbok')}>Ã–ppna dagboken</a>
				</article>
				<article class="how-card">
					<h3>UppfÃ¶ljning Ã¶ver tid</h3>
					<p>Se mÃ¶nster i hur du mÃ¥r och fÃ¥ bÃ¤ttre Ã¶verblick Ã¶ver perioder.</p>
					<a class="how-card-cta" href="/humorsparning" onclick={() => trackHomeCta('how_it_works', 'folj_maendet', '/humorsparning')}>FÃ¶lj mÃ¥endet</a>
				</article>
				<article class="how-card">
					<h3>Guider och Ã¶vningar</h3>
					<p>FÃ¥ tydliga fÃ¶rklaringar och konkreta Ã¶vningar fÃ¶r vardagens utmaningar.</p>
					<a class="how-card-cta" href="/guider" onclick={() => trackHomeCta('how_it_works', 'utforska_stod', '/guider')}>Utforska stÃ¶d</a>
				</article>
				<article class="how-card">
					<h3>StÃ¶d att Ã¥tervÃ¤nda till</h3>
					<p>Samla det som hjÃ¤lper dig sÃ¥ att du lÃ¤tt kan fortsÃ¤tta dÃ¤r du var.</p>
					<a class="how-card-cta" href="/register" onclick={() => trackHomeCta('how_it_works', 'fortsatt_over_tid', '/register')}>FortsÃ¤tt Ã¶ver tid</a>
				</article>
			</div>
		</div>
	</section>

	<!-- 5. Vad du kan anvÃ¤nda MittPsyke till -->
	<section class="features-section" aria-labelledby="features-title">
		<div class="cards-narrow features-inner">
			<h2 id="features-title">Verktyg som hjÃ¤lper dig att fÃ¶rstÃ¥ hur du mÃ¥r</h2>
			<p class="features-intro">Skriv, reflektera, fÃ¶lj ditt mÃ¥ende och ta smÃ¥ steg i din egen takt.</p>
			<div class="features-grid">
				{#each features as feature}
					<a class="feature-card" href={feature.href} onclick={() => trackHomeCta('features', feature.title, feature.href)}>
						<h3>{feature.title}</h3>
						<p>{feature.description}</p>
						<span class="feature-card-cta">Ã–ppna verktyget</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- 6. Social proof -->
	<section class="review-section" aria-labelledby="review-section-title">
		<div class="cards-narrow review-inner">
			<h2 id="review-section-title">SÃ¥ beskriver andra sin upplevelse</h2>
			<div class="review-grid">
				<blockquote class="review-card">
					<p>&ldquo;Jag skrev i nÃ¥gra minuter och kÃ¤nde mig mindre uppjagad.&rdquo;</p>
					<cite>Anonym anvÃ¤ndare</cite>
				</blockquote>
				<blockquote class="review-card">
					<p>&ldquo;FrÃ¥gorna hjÃ¤lpte mig sortera vad som var viktigast just dÃ¥.&rdquo;</p>
					<cite>Anonym anvÃ¤ndare</cite>
				</blockquote>
				<blockquote class="review-card">
					<p>&ldquo;NÃ¤r jag kom tillbaka sÃ¥g jag mÃ¶nster i sÃ¶mn och stress.&rdquo;</p>
					<cite>Anonym anvÃ¤ndare</cite>
				</blockquote>
			</div>
		</div>
	</section>

	<VoiceSupport />

	<!-- 7. Trygghet och avgrÃ¤nsning -->
	<section class="trust-section" aria-labelledby="trust-title">
		<div class="cards-narrow trust-inner">
			<img src="/assets/home/Tryggplats.png" alt="Illustration av en trygg plats i naturen" loading="lazy" class="trust-image" />
			<div class="trust-copy">
				<h2 id="trust-title">FÃ¶r stÃ¶d och reflektion â€” inte fÃ¶r vÃ¥rd eller diagnos</h2>
				<p>
					Du kan bÃ¶rja anonymt utan konto och fÃ¥ lugnt stÃ¶d i text direkt. NÃ¤r du vill fortsÃ¤tta finns dagbok, Ã¶vningar och guider fÃ¶r mer struktur Ã¶ver tid.
				</p>
				<p class="trust-privacy">
					Du kan lÃ¤sa hur integritet och data fungerar innan du delar nÃ¥got. Med konto kan du begÃ¤ra export och radering.
					<a href="/integritet" onclick={() => trackHomeCta('trust_section', 'integritetspolicy', '/integritet')}>LÃ¤s integritetspolicyn</a>.
				</p>
				<p class="trust-research">
					Vid akut fara, ring <a href="tel:112">112</a>. FÃ¶r vÃ¥rdrÃ¥d, kontakta
					<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. FÃ¶r vidare stÃ¶d finns
					<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
				</p>
				<div class="trust-facts" aria-label="AvsÃ¤ndare och ansvar">
					<p><strong>Drivs i Sverige av:</strong> Robert Claesson</p>
					<p><strong>Kontakt:</strong> <a href={PUBLIC_CONTACT_MAILTO}>{PUBLIC_CONTACT_EMAIL}</a></p>
					<p><strong>Viktigt:</strong> Inte vÃ¥rd, diagnos, behandling eller akuttjÃ¤nst</p>
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
	<section class="final-cta-section" aria-label="Kom igÃ¥ng">
		<div class="final-cta-inner">
			<h2>Du behÃ¶ver inte veta vad du ska sÃ¤ga.</h2>
			<p>BÃ¶rja skriva direkt utan konto. FÃ¥ stÃ¶d i text och fortsÃ¤tt i din egen takt.</p>
			<div class="final-cta-actions">
				<a href="/skriv" class="hero-cta hero-cta-primary" onclick={() => trackHomeCta('final_cta', 'borja_skriva_nu', '/skriv')}>BÃ¶rja skriva nu</a>
				<a href="/guider" class="hero-cta-link" onclick={() => trackHomeCta('final_cta', 'las_guider', '/guider')}>LÃ¤s guider</a>
			</div>
		</div>
	</section>
</main>

<style>
	.staging-look {
		width: 100%;
		color: #f5f5f2;
	}

	/* â”€â”€ Hero â”€â”€ */
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

	/* â”€â”€ Sektion 2: FÃ¶rsta steget â”€â”€ */
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

	/* â”€â”€ Sektion 3: IngÃ¥ngar â”€â”€ */
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

	/* â”€â”€ Sektion 4: SÃ¥ fungerar det â”€â”€ */
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


	/* â”€â”€ Sektion 5: Funktioner â”€â”€ */
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

	/* â”€â”€ Social proof â”€â”€ */
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

	/* â”€â”€ Sektion 7: Trygghet â”€â”€ */
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

	/* â”€â”€ Sektion 8: Viktigt att veta â”€â”€ */
	.important-section {
		padding: clamp(2rem, 5vw, 3.5rem) 1.25rem;
		background: #1a2530;
		color: #f5f5f2;
	}

	.important-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	/* â”€â”€ Sektion 9: Avslutande CTA â”€â”€ */
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

	/* â”€â”€ Gemensamma typografi â”€â”€ */
	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	/* â”€â”€ Responsivt â”€â”€ */
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

	/* â”€â”€ Dark mode â€” base is already dark, just deepen slightly â”€â”€ */
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

