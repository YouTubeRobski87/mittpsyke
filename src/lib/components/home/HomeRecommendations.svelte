<script lang="ts">
	import { CookingPot, ExternalLink, Gem, LifeBuoy } from 'lucide-svelte';
	import { trackHomeCtaClick } from '$lib/analytics';

	// Samarbeten och rekommendationer på den publika startsidan. Bara de här
	// tre domänerna, exakt som de är verifierade. Inga bilder från de externa
	// sajterna, inga spårningsparametrar och ingen karusell.
	//
	// Märkningen följer hur relationen faktiskt ser ut. Stödlinjer.se drivs av
	// samma avsändare som MittPsyke (står redan i trygghetssektionen), så det
	// sägs öppet här också. Ofta bra efter är ett samarbete och Systrarna
	// Halldin en rekommendation, ingen av dem betald. Ändras en relation ska
	// etiketten ändras med den.
	type Recommendation = {
		id: string;
		href: string;
		title: string;
		label: string;
		description: string;
		note?: string;
		linkText: string;
		icon: typeof LifeBuoy;
	};

	const featured: Recommendation = {
		id: 'stodlinjer',
		href: 'https://www.stodlinjer.se/',
		title: 'Stödlinjer.se',
		label: 'Extern stödresurs',
		description:
			'Hitta stöd och vägledning genom svenska stödverksamheter. Utforska olika vägar till hjälp utifrån din situation.',
		note: 'Fristående webbplats som drivs av samma avsändare som MittPsyke. Den är varken vård eller akutjour.',
		linkText: 'Hitta stöd och vägledning',
		icon: LifeBuoy
	};

	const others: Recommendation[] = [
		{
			id: 'oftabraefter',
			href: 'https://oftabraefter.se/',
			title: 'Ofta bra efter',
			// Robbans besked 2026-11-18: ett samarbete, inte betalt.
			label: 'Samarbete',
			description:
				'Få inspiration till middagen, hitta recept och ta vara på det som redan finns hemma. Enklare matplanering med mindre matsvinn.',
			linkText: 'Upptäck Ofta bra efter',
			icon: CookingPot
		},
		{
			id: 'systrarnahalldin',
			href: 'https://www.systrarnahalldin.com/',
			title: 'Systrarna Halldin',
			label: 'Rekommenderad webbplats',
			// Kontrollerat mot sajtens egen titel och beskrivning 2026-11-18:
			// en liten webbutik med handgjorda pärlplattor, armband och nyckelringar.
			description:
				'Handgjorda pärlplattor, armband och nyckelringar. En liten webbutik med små favoriter gjorda för hand.',
			linkText: 'Besök Systrarna Halldin',
			icon: Gem
		}
	];

	function track(item: Recommendation) {
		trackHomeCtaClick({ section: 'rekommendationer', cta: item.id, href: item.href });
	}
</script>

