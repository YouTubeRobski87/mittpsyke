<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import { PUBLIC_CONTACT_MAILTO } from '$lib/contact';

	const contactHref = `${PUBLIC_CONTACT_MAILTO}?subject=${encodeURIComponent('Förfrågan från organisation')}`;
</script>

<SEO canonical="https://www.mittpsyke.se/for-organisationer" />

<svelte:head>
	<title>MittPsyke för företag och organisationer</title>
	<meta
		name="description"
		content="Utforska hur MittPsyke kan användas som ett lågtröskligt digitalt stöd för psykiskt välbefinnande i företag, föreningar och organisationer."
	/>
</svelte:head>

<main class="page">
	<div class="page-container">
		<Breadcrumbs items={[{ label: 'För organisationer' }]} />

		<header class="hero">
			<p class="eyebrow">För företag och organisationer</p>
			<h1>Ett lågtröskligt stöd för psykiskt välbefinnande</h1>
			<p class="hero-intro">
				MittPsyke ger människor en lugn plats att skriva, sortera tankar och följa sitt mående.
				För organisationer kan plattformen bli ett tillgängligt komplement i arbetet med
				välbefinnande och tidigt stöd.
			</p>
			<div class="hero-actions">
				<a class="button button-primary" href={contactHref}>Kontakta MittPsyke</a>
				<a class="button button-secondary" href="/sa-fungerar-mittpsyke">Se hur MittPsyke fungerar</a>
			</div>
		</header>

		<section class="section" aria-labelledby="uses-title">
			<h2 id="uses-title">Så kan MittPsyke användas</h2>
			<div class="card-grid uses-grid">
				<article class="card">
					<h3>För medarbetare</h3>
					<p>Ett anonymt och lättillgängligt första steg för den som behöver skriva av sig eller skapa mer struktur i sina tankar.</p>
				</article>
				<article class="card">
					<h3>För föreningar och medlemsorganisationer</h3>
					<p>Ett digitalt stöd som kan erbjudas som en del av ett bredare välbefinnande- eller medlemsinitiativ.</p>
				</article>
				<article class="card">
					<h3>För projekt och målgrupper</h3>
					<p>Ett anpassningsbart upplägg för verksamheter som vill erbjuda lågtröskligt stöd utan att presentera tjänsten som vård.</p>
				</article>
			</div>
		</section>

		<section class="section feature-section" aria-labelledby="features-title">
			<div>
				<h2 id="features-title">En plats att återvända till</h2>
				<p>MittPsyke samlar flera lugna vägar för egen reflektion. Användaren väljer själv hur och när den vill börja.</p>
			</div>
			<ul class="feature-list">
				<li>Anonym start utan konto</li>
				<li>Reflekterande AI-chatt</li>
				<li>Dagbok och humörspårning</li>
				<li>Guider och kunskapsinnehåll</li>
				<li>Möjlighet att spara och följa utveckling över tid</li>
				<li>Tydliga gränser mot vård och behandling</li>
			</ul>
		</section>

		<section class="section" aria-labelledby="why-title">
			<h2 id="why-title">Byggt för låg tröskel och hög tydlighet</h2>
			<div class="card-grid values-grid">
				<article class="card"><h3>Svensk kontext</h3><p>Språk, hänvisningar och information är anpassade för en svensk vardag.</p></article>
				<article class="card"><h3>Enkel start</h3><p>Det går att börja utan konto och utan krav på att formulera allt perfekt.</p></article>
				<article class="card"><h3>Lugn och mänsklig ton</h3><p>Stödet är utformat för reflektion i egen takt, med tydliga och varsamma ramar.</p></article>
				<article class="card"><h3>Öppenhet och integritet</h3><p>Det ska vara lätt att förstå hur tjänsten fungerar, vad den är till för och vilka gränser som gäller.</p></article>
				<article class="card"><h3>Ett stöd mellan steg</h3><p>MittPsyke kan vara en plats för självreflektion och ett komplement när professionell vård behövs eller redan finns.</p></article>
				<article class="card"><h3>Öppen avsändare</h3><p>MittPsyke är byggt ur egen erfarenhet och med tydlig information om vem som står bakom.</p></article>
			</div>
		</section>

		<section class="section privacy-section" aria-labelledby="privacy-title">
			<h2 id="privacy-title">Integritet först</h2>
			<p>
				Det som en person väljer att dela i MittPsyke används inte för marknadsföringsändamål.
				Användaren styr själv vad som skrivs och vad som sparas. MittPsyke ersätter inte vård
				eller behandling.
			</p>
			<p>
				Om MittPsyke används i ett organisationssammanhang behöver upplägget alltid utgå från
				tydliga principer för integritet och samtycke.
			</p>
			<nav class="related-links" aria-label="Mer om integritet och ansvar">
				<a href="/integritet">Integritetspolicy</a>
				<a href="/redaktionell-metod">Redaktionell metod</a>
				<a href="/om-skaparen">Om skaparen</a>
			</nav>
		</section>

		<section class="contact-section" aria-labelledby="contact-title">
			<h2 id="contact-title">Utforska ett upplägg tillsammans</h2>
			<p>
				Är du verksam inom ett företag, en förening eller en organisation och vill undersöka hur
				MittPsyke kan användas? Hör av dig så tar vi ett första samtal om behov, målgrupp och
				lämpligt upplägg. Upplägg för organisationer kan anpassas efter behov.
			</p>
			<a class="button button-primary" href={contactHref}>Kontakta MittPsyke</a>
		</section>
	</div>
