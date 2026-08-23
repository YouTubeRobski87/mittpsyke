<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import HomeSafetyStrip from '$lib/components/HomeSafetyStrip.svelte';
</script>

<SEO canonical="https://www.mittpsyke.se/tiktok" />

<svelte:head>
	<title>Behöver du någon att prata med? | MittPsyke</title>
	<meta name="description" content="Skriv av dig anonymt och få stöd för din psykiska hälsa. Gratis, anonymt, dygnet runt." />
	<meta property="og:title" content="Behöver du någon att prata med? | MittPsyke" />
	<meta property="og:description" content="Skriv av dig anonymt och få stöd för din psykiska hälsa. Gratis, anonymt, dygnet runt." />
	<meta property="og:url" content="https://mittpsyke.se/tiktok" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<div class="tiktok-landing">
	<!-- Hero -->
	<section class="hero">
		<div class="hero-content">
			<p class="eyebrow">Du såg oss på TikTok</p>
			<h1>Behöver du någon att prata med?</h1>
			<p class="subtitle">
				Skriv av dig anonymt och få lugnt stöd — helt gratis, dygnet runt.
				Inget konto behövs.
			</p>
			<div class="cta-group">
				<a href="/skriv" class="cta-primary">Börja skriva anonymt</a>
				<a href="/register" class="cta-secondary">Skapa gratis konto</a>
			</div>
		</div>
	</section>

	<!-- Vad är MittPsyke -->
	<section class="what-section">
		<h2>Vad är MittPsyke?</h2>
		<p class="section-desc">
			En trygg plats online där du kan skriva av dig när det känns tungt.
			Du får lugna svar och hjälp att sortera tankar och känslor.
		</p>
		<div class="cards">
			<div class="card">
				<span class="card-icon">💬</span>
				<h3>Skriv anonymt</h3>
				<p>Ingen vet vem du är. Skriv precis vad du känner utan att dömas.</p>
			</div>
			<div class="card">
				<span class="card-icon">🔒</span>
				<h3>Helt gratis</h3>
				<p>Inget konto krävs för att börja. Ingen betalning, inga dolda kostnader.</p>
			</div>
			<div class="card">
				<span class="card-icon">🕐</span>
				<h3>Dygnet runt</h3>
				<p>Tillgängligt när du behöver det — mitt i natten eller på lunchen.</p>
			</div>
			<div class="card">
				<span class="card-icon">📓</span>
				<h3>Dagbok & spårning</h3>
				<p>Följ ditt mående över tid och upptäck mönster. Skapa konto för att spara.</p>
			</div>
		</div>
	</section>

	<!-- Så funkar det -->
	<section class="steps-section">
		<h2>Så enkelt är det</h2>
		<div class="steps">
			<div class="step">
				<span class="step-number">1</span>
				<h3>Klicka på "Börja skriva"</h3>
				<p>Ingen registrering behövs.</p>
			</div>
			<div class="step">
				<span class="step-number">2</span>
				<h3>Skriv vad du känner</h3>
				<p>Kort eller långt — allt är okej.</p>
			</div>
			<div class="step">
				<span class="step-number">3</span>
				<h3>Få lugnt stöd tillbaka</h3>
				<p>Hjälp att sätta ord på känslor och hitta nästa steg.</p>
			</div>
		</div>
	</section>

	<!-- Social proof -->
	<section class="proof-section">
		<h2>Vad folk säger</h2>
		<div class="quotes">
			<blockquote>
				<p>"Jag vågade inte prata med någon, men att skriva kändes lättare."</p>
			</blockquote>
			<blockquote>
				<p>"Det hjälpte mig att förstå vad jag egentligen kände."</p>
			</blockquote>
			<blockquote>
				<p>"Bra att det finns något som är anonymt och gratis."</p>
			</blockquote>
		</div>
	</section>

	<!-- Final CTA -->
	<section class="final-cta">
		<h2>Redo att ta första steget?</h2>
		<p>Du behöver inte ha alla svar. Bara börja skriva.</p>
		<a href="/skriv" class="cta-primary cta-large">Börja skriva nu</a>
	</section>

	<!-- Säkerhetsinfo -->
	<HomeSafetyStrip />
</div>

