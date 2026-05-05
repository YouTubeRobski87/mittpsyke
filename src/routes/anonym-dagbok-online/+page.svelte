<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import DiaryHero from '$lib/components/DiaryHero.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/anonym-dagbok-online" />

<svelte:head>
	<title>Anonym dagbok online utan konto | Reflektion i text | MittPsyke</title>
	<meta
		name="description"
		content="Skriv i en anonym dagbok online utan konto. Börja med reflektion i text, sortera tankar i lugn takt och gå vidare till anonym chatt om du vill."
	/>
	<meta property="og:title" content="Anonym dagbok online | MittPsyke" />
	<meta
		property="og:description"
		content="När du bara vill skriva av dig kan en lugn digital dagbok ge mer struktur, reflektion och kontinuitet."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<DiaryHero
	variant="diary-landing"
	title="Skriv anonymt och följ ditt mående"
	subtitle="Din text sparas lokalt. Inget konto krävs."
	secondaryHref="/digital-dagbok-for-maende"
	secondaryLabel="Läs om digital dagbok"
/>

<main class="page">
	<div class="page-container">

		<section class="section">
			<h2>När du bara vill skriva av dig</h2>
			<p>
				Det behöver inte vara perfekt eller genomtänkt. Dagboken kan vara en lugn plats för sådant som är
				svårt att säga högt eller svårt att förstå i stunden.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/digital-dagbok-for-maende">Digital dagbok för mående</a> när du vill ha mer struktur.</li>
				<li><a href="/framsteg">Framsteg</a> för att se återkommande mönster över tid.</li>
				<li><a href="/chatta-anonymt">Chatta anonymt utan konto</a> när du vill reflektera vidare i samtal.</li>
				<li><a href="/hjalp-vid-angest-online">Hjälp vid ångest online</a> och <a href="/om-mittpsyke">Om MittPsyke</a> om du vill läsa vidare.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Om du vill spara historik och få en egen plats över tid kan du <a href="/register">skapa konto</a>.
				Du kan också börja skriva direkt eller öppna chatten om du vill ta nästa steg i samtal.
			</p>
			<p class="links-row">
				<a href="/dagbok">Skriv i dagboken</a>
				<a href="/framsteg">Se framsteg</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja varsamt och skapa en egen plats först när du vill spara innehåll över tid.</p>
			<h3>Är detta anonymt?</h3>
			<p>Du kan börja med låg tröskel och använda dagboken i din egen takt.</p>
			<h3>Var börjar jag om jag bara vill skriva av mig?</h3>
			<p>Börja med några få rader. Det räcker långt som första steg.</p>
		</section>
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

	.hero,
	.section {
		max-width: 720px;
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: -0.02em;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		line-height: 1.08;
	}

	h2 {
		font-size: 1.3rem;
		margin-bottom: 0.6rem;
	}

	h3 {
		font-size: 1rem;
		margin-top: 0.9rem;
	}

	p,
	li {
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.08rem);
		line-height: 1.7;
		margin: 0;
	}

	ul {
		margin: 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	.links-row {
		margin-top: 0.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
	}

	.faq p + h3 {
		margin-top: 1rem;
	}

</style>

