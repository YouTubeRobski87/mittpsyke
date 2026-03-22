<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Forum – Samtalsrum för psykisk hälsa | MittPsyke</title>
	<meta
		name="description"
		content="Dela tankar och hitta igenkänning i MittPsykes forum. Lugna samtalsrum om ångest, stress, sömn, relationer och mer. Skriv anonymt eller med namn."
	/>
	<link rel="canonical" href="https://www.mittpsyke.se/forum" />
	<meta property="og:title" content="Forum – Samtalsrum för psykisk hälsa | MittPsyke" />
	<meta property="og:description" content="Dela tankar och hitta igenkänning i MittPsykes forum. Lugna samtalsrum om ångest, stress, sömn, relationer och mer. Skriv anonymt eller med namn." />
	<meta property="og:url" content="https://www.mittpsyke.se/forum" />
	<meta property="og:type" content="website" />
	{@html `<script type="application/ld+json">${JSON.stringify({
		"@context": "https://schema.org",
		"@type": "WebPage",
		"name": "Forum – Samtalsrum för psykisk hälsa",
		"description": "Dela tankar och hitta igenkänning i MittPsykes forum. Lugna samtalsrum om ångest, stress, sömn, relationer och mer.",
		"url": "https://www.mittpsyke.se/forum",
		"isPartOf": { "@type": "WebSite", "name": "MittPsyke", "url": "https://www.mittpsyke.se" },
		"about": { "@type": "Thing", "name": "Psykisk hälsa" }
	})}<\/script>`}
</svelte:head>

<div class="forum-page">
	<!-- Intro -->
	<header class="forum-hero">
		<h1 class="forum-hero__title">Forum</h1>
		<p class="forum-hero__lead">
			Välkommen till forumet – en plats för igenkänning, varsamt stöd och reflektion. Här finns rum
			för dig som vill dela, lyssna eller bara veta att du inte är ensam.
		</p>
		<p class="forum-hero__sub">
			Du väljer själv om du vill skriva med ditt namn eller anonymt. Alla inlägg behandlas med
			respekt.
		</p>

		<div class="forum-crisis-notice">
			<span class="forum-crisis-notice__icon">🆘</span>
			<p>
				Vid akut psykisk kris eller fara – kontakta
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>
				eller ring <strong>112</strong>. Forumet ersätter inte vård eller krisstöd.
			</p>
		</div>
	</header>

	<!-- Samtalsrum -->
	<section class="forum-rooms">
		<h2 class="forum-rooms__heading">Samtalsrum</h2>
		<div class="forum-rooms__grid">
			{#each data.categories as cat}
				<a href="/forum/{cat.id}" class="forum-room-card">
					<span class="forum-room-card__icon" aria-hidden="true">{cat.icon}</span>
					<div class="forum-room-card__content">
						<h3 class="forum-room-card__name">{cat.name}</h3>
						<p class="forum-room-card__desc">{cat.description}</p>
					</div>
					<span class="forum-room-card__count">
						{data.threadCounts[cat.id] ?? 0}
						{(data.threadCounts[cat.id] ?? 0) === 1 ? 'tråd' : 'trådar'}
					</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- Regler/info -->
	<section class="forum-rules">
		<h2 class="forum-rules__heading">Riktlinjer för forumet</h2>
		<ul class="forum-rules__list">
			<li>Möt varandra med respekt och empati – vi är alla här av en anledning.</li>
			<li>Dela gärna din egen upplevelse, men undvik att ge råd som ersätter professionell hjälp.</li>
			<li>Rapportera innehåll som känns stötande, skadligt eller oroande.</li>
			<li>Forumet är inte en krislinje – vid akut behov, sök professionell hjälp.</li>
		</ul>
	</section>
</div>

<style>
	.forum-page {
		max-width: 48rem;
		margin: 0 auto;
		padding: 2rem 1.25rem 4rem;
	}

	/* Hero */
	.forum-hero {
		margin-bottom: 2.5rem;
	}

	.forum-hero__title {
		font-family: var(--font-heading);
		font-size: clamp(1.75rem, 4vw, 2.25rem);
		font-weight: 700;
		color: hsl(var(--foreground));
		margin-bottom: 0.75rem;
	}

	.forum-hero__lead {
		font-size: 1.0625rem;
		line-height: 1.65;
		color: hsl(var(--foreground));
		margin-bottom: 0.5rem;
		max-width: 40rem;
	}

	.forum-hero__sub {
		font-size: 0.9375rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
		margin-bottom: 1.25rem;
	}

	.forum-crisis-notice {
		display: flex;
		align-items: flex-start;
		gap: 0.625rem;
		background: hsl(var(--surface-muted));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 0.75rem 1rem;
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
	}

	.forum-crisis-notice__icon {
		flex-shrink: 0;
		font-size: 1rem;
		margin-top: 0.05rem;
	}

	.forum-crisis-notice a {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* Samtalsrum */
	.forum-rooms {
		margin-bottom: 2.5rem;
	}

	.forum-rooms__heading {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--muted-foreground));
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}

	.forum-rooms__grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.75rem;
	}

	@media (min-width: 560px) {
		.forum-rooms__grid {
			grid-template-columns: 1fr 1fr;
		}
	}

	.forum-room-card {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.125rem 1.25rem;
		text-decoration: none;
		color: inherit;
		transition: background 0.15s, border-color 0.15s, transform 0.1s;
	}

	.forum-room-card:hover {
		background: hsl(var(--surface-muted));
		border-color: var(--primary);
		transform: translateY(-1px);
	}

	.forum-room-card:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.forum-room-card__icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.forum-room-card__name {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin: 0;
	}

	.forum-room-card__desc {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		flex: 1;
		margin: 0;
	}

	.forum-room-card__count {
		font-size: 0.8125rem;
		color: hsl(var(--muted-foreground));
		opacity: 0.75;
		margin-top: 0.25rem;
	}

	/* Regler */
	.forum-rules {
		background: hsl(var(--surface));
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		padding: 1.25rem 1.5rem;
	}

	.forum-rules__heading {
		font-family: var(--font-heading);
		font-size: 0.9375rem;
		font-weight: 600;
		color: hsl(var(--foreground));
		margin-bottom: 0.75rem;
	}

	.forum-rules__list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.forum-rules__list li {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
		line-height: 1.55;
		padding-left: 1.25rem;
		position: relative;
	}

	.forum-rules__list li::before {
		content: '·';
		position: absolute;
		left: 0.25rem;
		color: var(--primary);
		font-weight: 700;
	}
</style>
