<script lang="ts">
	import { onMount } from 'svelte';
	import { saveLandingPageEvent } from '$lib/analytics';

	type LandingPageData = {
		pageId: string;
		pageRecordId: string | null;
		name: string;
		slug: string;
		description: string;
		seoTitle: string;
		seoMeta: string;
		h1Heading: string;
		ctaText: string;
		keywords: string[];
		htmlContent: string | null;
		canonicalUrl: string;
	};

	let { data }: { data: LandingPageData } = $props();

	const featureCards = [
		{
			title: 'Prata när det känns mycket',
			body: 'Du kan börja i några få ord och ändå få ett lugnt svar tillbaka. Ingen förklaring behöver vara perfekt.'
		},
		{
			title: 'Skriv av dig i dagboken',
			body: 'När tankarna snurrar kan skrivandet hjälpa dig att sakta ned och få syn på vad som händer i dig.'
		},
		{
			title: 'Hitta små sätt att landa',
			body: 'Övningar, guider och stilla steg kan hjälpa kroppen att komma ned i varv utan att du behöver göra allt på en gång.'
		}
	];

	const faqItems = [
		{
			question: 'Kan MittPsyke hjälpa när ångesten är stark?',
			answer:
				'MittPsyke kan ge lugnt stöd, struktur och utrymme att sortera tankar. Det ersätter inte vård, men kan vara en första trygg plats när du behöver samla dig.'
		},
		{
			question: 'Måste jag berätta allt direkt?',
			answer:
				'Nej. Du kan börja kort, trevande eller helt anonymt. Tanken är att du ska kunna ta det i din egen takt.'
		},
		{
			question: 'Vad gör jag om läget känns akut?',
			answer:
				'Vid akut fara ringer du 112. För vårdråd finns 1177, och för vidare stöd kan du hitta hjälp via stodlinjer.se.'
		}
	];

	function trackPageView() {
		void saveLandingPageEvent({
			landingPageId: data.pageRecordId ?? data.pageId,
			eventType: 'view',
			metadata: {
				slug: data.slug
			}
		});
	}

	function trackPrimaryCta() {
		void saveLandingPageEvent({
			landingPageId: data.pageRecordId ?? data.pageId,
			eventType: 'conversion',
			metadata: {
				placement: 'hero-primary'
			}
		});
	}

	function trackSecondaryCta() {
		void saveLandingPageEvent({
			landingPageId: data.pageRecordId ?? data.pageId,
			eventType: 'click',
			metadata: {
				placement: 'hero-secondary'
			}
		});
	}

	onMount(() => {
		trackPageView();
	});
</script>

