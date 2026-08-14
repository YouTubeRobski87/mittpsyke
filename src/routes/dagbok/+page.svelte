<script lang="ts">
	import { page } from '$app/stores';
	import SEO from '$lib/components/SEO.svelte';
	import DiaryHero from '$lib/components/DiaryHero.svelte';
	import GuestQuickEntry from '$lib/components/GuestQuickEntry.svelte';

	// Visa snabbantecknings-yta direkt om användaren kommer in via CTA
	const showQuickEntry = $derived($page.url.searchParams.get('action') === 'new');

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

<DiaryHero
	variant="diary-main"
	title="Dagbok för tankar, känslor och mönster"
	lead="Skriv av dig, följ hur måendet skiftar och kom tillbaka när du vill förstå mer."
	ctaLabel="Börja skriva"
	secondaryHref="/framsteg"
	secondaryLabel="Se framsteg"
/>

{#if showQuickEntry}
	<GuestQuickEntry />
{/if}

	<main class="seo-diary-page">
		<section class="content-grid">
			<article class="body-card">
				<p class="eyebrow">Vad dagboken är</p>
				<h2>En privat plats där tankar får landa</h2>
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
				<p class="eyebrow">Låg tröskel</p>
				<h2>Börja litet, fortsätt i din takt</h2>
				<p>
					Du behöver inte skriva långt eller hitta rätt ord direkt. Några rader räcker. MittPsyke är
					gjort för att kännas lugnt, tydligt och mänskligt även de dagar då det är svårt att samla
					tankarna.
				</p>
				<a class="inline-cta" href="/dagbok?action=new">Börja skriva</a>
			</article>
		</section>

		<section class="benefits-section" aria-label="Fördelar med dagboken">
			<div class="section-heading">
				<p class="eyebrow">Fyra fördelar</p>
				<h2>Det här får du i dagboken</h2>
			</div>

			<div class="benefit-grid">
				<article class="benefit-card">
					<h3>Skriv av dig</h3>
					<p>Ge plats åt det som snurrar, utan krav på att formulera allt perfekt.</p>
				</article>
				<article class="benefit-card">
					<h3>Följ ditt mående</h3>
					<p>Lägg märke till hur dagar skiftar och vad som påverkar dig i vardagen.</p>
				</article>
				<article class="benefit-card">
					<h3>Se mönster över tid</h3>
					<p>Upptäck återkommande teman, små framsteg och sådant som hjälper.</p>
				</article>
				<article class="benefit-card">
					<h3>Privat och tryggt</h3>
					<p>Dina inlägg är privata för dig och du väljer själv vad du vill skriva.</p>
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
			Dagboken är ett stöd för reflektion, inte vård eller behandling. Vid akut fara: 112.
			För vårdråd: 1177.
		</p>
	</main>

<style>
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
		border-radius: 18px;
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

	.inline-cta {
		justify-self: start;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.55rem;
		margin-top: 0.25rem;
		padding: 0.62rem 1rem;
		border-radius: var(--radius-pill);
		background: var(--theme-accent, var(--primary));
		color: #fff;
		font-family: var(--font-heading);
		font-size: 0.92rem;
		font-weight: 650;
		text-decoration: none;
		box-shadow: 0 10px 20px rgba(15, 118, 110, 0.14);
		transition:
			transform 150ms ease,
			box-shadow 150ms ease;
	}

	.inline-cta:hover {
		transform: translateY(-1px);
		box-shadow: 0 14px 24px rgba(15, 118, 110, 0.18);
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

	.benefit-card {
		position: relative;
		overflow: hidden;
	}

	.benefit-card::before {
		content: '';
		width: 1.8rem;
		height: 0.18rem;
		border-radius: var(--radius-pill);
		background: var(--theme-accent, var(--primary));
		opacity: 0.65;
	}

	.support-note {
		margin: 0.5rem 0 0;
		padding: 0.9rem 1rem;
		border-radius: var(--radius-input);
		background: hsl(var(--surface-soft));
		border: 1px solid hsl(var(--border));
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
