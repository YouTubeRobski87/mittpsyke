<script lang="ts">
	import PublicTrustPanel from '$lib/components/PublicTrustPanel.svelte';
</script>

<svelte:head>
	<title>Psykiskt stöd online i lugn takt | MittPsyke</title>
	<meta
		name="description"
		content="Få psykiskt stöd online genom samtal, dagbok, guider och övningar. Ett tryggt första steg när livet känns tungt."
	/>
	<meta property="og:title" content="Psykiskt stöd online i lugn takt | MittPsyke" />
	<meta
		property="og:description"
		content="Prata, reflektera och hitta rätt stöd i din egen takt. MittPsyke är ett tryggt digitalt samtalsstöd."
	/>
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />
	<link rel="canonical" href="https://www.mittpsyke.se/psykiskt-stod-online" />
</svelte:head>

<main class="page">
	<div class="page-container">
		<header class="hero">
			<h1>Psykiskt stöd online</h1>
			<p>
				När tankarna blir tunga kan det vara svårt att veta var man ska börja. Här kan du landa i lugn
				och ro, prata anonymt och välja nästa steg i din egen takt.
			</p>
		</header>

		<div class="cta-container">
			<a class="cta-button" href="/chat/a">Börja anonymt</a>
			<a class="cta-button ghost" href="/register">Skapa din egen plats</a>
		</div>

		<section class="section">
			<h2>Ett tryggt första steg online</h2>
			<p>
				Det är vanligt att pendla mellan oro, trötthet och behov av struktur. MittPsyke är byggt för
				det mellanrummet: stöd i stunden och möjlighet att komma tillbaka.
			</p>
		</section>

		<section class="section">
			<h2>Vad MittPsyke erbjuder</h2>
			<ul>
				<li>Samtalsstöd när du behöver sortera tankar.</li>
				<li><a href="/dagbok">Dagbok</a> för att skriva av dig i lugn takt.</li>
				<li><a href="/guider">Guider</a> och <a href="/ovningar">övningar</a> för konkreta nästa steg.</li>
				<li><a href="/framsteg">Framsteg</a> för att följa mönster över tid när du har konto.</li>
			</ul>
		</section>

		<section class="section">
			<h2>Välj nästa steg</h2>
			<p>
				Du kan börja med ett samtal, skriva i dagboken eller läsa en guide. Om du behöver mänsklig
				kontakt finns <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer</a>.
				Mer om hur MittPsyke fungerar finns på <a href="/om-mittpsyke">Om MittPsyke</a>.
			</p>
			<p class="links-row">
				<a href="/chat">Öppna chatten</a>
				<a href="/guider/angest">Läs guide om ångest</a>
				<a href="/ovningar/daglig-reflektionsmall">Prova en övning</a>
			</p>
		</section>

		<section class="section faq">
			<h2>Vanliga frågor</h2>
			<h3>Är detta anonymt?</h3>
			<p>Du kan börja utan att skapa konto.</p>
			<h3>Måste jag ha konto?</h3>
			<p>Nej. Konto behövs först när du vill spara dagbok, historik och framsteg.</p>
			<h3>Är detta akut hjälp?</h3>
			<p>Vid akut fara, ring 112 direkt.</p>
		</section>
		<PublicTrustPanel
			updatedDate="14 mars 2026"
			sources={[
				{
					label: 'Psykisk hälsa – 1177 Vårdguiden',
					href: 'https://www.1177.se/liv--halsa/psykisk-halsa/'
				},
				{
					label: 'Psykisk hälsa – Folkhälsomyndigheten',
					href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/'
				},
				{
					label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen',
					href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/'
				}
			]}
		/>

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

