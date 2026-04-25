<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';

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
	<title>Digital dagbok för mående | Reflektion i text | MittPsyke</title>
	<meta
		name="description"
		content="Skriv dagbok online och få AI-reflektioner i text om ditt mående. För dig som vill följa mönster över tid i en egen dagbok."
	/>
	{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}<\/script>`}
</svelte:head>

<main class="seo-diary-page">
	<section class="hero">
		<div class="hero-copy">
			<p class="eyebrow">Dagbok för vardagen</p>
			<h1>Digital dagbok för ditt mående</h1>
			<p class="lead">
				MittPsyke är en digital dagbok för mående där du kan skriva i lugn takt, få
				AI-reflektioner och följa hur ditt mående skiftar över tid. Det är en online dagbok för
				psykisk hälsa för dig som vill förstå dig själv lite tydligare utan att allt behöver bli så
				stort på en gång.
			</p>
			<p class="support-copy">
				Du kan använda dagboken när du vill skriva dagbok vid ångest, samla tankar från dagen och
				se små framsteg som annars är lätta att missa. Om du vill börja utan konto kan du använda
				<a href="/anonym-dagbok-online">anonym dagbok online</a> först.
			</p>
			<div class="cta-row">
				<a class="primary-cta" href="/registrera">Börja skriva gratis</a>
				<a class="secondary-cta" href="/login">Logga in</a>
			</div>
			<p class="support-note">MittPsyke ersätter inte vård. Vid akut fara: 112. För vårdråd: 1177.</p>
		</div>

		<aside class="hero-panel" aria-label="Det här får du">
			<h2>Vad dagboken hjälper med</h2>
			<ul>
				<li>AI-reflektioner som hjälper dig se det tydligare</li>
				<li>Stämningslogg för att fånga små skiften</li>
				<li>Framsteg över tid i lugn och egen takt</li>
			</ul>
		</aside>
	</section>

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
</main>

<style>
	.seo-diary-page {
		max-width: 1080px;
		margin: 0 auto;
		padding: 0 1.25rem 4rem;
		display: grid;
		gap: 1.25rem;
	}

	.hero {
		display: grid;
		gap: 1rem;
		padding-top: 0.5rem;
	}

	.hero-copy,
	.hero-panel,
	.body-card,
	.benefit-card,
	.faq-item {
		border-radius: 24px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
	}

	.hero-copy {
		padding: clamp(1.4rem, 3vw, 2.4rem);
		display: grid;
		gap: 0.9rem;
		background:
			radial-gradient(circle at top left, rgba(20, 184, 166, 0.14), transparent 40%),
			linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface-soft)) 100%);
	}

	.eyebrow {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	h1,
	h2,
	h3 {
		margin: 0;
	}

	h1 {
		font-size: clamp(2rem, 1.5rem + 2vw, 3.2rem);
		line-height: 1.05;
		letter-spacing: -0.04em;
	}

	.lead,
	.support-copy,
	.body-card p,
	.benefit-card p,
	.faq-item p {
		margin: 0;
		line-height: 1.7;
		color: hsl(var(--foreground) / 0.84);
	}

	.lead {
		font-size: 1.02rem;
	}

	.cta-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		padding-top: 0.35rem;
	}

	.primary-cta,
	.secondary-cta {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 2.95rem;
		padding: 0.78rem 1.15rem;
		border-radius: var(--radius-pill);
		text-decoration: none;
		font-weight: 600;
		transition: transform 150ms ease, opacity 150ms ease, border-color 150ms ease;
	}

	.primary-cta {
		background: var(--theme-accent, var(--primary));
		color: #fff;
		box-shadow: 0 12px 24px rgba(15, 118, 110, 0.18);
	}

	.secondary-cta {
		border: 1px solid hsl(var(--border));
		color: hsl(var(--foreground));
		background: hsl(var(--surface-soft));
	}

	.primary-cta:hover,
	.secondary-cta:hover {
		transform: translateY(-1px);
	}

	.support-note {
		margin: 0;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
	}

	.hero-panel {
		padding: 1.2rem 1.15rem;
		display: grid;
		gap: 0.8rem;
	}

	.hero-panel ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.55rem;
		color: hsl(var(--foreground) / 0.82);
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

	.benefit-card h3,
	.faq-item h3 {
		font-size: 1rem;
	}

	@media (max-width: 760px) {
		.seo-diary-page {
			padding: 0 0.65rem 2.5rem;
			gap: 0.75rem;
		}

		.hero {
			gap: 0.6rem;
			padding-top: 0;
		}

		.hero-copy,
		.hero-panel,
		.body-card,
		.benefit-card,
		.faq-item {
			border-radius: var(--radius-input);
		}

		.hero-copy {
			padding: 1rem;
			gap: 0.65rem;
		}

		h1 {
			font-size: 1.75rem;
			line-height: 1.08;
		}

		.lead {
			font-size: 0.95rem;
			line-height: 1.55;
		}

		.support-copy,
		.hero-panel,
		.content-grid,
		.section-heading .eyebrow,
		.benefit-card p,
		.faq-item p {
			display: none;
		}

		.cta-row {
			display: grid;
			grid-template-columns: 1fr 1fr;
			gap: 0.5rem;
			padding-top: 0.1rem;
		}

		.primary-cta,
		.secondary-cta {
			min-height: 2.65rem;
			padding: 0.65rem 0.75rem;
			font-size: 0.9rem;
		}

		.support-note {
			font-size: 0.78rem;
			line-height: 1.45;
		}

		.benefits-section,
		.faq-section,
		.benefit-grid,
		.faq-list {
			gap: 0.55rem;
		}

		.body-card,
		.benefit-card,
		.faq-item {
			padding: 0.8rem;
		}
	}

	@media (min-width: 900px) {
		.hero {
			grid-template-columns: minmax(0, 1.35fr) minmax(280px, 0.85fr);
			align-items: stretch;
		}

		.content-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.benefit-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