<svelte:head>
	<title>{data.seoTitle}</title>
	<meta name="description" content={data.seoMeta} />
	<link rel="canonical" href={data.canonicalUrl} />
	<meta property="og:title" content={data.seoTitle} />
	<meta property="og:description" content={data.seoMeta} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content={data.canonicalUrl} />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={data.seoTitle} />
	<meta name="twitter:description" content={data.seoMeta} />
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'MedicalWebPage',
		name: data.seoTitle,
		url: data.canonicalUrl,
		description: data.seoMeta,
		about: { '@type': 'MedicalCondition', name: 'Ångest' },
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="landing-page">
	<section class="hero">
		<div class="hero__copy">
			<p class="hero__eyebrow">Stöd vid ångest</p>
			<h1>{data.h1Heading}</h1>
			<p class="hero__lead">
				{data.description}
			</p>
			<p class="hero__body">
				Ångest kan göra kroppen spänd, tankarna snabba och vardagen mindre. Här finns en lugn ingång
				till samtalsstöd, skrivande och små verktyg när du behöver andrum.
			</p>
			<div class="hero__actions">
				<a class="button button--primary" href="/chat/a" onclick={trackPrimaryCta}>
					{data.ctaText}
				</a>
				<a class="button button--ghost" href="/dagbok" onclick={trackSecondaryCta}>
					Skriv av dig i dagboken
				</a>
			</div>
			<p class="hero__note">
				MittPsyke ersätter inte vård. Vid akut fara: 112. För vårdråd: 1177. Vidare stöd finns på
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">stodlinjer.se</a>.
			</p>
		</div>

		<div class="hero__aside">
			<div class="signal-card">
				<h2>När det känns mycket</h2>
				<ul>
					<li>Ta ett litet steg i taget</li>
					<li>Välj mellan att prata, skriva eller läsa</li>
					<li>Du kan vara anonym från början</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="feature-grid" aria-label="Vad du kan göra här">
		{#each featureCards as card}
			<article class="feature-card">
				<h2>{card.title}</h2>
				<p>{card.body}</p>
			</article>
		{/each}
	</section>

	<section class="keyword-strip" aria-label="Vanliga teman">
		{#each data.keywords as keyword}
			<span>{keyword}</span>
		{/each}
	</section>

	<section class="pathways" aria-label="Vägar vidare">
		<div class="pathways__intro">
			<h2>Välj det som känns mest hjälpsamt just nu</h2>
			<p>
				Ibland hjälper det att prata. Ibland att skriva. Ibland att bara få något lugnt och konkret att
				hålla sig i.
			</p>
		</div>

		<div class="pathways__grid">
			<a class="path-card" href="/chat/a">
				<h3>Prata anonymt</h3>
				<p>För dig som vill få ordning i tankarna i ett samtal direkt.</p>
			</a>
			<a class="path-card" href="/ovningar">
				<h3>Gör en övning</h3>
				<p>När kroppen behöver hjälp att komma ned i varv här och nu.</p>
			</a>
			<a class="path-card" href="/guider-seo/angest">
				<h3>Läs guider om ångest</h3>
				<p>För dig som vill förstå mer och hitta steg som går att prova i vardagen.</p>
			</a>
		</div>
	</section>

	{#if data.htmlContent}
		<section class="editorial" aria-label="Fördjupning från admin">
			<div class="editorial__content">
				{@html data.htmlContent}
			</div>
		</section>
	{/if}

	<section class="faq" aria-label="Vanliga frågor">
		<div class="faq__intro">
			<h2>Vanliga frågor om ångest och stöd</h2>
			<p>
				Här är några vanliga frågor från personer som söker ett lugnt första steg.
			</p>
		</div>

		<div class="faq__items">
			{#each faqItems as item}
				<article class="faq-item">
					<h3>{item.question}</h3>
					<p>{item.answer}</p>
				</article>
			{/each}
		</div>
	</section>
</main>

<style>
	.landing-page {
		max-width: 72rem;
		margin: 0 auto;
		padding: clamp(1.25rem, 4vw, 2rem) 1rem 4rem;
		display: grid;
		gap: 1.5rem;
	}

	.hero {
		display: grid;
		gap: 1rem;
		align-items: stretch;
	}

	.hero__copy,
	.signal-card,
	.feature-card,
	.path-card,
	.faq-item,
	.editorial {
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background:
			linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(244, 248, 246, 0.88));
	}

	.hero__copy {
		padding: clamp(1.4rem, 4vw, 2.4rem);
	}

	.hero__eyebrow {
		margin: 0 0 0.6rem;
		font-size: 0.85rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--primary);
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-size: clamp(2rem, 1.6rem + 2vw, 3.4rem);
		line-height: 1.03;
		max-width: 12ch;
	}

	.hero__lead,
	.hero__body,
	.path-card p,
	.feature-card p,
	.faq-item p,
	.pathways__intro p {
		font-family: var(--font-body);
		line-height: 1.7;
	}

	.hero__lead {
		margin: 1rem 0 0;
		font-size: clamp(1.02rem, 0.98rem + 0.45vw, 1.2rem);
		max-width: 60ch;
	}

	.hero__body {
		margin: 0.85rem 0 0;
		max-width: 62ch;
		color: hsl(var(--muted-foreground));
	}

	.hero__actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.85rem;
		margin-top: 1.3rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.85rem 1.25rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
		transition: transform 160ms ease, opacity 160ms ease, background 160ms ease;
	}

	.button:hover {
		transform: translateY(-1px);
	}

	.button--primary {
		background: var(--primary);
		color: white;
	}

	.button--ghost {
		background: transparent;
		color: hsl(var(--foreground));
		border: 1px solid hsl(var(--border));
	}

	.hero__note {
		margin: 1rem 0 0;
		font-size: 0.92rem;
		color: hsl(var(--muted-foreground));
		max-width: 62ch;
	}

	.hero__note a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.signal-card {
		padding: 1.25rem;
		height: 100%;
		background:
			radial-gradient(circle at top right, rgba(15, 118, 110, 0.14), transparent 52%),
			linear-gradient(180deg, rgba(234, 245, 240, 0.95), rgba(247, 250, 248, 0.92));
	}

	.signal-card h2 {
		font-size: 1.15rem;
		margin-bottom: 0.9rem;
	}

	.signal-card ul {
		margin: 0;
		padding-left: 1.2rem;
		display: grid;
		gap: 0.6rem;
		line-height: 1.6;
	}

	.feature-grid,
	.pathways__grid,
	.faq__items {
		display: grid;
		gap: 1rem;
	}

	.feature-card,
	.path-card,
	.faq-item {
		padding: 1.15rem;
	}

	.feature-card h2,
	.pathways__intro h2,
	.faq__intro h2 {
		font-size: 1.2rem;
		margin-bottom: 0.5rem;
	}

	.keyword-strip {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
	}

	.keyword-strip span {
		display: inline-flex;
		align-items: center;
		padding: 0.45rem 0.8rem;
		border-radius: var(--radius-pill);
		background: rgba(15, 118, 110, 0.08);
		color: var(--primary);
		font-size: 0.88rem;
	}

	.pathways,
	.faq {
		display: grid;
		gap: 1rem;
	}

	.path-card,
	.faq-item {
		color: inherit;
		text-decoration: none;
	}

	.path-card:hover {
		border-color: color-mix(in srgb, var(--primary) 40%, hsl(var(--border)));
	}

	.path-card h3,
	.faq-item h3 {
		font-size: 1.02rem;
		margin-bottom: 0.4rem;
	}

	.editorial {
		padding: 1.2rem;
	}

	.editorial :global(h2),
	.editorial :global(h3) {
		margin-bottom: 0.55rem;
	}

	.editorial :global(p + p) {
		margin-top: 0.8rem;
	}

	@media (min-width: 720px) {
		.hero {
			grid-template-columns: minmax(0, 1.6fr) minmax(16rem, 0.9fr);
		}

		.feature-grid,
		.pathways__grid,
		.faq__items {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 719px) {
		.button {
			width: 100%;
		}

		.hero__actions {
			flex-direction: column;
		}
	}

	:global(.dark) .hero__copy,
	:global(.dark) .signal-card,
	:global(.dark) .feature-card,
	:global(.dark) .path-card,
	:global(.dark) .faq-item,
	:global(.dark) .editorial {
		background:
			linear-gradient(180deg, rgba(16, 24, 32, 0.92), rgba(12, 18, 24, 0.96));
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .hero__body,
	:global(.dark) .hero__note {
		color: rgba(255, 255, 255, 0.74);
	}

	:global(.dark) .button--ghost {
		color: #f3f7f6;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .keyword-strip span {
		background: rgba(134, 223, 214, 0.12);
		color: #9be7de;
	}
</style>
