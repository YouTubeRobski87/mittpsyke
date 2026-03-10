<script lang="ts">
	import { onMount } from 'svelte';
	import { portals } from '$lib/data/portals';
	import VoiceSupport from '$lib/components/VoiceSupport.svelte';

	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;

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

<svelte:head>
	<title>Psykiskt stöd online i lugn takt | MittPsyke</title>
	<meta name="description" content="Prata anonymt, skriv dagbok och följ ditt mående över tid. MittPsyke är ett tryggt digitalt samtalsstöd när livet känns tungt." />
	<meta property="og:title" content="Psykiskt stöd online i lugn takt | MittPsyke" />
	<meta property="og:description" content="Ett tryggt digitalt stödrum för samtal, dagbok, reflektion och nästa steg när du behöver stöd." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://mittpsyke.se/" />
</svelte:head>

<main class="staging-look">
	<section class="hero-section hero" aria-label="Introduktion till MittPsyke" bind:this={heroEl}>
		<img
			class="hero-bg"
			bind:this={bgEl}
			src="/assets/home/MittpsykeTree.jpg"
			alt=""
			aria-hidden="true"
		/>
		<div class="hero-content">
			<h1>Ett tryggt rum för att landa, skriva av dig och börja i din egen takt</h1>
			<p>
				Prata anonymt när du behöver stöd i stunden. Skapa konto om du vill spara din dagbok, följa mönster över tid och få en plats att återvända till.
			</p>
			<div class="hero-actions">
				<a href="/chat/a" class="hero-cta hero-cta-primary">Börja anonymt</a>
				<a href="/register" class="hero-cta hero-cta-secondary">Skapa din egen plats</a>
			</div>
			<p class="hero-subnote">Stöd i stunden, struktur över tid</p>
			<p class="hero-support-link">
				<a href="/om-mittpsyke">Så fungerar MittPsyke</a>
				<span aria-hidden="true"> · </span>
				Behöver du mänsklig kontakt? <a href="https://stodlinjer.se" rel="noopener noreferrer" target="_blank">Öppna Stödlinjer</a>
			</p>
		</div>
	</section>


	<section class="hero-clarity" aria-label="Så fungerar MittPsyke">
		<div class="narrow hero-clarity-inner">
			<div class="clarity-item">
				<h2>1. Prata och reflektera</h2>
				<p>Du kan börja i chatten eller dagboken och sätta ord på det som känns tungt.</p>
			</div>
			<div class="clarity-item">
				<h2>2. Hitta mänskligt stöd</h2>
				<p>I MittPsyke finns Stödlinjer när du vill gå vidare till mänsklig kontakt.</p>
			</div>
			<div class="clarity-item">
				<h2>3. Akut hjälp vid behov</h2>
				<p>Vid akut fara ska du alltid ringa 112. MittPsyke ersätter inte vård.</p>
			</div>
		</div>
	</section>

	<section class="support-options" aria-label="Tre sätt att få stöd">
		<div class="narrow support-options-inner">
			<h2>Tre sätt att få stöd direkt</h2>
			<p>Välj det som känns lättast just nu.</p>
				<div class="support-grid">
				<div class="support-card">
					<h3>Börja anonymt direkt</h3>
					<p>Du kan skriva av dig och få stöd i stunden utan att behöva prestera eller förklara allt från början.</p>
					<a href="/chat/a" class="support-button">Starta chat</a>
				</div>
				<div class="support-card support-card-phone">
					<h3>Spara din resa över tid</h3>
					<p>Med konto får du en egen plats för dagbok, historik och framsteg, så att du kan följa hur ditt mående förändras över tid.</p>
					<a href="/register" class="support-button">Skapa konto</a>
				</div>
				<div class="support-card">
					<h3>Hitta väg vidare vid behov</h3>
					<p>MittPsyke ersätter inte vård, men kan vara ett första steg när du behöver landa, sortera tankar eller hitta vidare till mänskligt stöd.</p>
					<a href="https://stodlinjer.se" class="support-button" rel="noopener noreferrer" target="_blank">Se stödlinjer</a>
				</div>
				</div>
				<div class="support-path">
					<a class="support-path-card" href="https://stodlinjer.se" rel="noopener noreferrer" target="_blank">
						<h3>Stödlinjer i MittPsyke</h3>
						<p>Väg vidare till mänskligt stöd när du vill prata med någon.</p>
					</a>
					<div class="support-path-card support-path-card-urgent">
						<h3>Akut hjälp</h3>
						<p>Vid akut fara eller självmordstankar, ring alltid 112 direkt.</p>
						<a href="tel:112" class="support-button">Ring 112</a>
					</div>
				</div>
			</div>
		</section>


			<section class="account-value" aria-label="Varför skapa konto">
				<div class="narrow account-value-inner">
					<div>
						<h2>När du vill ha mer än ett samtal i stunden</h2>
						<p>Du kan börja anonymt direkt. Om du vill spara det som betyder något, skriva i dagboken och följa mönster över tid kan du skapa en egen plats i MittPsyke.</p>
					</div>
					<div class="account-value-list">
						<p><strong>Dagbok i din egen takt:</strong> skriv när du behöver landa.</p>
						<p><strong>Sparad historik och framsteg:</strong> se vad som förändras över tid.</p>
						<p><strong>En lugn plats att återvända till:</strong> stöd i stunden, struktur över tid.</p>
					</div>
					<div class="hero-actions">
						<a href="/register" class="hero-cta hero-cta-primary">Skapa konto</a>
						<a href="/om-mittpsyke" class="hero-cta hero-cta-secondary">Läs hur det fungerar</a>
					</div>
					<p class="account-return-note">Inte bara för idag. Kom tillbaka i din egen takt och följ det som förändras över tid.</p>
				</div>
			</section>


	<section class="video-section">
		<div class="video-inner">
			<h2>Se hur MittPsyke fungerar</h2>
			<p>En kort introduktion till dagboken, framsteg och AI-chatten.</p>
			<div class="video-wrapper">
				<video controls preload="none" poster="/og-image.png">
					<source src="/intro.mp4" type="video/mp4" />
					Din webbläsare stöder inte videouppspelning.
				</video>
			</div>
		</div>
	</section>

	<section class="seo-intro">
		<div class="narrow seo-inner">
			<h2>Verktyg mot ångest och personlig utveckling</h2>
			<p>
				Att hitta rätt verktyg mot ångest online kan vara avgörande. Genom vår digitala dagbok och chattfunktion kan du i din egen takt bearbeta tankar och känslor. Vi erbjuder även specialiserat <a href="/trauma">samtalsstöd vid trauma</a> för dig som behöver bearbeta svåra upplevelser i en trygg miljö.
			</p>
			<p>
				Om du vill läsa mer kan du börja här: <a href="/psykiskt-stod-online">psykiskt stöd online</a>,
				<a href="/anonymt-samtalsstod-online">anonymt samtalsstöd online</a> och
				<a href="/hjalp-vid-angest-online">hjälp vid ångest online</a>.
			</p>
			<ul class="seo-features">
				<li><strong>Anonymitet &amp; Trygghet:</strong> Vi värnar om din integritet med tystnadsplikt.</li>
				<li><strong>Enkelt att använda:</strong> Din personliga dashboard ger dig full överblick över din utveckling.</li>
				<li><strong>Erfarenhet som grund:</strong> Plattformen är byggd på förståelse och verklig expertis inom psykisk hälsa.</li>
			</ul>
		</div>
	</section>

	<section class="content-hub">
		<div class="narrow cards-narrow hub-inner">
			<h2>Guider och övningar</h2>
			<p>
				Läs strukturerade guider och prova konkreta steg som du kan använda direkt i din vardag.
			</p>
			<div class="hub-grid">
				<a class="hub-card" href="/guider">
					<h3>Guider</h3>
					<p>8 fokusområden med klusterartiklar inom psykiskt mående.</p>
					<span>Gå till guider</span>
				</a>
				<a class="hub-card" href="/ovningar">
					<h3>Övningar</h3>
					<p>Praktiska steg-för-steg-övningar för reflektion och lugn.</p>
					<span>Gå till övningar</span>
				</a>
			</div>
		</div>
	</section>

	<section class="focus-section">
		<div class="narrow cards-narrow focus-content">
			<header class="focus-header">
				<h2>Välj fokusområde</h2>
				<p>
					Du behöver inte förklara allt. Välj det som känns närmast just nu.
				</p>
			</header>
			<div class="focus-cards">
				{#each portals as portal}
					<a class="focus-card" href={`/chat/${portal.key}`}>
						<img
							class="focus-cover"
							src={portal.image}
							alt={`Bild for ${portal.title}`}
							loading="lazy"
						/>
						<div class="focus-body">
							<span class="focus-icon">{portal.icon}</span>
							<h3>{portal.title}</h3>
							<p>{portal.description}</p>
							<span class="focus-cta">Börja skriva</span>
						</div>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<VoiceSupport />

	<section class="band band-olive">
		<div class="narrow intro-grid">
			<img src="/assets/home/Tryggplats.png" alt="Trygg plats" loading="lazy" />
			<div>
				<h2>Tryggt, varsamt och tydligt avgränsat</h2>
				<p>
					MittPsyke är ett digitalt samtalsstöd för reflektion och stöd i vardagen. Du bestämmer tempot, och allt börjar i lugn takt.
				</p>
				<p>
					Tjänsten ställer inte diagnoser och ersätter inte vård, men kan hjälpa dig att stanna upp, sätta ord på det som känns och hitta nästa steg.
				</p>
				<ul>
					<li>Du bestämmer tempot</li>
					<li>Ingen diagnos eller behandling</li>
					<li>Väg vidare till mänskligt stöd vid behov</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="band band-brown">
		<div class="narrow support-columns">
			<div>
				<h2>Din väg till psykiskt stöd</h2>
				<p>
					Varje portal är specialiserad för att skapa ett mer träffsäkert och tryggt samtal.
				</p>
				<ul>
					<li>stabilt stöd för oro och ångest</li>
					<li>varsam struktur vid nedstämdhet</li>
					<li>fokus på trygghet och gränssättning vid trauma</li>
				</ul>
				<p>
					Målet är inte snabba svar, utan ett hållbart samtal där du kan landa och ta nästa steg.
				</p>
			</div>
			<img src="/assets/home/Digitalastod.PNG" alt="Digitalt stöd" loading="lazy" />
		</div>
	</section>

</main>

<style>
	.staging-look {
		width: 100%;
		color: #f5f5f2;
	}

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

	.hero-content {
		position: relative;
		z-index: 2;
		width: min(560px, 100%);
		text-align: center;
		padding: 1.3rem 1.6rem 1.6rem;
		background: rgba(39, 45, 53, 0.56);
		border: 1px solid rgba(255, 255, 255, 0.18);
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
		background: #8ca36a;
		color: #182016;
		font-weight: 700;
		border-radius: var(--radius-pill);
	}

	.hero-actions {
		margin-top: 1.2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
	}

	.hero-support-link {
		margin: 0.7rem 0 0;
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.86);
	}

	.hero-subnote {
		margin: 0.75rem auto 0;
		font-size: 0.88rem;
		color: rgba(255, 255, 255, 0.78);
	}

	.hero-support-link a {
		color: #d7e7ff;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.hero-cta-primary {
		background: #8ca36a;
		color: #182016;
	}

	.hero-cta-secondary {
		background: rgba(255, 255, 255, 0.14);
		color: #f4f6f9;
		border: 1px solid rgba(255, 255, 255, 0.28);
	}

	.hero-clarity {
		padding: 1.1rem 1.25rem 2rem;
		background: #0f1824;
	}

	.hero-clarity-inner {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.clarity-item {
		background: #1d2a39;
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 1rem;
	}

	.clarity-item h2 {
		font-size: 1rem;
		line-height: 1.3;
		margin: 0;
	}

	.clarity-item p {
		margin: 0.5rem 0 0;
		font-size: 0.94rem;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.88);
	}

	.band {
		padding: clamp(3rem, 8vw, 7rem) 1.25rem;
	}

	.band-olive {
		background: #1b2b3a;
	}

	.band-brown {
		background: #56453d;
	}

	.narrow {
		width: min(760px, 100%);
		margin: 0 auto;
	}

	.cards-narrow {
		width: min(1080px, 100%);
	}

	.intro-grid,
	.support-columns {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 1.6rem;
		align-items: center;
	}

	.intro-grid img,
	.support-columns img {
		width: 100%;
		height: clamp(220px, 30vw, 340px);
		object-fit: cover;
		border: 1px solid rgba(255, 255, 255, 0.25);
	}

	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.6rem, 3vw, 2.3rem);
		line-height: 1.1;
		letter-spacing: -0.02em;
	}

	.band p {
		margin: 0.85rem 0 0;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		font-size: 1rem;
		letter-spacing: -0.005em;
		color: rgba(255, 255, 255, 0.9);
	}

	ul {
		margin: 1rem 0 0;
		padding-left: 1.2rem;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.9);
	}

	.focus-section {
		background: #f4f6f7;
		padding: clamp(3.8rem, 10vw, 6.8rem) 1.25rem;
	}

	.content-hub {
		padding: clamp(2.8rem, 8vw, 4.2rem) 1.25rem;
		background: #23384d;
		color: #eaf3fb;
	}

	.hub-inner h2 {
		margin: 0;
		color: #f3f8fd;
		font-size: clamp(1.5rem, 2.8vw, 2rem);
	}

	.hub-inner p {
		margin: 0.75rem 0 0;
		max-width: 62ch;
		color: #c7d6e5;
	}

	.hub-grid {
		margin-top: 1.15rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.95rem;
	}

	.hub-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		background: #2d4660;
		border: 1px solid #45617d;
		transition: transform 180ms ease, background-color 180ms ease;
	}

	.hub-card:hover {
		transform: translateY(-2px);
		background: #355270;
	}

	.hub-card h3 {
		margin: 0;
		color: #f3f8fd;
		font-size: 1.05rem;
	}

	.hub-card p {
		margin: 0.55rem 0 0;
		font-size: 0.94rem;
		line-height: 1.65;
		color: #c7d6e5;
	}

	.hub-card span {
		display: inline-block;
		margin-top: 0.75rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: #d9e7f5;
	}

	.focus-content {
		color: #2c3338;
	}

	.focus-header {
		max-width: 62ch;
		margin: 0 auto 1.5rem;
		text-align: left;
	}

	.focus-header h2 {
		margin: 0;
		color: #263036;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.55rem, 3vw, 2.2rem);
		letter-spacing: -0.02em;
	}

	.focus-header p {
		margin: 0.75rem 0 0;
		color: #54626b;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		font-size: 1rem;
	}

	.focus-cards {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.95rem;
	}

	.focus-card {
		display: block;
		padding: 0.85rem;
		border-radius: var(--radius-card);
		background: #ffffff;
		border: 1px solid #e7ecef;
		color: #2c3338;
		transition: transform 180ms ease, background-color 180ms ease;
	}

	.focus-card:hover {
		transform: translateY(-2px);
		background: #fafcfc;
	}

	.focus-cover {
		display: block;
		width: 100%;
		height: clamp(150px, 28vw, 178px);
		object-fit: cover;
		border-radius: var(--radius-input);
		filter: saturate(0.88) contrast(0.96);
	}

	.focus-body {
		padding: 0.9rem 0.2rem 0.25rem;
	}

	.focus-icon {
		display: inline-flex;
		width: 2.05rem;
		height: 2.05rem;
		align-items: center;
		justify-content: center;
		font-size: 1.1rem;
		margin-bottom: 0.58rem;
		background: #edf1f2;
		border-radius: var(--radius-pill);
	}

	.focus-card h3 {
		margin: 0;
		color: #273237;
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 1.1rem;
		letter-spacing: -0.015em;
	}

	.focus-card p {
		margin: 0.6rem 0 0;
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.95rem;
		line-height: 1.7;
		color: #516069;
	}

	.focus-cta {
		display: inline-block;
		margin-top: 0.85rem;
		padding: 0.38rem 0.72rem;
		border-radius: var(--radius-pill);
		background: #e7f1ee;
		color: #2e5850;
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.005em;
	}

	.support-options {
		padding: 2rem 1.25rem 1.25rem;
		background: #172330;
	}

	.support-options-inner > h2 {
		font-size: clamp(1.35rem, 2.7vw, 1.9rem);
		color: #f3f8fd;
	}

	.support-options-inner > p {
		margin: 0.55rem 0 0;
		color: #c7d6e5;
	}

	.account-value {
		padding: 1.9rem 1.25rem 2.4rem;
		background: #f3f6f8;
		color: #263036;
	}

	.account-value-inner {
		display: grid;
		gap: 0.85rem;
	}

	.account-value-inner h2 {
		font-size: clamp(1.3rem, 2.6vw, 1.85rem);
	}

	.account-value-inner > div > p {
		margin: 0.65rem 0 0;
		color: #516069;
	}

	.account-value-list {
		display: grid;
		gap: 0.45rem;
	}

	.account-value-list p {
		margin: 0;
		padding: 0.75rem 0.85rem;
		background: #ffffff;
		border: 1px solid #dce5eb;
		border-radius: 12px;
		color: #44525a;
		font-size: 0.95rem;
	}

	.account-return-note {
		margin: 0.2rem 0 0;
		color: #54626b;
		font-size: 0.95rem;
	}

	/* Stodkort-grid */
	.support-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 30px;
		max-width: 100%;
		margin: 1rem 0 0;
		padding: 0;
	}

	.support-card {
		background: #f4f7f5;
		padding: 30px;
		border-radius: 16px;
		text-align: center;
		color: #2c3338;
	}

	.support-card h3 {
		margin: 0 0 10px;
		color: #263036;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: 1.25rem;
		letter-spacing: -0.015em;
	}

	.support-card p {
		margin: 0;
		color: #516069;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		font-size: 1rem;
	}

	.support-card-phone {
		border: 1px solid #c7d4cc;
	}

	.support-path {
		margin-top: 1rem;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 0.9rem;
	}

	.support-path-card {
		display: block;
		padding: 1rem;
		border-radius: 14px;
		background: #24384d;
		border: 1px solid rgba(255, 255, 255, 0.16);
		color: #f3f8fd;
	}

	.support-path-card h3 {
		margin: 0;
		font-size: 1.05rem;
		color: #f3f8fd;
	}

	.support-path-card p {
		margin: 0.5rem 0 0;
		color: #c7d6e5;
		font-size: 0.95rem;
		line-height: 1.6;
	}

	.support-path-card-urgent {
		background: #2a3644;
	}

	.support-path-card-urgent .support-button {
		margin-top: 0.85rem;
	}

	.support-button {
		display: inline-block;
		margin-top: 15px;
		background: #6b8e7a;
		color: white;
		padding: 12px 22px;
		border-radius: 10px;
		text-decoration: none;
		font-size: 1rem;
		font-weight: 600;
		transition: background 0.2s ease, transform 0.2s ease;
	}

	.support-button:hover {
		background: #557a66;
		transform: translateY(-2px);
	}

	.phone-number {
		margin-top: 15px;
		font-weight: 600;
		font-size: 1.1rem;
		color: #263036;
		letter-spacing: 0.02em;
	}

	@media (max-width: 900px) {
		.intro-grid,
		.support-columns {
			grid-template-columns: 1fr;
		}

		.hero-content {
			padding: 1.1rem 1rem 1.2rem;
		}

		.hero-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.hero-cta {
			width: 100%;
		}

		.hero-clarity-inner {
			grid-template-columns: 1fr;
		}
	}

	@media (min-width: 700px) {
		.focus-cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.focus-header {
			margin-bottom: 1.8rem;
		}
	}

	@media (min-width: 1040px) {
		.focus-cards {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}

	/* Dark mode */
	:global(.dark) .focus-section {
		background: #1a1c1d;
	}

	:global(.dark) .content-hub {
		background: #1b2430;
		color: #e5edf6;
	}

	:global(.dark) .hub-inner h2 {
		color: #edf3f9;
	}

	:global(.dark) .hub-inner p,
	:global(.dark) .hub-card p {
		color: #bcc9d8;
	}

	:global(.dark) .hub-card {
		background: #223041;
		border-color: #34475c;
	}

	:global(.dark) .hub-card:hover {
		background: #27384b;
	}

	:global(.dark) .hub-card h3,
	:global(.dark) .hub-card span {
		color: #e5edf6;
	}

	:global(.dark) .focus-content {
		color: #e8e6e2;
	}

	:global(.dark) .focus-header h2 {
		color: #f0eeea;
	}

	:global(.dark) .focus-header p {
		color: rgba(255, 255, 255, 0.65);
	}

	:global(.dark) .focus-card {
		background: #232526;
		border-color: rgba(255, 255, 255, 0.08);
		color: #e8e6e2;
	}

	:global(.dark) .focus-card:hover {
		background: #2a2c2e;
	}

	:global(.dark) .focus-icon {
		background: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .focus-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .focus-card p {
		color: rgba(255, 255, 255, 0.65);
	}

	:global(.dark) .focus-cta {
		background: rgba(134, 223, 214, 0.12);
		color: #86dfd6;
	}

	:global(.dark) .band-olive {
		background: #1b2b3a;
	}

	:global(.dark) .band-brown {
		background: #3a2e28;
	}

	:global(.dark) .hero-clarity {
		background: #12181f;
	}

	:global(.dark) .clarity-item {
		background: #1b2028;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .support-card {
		background: #1e2422;
		color: #e8e6e2;
	}

	:global(.dark) .support-options {
		background: #1a2129;
	}

	:global(.dark) .support-options-inner > h2 {
		color: #f0eeea;
	}

	:global(.dark) .support-options-inner > p {
		color: rgba(255, 255, 255, 0.65);
	}

	:global(.dark) .account-value {
		background: #171b20;
		color: #ece7e1;
	}

	:global(.dark) .account-value-inner > div > p {
		color: rgba(255, 255, 255, 0.72);
	}

	:global(.dark) .account-value-list p {
		background: #222830;
		border-color: rgba(255, 255, 255, 0.12);
		color: rgba(255, 255, 255, 0.82);
	}

	:global(.dark) .account-return-note {
		color: rgba(255, 255, 255, 0.72);
	}

	:global(.dark) .support-path-card {
		background: #1f2a36;
		border-color: rgba(255, 255, 255, 0.14);
	}

	:global(.dark) .support-path-card-urgent {
		background: #252d36;
	}

	:global(.dark) .support-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .support-card p {
		color: rgba(255, 255, 255, 0.65);
	}

	:global(.dark) .phone-number {
		color: #f0eeea;
	}

	.seo-intro {
		padding: clamp(2.5rem, 6vw, 4rem) 1.25rem;
		background: #f4f6f7;
		color: #2c3338;
	}

	.seo-inner {
		max-width: 760px;
	}

	.seo-intro h2 {
		margin: 0 0 1rem;
		color: #263036;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.5rem, 2.8vw, 2rem);
		letter-spacing: -0.02em;
	}

	.seo-intro p {
		margin: 0;
		color: #516069;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.75;
		font-size: 1rem;
	}

	.seo-intro a {
		color: #0f766e;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.seo-features {
		margin: 1.2rem 0 0;
		padding-left: 1.4rem;
		color: #516069;
		font-family: var(--font-body);
		line-height: 1.75;
	}

	.seo-features li + li {
		margin-top: 0.5rem;
	}

	:global(.dark) .seo-intro {
		background: #1a1c1d;
		color: #e8e6e2;
	}

	:global(.dark) .seo-intro h2 {
		color: #f0eeea;
	}

	:global(.dark) .seo-intro p,
	:global(.dark) .seo-features {
		color: rgba(255, 255, 255, 0.65);
	}


	.video-section {
		padding: clamp(2.5rem, 6vw, 4rem) 1.25rem;
		background: #1b2b3a;
		text-align: center;
		color: #f5f5f2;
	}

	.video-inner {
		max-width: 760px;
		margin: 0 auto;
	}

	.video-inner h2 {
		margin: 0 0 0.6rem;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.5rem, 2.8vw, 2rem);
		letter-spacing: -0.02em;
		color: #f3f8fd;
	}

	.video-inner p {
		margin: 0 0 1.5rem;
		color: #c7d6e5;
		font-family: var(--font-body);
		line-height: 1.7;
	}

	.video-wrapper {
		position: relative;
		width: 100%;
		border-radius: var(--radius-card);
		overflow: hidden;
		box-shadow: 0 8px 32px rgba(0,0,0,0.4);
	}

	.video-wrapper video {
		width: 100%;
		display: block;
		border-radius: var(--radius-card);
	}


</style>