{#snippet card(item: Recommendation, isFeatured: boolean)}
	<li class="rec-card" class:rec-card--featured={isFeatured}>
		<div class="rec-head">
			<span class="rec-icon" aria-hidden="true">
				<item.icon size={isFeatured ? 22 : 20} strokeWidth={1.75} />
			</span>
			<p class="rec-label">{item.label}</p>
		</div>
		<h3 class="rec-title">{item.title}</h3>
		<p class="rec-text">{item.description}</p>
		{#if item.note}
			<p class="rec-note">{item.note}</p>
		{/if}
		<a
			class="rec-link"
			href={item.href}
			target="_blank"
			rel="noopener noreferrer"
			onclick={() => track(item)}
		>
			{item.linkText}
			<ExternalLink size={15} aria-hidden="true" />
			<span class="sr-only">(extern webbplats, öppnas i ny flik)</span>
		</a>
	</li>
{/snippet}

<section class="home-recommendations" aria-labelledby="recommendations-title">
	<div class="rec-inner">
		<p class="rec-kicker">Samarbeten &amp; rekommendationer</p>
		<h2 id="recommendations-title">Fler platser att upptäcka</h2>
		<p class="rec-intro">Webbplatser och initiativ som vi gärna vill lyfta fram.</p>

		<ul class="rec-grid" role="list">
			{@render card(featured, true)}
			{#each others as item (item.id)}
				{@render card(item, false)}
			{/each}
		</ul>
	</div>
</section>

<style>
	/* Använder startsidans egna variabler (definierade globalt i +page.svelte)
	   och appens radie, så sektionen ser ut som resten av sidan. */
	.home-recommendations {
		padding: clamp(2.2rem, 6vw, 3.8rem) 1.25rem;
		background: var(--home-section-bg);
		color: var(--home-text-soft);
	}

	.rec-inner {
		width: min(1280px, 100%);
		margin: 0 auto;
	}

	.rec-kicker {
		margin: 0 0 0.55rem;
		color: #9ccbb7;
		font-size: 0.78rem;
		font-weight: 750;
		letter-spacing: 0.1em;
		text-transform: uppercase;
	}

	h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.5rem, 3vw, 2.1rem);
		line-height: 1.12;
		letter-spacing: -0.02em;
		color: var(--home-text-strong);
	}

	.rec-intro {
		margin: 0.8rem 0 0;
		max-width: 62ch;
		font-size: 0.98rem;
		line-height: 1.65;
		color: var(--home-text-muted-strong);
	}

	.rec-grid {
		display: grid;
		gap: 1rem;
		margin: clamp(1.5rem, 3.4vw, 2.2rem) 0 0;
		padding: 0;
		list-style: none;
	}

	/* Lugna kort: tunn ram, ingen skugga, inget som ser ut som en annons. */
	.rec-card {
		display: flex;
		flex-direction: column;
		min-width: 0;
		padding: clamp(1.1rem, 2.6vw, 1.5rem);
		border: 1px solid rgba(148, 163, 184, 0.22);
		border-radius: var(--radius-card);
		background: rgba(148, 163, 184, 0.04);
	}

	/* Stödlinjer.se får lite mer utrymme och en svag ton i stället för en
	   starkare färg, så att den inte förväxlas med akutinformationen. */
	.rec-card--featured {
		padding: clamp(1.25rem, 3vw, 1.85rem);
		border-color: rgba(156, 203, 183, 0.34);
		background: rgba(156, 203, 183, 0.07);
	}

	.rec-head {
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.rec-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		flex: none;
		border-radius: var(--radius-pill);
		background: rgba(148, 163, 184, 0.1);
		color: var(--home-text-cool);
	}

	.rec-card--featured .rec-icon {
		width: 2.5rem;
		height: 2.5rem;
		background: rgba(156, 203, 183, 0.14);
		color: #9ccbb7;
	}

	.rec-label {
		margin: 0;
		font-size: 0.74rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--home-text-muted-strong);
	}

	.rec-title {
		margin: 0.85rem 0 0;
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: var(--home-text-strong);
	}

	.rec-card--featured .rec-title {
		font-size: clamp(1.2rem, 2.2vw, 1.4rem);
	}

	.rec-text {
		margin: 0.45rem 0 0;
		max-width: 62ch;
		font-size: 0.95rem;
		line-height: 1.65;
		color: var(--home-text-muted-strong);
	}

	.rec-note {
		margin: 0.6rem 0 0;
		max-width: 62ch;
		font-size: 0.84rem;
		line-height: 1.55;
		color: var(--home-text-muted);
	}

	/* Samma länkstil som startsidans .text-link, med 44 px träffyta. Länken
	   ligger sist i kortet och skjuts ned så att korten på samma rad får
	   länkarna i linje. */
	.rec-link {
		display: inline-flex;
		align-items: center;
		align-self: flex-start;
		gap: 0.4rem;
		min-height: 44px;
		margin-top: auto;
		padding-top: 0.7rem;
		color: var(--home-link);
		font-family: var(--font-heading);
		font-size: 0.92rem;
		font-weight: 650;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.rec-link:hover {
		text-decoration-thickness: 2px;
	}

	@media (min-width: 760px) {
		.rec-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.rec-card--featured {
			grid-column: 1 / -1;
		}
	}

	:global(.dark) .home-recommendations {
		background: var(--home-dark-bg);
	}
</style>
