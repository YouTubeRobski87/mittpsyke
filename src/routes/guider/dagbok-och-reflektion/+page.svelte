<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import DiaryHero from '$lib/components/DiaryHero.svelte';

	const faqItems = [
		{
			question: 'Hur hjälper dagboksskrivande mig att reflektera?',
			answer:
				'Att skriva aktiverar en annan del av hjärnan än att bara tänka. Det hjälper dig att externalasera tankar, se mönster och skapa lite distans till det som känns svårt.'
		},
		{
			question: 'Vad är skillnaden mellan dagbok och AI-chatt på MittPsyke?',
			answer:
				'Dagboken är din privata yta för fri reflektion. Chatten ger dig ett samtal med AI som svarar och ställer följdfrågor. Många kombinerar båda.'
		},
		{
			question: 'Hur ofta bör jag skriva för att se effekt?',
			answer:
				'Det finns ingen minsta gräns. Forskning pekar på att redan 15 minuter om dagen under tre dagar kan ge mätbar effekt på välbefinnandet. Börja med vad som känns hanterbart.'
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
		'@type': 'WebPage',
		headline: 'Dagbok och reflektion – skriv dig till klarhet',
		description:
			'Dagbok och reflektion hjälper dig att bearbeta tankar, se mönster och förstå ditt mående. Börja skriva anonymt direkt – inget konto krävs.',
		url: 'https://www.mittpsyke.se/guider/dagbok-och-reflektion',
		publisher: {
			'@type': 'Organization',
			name: 'MittPsyke',
			url: 'https://www.mittpsyke.se'
		},
		inLanguage: 'sv-SE'
	};
</script>

<SEO canonical="https://www.mittpsyke.se/guider/dagbok-och-reflektion" />

<svelte:head>
	<title>Dagbok och reflektion – skriv dig till klarhet | MittPsyke</title>
	<meta
		name="description"
		content="Dagbok och reflektion hjälper dig att bearbeta tankar och förstå ditt mående. Skriv anonymt direkt utan konto och få AI-reflektion på det du skriver."
	/>
	<meta property="og:title" content="Dagbok och reflektion | MittPsyke" />
	<meta
		property="og:description"
		content="Skriv av dig, bearbeta tankar och följ ditt mående med dagbok och reflektion på MittPsyke."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	{@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}<\/script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}<\/script>`}
</svelte:head>

<DiaryHero
	variant="diary-landing"
	title="Dagbok och reflektion"
	subtitle="Skriv av dig, se mönster och förstå ditt mående – direkt, utan konto."
	secondaryHref="/framsteg"
	secondaryLabel="Se framsteg"
/>

<main class="page">
	<div class="page-container">
		<section class="section">
			<h2>Varför dagbok och reflektion fungerar</h2>
			<p>
				Att skriva ner tankar och känslor är ett av de mest beforskade och lättillgängliga sätten att
				bearbeta svåra upplevelser. Det kostar inget, kräver ingen utrustning och kan göras när som
				helst.
			</p>
			<p>
				Reflekterande dagboksskrivande – att aktivt försöka förstå och tolka det man skriver – ger
				starkare effekt än att bara ventilera känslor. Det är därför MittPsyke erbjuder
				AI-reflektioner på dina inlägg.
			</p>
		</section>

		<section class="section">
			<h2>Tre sätt att använda dagboken</h2>
			<ul>
				<li>
					<strong>Fri tömning:</strong> Skriv allt utan filter. Sortera tankar, töm huvudet.
				</li>
				<li>
					<strong>Strukturerad reflektion:</strong> Svara på en fråga, t.ex. "Vad var svårt idag och varför?"
				</li>
				<li>
					<strong>Stämningslogg:</strong> Notera ditt mående kort varje dag och se mönster över tid.
				</li>
			</ul>
		</section>

		<section class="section">
			<h2>Kombinera med AI-stöd</h2>
			<p>
				Med ett konto kan du få AI-genererade reflektioner på dina inlägg – en lugn, kort
				sammanfattning som hjälper dig att förstå vad du just skrivit. Det ersätter inte terapi men
				kan ge ett extra lager av insikt.
			</p>
			<p>
				Vill du samtala istället för att skriva? Öppna <a href="/chat">chatten</a> och reflektera
				vidare i dialog.
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
				Börja med <a href="/dagbok">dagboken</a>, läs om
				<a href="/anonym-dagbok-online">anonym dagbok online</a> eller se
				<a href="/framsteg">framsteg och mönster</a>. Redo att spara din historia?
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
		gap: 0.5rem;
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
