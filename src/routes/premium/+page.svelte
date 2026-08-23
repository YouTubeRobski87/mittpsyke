<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL } from '$lib/contact';

	// Intresseanmälan sker via e-post – ingen betalning och ingen betalvägg
	const interestMailto = `mailto:${PUBLIC_CONTACT_EMAIL}?subject=Premium`;

	const premiumFeatures = [
		'Privat sparad dagbok i text',
		'Bilder i dagboken',
		'Röst- och videoinlägg',
		'Humörhistorik över tid',
		'Mönster och trender i ditt mående',
		'AI-sammanfattningar av dina reflektioner',
		'Export av dina inlägg',
		'Fler sparade inlägg'
	];
</script>

<SEO canonical="https://mittpsyke.se/premium" />

<main class="premium-page">
	<Breadcrumbs items={[{ label: 'Premium' }]} />

	<header class="premium-hero">
		<p class="eyebrow">Under utveckling</p>
		<h1>Premium för mer kontinuitet över tid</h1>
		<p class="lead">
			MittPsyke ska alltid vara enkelt att börja använda. Premium är tänkt för dig som vill spara mer,
			följa ditt mående över tid och samla dina reflektioner på ett tryggt sätt.
		</p>
		<p class="status-pill">Premium kommer snart</p>
	</header>

	<section class="premium-card" aria-labelledby="gratis-title">
		<h2 id="gratis-title">Gratis att börja</h2>
		<p>
			Du kan börja anonymt, läsa guider och artiklar och använda MittPsyke som stöd för att sortera
			tankar i stunden. Det grundläggande stödet är och förblir gratis.
		</p>
	</section>

	<section class="premium-card accent-card" aria-labelledby="premium-title">
		<h2 id="premium-title">Premium kommer snart</h2>
		<p>
			Premium är tänkt att låsa upp mer djup i dagboken: text, bilder, röst- och videoinlägg,
			humörhistorik, mönster, AI-sammanfattningar, export och fler sparade inlägg.
		</p>
		<ul class="feature-list">
			{#each premiumFeatures as feature}
				<li>{feature}</li>
			{/each}
		</ul>
		<p class="card-note">Premium är under utveckling. Inget av detta låser befintliga funktioner.</p>
	</section>

	<section class="safety-box" aria-labelledby="safety-title">
		<h2 id="safety-title">Trygghet först</h2>
		<p>
			Premium ersätter inte vård, behandling eller akut hjälp. Akut information, stödlinjer och
			hänvisningar till vård ska aldrig ligga bakom betalvägg – de förblir tillgängliga för alla.
		</p>
		<p class="safety-links">
			Vid akut fara: <a href="tel:112">112</a>. För vårdråd:
			<a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Stödlinjer:
			<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>.
		</p>
	</section>

	<section class="cta-card" aria-labelledby="cta-title">
		<h2 id="cta-title">Vill du veta mer?</h2>
		<p>
			Vill du lämna intresse eller feedback inför lanseringen? Hör av dig på
			<a href={interestMailto}>{PUBLIC_CONTACT_EMAIL}</a>.
		</p>
		<a class="cta-button" href={interestMailto}>Jag är intresserad</a>
		<p class="cta-note">Ingen betalning krävs. Vi hör av oss när Premium är redo.</p>
	</section>

	<p class="support-note">MittPsyke ersätter inte vård. Vid akut fara: 112. För vårdråd: 1177.</p>
</main>

<style>
	.premium-page {
		max-width: 880px;
		margin: 1.25rem auto 0;
		padding: 0 1.25rem 4rem;
		display: grid;
		gap: 1.25rem;
	}

	.premium-hero {
		display: grid;
		gap: 0.5rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	h1 {
		margin: 0;
		font-size: clamp(1.6rem, 4vw, 2.2rem);
		line-height: 1.2;
		color: hsl(var(--foreground));
	}

	h2 {
		margin: 0;
		font-size: 1.1rem;
		color: hsl(var(--foreground));
	}

	.lead {
		margin: 0.25rem 0 0;
		max-width: 60ch;
		line-height: 1.7;
		color: hsl(var(--foreground) / 0.84);
	}

	.status-pill {
		justify-self: start;
		margin: 0.4rem 0 0;
		padding: 0.3rem 0.7rem;
		border-radius: 999px;
		border: 1px solid var(--primary-border-soft);
		background: var(--primary-soft);
		color: hsl(var(--foreground) / 0.9);
		font-size: 0.82rem;
		font-weight: 600;
	}

	.premium-card,
	.safety-box,
	.cta-card {
		border-radius: 24px;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		padding: 1.2rem 1.1rem;
		display: grid;
		gap: 0.65rem;
		box-shadow: 0 10px 28px rgba(15, 23, 42, 0.05);
	}

	.premium-card p,
	.safety-box p,
	.cta-card p {
		margin: 0;
		line-height: 1.7;
		color: hsl(var(--foreground) / 0.84);
	}

	.accent-card {
		background:
			radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 38%),
			hsl(var(--surface));
	}

	.feature-list {
		margin: 0;
		padding: 0;
		list-style: none;
		display: grid;
		gap: 0.45rem;
	}

	.feature-list li {
		position: relative;
		padding-left: 1.3rem;
		line-height: 1.6;
		color: hsl(var(--foreground) / 0.84);
	}

	.feature-list li::before {
		content: '';
		position: absolute;
		left: 0.15rem;
		top: 0.62em;
		width: 0.4rem;
		height: 0.4rem;
		border-radius: 999px;
		background: var(--primary);
	}

	.card-note {
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground)) !important;
	}

	.safety-box {
		background: hsl(var(--surface-muted));
		border-color: hsl(var(--border));
	}

	.safety-links a,
	.cta-card a {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
		overflow-wrap: anywhere;
	}

	:global(.dark) .safety-links a,
	:global(.dark) .cta-card a {
		color: var(--primary-dark);
	}

	.cta-button {
		justify-self: start;
		margin-top: 0.15rem;
		padding: 0.6rem 1.1rem;
		border-radius: 999px;
		background: var(--primary);
		color: #fff !important;
		font-weight: 600;
		text-decoration: none !important;
		transition: opacity 0.15s ease;
	}

	.cta-button:hover,
	.cta-button:focus-visible {
		opacity: 0.9;
	}

	.cta-note {
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground)) !important;
	}

	.support-note {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: hsl(var(--muted-foreground));
	}

	@media (min-width: 720px) {
		.feature-list {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}

	@media (max-width: 760px) {
		.premium-page {
			padding: 0 0.85rem 2.5rem;
			gap: 0.85rem;
		}

		.premium-card,
		.safety-box,
		.cta-card {
			border-radius: var(--radius-input);
			padding: 0.95rem 0.9rem;
		}
	}
</style>
