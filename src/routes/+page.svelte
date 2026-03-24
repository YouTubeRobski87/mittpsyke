<script lang="ts">
	import { onMount } from 'svelte';
	import { blogPosts } from '$lib/data/blogg';
	import HomeSafetyStrip from '$lib/components/HomeSafetyStrip.svelte';
	import ResearchEvidenceCard from '$lib/components/ResearchEvidenceCard.svelte';
	import { portals } from '$lib/data/portals';
	import VoiceSupport from '$lib/components/VoiceSupport.svelte';
	import { trackHeroCtaPrimaryClick, trackHeroCtaSecondaryClick } from '$lib/analytics';

	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;
	const entryPaths = [
		{
			title: 'Jag behöver stöd nu',
			description: 'Få ett lugnt första steg direkt, utan att behöva formulera allt perfekt.',
			href: '/skriv',
			cta: 'Börja anonymt'
		},
		{
			title: 'Jag vill förstå mitt mående',
			description: 'Läs guider om ångest, stress, trauma och andra vanliga tillstånd.',
			href: '/guider',
			cta: 'Läs guider'
		},
		{
			title: 'Jag vill ha konkreta steg',
			description: 'Börja med enkla övningar och små handlingar som går att göra idag.',
			href: '/ovningar',
			cta: 'Se övningar'
		},
		{
			title: 'Jag vill följa min utveckling',
			description: 'Skriv dagbok, spara reflektioner och se din resa över tid.',
			href: '/register',
			cta: 'Skapa konto'
		}
	];
	const featureHighlights = [
		{
			title: 'Journalföring',
			description: 'Skriv av dig i lugn och ro och få mer struktur i tankar och känslor.',
			href: '/journalforing',
			cta: 'Läs mer'
		},
		{
			title: 'Humörspårning',
			description: 'Följ ditt mående över tid och upptäck mönster i vardagen.',
			href: '/humorsparning',
			cta: 'Läs mer'
		}
	];

	const commonSearchIntents = [
		{
			title: 'Hjälp mot oro',
			description: 'För dig som fastnar i ältande tankar och vill ha ett lugnare sätt att börja.',
			href: '/oro'
		},
		{
			title: 'Stöd vid stress',
			description: 'När kroppen går på högvarv och det är svårt att varva ner.',
			href: '/stress'
		},
		{
			title: 'Hjälp vid panikattack',
			description: 'Snabba steg och tydlig information när allt känns starkt på en gång.',
			href: '/panikattack'
		},
		{
			title: 'Prata anonymt online',
			description: 'Ett första steg för den som söker någon att prata med utan konto.',
			href: '/prata-anonymt-online'
		}
	];
	const latestBlogPosts = blogPosts.slice(0, 3);

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
	<title>MittPsyke – AI-dagbok för mental hälsa</title>
	<meta
		name="description"
		content="Skriv dagbok med AI-stöd, spåra ditt humör och förstå dina känslomönster. MittPsyke är din personliga digitala dagbok för välmående."
	/>
	<meta property="og:title" content="MittPsyke – AI-dagbok för mental hälsa" />
	<meta
		property="og:description"
		content="Skriv dagbok med AI-stöd, spåra ditt humör och förstå dina känslomönster. MittPsyke är din personliga digitala dagbok för välmående."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/" />
</svelte:head>