<style>
	/* === Landningssida för TikTok-trafik === */

	.tiktok-landing {
		color: #f5f5f2;
		font-family: var(--font-body);
	}

	/* Hero */
	.hero {
		background: linear-gradient(135deg, #0f1923 0%, #162236 50%, #1a3a5c 100%);
		padding: 4rem 1.5rem 3.5rem;
		text-align: center;
	}

	.hero-content {
		max-width: 640px;
		margin: 0 auto;
	}

	.eyebrow {
		font-family: var(--font-heading);
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		color: #7db4e8;
		margin-bottom: 1rem;
		font-weight: 600;
	}

	.hero h1 {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 5vw, 2.6rem);
		font-weight: 850;
		line-height: 1.15;
		margin-bottom: 1rem;
		color: #ffffff;
	}

	.subtitle {
		font-size: 1.1rem;
		line-height: 1.6;
		color: #c8d0dc;
		margin-bottom: 2rem;
		max-width: 480px;
		margin-left: auto;
		margin-right: auto;
	}

	.cta-group {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		align-items: center;
	}

	.cta-primary {
		display: inline-block;
		padding: 0.85rem 2rem;
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 700;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		background: #3a7bd5;
		color: #ffffff;
		border-radius: var(--radius-pill);
		text-decoration: none;
		transition: background 0.2s, transform 0.15s;
	}

	.cta-primary:hover {
		background: #2e6bc4;
		transform: translateY(-1px);
	}

	.cta-secondary {
		display: inline-block;
		padding: 0.65rem 1.5rem;
		font-family: var(--font-heading);
		font-size: 0.8rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: #7db4e8;
		border: 1px solid rgba(125, 180, 232, 0.3);
		border-radius: var(--radius-pill);
		text-decoration: none;
		transition: border-color 0.2s, color 0.2s;
	}

	.cta-secondary:hover {
		border-color: #7db4e8;
		color: #ffffff;
	}

	/* Sektioner */
	.what-section {
		background: #141e2e;
		padding: 3.5rem 1.5rem;
		text-align: center;
	}

	.steps-section {
		background: #111a28;
		padding: 3.5rem 1.5rem;
		text-align: center;
	}

	.proof-section {
		background: #162236;
		padding: 3.5rem 1.5rem;
		text-align: center;
	}

	.final-cta {
		background: linear-gradient(135deg, #162236 0%, #1a3a5c 100%);
		padding: 4rem 1.5rem;
		text-align: center;
	}

	h2 {
		font-family: var(--font-heading);
		font-size: clamp(1.4rem, 3.5vw, 1.9rem);
		font-weight: 700;
		color: #eef1f6;
		margin-bottom: 0.75rem;
	}

	.section-desc {
		color: #a8b2c1;
		max-width: 520px;
		margin: 0 auto 2rem;
		line-height: 1.6;
	}

	/* Kort */
	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.25rem;
		max-width: 900px;
		margin: 0 auto;
	}

	.card {
		background: linear-gradient(
			160deg,
			rgba(15, 118, 110, 0.08) 0%,
			rgba(20, 30, 46, 0.95) 100%
		);
		border: 1px solid rgba(148, 163, 184, 0.12);
		border-radius: var(--radius-card);
		padding: 1.75rem 1.5rem;
		text-align: left;
	}

	.card-icon {
		font-size: 1.6rem;
		display: block;
		margin-bottom: 0.75rem;
	}

	.card h3 {
		font-family: var(--font-heading);
		font-size: 1.05rem;
		font-weight: 600;
		color: #eef1f6;
		margin-bottom: 0.5rem;
	}

	.card p {
		color: #a8b2c1;
		font-size: 0.92rem;
		line-height: 1.5;
	}

	/* Steg */
	.steps {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 2rem;
		max-width: 800px;
		margin: 2rem auto 0;
	}

	.step {
		flex: 1 1 200px;
		max-width: 240px;
		text-align: center;
	}

	.step-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: rgba(58, 123, 213, 0.15);
		border: 2px solid #3a7bd5;
		color: #7db4e8;
		font-family: var(--font-heading);
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 1rem;
	}

	.step h3 {
		font-family: var(--font-heading);
		font-size: 1rem;
		font-weight: 600;
		color: #eef1f6;
		margin-bottom: 0.4rem;
	}

	.step p {
		color: #a8b2c1;
		font-size: 0.9rem;
	}

	/* Citat */
	.quotes {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1.25rem;
		max-width: 800px;
		margin: 2rem auto 0;
	}

	blockquote {
		flex: 1 1 220px;
		max-width: 260px;
		background: rgba(148, 163, 184, 0.06);
		border-left: 3px solid #3a7bd5;
		border-radius: var(--radius-card);
		padding: 1.25rem 1.5rem;
		margin: 0;
		text-align: left;
	}

	blockquote p {
		color: #c8d0dc;
		font-size: 0.95rem;
		line-height: 1.55;
		font-style: italic;
	}

	/* Final CTA */
	.final-cta p {
		color: #a8b2c1;
		margin-bottom: 1.5rem;
	}

	.cta-large {
		font-size: 1.05rem;
		padding: 1rem 2.5rem;
	}

	/* Responsiv */
	@media (min-width: 480px) {
		.cta-group {
			flex-direction: row;
			justify-content: center;
		}
	}

	@media (max-width: 480px) {
		.hero {
			padding: 3rem 1.25rem 2.5rem;
		}

		.cards {
			grid-template-columns: 1fr;
		}

		.steps {
			flex-direction: column;
			align-items: center;
		}

		.quotes {
			flex-direction: column;
			align-items: center;
		}

		blockquote {
			max-width: 100%;
		}
	}
</style>
