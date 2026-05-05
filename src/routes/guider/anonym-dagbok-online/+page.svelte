<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import DiaryHero from '$lib/components/DiaryHero.svelte';

	const faqItems = [
		{
			question: 'Behöver jag ett konto för att använda dagboken?',
			answer:
				'Nej. Du kan börja skriva direkt utan konto. Din text sparas lokalt på din enhet. Om du vill spara historik och följa ditt mående över tid kan du skapa konto senare.'
		},
		{
			question: 'Vad menas med anonym dagbok?',
			answer:
				'Anonym dagbok betyder att du kan skriva utan att logga in, registrera dig eller koppla din text till en identitet. Inget skickas till en server förrän du väljer att spara.'
		},
		{
			question: 'Är dagboken säker att använda?',
			answer:
				'Ja. Text du skriver som gäst lagras enbart i din webbläsares localStorage. MittPsyke skickar inte din text vidare utan ditt medgivande.'
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

	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'Anonym dagbok online – skriv utan konto',
		description:
			'Skriv i en anonym dagbok online utan konto. Din text sparas lokalt. Börja reflektera direkt och skapa konto när du är redo.',
		url: 'https://www.mittpsyke.se/guider/anonym-dagbok-online',
		publisher: {
			'@type': 'Organization',
			name: 'MittPsyke',
			url: 'https://www.mittpsyke.se'
		},
		inLanguage: 'sv-SE'
	};
</script>

<SEO canonical="https://www.mittpsyke.se/guider/anonym-dagbok-online" />

<svelte:head>
	<title>Anonym dagbok online – skriv utan konto | MittPsyke</title>
	<meta
		name="description"
		content="Skriv i en anonym dagbok online utan konto. Din text sparas lokalt på din enhet. Börja reflektera direkt – skapa konto när du är redo att spara."
	/>
	<meta property="og:title" content="Anonym dagbok online | MittPsyke" />
	<meta
		property="og:description"
		content="Skriv anonymt utan konto. Din text stannar på din enhet tills du väljer att spara den."
	/>
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary" />
	{@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}<\/script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}<\/script>`}
</svelte:head>

<DiaryHero
	variant="diary-landing"
	title="Skriv anonymt utan konto"
	subtitle="Din text sparas lokalt. Inget skickas vidare förrän du väljer det."
	secondaryHref="/dagbok"
	secondaryLabel="Till dagboken"
/>

<main class="page">
	<div class="page-container">
		<section class="section">
			<h2>Varför skriva anonymt?</h2>
			<p>
				Att skriva utan ett konto sänker tröskeln. Du behöver inte bestämma dig för något i förväg –
				bara börja. Text som inte sparas någonstans permanent kan kännas friare att skriva.
			</p>
			<p>
				MittPsyke låter dig skriva direkt i dagboken och sparar texten lokalt i din webbläsare.
				Ingenting skickas till en server förrän du aktivt väljer att spara med ett konto.
			</p>
		</section>

		<section class="section">
			<h2>Så fungerar den anonyma dagboken</h2>
			<ul>
				<li>Klicka på "Börja skriva nu" – du tas direkt till skrivytan.</li>
				<li>Din text sparas automatiskt lokalt var tredje sekund.</li>
				<li>Ingen inloggning, ingen registrering, inga spårningscookies.</li>
				<li>Vill du spara permanent? Skapa konto och flytta över din text.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Vad kan dagboken hjälpa med?</h2>
			<p>
				En dagbok kan ge dig ett rum för saker som är svåra att sätta ord på i samtal. Att skriva
				hjälper ofta att sorttera tankar, hitta mönster och få lite distans till det som känns tungt.
				Kombiner gärna med <a href="/chat">chatten</a> om du vill reflektera vidare med AI-stöd.
			</p>
		</section>

		<section class="section">
			<h2>Vanliga frågor</h2>
			<div class="faq-list">
				{#each faqItems as item}
					<article class="faq-item">
						<h3>{item.question}</h3>
						<p>{item.answer}</p>
					</article>
				{/each}
			</div>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Börja med dagboken, se <a href="/framsteg">framsteg</a> och läs om
				<a href="/digital-dagbok-for-maende">digital dagbok för mående</a>. Redo att spara?
				<a href="/register">Skapa konto</a>.
			</p>
		</section>

		<p class="support-note">
			MittPsyke ersätter inte vård. Vid akut fara: 112. För vårdråd: 1177.
		</p>
	</div>
</main>

<style>
	.page {
		padding: clamp(1.5rem, 4vw, 2rem) clamp(1.25rem, 4vw, 1.5rem) clamp(3.2rem, 8vw, 4rem);
	}

	.page-container {
		max-width: 840px;
		margin: 0 auto;
		display: grid;
		gap: clamp(1.3rem, 3vw, 1.8rem);
	}

	.section {
		max-width: 720px;
	}

	h2,
	h3 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.6rem;
	}

	h3 {
		font-size: 1rem;
		margin-bottom: 0.35rem;
	}

	p,
	li {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.7;
		margin: 0;
	}

	p + p {
		margin-top: 0.65rem;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.faq-list {
		display: grid;
		gap: 0.85rem;
	}

	.faq-item {
		border-radius: 16px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		padding: 1rem 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.faq-item p {
		color: hsl(var(--foreground) / 0.82);
	}

	.support-note {
		margin: 0;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
	}
</style>
