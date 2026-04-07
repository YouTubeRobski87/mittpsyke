<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/digital-dagbok-for-maende" />

<svelte:head>
	<title>Digital dagbok för mående | Skriv, följ och förstå över tid | MittPsyke</title>
	<meta
		name="description"
		content="Använd en digital dagbok för mående för att skriva av dig, se mönster och följa små steg över tid."
	/>
	<meta property="og:title" content="Digital dagbok för mående | MittPsyke" />
	<meta
		property="og:description"
		content="När du vill förstå ditt mående bättre kan en digital dagbok ge mer struktur, reflektion och kontinuitet."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Digital dagbok för mående</h1>
			<p>
				När mycket pågår samtidigt kan det vara svårt att se mönster. En digital dagbok kan hjälpa dig att
				skriva av dig, följa små förändringar och få en lugnare överblick över tid.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/dagbok">Öppna dagboken</a>
			<a class="cta-button ghost" href="/register">Skapa din egen plats</a>
		</div>

		<section class="section">
			<h2>När skrivande hjälper dig att landa</h2>
			<p>
				Dagboken är till för reflektion, inte prestation. Du kan skriva kort eller långt, följa känslor
				över tid och återvända när du behöver.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li><a href="/dagbok">Dagbok</a> och <a href="/anonym-dagbok-online">anonym dagbok online</a> för att skriva av dig i din egen takt.</li>
				<li><a href="/framsteg">Framsteg</a> för att se mönster och återkommande skiften.</li>
				<li><a href="/chat">Chatten</a> när du vill reflektera vidare i samtal.</li>
				<li><a href="/guider">Guider</a> och <a href="/ovningar">övningar</a> som stöd kring det du skriver om.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Nästa steg</h2>
			<p>
				Om du vill spara historik över tid kan du <a href="/register">skapa konto</a>. Mer om hur
				tjänsten fungerar finns på <a href="/om-mittpsyke">Om MittPsyke</a>.
			</p>
			<p class="links-row">
				<a href="/anonym-dagbok-online">Läs om anonym dagbok</a>
				<a href="/framsteg">Se framsteg</a>
				<a href="/chat">Öppna chatten</a>
				<a href="/register">Skapa konto</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Måste jag skriva varje dag?</h3>
			<p>Nej. Dagboken är till för att användas i din egen takt, när det känns hjälpsamt.</p>
			<h3>Kan jag följa mitt mående över tid?</h3>
			<p>Ja. Med konto kan du spara innehåll och få mer kontinuitet genom historik och framsteg.</p>
			<h3>Kan jag kombinera dagboken med chatten?</h3>
			<p>Ja. Många använder dagboken för att skriva av sig och chatten för att reflektera vidare.</p>
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

