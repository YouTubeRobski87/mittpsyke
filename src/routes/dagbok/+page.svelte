<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import SEO from '$lib/components/SEO.svelte';
	import HealthConsent from '$lib/components/HealthConsent.svelte';
	import DiaryHero from '$lib/components/DiaryHero.svelte';
	import GuestQuickEntry from '$lib/components/GuestQuickEntry.svelte';

	const STORAGE_KEY = 'mittpsyke.healthConsent';
	const VERSION = '2026-04-29';

	let hasConsent = $state(false);

	// Visa snabbantecknings-yta direkt om användaren kommer in via CTA
	const showQuickEntry = $derived($page.url.searchParams.get('action') === 'new');

	onMount(() => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return;

			const parsed = JSON.parse(stored);
			if (parsed?.accepted && parsed?.policy_version === VERSION) {
				hasConsent = true;
			}
		} catch {
			hasConsent = false;
		}
	});

	const faqItems = [
		{
			question: 'Är dagboken gratis?',
			answer:
				'Ja. Du kan börja gratis och skriva i lugn takt. Om du vill spara inlägg, få AI-reflektioner och följa ditt mående över tid skapar du ett konto.'
		},
		{
			question: 'Kan någon annan läsa mina inlägg?',
			answer:
				'Nej. Dina dagboksinlägg är privata för dig. MittPsyke är byggt för att ge dig en egen och lugn plats för reflektion.'
		},
		{
			question: 'Behöver jag skapa ett konto?',
			answer:
				'För att spara i dagboken och följa stämningslogg och framsteg behöver du ett konto. Du kan läsa om funktionen utan att logga in.'
		}
	];

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	};
</script>

<SEO canonical="https://www.mittpsyke.se/dagbok" />

<svelte:head>
	{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}<\/script>`}
</svelte:head>

<DiaryHero variant="diary-main" />

{#if showQuickEntry}
	<GuestQuickEntry />
{/if}

{#if !hasConsent}
	<div class="consent-wrap">
		<HealthConsent onAccept={() => (hasConsent = true)} />
	</div>
{:else}
	<main class="seo-diary-page">
		<section class="content-grid">
			<article class="body-card">
				<h2>En dagbok som gör mer än att bara spara text</h2>
				<p>
					När du skriver får du en plats där tankar, känslor och återkommande mönster kan landa.
					Dagboken hjälper dig att stanna upp, sätta ord på det som känns och få AI-genererade
					reflektioner som ger lite mer riktning.
				</p>
				<p>
					Du kan också följa en enkel stämningslogg och se framsteg över tid. Det gör det lättare att
					upptäcka vad som återkommer, vad som hjälper och hur ditt mående faktiskt förändras.
				</p>
			</article>

			<article class="body-card accent-card">
				<h2>Börja litet, fortsätt i din takt</h2>
				<p>
					Du behöver inte skriva långt eller hitta rätt ord direkt. Några rader räcker. MittPsyke är
					gjort för att kännas lugnt, tydligt och mänskligt även de dagar då det är svårt att samla
					tankarna.
				</p>
			</article>
		</section>

		<section class="benefits-section" aria-label="Fördelar med dagboken">
			<div class="section-heading">
				<p class="eyebrow">Fyra fördelar</p>
				<h2>Det här får du i dagboken</h2>
			</div>

			<div class="benefit-grid">
				<article class="benefit-card">
					<h3>AI-reflektioner</h3>
					<p>Få en lugn sammanfattning som hjälper dig att förstå det du precis har skrivit.</p>
				</article>
				<article class="benefit-card">
					<h3>Stämningslogg</h3>
					<p>Se hur dagar skiljer sig åt och få bättre grepp om hur du mår över tid.</p>
				</article>
				<article class="benefit-card">
					<h3>Framsteg</h3>
					<p>Upptäck små steg framåt, återkommande mönster och det som faktiskt hjälper.</p>
				</article>
				<article class="benefit-card">
					<h3>Låg tröskel</h3>
					<p>Börja med några få ord och skriv i din egen takt, utan press att prestera.</p>
				</article>
			</div>
		</section>

		<section class="faq-section" aria-label="Vanliga frågor om dagboken">
			<div class="section-heading">
				<p class="eyebrow">Vanliga frågor</p>
				<h2>Det här undrar många</h2>
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

		<p class="support-note">
			MittPsyke ersätter inte vård. Vid akut fara: 112. För vårdråd: 1177.
		</p>
	</main>
{/if}

<style>
	.consent-wrap {
		max-width: 1080px;
		margin: 1.25rem auto 0;
		padding: 0 1.25rem;
	}

	.seo-diary-page {
		max-width: 1080px;
		margin: 1.25rem auto 0;
		padding: 0 1.25rem 4rem;
		display: grid;
		gap: 1.25rem;
	}

	.body-card,
	.benefit-card,
	.faq-item {
		border-radius: 24px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
	}

	h2,
	h3 {
		margin: 0;
	}

	.body-card p,
	.benefit-card p,
	.faq-item p {
		margin: 0;
		line-height: 1.7;
		color: hsl(var(--foreground) / 0.84);
	}

	.content-grid,
	.benefit-grid,
	.faq-list {
		display: grid;
		gap: 1rem;
	}

	.body-card,
	.benefit-card,
	.faq-item {
		padding: 1.2rem 1.1rem;
		display: grid;
		gap: 0.65rem;
	}

	.accent-card {
		background:
			radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 38%),
			hsl(var(--surface));
	}

	.section-heading {
		display: grid;
		gap: 0.35rem;
	}

	.benefits-section,
	.faq-section {
		display: grid;
		gap: 1rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	.benefit-card h3,
	.faq-item h3 {
		font-size: 1rem;
	}

	.support-note {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
	}

	@media (max-width: 760px) {
		.seo-diary-page {
			padding: 0 0.65rem 2.5rem;
			gap: 0.75rem;
		}

		.body-card,
		.benefit-card,
		.faq-item {
			border-radius: var(--radius-input);
			padding: 0.8rem;
		}

		.benefits-section,
		.faq-section,
		.benefit-grid,
		.faq-list {
			gap: 0.55rem;
		}
	}

	@media (min-width: 900px) {
		.content-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.benefit-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
