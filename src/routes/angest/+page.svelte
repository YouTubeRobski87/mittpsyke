<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import {
		saveLandingPageEvent,
		trackHeroCtaPrimaryClick,
		trackHeroCtaSecondaryClick
	} from '$lib/analytics';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const featureCards = [
		{
			title: 'Prata utan att börja perfekt',
			text: 'Du kan börja med några få ord. Samtalsstödet är gjort för att möta dig där du är, inte där du borde vara.'
		},
		{
			title: 'Skriv av dig i lugn takt',
			text: 'Dagboken hjälper dig att fånga upp tankar, mönster och små skiften utan att allt behöver bli så stort på en gång.'
		},
		{
			title: 'Hitta enkla nästa steg',
			text: 'Guider och övningar ger konkreta sätt att lugna kroppen, förstå oron och skapa lite mer riktning i stunden.'
		}
	];

	const faqItems = [
		{
			question: 'Kan jag använda MittPsyke anonymt?',
			answer:
				'Ja. Du kan börja utan konto och känna efter i lugn takt. Om du vill spara mer över tid kan du skapa en egen plats senare.'
		},
		{
			question: 'Är det här vård?',
			answer:
				'Nej. MittPsyke är ett första stöd för reflektion, lugn och struktur. Det ersätter inte vård. Vid akut fara: 112. För vårdråd: 1177.'
		},
		{
			question: 'Vad kan jag göra om ångesten känns stark just nu?',
			answer:
				'Börja smått: sänk tempot, sätt ord på det som händer och välj ett enkelt nästa steg. Du kan också gå vidare till våra övningar eller hitta fler stödvägar via stodlinjer.se.'
		}
	];

	onMount(() => {
		if (!data.analytics.landingPageId) return;

		void saveLandingPageEvent({
			landingPageId: data.analytics.landingPageId,
			abTestId: data.analytics.abTestId,
			eventType: 'view',
			variant: data.analytics.variant,
			metadata: {
				page: '/angest'
			}
		});
	});

	function trackCta(position: 'hero-primary' | 'hero-secondary' | 'guide') {
		if (!data.analytics.landingPageId) return;

		if (position === 'hero-primary') {
			trackHeroCtaPrimaryClick();
		}

		if (position === 'hero-secondary') {
			trackHeroCtaSecondaryClick();
		}

		void saveLandingPageEvent({
			landingPageId: data.analytics.landingPageId,
			abTestId: data.analytics.abTestId,
			eventType: 'click',
			variant: data.analytics.variant,
			metadata: {
				position
			}
		});

		if (position !== 'guide') {
			void saveLandingPageEvent({
				landingPageId: data.analytics.landingPageId,
				abTestId: data.analytics.abTestId,
				eventType: 'conversion',
				variant: data.analytics.variant,
				metadata: {
					position
				}
			});
		}
	}
</script>

<SEO canonical="https://www.mittpsyke.se/angest" />

