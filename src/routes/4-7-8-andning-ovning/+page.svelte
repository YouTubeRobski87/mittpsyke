<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/4-7-8-andning-ovning" />

<svelte:head>
	<title>4-7-8 andning övning | Lugna andetag i egen takt | MittPsyke</title>
	<meta
		name="description"
		content="Prova en 4-7-8 andning övning för att landa lite lugnare när tankarna snurrar eller kroppen är spänd."
	/>
	<meta property="og:title" content="4-7-8 andning övning | MittPsyke" />
	<meta
		property="og:description"
		content="När kroppen går upp i varv kan lugna andetag vara ett enkelt första steg innan du går vidare."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>4-7-8 andning övning</h1>
			<p>
				När tankarna snurrar eller kroppen känns spänd kan en enkel andningsövning vara ett lugnt första
				steg. Här kan du börja varsamt och hitta vägar vidare i din egen takt.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/ovningar/4-7-8-andning">Öppna 4-7-8-övningen</a>
			<a class="cta-button ghost" href="/andningsovningar-mot-angest">Se fler andningsövningar</a>
		</div>

		<section class="section">
			<h2>När du behöver landa i stunden</h2>
			<p>
				Det behöver inte vara avancerat för att vara hjälpsamt. Ett par lugna andetag kan göra det lättare
				att stanna upp och välja nästa steg med lite mer överblick.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/andningsovningar-mot-angest">Andningsövningar mot ångest</a> för att komma igång varsamt.</li>
				<li><a href="/ovningar-mot-angest-online">Övningar mot ångest online</a> när du vill prova fler verktyg.</li>
				<li><a href="/hjalp-vid-angest-online">Hjälp vid ångest online</a> om du vill fortsätta i samtal.</li>
				<li><a href="/dagbok">Dagbok</a> för att skriva ner hur det känns före och efter.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Du kan börja med själva övningen, skriva i dagboken eller fortsätta i samtal om du märker att du
				vill ha mer stöd än en övning just nu.
			</p>
			<p class="links-row">
				<a href="/chat/a">Starta samtal om ångest</a>
				<a href="/ovningar">Se fler övningar</a>
				<a href="/dagbok">Skriv i dagboken</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Du kan börja med övningen direkt och använda andra delar av MittPsyke när det passar.</p>
			<h3>Hur kan en övning hjälpa i stunden?</h3>
			<p>Den kan ge kroppen och tankarna lite mer lugn så att nästa steg känns mer hanterbart.</p>
			<h3>Ersätter detta vård?</h3>
			<p>Nej. MittPsyke är ett digitalt samtalsstöd och ett komplement till vård.</p>
		</section>
	</div>
</main>

<style>
	.page {
		padding: clamp(2.2rem, 6vw, 3rem) clamp(1.25rem, 4vw, 1.5rem) clamp(3.2rem, 8vw, 4rem);
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

	.cta-container {
		max-width: 720px;
		display: flex;
		gap: 0.7rem;
		flex-wrap: wrap;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.7rem 1.35rem;
		border-radius: var(--radius-pill);
		background: var(--primary);
		border: 2px solid var(--primary);
		color: white;
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
	}

	.cta-button.ghost {
		background: transparent;
		color: var(--primary);
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

	@media (max-width: 640px) {
		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .cta-button.ghost {
		color: #86dfd6;
		border-color: #86dfd6;
	}
</style>

