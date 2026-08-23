<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import SEO from '$lib/components/SEO.svelte';
	import HomeSafetyStrip from '$lib/components/HomeSafetyStrip.svelte';
	import {
		trackQrLandingView,
		trackQrCtaPrimaryClick,
		trackQrCtaSecondaryClick
	} from '$lib/analytics';

	const srcParam = $derived(page.url.searchParams.get('src')?.trim() || '');

	let lastTrackedSearch = $state('');

	$effect(() => {
		if (!browser) return;

		const currentSearch = page.url.search;
		if (lastTrackedSearch === currentSearch) return;

		lastTrackedSearch = currentSearch;
		trackQrLandingView(srcParam || null);
	});

	function handlePrimaryClick() {
		trackQrCtaPrimaryClick(srcParam || null);
	}

	function handleSecondaryClick() {
		trackQrCtaSecondaryClick(srcParam || null);
	}
</script>

<SEO canonical="https://mittpsyke.se/qr" />

<svelte:head>
	<title>Du kan börja skriva anonymt direkt | MittPsyke</title>
	<meta
		name="description"
		content="Du hittade hit via QR-koden. Här kan du börja skriva anonymt direkt. Gratis, anonymt och tillgängligt dygnet runt."
	/>
	<meta property="og:title" content="Du kan börja skriva anonymt direkt | MittPsyke" />
	<meta
		property="og:description"
		content="Du hittade hit via QR-koden. Här kan du börja skriva anonymt direkt. Gratis, anonymt och tillgängligt dygnet runt."
	/>
	<meta property="og:url" content="https://mittpsyke.se/qr" />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="qr-landing">
	<section class="hero" aria-labelledby="qr-hero-title">
		<div class="hero__copy">
			<p class="hero__eyebrow">Du hittade hit via QR-koden</p>
			<h1 id="qr-hero-title">Här kan du börja skriva anonymt direkt</h1>
			<p class="hero__lead">
				Gratis, anonymt och tillgängligt dygnet runt. Inget konto behövs för att börja.
			</p>

			<div class="hero__actions">
				<a class="button button--primary" href="/skriv" onclick={handlePrimaryClick}>
					Börja skriva anonymt
				</a>
				<a class="button button--ghost" href="/register" onclick={handleSecondaryClick}>
					Skapa konto
				</a>
			</div>

			<p class="hero__note">
				MittPsyke är ett lugnt första steg för stöd och reflektion. Det ersätter inte vård.
			</p>
		</div>

		<div class="hero__aside" aria-label="Trygga ingångar">
			<div class="aside-item">
				<h2>Anonymt från start</h2>
				<p>Du kan skriva direkt utan att skapa konto.</p>
			</div>
			<div class="aside-item">
				<h2>Gratis att använda</h2>
				<p>Du kan börja nu och känna efter i din egen takt.</p>
			</div>
			<div class="aside-item">
				<h2>När det passar dig</h2>
				<p>Stödet finns tillgängligt dygnet runt.</p>
			</div>
		</div>
	</section>

	<section class="steps" aria-labelledby="qr-steps-title">
		<div class="steps__intro">
			<p class="steps__eyebrow">Så enkelt är det</p>
			<h2 id="qr-steps-title">Börja med några ord</h2>
		</div>

		<div class="steps__grid">
			<article class="step">
				<span class="step__number">1</span>
				<h3>Öppna skrivytan</h3>
				<p>Tryck på "Börja skriva anonymt".</p>
			</article>
			<article class="step">
				<span class="step__number">2</span>
				<h3>Skriv det som känns</h3>
				<p>Det räcker med några ord för att börja.</p>
			</article>
			<article class="step">
				<span class="step__number">3</span>
				<h3>Ta nästa steg om du vill</h3>
				<p>Du kan fortsätta anonymt eller skapa konto senare.</p>
			</article>
		</div>
	</section>

	<section class="safety">
		<div class="safety__inner">
			<HomeSafetyStrip />
		</div>
	</section>
</main>