<svelte:head>
	{#if data.noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'MedicalWebPage',
		name: data.content.h1_heading,
		url: 'https://www.mittpsyke.se/angest',
		description: data.description,
		about: { '@type': 'MedicalCondition', name: 'Ångest' },
		medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Patient' },
		specialty: 'https://schema.org/Psychiatric',
		dateModified: data.lastUpdated,
		publisher: { '@type': 'Organization', name: 'MittPsyke', url: 'https://www.mittpsyke.se' }
	})}<\/script>`}
</svelte:head>

<main class="landing-page">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Stöd vid ångest</p>
			<h1>{data.content.h1_heading}</h1>
			<p class="lead">
				Ångest kan kännas stort, snabbt och ensamt. Här får du en lugnare ingång där du kan
				prata anonymt, skriva av dig och hitta små steg som hjälper kroppen och tankarna att
				sakta ned.
			</p>
			<div class="cta-row">
				<a
					class="primary-cta"
					href="/chat"
					onclick={() => trackCta('hero-primary')}
				>
					{data.content.cta_text}
				</a>
				<a
					class="secondary-cta"
					href="/dagbok"
					onclick={() => trackCta('hero-secondary')}
				>
					Skriv i dagboken
				</a>
			</div>
			<p class="support-note">MittPsyke ersätter inte vård. Vid akut fara: 112. För vårdråd: 1177.</p>
		</div>

		<aside class="hero-panel" aria-label="Vad du kan göra här">
			<h2>En lugn första riktning</h2>
			<ul>
				<li>Prata anonymt när tankarna snurrar</li>
				<li>Fånga upp mönster i dagbok och humör</li>
				<li>Fördjupa dig i guider och övningar</li>
			</ul>
		</aside>
	</section>

	<section class="content-grid">
		<div class="body-card prose-card">
			<h2>Om ångest och stöd i vardagen</h2>
			<div class="rich-copy">
				{@html data.content.html_content}
			</div>
		</div>

		<div class="body-card trust-card">
			<h2>Du behöver inte lösa allt direkt</h2>
			<p>
				Ångest betyder inte att något är fel med dig. Det kan vara kroppens sätt att försöka
				skydda dig lite för hårt. När det blir mycket kan nästa lilla steg vara nog.
			</p>
			<p>
				Om du vill kan du växla mellan att prata, skriva och läsa. Du behöver inte välja rätt
				med en gång.
			</p>
		</div>
	</section>

	<section class="feature-section" aria-label="Det här kan du göra">
		<div class="section-heading">
			<p class="eyebrow">Små nästa steg</p>
			<h2>Tre sätt att börja</h2>
		</div>
		<div class="feature-grid">
			{#each featureCards as card}
				<article class="feature-card">
					<h3>{card.title}</h3>
					<p>{card.text}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="guide-strip">
		<div>
			<p class="eyebrow">Fördjupning</p>
			<h2>Det här är översiktssidan om ångest. Här är de viktigaste fördjupningarna i klustret.</h2>
		</div>
		<div class="guide-links">
			<a href="/guider/angest" onclick={() => trackCta('guide')}>
				Öppna guiden om ångest
			</a>
			<a href="/guider/angest/angest-hjalp" onclick={() => trackCta('guide')}>
				Ångesthjälp när det känns svårt att få grepp
			</a>
			<a href="/guider/angest/panikattack-hjalp" onclick={() => trackCta('guide')}>
				Hjälp vid panikattack när kroppen larmar
			</a>
			<a href="/guider/angest/orostankar" onclick={() => trackCta('guide')}>
				Orostankar som snurrar och inte vill släppa
			</a>
			<a href="/guider/angest/lugna-en-panikattack" onclick={() => trackCta('guide')}>
				Lugna en panikattack steg för steg
			</a>
			<a href="/ovningar-mot-angest-online" onclick={() => trackCta('guide')}>
				Övningar mot ångest online
			</a>
		</div>
	</section>

	<section class="faq-section" aria-label="Vanliga frågor">
		<div class="section-heading">
			<p class="eyebrow">Vanliga frågor</p>
			<h2>Frågor många bär på</h2>
		</div>
		<div class="faq-list">
			{#each faqItems as item}
				<article class="faq-item">
					<h3>{item.question}</h3>
					<p>{item.answer}</p>
				</article>
			{/each}
		</div>
	</section>

	<section class="sources">
		<p class="updated">Senast uppdaterad: {new Date(data.lastUpdated).toLocaleDateString('sv-SE')}</p>
		<h2>Källor och vidare stöd</h2>
		<ul>
			<li>
				<a
					href="https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/"
					target="_blank"
					rel="noopener noreferrer"
				>
					Ångest – 1177 Vårdguiden
				</a>
			</li>
			<li>
				<a
					href="https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/"
					target="_blank"
					rel="noopener noreferrer"
				>
					Psykisk hälsa och suicidprevention – Socialstyrelsen
				</a>
			</li>
			<li>
				<a
					href="https://www.stodlinjer.se/stodlinjer/angestforbundet/"
					target="_blank"
					rel="noopener noreferrer"
				>
					Stöd för ångest och panikångest
				</a>
			</li>
		</ul>
	</section>
</main>

<style>
	.landing-page {
		max-width: 1080px;
		margin: 0 auto;
		padding: 1.25rem 1rem 3.8rem;
		display: grid;
		gap: 1.25rem;
	}

	.hero,
	.body-card,
	.feature-card,
	.guide-strip,
	.faq-item,
	.sources {
		border-radius: 24px;
		border: 1px solid rgba(15, 23, 42, 0.08);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.08), transparent 42%),
			linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(247, 250, 252, 0.98));
	}

	.hero {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
		gap: 1rem;
		padding: 1.4rem;
	}

	.eyebrow {
		margin: 0 0 0.45rem;
		font-size: 0.78rem;
		text-transform: uppercase;
		letter-spacing: 0.16em;
		color: #436e8f;
	}

	h1,
	h2,
	h3 {
		margin: 0;
		color: #0f172a;
	}

	h1 {
		font-size: clamp(2rem, 1.6rem + 1.7vw, 3rem);
		line-height: 1.02;
	}

	.lead,
	.hero-panel li,
	.rich-copy :global(p),
	.body-card p,
	.feature-card p,
	.guide-links a,
	.faq-item p,
	.sources li {
		font-size: 1rem;
		line-height: 1.72;
		color: rgba(15, 23, 42, 0.82);
	}

	.lead {
		margin-top: 0.8rem;
		max-width: 58ch;
	}

	.cta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		margin-top: 1.1rem;
	}

	.primary-cta,
	.secondary-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.8rem 1.2rem;
		border-radius: 999px;
		font-family: var(--font-heading);
		font-weight: 600;
		transition: transform 160ms ease, box-shadow 160ms ease;
	}

	.primary-cta {
		background: #436e8f;
		color: #fff;
		box-shadow: 0 14px 28px rgba(15, 118, 110, 0.18);
	}

	.secondary-cta {
		background: rgba(15, 23, 42, 0.04);
		border: 1px solid rgba(15, 23, 42, 0.08);
		color: #0f172a;
	}

	.primary-cta:hover,
	.secondary-cta:hover {
		transform: translateY(-1px);
	}

	.support-note,
	.updated {
		margin: 0.85rem 0 0;
		font-size: 0.9rem;
		color: rgba(15, 23, 42, 0.62);
	}

	.hero-panel {
		padding: 1rem;
		background: rgba(255, 255, 255, 0.66);
		border-radius: 20px;
		border: 1px solid rgba(15, 23, 42, 0.08);
	}

	.hero-panel ul,
	.sources ul {
		margin: 0.85rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.5rem;
	}

	.content-grid,
	.feature-grid,
	.faq-list {
		display: grid;
		gap: 1rem;
	}

	.content-grid {
		grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
	}

	.body-card,
	.guide-strip,
	.sources {
		padding: 1.2rem;
	}

	.rich-copy :global(p + p) {
		margin-top: 0.9rem;
	}

	.feature-section,
	.faq-section {
		display: grid;
		gap: 0.85rem;
	}

	.section-heading {
		display: grid;
		gap: 0.25rem;
	}

	.feature-grid {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	.feature-card,
	.faq-item {
		padding: 1.1rem;
	}

	.guide-strip {
		display: grid;
		gap: 1rem;
	}

	.guide-links {
		display: grid;
		gap: 0.6rem;
	}

	.guide-links a,
	.sources a {
		color: #436e8f;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.faq-list {
		grid-template-columns: repeat(3, minmax(0, 1fr));
	}

	@media (max-width: 900px) {
		.hero,
		.content-grid,
		.feature-grid,
		.faq-list {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.landing-page {
			padding-inline: 0.85rem;
		}

		.hero,
		.body-card,
		.guide-strip,
		.sources {
			padding: 1rem;
		}

		.cta-row {
			flex-direction: column;
		}

		.primary-cta,
		.secondary-cta {
			width: 100%;
		}
	}

	:global(.dark) .hero,
	:global(.dark) .body-card,
	:global(.dark) .feature-card,
	:global(.dark) .guide-strip,
	:global(.dark) .faq-item,
	:global(.dark) .sources {
		border-color: rgba(148, 163, 184, 0.12);
		background:
			radial-gradient(circle at top left, rgba(15, 118, 110, 0.12), transparent 42%),
			linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(2, 6, 23, 0.98));
	}

	:global(.dark) h1,
	:global(.dark) h2,
	:global(.dark) h3,
	:global(.dark) .secondary-cta {
		color: #f8fafc;
	}

	:global(.dark) .lead,
	:global(.dark) .hero-panel li,
	:global(.dark) .rich-copy :global(p),
	:global(.dark) .body-card p,
	:global(.dark) .feature-card p,
	:global(.dark) .guide-links a,
	:global(.dark) .faq-item p,
	:global(.dark) .sources li,
	:global(.dark) .support-note,
	:global(.dark) .updated {
		color: rgba(226, 232, 240, 0.82);
	}

	:global(.dark) .secondary-cta,
	:global(.dark) .hero-panel {
		background: rgba(15, 23, 42, 0.55);
		border-color: rgba(148, 163, 184, 0.18);
	}

	:global(.dark) .guide-links a,
	:global(.dark) .sources a,
	:global(.dark) .eyebrow {
		color: #7dd3fc;
	}
</style>