<main class="staging-look">
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
			<div class="hero-content">
				<p class="hero-eyebrow">Om du mår dåligt och inte vet var du ska börja</p>
				<h1>MittPsyke är en lugn plats att börja på.</h1>
				<p>
					Skriv av dig direkt — utan konto eller registrering.<br />
				Skapar du ett konto kan du spara din dagbok, följa ditt mående över tid i en graf, få en sammanfattning, se dina framsteg och hitta tillbaka till det du skrivit senare.

				</p>
				<div class="hero-actions">
					<a href="/skriv" class="hero-cta hero-cta-primary" onclick={() => trackHeroCtaPrimaryClick()}>Börja skriva anonymt</a>
					<a href="/register" class="hero-cta-link" onclick={() => trackHeroCtaSecondaryClick()}>Skapa konto</a>
				</div>
				<div class="hero-community-note" aria-label="Forum">
					<p class="hero-community-title">Du är inte ensam här</p>
					<p class="hero-community-text">I forumet kan du läsa vad andra går igenom, dela egna tankar och känna att du inte är ensam.<br />Du kan skapa en tråd anonymt eller som inloggad — eller bara läsa i din egen takt.</p>
					<p class="hero-community-text">Här kan några ord från någon annan göra skillnad — och dina ord kan göra skillnad för någon med.</p>
					<a href="/forum" class="hero-community-cta">Gå till forumet</a>
				</div>
				<p class="hero-trust-note">Ingen registrering krävs. Du kan börja skriva direkt.</p>
				<HomeSafetyStrip />
				<div class="mode-compare" aria-label="Vad är skillnaden?">
					<div class="mode-col">
						<p class="mode-label">Anonymt läge</p>
						<ul class="mode-list">
							<li>Ingen registrering</li>
							<li>Ingen profil skapas</li>
							<li>Börja direkt</li>
						</ul>
					</div>
					<div class="mode-col">
						<p class="mode-label">Med konto</p>
						<ul class="mode-list">
							<li>Spara dagbok och reflektioner</li>
							<li>Följ ditt mående över tid</li>
							<li>Fortsätt där du slutade</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
		<!-- TODO: Lägg verifierat social proof här när vi har verkliga omdömen eller data. -->

		<section class="feature-highlights" aria-labelledby="feature-highlights-title">
			<div class="cards-narrow feature-inner">
				<p class="feature-eyebrow">Funktioner</p>
				<h2 id="feature-highlights-title">Vad du kan göra med MittPsyke</h2>
				<div class="feature-grid">
					{#each featureHighlights as feature}
						<article class="feature-card">
							<h3>{feature.title}</h3>
							<p>{feature.description}</p>
							<a class="feature-card-cta" href={feature.href}>{feature.cta}</a>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section class="entry-paths" aria-labelledby="entry-paths-title">
			<div class="cards-narrow entry-inner">
			<p class="entry-eyebrow">Välj din väg in</p>
			<h2 id="entry-paths-title">Det finns olika sätt att börja.</h2>
			<p class="entry-intro">
				Välj det som känns mest hjälpsamt just nu. Du kan alltid byta väg senare.
			</p>
			<div class="entry-grid">
				{#each entryPaths as path}
					<a class="entry-card" href={path.href}>
						<h3>{path.title}</h3>
						<p>{path.description}</p>
						<span class="entry-card-cta">{path.cta}</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<section class="how-it-works" aria-labelledby="how-it-works-title">
		<div class="cards-narrow how-inner">
			<p class="how-eyebrow">Så fungerar MittPsyke</p>
			<h2 id="how-it-works-title">Du kan börja enkelt och spara först när du vill.</h2>
			<p class="how-intro">
				Här är skillnaden mellan att börja anonymt, skapa konto och använda dagbok eller vidare stöd.
			</p>
			<div class="how-grid">
				<article class="how-card">
					<span class="how-step">01</span>
					<h3>Börja anonymt</h3>
					<p>
						Skriv direkt utan konto när du bara behöver ett första steg. Det skapas ingen profil när du börjar så.
					</p>
					<a class="how-card-cta" href="/skriv">Börja skriva</a>
				</article>
				<article class="how-card">
					<span class="how-step">02</span>
					<h3>Skapa konto</h3>
					<p>
						Konto behövs först när du vill spara dagbok, historik och kunna komma tillbaka till samma plats.
					</p>
					<a class="how-card-cta" href="/register">Skapa konto</a>
				</article>
				<article class="how-card">
					<span class="how-step">03</span>
					<h3>Dagbok och historik</h3>
					<p>
						Med konto kan du spara reflektioner, följa känslor över tid och se din utveckling i lugn takt.
					</p>
					<a class="how-card-cta" href="/dagbok">Se dagboken</a>
				</article>
				<article class="how-card">
					<span class="how-step">04</span>
					<h3>Röstsamtal eller vidare stöd</h3>
					<p>
						Det finns också röstsamtal här på sidan. Vid akut fara ska du ringa 112, kontakta 1177 eller använda stödlinjer.
					</p>
					<a class="how-card-cta" href="#roststod">Se stödvägar</a>
					<div class="how-support-links" aria-label="Akuta och vidare stödvägar">
						<a href="tel:112">112</a>
						<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>
						<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>
					</div>
				</article>
			</div>
			<p class="how-footer">
				Vill du läsa mer om vad som sparas och hur uppgifter hanteras?
				<a href="/integritet">Läs integritetspolicyn</a>.
			</p>
			<div class="how-evidence">
				<ResearchEvidenceCard />
			</div>
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

	<section id="fokusomraden" class="focus-section">
		<div class="narrow cards-narrow focus-content">
			<header class="focus-header">
				<h2>Välj fokusområde</h2>
				<p>
					Välj det som känns närmast just nu. Det hjälper MittPsyke att öppna rätt samtalsstöd.
				</p>
			</header>
			<div class="focus-cards">
				{#each portals as portal}
					<a class="focus-card" href={`/chat/${portal.key}`}>
						<img
							class="focus-cover"
							src={portal.image}
							alt={`Stämningsbild för ${portal.title}`}
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

	<section class="discovery-section" aria-labelledby="discovery-title">
		<div class="cards-narrow discovery-inner">
			<div class="discovery-copy">
				<p class="discovery-eyebrow">Vanliga ingÃ¥ngar frÃ¥n sÃ¶k</p>
				<h2 id="discovery-title">BÃ¶rja dÃ¤r det kÃ¤nns mest trÃ¤ffsÃ¤kert</h2>
				<p>
					MÃ¥nga hittar hit mitt i nÃ¥got konkret: oro, stress, panik eller behovet av att prata anonymt.
					HÃ¤r Ã¤r nÃ¥gra vanliga vÃ¤gar in.
				</p>
			</div>
			<div class="discovery-grid">
				{#each commonSearchIntents as item}
					<a class="discovery-card" href={item.href}>
						<h3>{item.title}</h3>
						<p>{item.description}</p>
						<span>LÃ¤s mer</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<section class="blog-preview" aria-labelledby="blog-preview-title">
		<div class="cards-narrow blog-preview-inner">
			<div class="blog-preview-head">
				<div>
					<p class="blog-preview-eyebrow">InnehÃ¥ll som kan dra in rÃ¤tt trafik</p>
					<h2 id="blog-preview-title">Senaste frÃ¥n bloggen</h2>
					<p>
						Artiklarna hjÃ¤lper fler att hitta MittPsyke via sÃ¶k och ger en lugnare vÃ¤g vidare in till guider,
						Ã¶vningar och anonymt skrivstÃ¶d.
					</p>
				</div>
				<a class="blog-preview-link" href="/blogg">Se alla artiklar</a>
			</div>
			<div class="blog-preview-grid">
				{#each latestBlogPosts as post}
					<article class="blog-preview-card">
						<p class="blog-preview-meta">{post.publishedLabel} · {post.readTime}</p>
						<h3>{post.title}</h3>
						<p>{post.excerpt}</p>
						<a href={`/blogg/${post.slug}`}>LÃ¤s artikel</a>
					</article>
				{/each}
			</div>
		</div>
	</section>

	<VoiceSupport />

	<section class="band forum-band" aria-labelledby="forum-band-title">
		<div class="narrow forum-inner">
			<h2 id="forum-band-title">Du behöver inte bära allt ensam</h2>
			<p>Forumet är en plats där du kan läsa vad andra går igenom, dela egna tankar och möta stöd i ett lågmält sammanhang.<br />
			Du kan skapa en tråd anonymt eller som inloggad, och du får också gärna bara läsa i din egen takt.</p>
			<p class="forum-band-extra">Här kan några ord från någon annan göra skillnad — och dina ord kan göra skillnad för någon med.</p>
			<a href="/forum" class="forum-cta">Gå till forumet</a>
		</div>
	</section>

	<section class="band band-olive">
		<div class="narrow intro-grid">
			<img src="/assets/home/Tryggplats.png" alt="Illustration av en trygg plats i naturen" loading="lazy" />
			<div>
				<h2>Tryggt, varsamt och tydligt avgränsat</h2>
				<p>
					MittPsyke är byggt för lugn reflektion i egen takt. Det är inte vård eller behandling, men kan vara en första plats att landa innan du tar nästa steg.
				</p>
			</div>
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

	.hero-eyebrow {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.75);
		font-weight: 400;
		margin-bottom: 0.4rem;
		letter-spacing: 0.01em;
	}

	.hero-trust-note {
		margin-top: 0.75rem;
		font-size: 0.82rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.01em;
	}

	.hero-community-note {
		margin-top: 0.95rem;
		padding: 0.7rem 0.85rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.16);
		text-align: left;
	}

	.hero-community-title {
		margin: 0;
		max-width: none;
		font-family: var(--font-heading);
		font-size: clamp(1rem, 1.45vw, 1.12rem);
		font-weight: 700;
		line-height: 1.2;
		color: rgba(255, 255, 255, 0.95);
	}

	.hero-community-text {
		margin: 0.35rem 0 0;
		max-width: none;
		font-size: 0.92rem;
		line-height: 1.55;
		color: rgba(255, 255, 255, 0.86);
	}

	.hero-community-cta {
		display: inline-block;
		margin-top: 0.7rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.9);
		text-decoration: underline;
		text-underline-offset: 3px;
		text-decoration-color: rgba(255, 255, 255, 0.4);
		transition: text-decoration-color 0.15s;
	}

	.hero-community-cta:hover,
	.hero-community-cta:focus-visible {
		text-decoration-color: rgba(255, 255, 255, 0.9);
	}

	.hero-actions {
		margin-top: 1.2rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
	}

	.hero-cta-primary {
		background: #8ca36a;
		color: #182016;
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

	.discovery-section,
	.blog-preview {
		padding: clamp(2.8rem, 7vw, 5.5rem) 1.25rem;
	}

	.discovery-section {
		background: #f3f0e8;
		color: #1d2b33;
	}

	.blog-preview {
		background: #e6efe7;
		color: #1d2b33;
	}

	.discovery-inner,
	.blog-preview-inner {
		max-width: 1120px;
		margin: 0 auto;
	}

	.discovery-copy,
	.blog-preview-head {
		max-width: 760px;
	}

	.discovery-eyebrow,
	.blog-preview-eyebrow {
		margin: 0 0 0.45rem;
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #61715c;
	}

	.discovery-copy h2,
	.blog-preview-head h2 {
		margin: 0;
		font-size: clamp(1.8rem, 3vw, 2.4rem);
		line-height: 1.1;
		color: #182016;
	}

	.discovery-copy p,
	.blog-preview-head p,
	.discovery-card p,
	.blog-preview-card p {
		color: rgba(24, 32, 22, 0.82);
	}

	.discovery-grid,
	.blog-preview-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
		margin-top: 1.4rem;
	}

	.discovery-card,
	.blog-preview-card {
		display: grid;
		gap: 0.7rem;
		padding: 1.1rem;
		border-radius: var(--radius-card);
		background: rgba(255, 255, 255, 0.72);
		border: 1px solid rgba(24, 32, 22, 0.08);
	}

	.discovery-card h3,
	.blog-preview-card h3 {
		margin: 0;
		font-size: 1.08rem;
		line-height: 1.35;
		color: #182016;
	}

	.discovery-card span,
	.blog-preview-card a,
	.blog-preview-link {
		display: inline-flex;
		align-items: center;
		align-self: start;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		color: #234235;
	}

	.blog-preview-head {
		display: flex;
		gap: 1rem;
		align-items: end;
		justify-content: space-between;
		max-width: none;
	}

	.blog-preview-meta {
		margin: 0;
		font-size: 0.82rem;
		color: rgba(24, 32, 22, 0.62);
	}

	.band {
		padding: clamp(3rem, 8vw, 7rem) 1.25rem;
	}

	.band-olive {
		background: #1b2b3a;
	}

	.forum-band {
		background: #162232;
	}

	.forum-inner {
		text-align: center;
	}

	@media (max-width: 720px) {
		.blog-preview-head {
			display: grid;
			align-items: start;
		}
	}

	.forum-band-extra {
		margin-top: 0.9rem;
		opacity: 0.75;
		font-style: italic;
		font-size: 0.95rem;
	}

	.forum-cta {
		display: inline-block;
		margin-top: 1.4rem;
		padding: 0.62rem 1.3rem;
		font-family: var(--font-heading);
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: #8ca36a;
		color: #182016;
		border-radius: var(--radius-pill);
	}

	.narrow {
		width: min(760px, 100%);
		margin: 0 auto;
	}

	.cards-narrow {
		width: min(1080px, 100%);
	}

	.intro-grid {
		display: grid;
		grid-template-columns: 1fr 1.2fr;
		gap: 1.6rem;
		align-items: center;
	}

	.intro-grid img {
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

	.entry-paths {
		padding: clamp(2.8rem, 8vw, 4.4rem) 1.25rem;
		background: #eef2f0;
		color: #2c3338;
	}

	.feature-highlights {
		padding: clamp(2.5rem, 7vw, 3.9rem) 1.25rem;
		background: #f7f9f8;
		color: #2c3338;
	}

	.feature-eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #5c6c64;
	}

	.feature-inner h2 {
		margin: 0;
		color: #263036;
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.feature-grid {
		margin-top: 1.1rem;
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.95rem;
	}

	.feature-card {
		padding: 1rem;
		border-radius: var(--radius-card);
		background: #ffffff;
		border: 1px solid #dde5e1;
	}

	.feature-card h3 {
		margin: 0;
		color: #273237;
		font-size: 1.08rem;
		line-height: 1.3;
	}

	.feature-card p {
		margin: 0.55rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: #5a686f;
	}

	.feature-card-cta {
		display: inline-flex;
		align-items: center;
		margin-top: 0.9rem;
		padding: 0.42rem 0.78rem;
		border-radius: var(--radius-pill);
		background: #e7f1ee;
		color: #2e5850;
		font-family: var(--font-heading);
		font-size: 0.83rem;
		font-weight: 600;
		letter-spacing: 0.005em;
	}

	.entry-inner h2 {
		margin: 0;
		color: #263036;
		font-size: clamp(1.55rem, 3vw, 2.1rem);
	}

	.entry-eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #5c6c64;
	}

	.entry-intro {
		margin: 0.75rem 0 0;
		max-width: 58ch;
		color: #54626b;
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
		background: #ffffff;
		border: 1px solid #dde5e1;
		color: #2c3338;
		transition:
			transform 180ms ease,
			background-color 180ms ease,
			border-color 180ms ease;
	}

	.entry-card:hover {
		transform: translateY(-2px);
		background: #fbfcfb;
		border-color: #cfd8d4;
	}

	.entry-card h3 {
		margin: 0;
		color: #273237;
		font-size: 1.08rem;
		line-height: 1.3;
	}

	.entry-card p {
		margin: 0.55rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: #5a686f;
	}

	.entry-card-cta {
		display: inline-flex;
		align-items: center;
		margin-top: 0.9rem;
		padding: 0.42rem 0.78rem;
		border-radius: var(--radius-pill);
		background: #e7f1ee;
		color: #2e5850;
		font-family: var(--font-heading);
		font-size: 0.83rem;
		font-weight: 600;
		letter-spacing: 0.005em;
	}

	.how-it-works {
		padding: clamp(2.8rem, 8vw, 4.4rem) 1.25rem;
		background: #ffffff;
		color: #2c3338;
	}

	.how-eyebrow {
		margin: 0 0 0.45rem;
		font-family: var(--font-heading);
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #5f7067;
	}

	.how-inner h2 {
		margin: 0;
		color: #263036;
		font-size: clamp(1.55rem, 3vw, 2.05rem);
	}

	.how-intro {
		margin: 0.75rem 0 0;
		max-width: 60ch;
		color: #55646c;
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
		background: #f7f8f6;
		border: 1px solid #e2e8e3;
	}

	.how-step {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 2.3rem;
		padding: 0.2rem 0.5rem;
		border-radius: var(--radius-pill);
		background: #e5ece7;
		color: #4e6259;
		font-family: var(--font-heading);
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.04em;
	}

	.how-card h3 {
		margin: 0.8rem 0 0;
		color: #273237;
		font-size: 1.06rem;
		line-height: 1.3;
	}

	.how-card p {
		margin: 0.55rem 0 0;
		color: #5a686f;
		font-size: 0.95rem;
		line-height: 1.65;
	}

	.how-card-cta {
		display: inline-flex;
		align-items: center;
		margin-top: 0.9rem;
		padding: 0.42rem 0.78rem;
		border-radius: var(--radius-pill);
		background: #e7f1ee;
		color: #2e5850;
		font-family: var(--font-heading);
		font-size: 0.83rem;
		font-weight: 600;
		letter-spacing: 0.005em;
	}

	.how-support-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		margin-top: 0.85rem;
	}

	.how-support-links a {
		display: inline-flex;
		align-items: center;
		padding: 0.32rem 0.62rem;
		border-radius: var(--radius-pill);
		background: #ffffff;
		border: 1px solid #d5ddd8;
		color: #43564f;
		font-size: 0.8rem;
	}

	.how-footer {
		margin: 1rem 0 0;
		color: #55646c;
		font-size: 0.94rem;
	}

	.how-footer a {
		color: #0f766e;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.how-evidence {
		margin-top: 1rem;
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

	@media (max-width: 900px) {
		.intro-grid {
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
	}

	@media (min-width: 700px) {
		.feature-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.05rem;
		}

		.entry-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.05rem;
		}

		.how-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.05rem;
		}

		.focus-cards {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.focus-header {
			margin-bottom: 1.8rem;
		}
	}

	@media (min-width: 1040px) {
		.entry-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.how-grid {
			grid-template-columns: repeat(4, minmax(0, 1fr));
			gap: 1.1rem;
		}

		.focus-cards {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1.25rem;
		}
	}

	/* Dark mode */
	:global(.dark) .focus-section {
		background: #1a1c1d;
	}

	:global(.dark) .entry-paths {
		background: #151b19;
		color: #e8e6e2;
	}

	:global(.dark) .feature-highlights {
		background: #131918;
		color: #e8e6e2;
	}

	:global(.dark) .feature-eyebrow {
		color: #9cb0a6;
	}

	:global(.dark) .feature-inner h2 {
		color: #f0eeea;
	}

	:global(.dark) .feature-card {
		background: #202624;
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .feature-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .feature-card p {
		color: rgba(255, 255, 255, 0.68);
	}

	:global(.dark) .feature-card-cta {
		background: rgba(134, 223, 214, 0.12);
		color: #86dfd6;
	}

	:global(.dark) .entry-inner h2 {
		color: #f0eeea;
	}

	:global(.dark) .entry-eyebrow {
		color: #9cb0a6;
	}

	:global(.dark) .entry-intro,
	:global(.dark) .entry-card p {
		color: rgba(255, 255, 255, 0.68);
	}

	:global(.dark) .entry-card {
		background: #202624;
		border-color: rgba(255, 255, 255, 0.08);
		color: #e8e6e2;
	}

	:global(.dark) .entry-card:hover {
		background: #252c29;
		border-color: rgba(255, 255, 255, 0.14);
	}

	:global(.dark) .entry-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .entry-card-cta {
		background: rgba(134, 223, 214, 0.12);
		color: #86dfd6;
	}

	:global(.dark) .how-it-works {
		background: #121414;
		color: #e8e6e2;
	}

	:global(.dark) .how-eyebrow {
		color: #99afa4;
	}

	:global(.dark) .how-inner h2 {
		color: #f0eeea;
	}

	:global(.dark) .how-intro,
	:global(.dark) .how-card p,
	:global(.dark) .how-footer {
		color: rgba(255, 255, 255, 0.68);
	}

	:global(.dark) .how-card {
		background: #1d2221;
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .how-step {
		background: rgba(255, 255, 255, 0.08);
		color: #c9d8d0;
	}

	:global(.dark) .how-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .how-card-cta {
		background: rgba(134, 223, 214, 0.12);
		color: #86dfd6;
	}

	:global(.dark) .how-support-links a {
		background: #202624;
		border-color: rgba(255, 255, 255, 0.1);
		color: #dce7e2;
	}

	:global(.dark) .how-footer a {
		color: #9ad7ce;
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

	.mode-compare {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		margin-top: 1rem;
		padding: 0.85rem 1rem;
		background: rgba(255, 255, 255, 0.07);
		border: 1px solid rgba(255, 255, 255, 0.14);
		text-align: left;
	}

	.mode-col {
		display: flex;
		flex-direction: column;
	}

	.mode-label {
		margin: 0 0 0.4rem;
		font-family: var(--font-heading);
		font-size: clamp(0.92rem, 1.35vw, 1.04rem);
		font-weight: 850;
		line-height: 1.05;
		letter-spacing: -0.025em;
		color: rgba(255, 255, 255, 0.95);
	}

	.mode-list {
		margin: 0;
		padding-left: 1.1rem;
		font-size: 0.9rem;
		line-height: 1.6;
		color: rgba(255, 255, 255, 0.85);
	}

	.mode-list li + li {
		margin-top: 0.2rem;
	}

</style>

