<script lang="ts">
	import { onMount } from 'svelte';
	import HomeSafetyStrip from '$lib/components/HomeSafetyStrip.svelte';
	import VoiceSupport from '$lib/components/VoiceSupport.svelte';
	import { trackHeroCtaPrimaryClick, trackHeroCtaSecondaryClick } from '$lib/analytics';

	type HomepageForumThread = {
		id: string;
		title: string;
		reply_count: number;
		created_at: string;
		active_at: string;
	};

	let {
		data
	}: {
		data: {
			homepageForumThreads?: HomepageForumThread[];
			popularForumThreads?: HomepageForumThread[];
		};
	} = $props();
	let heroEl: HTMLElement | null = null;
	let bgEl: HTMLImageElement | null = null;
	const homepageForumThreads = $derived(data.homepageForumThreads ?? []);
	const popularForumThreads = $derived(data.popularForumThreads ?? []);

	const entryPaths = [
		{
			title: 'Skriv av dig',
			description: 'Börja direkt med AI-stöd — anonymt eller med konto.',
			href: '/skriv',
			cta: 'Börja skriva'
		},
		{
			title: 'Läs guider',
			description: 'Förstå ångest, stress, trauma och andra vanliga tillstånd.',
			href: '/guider',
			cta: 'Läs guider'
		},
		{
			title: 'Prova övningar',
			description: 'Enkla övningar och små handlingar du kan göra idag.',
			href: '/ovningar',
			cta: 'Se övningar'
		},
		{
			title: 'Följ ditt mående',
			description: 'Dagbok, humörspårning och framsteg — över tid.',
			href: '/register',
			cta: 'Skapa konto'
		}
	];

	const supportPoints = [
		{
			label: 'Anonymt',
			text: 'Skriv direkt utan konto. Ingen profil skapas.'
		},
		{
			label: 'I din takt',
			text: 'Börja litet. Spara och bygg vidare när du är redo.'
		},
		{
			label: 'Inte vård',
			text: 'Stöd för reflektion i vardagen — inte ersättning för professionell hjälp.'
		}
	];

	const features = [
		{
			title: 'AI-samtal',
			description: 'Skriv vad du bär på och få lugna, stödjande svar — utan att behöva formulera dig perfekt.',
			href: '/skriv'
		},
		{
			title: 'Dagbok med röster',
			description: 'Berätta om din dag och få den skriven i en röst du väljer — filosofisk, vardaglig eller något annat.',
			href: '/dagbok'
		},
		{
			title: 'Humörspårning',
			description: 'Se hur ditt mående rör sig över tid. Mönster blir tydligare när du har något att gå tillbaka till.',
			href: '/humorsparning'
		},
		{
			title: 'Guider och övningar',
			description: 'Läs om ångest, stress och andra vanliga tillstånd — och hitta enkla övningar att börja med idag.',
			href: '/guider'
		}
	];

	function formatForumTime(timestamp: string) {
		if (!timestamp) return '';

		const date = new Date(timestamp);
		if (Number.isNaN(date.getTime())) return '';

		const diffMs = date.getTime() - Date.now();
		const diffHours = Math.round(diffMs / (1000 * 60 * 60));
		const absHours = Math.abs(diffHours);
		const rtf = new Intl.RelativeTimeFormat('sv', { numeric: 'auto' });

		if (absHours < 24) return rtf.format(diffHours, 'hour');

		const diffDays = Math.round(diffHours / 24);
		if (Math.abs(diffDays) < 7) return rtf.format(diffDays, 'day');

		return new Intl.DateTimeFormat('sv-SE', {
			day: 'numeric',
			month: 'short'
		}).format(date);
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
				<p class="hero-eyebrow">Om du mår dåligt och inte vet var du ska börja</p>
				<h1>MittPsyke är en lugn plats att börja på.</h1>
				<p>
					Skriv av dig direkt — utan konto.
					Skapar du ett konto kan du spara dagbok, följa ditt mående och se dina framsteg.
				</p>
				<div class="hero-actions">
					<a href="/skriv" class="hero-cta hero-cta-primary" onclick={() => trackHeroCtaPrimaryClick()}>Börja skriva anonymt</a>
					<a href="/register" class="hero-cta-link" onclick={() => trackHeroCtaSecondaryClick()}>Skapa konto</a>
				</div>
				<p class="hero-trust-note">Ingen registrering krävs.</p>
			</div>
		</div>
	</section>

	<!-- 2. Ett första steg, i din egen takt -->
	<section class="first-step" aria-labelledby="first-step-title">
		<div class="cards-narrow first-step-inner">
			<h2 id="first-step-title">Ett första steg, i din egen takt</h2>
			<p class="first-step-body">
				MittPsyke hjälper dig sätta ord på hur du mår — med AI-stöd, dagbok och humörspårning, i ett lugnt tempo utan press.
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

	<!-- 3. Välj det som hjälper mest just nu -->
	<section class="entry-paths" aria-labelledby="entry-paths-title">
		<div class="cards-narrow entry-inner">
			<h2 id="entry-paths-title">Välj det som hjälper mest just nu</h2>
			<p class="entry-intro">
				Välj det som känns närmast just nu.
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

	<!-- 4. Så fungerar det -->
	<section class="how-it-works" aria-labelledby="how-it-works-title">
		<div class="cards-narrow how-inner">
			<p class="how-eyebrow">Så fungerar det</p>
			<h2 id="how-it-works-title">Du kan börja enkelt och spara först när du vill.</h2>
			<div class="how-grid">
				<article class="how-card">
					<span class="how-step">01</span>
					<h3>Börja anonymt</h3>
					<p>Välj ett tema och skriv fritt. Samtalet tar form i din takt — utan konto.</p>
					<a class="how-card-cta" href="/skriv">Börja skriva</a>
				</article>
				<article class="how-card">
					<span class="how-step">02</span>
					<h3>Skapa konto</h3>
					<p>Spara dagbok och historik, och fortsätt där du slutade nästa gång.</p>
					<a class="how-card-cta" href="/register">Skapa konto</a>
				</article>
				<article class="how-card">
					<span class="how-step">03</span>
					<h3>Följ ditt mående</h3>
					<p>Se hur du mår över tid med grafer och stämningslogg — mönster blir tydliga.</p>
					<a class="how-card-cta" href="/dagbok">Se dagboken</a>
				</article>
				<article class="how-card">
					<span class="how-step">04</span>
					<h3>Vidare stöd</h3>
					<p>Röstsamtal finns på sidan. Vid akut fara: ring 112 eller kontakta 1177.</p>
					<a class="how-card-cta" href="#roststod">Se stödvägar</a>
				</article>
			</div>
		</div>
	</section>

	<!-- 5. Vad du kan använda MittPsyke till -->
	<section class="features-section" aria-labelledby="features-title">
		<div class="cards-narrow features-inner">
			<h2 id="features-title">Vad du kan använda MittPsyke till</h2>
			<div class="features-grid">
				{#each features as feature}
					<a class="feature-card" href={feature.href}>
						<h3>{feature.title}</h3>
						<p>{feature.description}</p>
						<span class="feature-card-cta">Läs mer</span>
					</a>
				{/each}
			</div>
		</div>
	</section>

	<!-- 6. Forum -->
	<section class="forum-section" aria-labelledby="forum-section-title">
		<div class="cards-narrow forum-inner">
			<div class="forum-header">
				<h2 id="forum-section-title">Aktiva forumtrådar</h2>
				<p>
					Det senaste som rör sig i forumet just nu.
				</p>
			</div>
			{#if homepageForumThreads.length > 0}
				<div class="forum-thread-grid" aria-label="Aktiva forumtrådar">
					{#each homepageForumThreads as thread}
						<article class="forum-thread-card">
							<p class="forum-meta">
								Senast aktiv {formatForumTime(thread.active_at || thread.created_at)}
							</p>
							<a class="forum-thread-link" href={`/forum/thread/${thread.id}`}>
								<h3>{thread.title}</h3>
							</a>
							<div class="forum-thread-footer">
								<p class="forum-count">{thread.reply_count} svar</p>
								<a class="forum-inline-link" href={`/forum/thread/${thread.id}`}>Läs tråden</a>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="forum-empty">
					<p>Inga aktiva trådar ännu</p>
				</div>
			{/if}
			<a href="/forum" class="forum-cta-link">Gå till forumet</a>
			<div class="forum-subsection">
				<h3 class="forum-subheading">Mest populÃ¤ra forumsinlÃ¤gg</h3>
				{#if popularForumThreads.length > 0}
					<div class="forum-thread-grid" aria-label="Mest populÃ¤ra forumsinlÃ¤gg">
						{#each popularForumThreads as thread}
							<article class="forum-thread-card">
								<p class="forum-meta">{thread.reply_count} svar</p>
								<a class="forum-thread-link" href={`/forum/thread/${thread.id}`}>
									<h3>{thread.title}</h3>
								</a>
								<div class="forum-thread-footer">
									<p class="forum-count">
										Senast aktiv {formatForumTime(thread.active_at || thread.created_at)}
									</p>
									<a class="forum-inline-link" href={`/forum/thread/${thread.id}`}>LÃ¤s trÃ¥den</a>
								</div>
							</article>
						{/each}
					</div>
				{:else}
					<div class="forum-empty">
						<p>Inga populÃ¤ra inlÃ¤gg Ã¤nnu</p>
					</div>
				{/if}
			</div>
			<a href="/forum" class="forum-cta-link">GÃ¥ till forumet</a>
		</div>
	</section>

	<VoiceSupport />

	<!-- 7. Trygghet och avgränsning -->
	<section class="trust-section" aria-labelledby="trust-title">
		<div class="cards-narrow trust-inner">
			<img src="/assets/home/Tryggplats.png" alt="Illustration av en trygg plats i naturen" loading="lazy" class="trust-image" />
			<div class="trust-copy">
				<h2 id="trust-title">Tryggt, varsamt och tydligt avgränsat</h2>
				<p>
					MittPsyke är byggt för lugn reflektion i egen takt. Det är inte vård eller behandling, men kan vara en första plats att landa innan du tar nästa steg.
				</p>
				<p class="trust-privacy">
					Vill du läsa mer om vad som sparas?
					<a href="/integritet">Läs integritetspolicyn</a>.
				</p>
				<p class="trust-research">
					Forskning visar att strukturerat digitalt stöd kan ha positiva effekter på psykisk hälsa.
					<a href="https://www.jmir.org/2024/1/e51268" target="_blank" rel="noopener noreferrer">Källa: Yeo et al., JMIR 2024</a>.
				</p>
			</div>
		</div>
	</section>

	<!-- 8. Viktigt att veta -->
	<section class="important-section" aria-labelledby="important-title">
		<div class="cards-narrow important-inner">
			<HomeSafetyStrip />
		</div>
	</section>

	<!-- 9. Avslutande CTA -->
	<section class="final-cta-section" aria-label="Kom igång">
		<div class="final-cta-inner">
			<h2>Redo att ta ett första steg?</h2>
			<p>Du behöver inte veta exakt vad du vill säga. Börja skriva — så tar vi det därifrån.</p>
			<div class="final-cta-actions">
				<a href="/skriv" class="hero-cta hero-cta-primary">Börja skriva anonymt</a>
				<a href="/register" class="hero-cta-link">Skapa konto</a>
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

	/* ── Sektion 2: Första steget ── */
	.first-step {
		padding: clamp(2.5rem, 7vw, 4rem) 1.25rem;
		background: #f7f9f8;
		color: #2c3338;
	}

	.first-step-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	.first-step-inner h2 {
		margin: 0;
		color: #263036;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.5rem, 3vw, 2rem);
	}

	.first-step-body {
		margin: 0.75rem 0 0;
		max-width: 58ch;
		color: #54626b;
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
		background: #ffffff;
		border: 1px solid #dde5e1;
		border-radius: var(--radius-card);
	}

	.support-label {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 0.88rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #5f7067;
	}

	.support-text {
		margin: 0.3rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: #5a686f;
	}

	/* ── Sektion 3: Ingångar ── */
	.entry-paths {
		padding: clamp(2.8rem, 8vw, 4.4rem) 1.25rem;
		background: #eef2f0;
		color: #2c3338;
	}

	.cards-narrow {
		width: min(1080px, 100%);
		margin: 0 auto;
	}

	.entry-inner h2 {
		margin: 0;
		color: #263036;
		font-size: clamp(1.55rem, 3vw, 2.1rem);
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

	/* ── Sektion 4: Så fungerar det ── */
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


	/* ── Sektion 5: Funktioner ── */
	.features-section {
		padding: clamp(2.5rem, 7vw, 3.9rem) 1.25rem;
		background: #f3f0e8;
		color: #2c3338;
	}

	.features-inner h2 {
		margin: 0;
		color: #263036;
		font-size: clamp(1.5rem, 3vw, 2rem);
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
		background: rgba(255, 255, 255, 0.72);
		border: 1px solid rgba(24, 32, 22, 0.08);
		color: #2c3338;
		transition: transform 180ms ease, background-color 180ms ease;
	}

	.feature-card:hover {
		transform: translateY(-2px);
		background: rgba(255, 255, 255, 0.9);
	}

	.feature-card h3 {
		margin: 0;
		color: #182016;
		font-size: 1.08rem;
		line-height: 1.35;
	}

	.feature-card p {
		margin: 0.55rem 0 0;
		font-size: 0.95rem;
		line-height: 1.65;
		color: rgba(24, 32, 22, 0.82);
	}

	.feature-card-cta {
		display: inline-flex;
		align-items: center;
		align-self: start;
		margin-top: 0.9rem;
		font-weight: 600;
		text-decoration: underline;
		text-underline-offset: 3px;
		color: #234235;
		font-size: 0.88rem;
	}

	/* ── Sektion 6: Forum ── */
	.forum-section {
		padding: clamp(2.8rem, 7vw, 5rem) 1.25rem;
		background: #1b2b3a;
		color: #f5f5f2;
	}

	.forum-inner {
		max-width: 1080px;
		margin: 0 auto;
	}

	.forum-header {
		max-width: 62ch;
	}

	.forum-header h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.55rem, 3vw, 2.2rem);
		color: #f3f8fd;
	}

	.forum-header p {
		margin: 0.75rem 0 0;
		font-family: var(--font-body);
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.82);
	}

	.forum-thread-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.7rem;
		margin-top: 1.4rem;
	}

	.forum-thread-card,
	.forum-empty {
		display: grid;
		gap: 0.35rem;
		padding: 0.85rem 0.9rem;
		background: rgba(255, 255, 255, 0.08);
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: var(--radius-card);
		text-align: left;
	}

	.forum-thread-card h3,
	.forum-empty p {
		margin: 0;
	}

	.forum-thread-card h3 {
		font-size: 1rem;
		line-height: 1.35;
		color: #f8faf8;
	}

	.forum-thread-link {
		text-decoration: none;
	}

	.forum-thread-link:hover h3,
	.forum-thread-link:focus-visible h3 {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.forum-meta,
	.forum-count {
		margin: 0;
		font-size: 0.8rem;
		line-height: 1.45;
		color: rgba(255, 255, 255, 0.7);
	}

	.forum-meta {
		font-weight: 700;
		letter-spacing: 0.03em;
	}

	.forum-thread-footer {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 0.55rem;
		margin-top: 0.2rem;
	}

	.forum-inline-link,
	.forum-cta-link {
		display: inline-flex;
		font-size: 0.92rem;
		font-weight: 600;
		color: rgba(255, 255, 255, 0.92);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.forum-cta-link {
		margin-top: 1.2rem;
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
		color: #9ad7ce;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.trust-research {
		font-size: 0.88rem;
		opacity: 0.72;
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
		background: #eef2f0;
		color: #2c3338;
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
		color: #263036;
	}

	.final-cta-inner p {
		margin: 0.75rem 0 0;
		font-family: var(--font-body);
		line-height: 1.7;
		color: #54626b;
	}

	.final-cta-actions {
		margin-top: 1.4rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
	}

	.final-cta-actions .hero-cta {
		background: #8ca36a;
		color: #182016;
	}

	.final-cta-actions .hero-cta-link {
		color: #3a5a4a;
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

	ul {
		margin: 1rem 0 0;
		padding-left: 1.2rem;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		color: rgba(255, 255, 255, 0.9);
	}

	/* ── Responsivt ── */
	@media (max-width: 900px) {
		.trust-inner {
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

	@media (min-width: 680px) {
		.support-points {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 0.9rem;
		}

		.forum-thread-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
			gap: 0.85rem;
		}
	}

	@media (min-width: 700px) {
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

		.forum-thread-grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
			gap: 1rem;
		}
	}

	/* ── Dark mode ── */
	:global(.dark) .first-step {
		background: #131918;
		color: #e8e6e2;
	}

	:global(.dark) .first-step-inner h2 {
		color: #f0eeea;
	}

	:global(.dark) .first-step-body {
		color: rgba(255, 255, 255, 0.68);
	}

	:global(.dark) .support-point {
		background: #202624;
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .support-label {
		color: #9cb0a6;
	}

	:global(.dark) .support-text {
		color: rgba(255, 255, 255, 0.68);
	}

	:global(.dark) .entry-paths {
		background: #151b19;
		color: #e8e6e2;
	}

	:global(.dark) .entry-inner h2 {
		color: #f0eeea;
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

	:global(.dark) .how-card p {
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

	:global(.dark) .features-section {
		background: #131918;
		color: #e8e6e2;
	}

	:global(.dark) .features-inner h2 {
		color: #f0eeea;
	}

	:global(.dark) .feature-card {
		background: #202624;
		border-color: rgba(255, 255, 255, 0.08);
		color: #e8e6e2;
	}

	:global(.dark) .feature-card:hover {
		background: #252c29;
	}

	:global(.dark) .feature-card h3 {
		color: #f0eeea;
	}

	:global(.dark) .feature-card p {
		color: rgba(255, 255, 255, 0.68);
	}

	:global(.dark) .feature-card-cta {
		color: #86dfd6;
	}

	:global(.dark) .forum-section {
		background: #0f1a24;
	}

	:global(.dark) .trust-section {
		background: #0f1a24;
	}

	:global(.dark) .important-section {
		background: #0d151e;
	}

	:global(.dark) .final-cta-section {
		background: #151b19;
		color: #e8e6e2;
	}

	:global(.dark) .final-cta-inner h2 {
		color: #f0eeea;
	}

	:global(.dark) .final-cta-inner p {
		color: rgba(255, 255, 255, 0.68);
	}

	:global(.dark) .final-cta-actions .hero-cta-link {
		color: rgba(255, 255, 255, 0.82);
	}
</style>