<style>
	.qr-landing {
		display: grid;
		gap: 1rem;
		padding: 1rem 0 2.5rem;
	}

	.hero,
	.steps {
		width: min(72rem, calc(100% - 2rem));
		margin: 0 auto;
	}

	.hero {
		display: grid;
		gap: 1rem;
	}

	.hero__copy,
	.hero__aside,
	.step {
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: linear-gradient(180deg, rgba(255, 255, 255, 0.94), rgba(245, 247, 245, 0.92));
	}

	.hero__copy {
		padding: 1.35rem;
	}

	.hero__eyebrow,
	.steps__eyebrow {
		margin: 0 0 0.5rem;
		font-size: 0.8rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--primary);
	}

	h1,
	h2,
	h3 {
		margin: 0;
	}

	h1 {
		font-size: clamp(1.95rem, 1.6rem + 2.2vw, 3.15rem);
		line-height: 1.05;
		max-width: 12ch;
	}

	.hero__lead,
	.hero__note,
	.aside-item p,
	.step p {
		line-height: 1.65;
	}

	.hero__lead {
		margin: 0.95rem 0 0;
		font-size: 1.02rem;
		max-width: 34rem;
		color: hsl(var(--muted-foreground));
	}

	.hero__actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-top: 1.25rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-height: 3rem;
		padding: 0.85rem 1.2rem;
		border-radius: var(--radius-pill);
		font-family: var(--font-heading);
		font-weight: 600;
		text-decoration: none;
		transition: transform 160ms ease, background-color 160ms ease, border-color 160ms ease;
	}

	.button:hover {
		transform: translateY(-1px);
	}

	.button--primary {
		background: var(--primary);
		color: #fff;
	}

	.button--ghost {
		border: 1px solid hsl(var(--border));
		background: transparent;
		color: hsl(var(--foreground));
	}

	.hero__note {
		margin: 1rem 0 0;
		font-size: 0.94rem;
		color: hsl(var(--muted-foreground));
		max-width: 36rem;
	}

	.hero__aside {
		padding: 1.15rem;
		display: grid;
		gap: 0.9rem;
	}

	.aside-item h2,
	.steps__intro h2 {
		font-size: 1.08rem;
	}

	.aside-item p {
		margin: 0.25rem 0 0;
		color: hsl(var(--muted-foreground));
	}

	.steps {
		display: grid;
		gap: 1rem;
	}

	.steps__intro {
		padding: 0 0.2rem;
	}

	.steps__grid {
		display: grid;
		gap: 0.85rem;
	}

	.step {
		padding: 1.05rem;
	}

	.step__number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		margin-bottom: 0.7rem;
		border-radius: 999px;
		background: rgba(67, 110, 143, 0.1);
		color: var(--primary);
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 700;
	}

	.step h3 {
		font-size: 1rem;
	}

	.step p {
		margin: 0.35rem 0 0;
		color: hsl(var(--muted-foreground));
	}

	.safety {
		background: linear-gradient(180deg, #3d5567, #324857);
		padding: 0 1rem;
	}

	.safety__inner {
		width: min(100%, 72rem);
		margin: 0 auto;
		padding: 1rem 0;
	}

	@media (min-width: 760px) {
		.hero {
			grid-template-columns: minmax(0, 1.45fr) minmax(18rem, 0.95fr);
			align-items: stretch;
		}

		.hero__copy,
		.hero__aside {
			padding: 1.5rem;
		}

		.hero__actions {
			flex-direction: row;
			flex-wrap: wrap;
		}

		.steps__grid {
			grid-template-columns: repeat(3, minmax(0, 1fr));
		}
	}

	@media (max-width: 759px) {
		.button {
			width: 100%;
		}
	}

	:global(.dark) .hero__copy,
	:global(.dark) .hero__aside,
	:global(.dark) .step {
		background: linear-gradient(180deg, rgba(16, 24, 32, 0.94), rgba(12, 18, 24, 0.98));
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global(.dark) .hero__lead,
	:global(.dark) .hero__note,
	:global(.dark) .aside-item p,
	:global(.dark) .step p {
		color: rgba(255, 255, 255, 0.74);
	}

	:global(.dark) .button--ghost {
		color: #f5f5f5;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .step__number {
		background: rgba(134, 223, 214, 0.12);
		color: #9be7de;
	}
</style>