</main>

<style>
	.page { padding: clamp(2rem, 6vw, 4.5rem) 1.25rem clamp(3.5rem, 8vw, 6rem); }
	.page-container { width: min(1080px, 100%); margin: 0 auto; }
	.hero { max-width: 760px; padding: clamp(1.5rem, 4vw, 2.5rem) 0 clamp(2.5rem, 6vw, 4rem); }
	.eyebrow { margin: 0 0 0.5rem; color: var(--color-primary, #345b37); font-family: var(--font-heading); font-size: 0.85rem; font-weight: 700; letter-spacing: 0.07em; text-transform: uppercase; }
	h1, h2, h3 { font-family: var(--font-heading); letter-spacing: -0.02em; }
	h1 { margin: 0; font-size: clamp(2rem, 4vw, 3.1rem); line-height: 1.08; }
	h2 { margin: 0; font-size: clamp(1.5rem, 2.8vw, 2.1rem); line-height: 1.15; }
	h3 { margin: 0; font-size: 1.06rem; line-height: 1.3; }
	p { font-family: var(--font-body); font-size: 1rem; line-height: 1.7; }
	.hero-intro { margin: 1rem 0 0; font-size: clamp(1.03rem, 1.4vw, 1.15rem); }
	.hero-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 1.5rem; }
	.button { display: inline-flex; align-items: center; justify-content: center; min-height: 2.8rem; padding: 0.68rem 1rem; border-radius: var(--radius-pill); font-family: var(--font-heading); font-size: 0.94rem; font-weight: 700; text-decoration: none; }
	.button-primary { background: var(--color-primary, #345b37); color: white; }
	.button-secondary { border: 1px solid color-mix(in srgb, currentColor 20%, transparent); color: inherit; }
	.section { padding: clamp(2rem, 5vw, 3.5rem) 0; border-top: 1px solid rgba(0, 0, 0, 0.1); }
	.section > p { max-width: 720px; margin: 0.8rem 0 0; }
	.card-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; margin-top: 1.25rem; }
	.card { padding: 1.15rem; border: 1px solid rgba(0, 0, 0, 0.1); border-radius: var(--radius-card); background: rgba(52, 91, 55, 0.045); }
	.card p { margin: 0.55rem 0 0; font-size: 0.95rem; }
	.feature-section { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: clamp(1.2rem, 4vw, 4rem); align-items: start; }
	.feature-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.7rem; margin: 0; padding: 0; list-style: none; }
	.feature-list li { padding: 0.85rem 0.9rem; border-radius: var(--radius-card); background: rgba(52, 91, 55, 0.075); font-family: var(--font-body); font-size: 0.95rem; line-height: 1.45; }
	.privacy-section { padding-left: clamp(1rem, 3vw, 1.5rem); padding-right: clamp(1rem, 3vw, 1.5rem); border: 0; border-radius: var(--radius-card); background: rgba(52, 91, 55, 0.07); }
	.related-links { display: flex; flex-wrap: wrap; gap: 1rem; margin-top: 1rem; }
	.related-links a { color: inherit; font-family: var(--font-heading); font-size: 0.94rem; text-decoration: underline; text-underline-offset: 3px; }
	.contact-section { margin-top: clamp(2rem, 5vw, 3.5rem); padding: clamp(1.5rem, 4vw, 2.5rem); border-radius: var(--radius-card); background: var(--color-primary, #345b37); color: white; }
	.contact-section p { max-width: 720px; margin: 0.8rem 0 0; }
	.contact-section .button { margin-top: 1.2rem; background: white; color: var(--color-primary, #345b37); }
	:global(.dark) .section { border-color: rgba(255, 255, 255, 0.12); }
	:global(.dark) .card { border-color: rgba(255, 255, 255, 0.12); background: rgba(255, 255, 255, 0.04); }
	:global(.dark) .feature-list li { background: rgba(255, 255, 255, 0.06); }
	:global(.dark) .privacy-section { background: rgba(255, 255, 255, 0.05); }
	@media (max-width: 720px) { .card-grid, .feature-section, .feature-list { grid-template-columns: 1fr; } .hero-actions { flex-direction: column; align-items: stretch; } }
</style>
