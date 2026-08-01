<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import TopicGuideSection from '$lib/components/TopicGuideSection.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/kbt" />

<svelte:head>
	<title>KBT – Kognitiv beteendeterapi | Tekniker och guider | MittPsyke</title>
	<meta name="description" content="Lär dig hur KBT fungerar och prova konkreta tekniker hemma. Guider om tankeomstrukturering, beteendeaktivering och mer – i lugn takt." />
	<meta property="og:title" content="KBT – Kognitiv beteendeterapi | MittPsyke" />
	<meta property="og:description" content="Lär dig hur KBT fungerar och prova konkreta tekniker hemma." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary" />

</svelte:head>

<main class="page">
	<div class="page-container">
		<!-- Hero-sektion -->
		<header class="hero">
			<h1>KBT – verktyg för tankar, känslor och beteenden</h1>
			<p>
				Kognitiv beteendeterapi är en av de mest välstuderade metoderna inom psykisk hälsa.
				Här hittar du förklaringar och övningar du kan använda i din vardag – i din egen takt.
			</p>
		</header>

		<div class="text-block">
			<section class="section">
				<p>
					KBT bygger på sambandet mellan tankar, känslor och beteenden. Genom att förändra ett led
					kan du påverka de andra. Du behöver inte ha tidigare erfarenhet av terapi – många
					grundläggande tekniker går att testa på egen hand.
				</p>
			</section>

			<section class="section">
				<p>
					MittPsyke erbjuder ett tryggt utrymme där du kan reflektera kring dina mönster, skriva
					tankedagbok och få stöd i vardagen. Börja anonymt utan konto, eller skapa ett eget
					utrymme över tid.
				</p>
			</section>
		</div>

		<!-- CTA-knapp -->
		<div class="cta-container">
			<a class="cta-button" href="/chat/angest">Prata om dina tankar</a>
		</div>

		<!-- Informationsruta -->
		<aside class="callout" aria-label="Om KBT">
			<h2>Vad är KBT?</h2>
			<p>
				Kognitiv beteendeterapi fokuserar på hur tankar och beteenden påverkar hur vi mår. Metoden
				har stark vetenskaplig evidens för ångest, depression och stress.
			</p>
		</aside>

		<TopicGuideSection
			topicTitle="KBT"
			guideHref="/guider/kbt"
			articleLinks={[
				{ title: 'Vad är KBT och hur fungerar det?', href: '/guider/kbt/vad-ar-kbt' },
				{ title: 'Tankeomstrukturering – utmana dina negativa tankar', href: '/guider/kbt/tankeomstrukturering' },
				{ title: 'Beteendeaktivering – ta ett steg ut ur passiviteten', href: '/guider/kbt/beteendeaktivering' },
				{ title: 'KBT-tekniker du kan använda hemma', href: '/guider/kbt/kbt-tekniker-hemma' },
				{ title: 'KBT vid ångest – hur det fungerar steg för steg', href: '/guider/kbt/kbt-vid-angest' }
			]}
		/>

		<!-- Källor -->
		<section class="source-block" aria-label="Källor och uppdatering">
			<p class="updated-date">Senast uppdaterad: 21 mars 2026</p>
			<h2>Källor</h2>
			<ul>
				<li>
					<a href="https://www.1177.se/behandlingar--hjalpmedel/behandlingar-vid-psykiska-besvar/kognitiv-beteendeterapi-kbt/" target="_blank" rel="noopener noreferrer">
						KBT – 1177 Vårdguiden
					</a>
				</li>
				<li>
					<a href="https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/" target="_blank" rel="noopener noreferrer">
						Psykisk hälsa och suicidprevention – Socialstyrelsen
					</a>
				</li>
				<li>
					<a href="https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/" target="_blank" rel="noopener noreferrer">
						Psykisk hälsa – Folkhälsomyndigheten
					</a>
				</li>
			</ul>
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
		gap: clamp(2rem, 3.5vw, 2.5rem);
	}

	.text-block {
		max-width: 720px;
	}

	.hero {
		max-width: 720px;
		padding: clamp(1rem, 2vw, 1.25rem) 0 0.2rem;
	}

	.section {
		max-width: 720px;
	}

	h1,
	h2 {
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		margin: 0;
	}

	h1 {
		font-size: clamp(1.8rem, 1.45rem + 1.8vw, 2.2rem);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.08;
		margin-bottom: 1.5rem;
	}

	p {
		font-family: var(--font-body);
		font-weight: 400;
		font-size: clamp(1rem, 0.95rem + 0.45vw, 1.125rem);
		line-height: 1.7;
		letter-spacing: -0.005em;
		margin: 0;
	}

	.cta-container {
		max-width: 720px;
		display: flex;
		justify-content: center;
		margin-top: 1rem;
	}

	.cta-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.75rem 2rem;
		border-radius: var(--radius-pill);
		border: 2px solid var(--primary);
		font-family: var(--font-heading);
		font-weight: 600;
		font-size: 1rem;
		color: white;
		background: var(--primary);
		text-decoration: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}

	.cta-button:hover {
		transform: translateY(-2px);
		box-shadow: 0 6px 20px rgba(15, 118, 110, 0.3);
	}

	.cta-button:active {
		transform: translateY(0);
	}

	.callout {
		max-width: 720px;
		border: 1px solid rgba(15, 23, 42, 0.12);
		border-radius: var(--radius-card);
		padding: 1.05rem;
		background: rgba(226, 240, 236, 0.6);
	}

	.callout h2 {
		font-size: 1.3rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
		margin-bottom: 0.45rem;
		color: var(--primary);
	}

	.callout p {
		margin: 0;
		font-size: clamp(1rem, 0.96rem + 0.3vw, 1.05rem);
		line-height: 1.65;
	}

	@media (max-width: 640px) {
		.page {
			padding: 2rem 1rem 2.8rem;
		}

		p {
			font-size: 1.02rem;
		}

		.cta-button {
			width: 100%;
		}
	}

	:global(.dark) .callout {
		background: #1a1a1a;
		color: #f5f5f5;
		border: 1px solid rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .callout h2 {
		color: #86dfd6;
	}

	:global(.dark) .callout p {
		color: rgba(255, 255, 255, 0.85);
	}

	:global(.dark) .cta-button {
		background: var(--primary);
		border-color: #86dfd6;
		color: white;
	}

	:global(.dark) .cta-button:hover {
		box-shadow: 0 6px 20px rgba(134, 223, 214, 0.3);
	}

	.source-block {
		margin-top: clamp(2rem, 4vw, 3rem);
		padding-top: 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.1);
	}

	.source-block .updated-date {
		font-size: 0.8rem;
		opacity: 0.5;
		margin-bottom: 1rem;
	}

	.source-block h2 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}

	.source-block ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.source-block li {
		font-size: 0.85rem;
	}

	.source-block a {
		color: inherit;
		opacity: 0.7;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.source-block a:hover {
		opacity: 1;
	}
</style>
