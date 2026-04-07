<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	let { data } = $props();
	const streak = $derived(data.streak);
	const total = $derived(data.total);
	const weekly = $derived(data.weekly);
	const ogTitle = $derived(data.ogTitle);
	const ogDescription = $derived(data.ogDescription);

</script>

<SEO canonical="https://www.mittpsyke.se/share" />

<svelte:head>
	<title>{ogTitle}</title>
	<meta name="description" content={ogDescription} />
	<meta property="og:title" content={ogTitle} />
	<meta property="og:description" content={ogDescription} />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://www.mittpsyke.se/share" />
	<meta property="og:image" content="https://www.mittpsyke.se/assets/og-default.jpg" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={ogTitle} />
	<meta name="twitter:description" content={ogDescription} />
	<meta name="robots" content="noindex" />
</svelte:head>

<main class="share-page">
	<div class="share-card">
		<div class="share-logo">
			<span class="logo-text">MittPsyke</span>
		</div>

		<div class="share-hero">
			<p class="share-anon">En person tar hand om sitt psyke</p>
			{#if streak >= 1}
				<div class="share-streak">
					<span class="streak-number">{streak}</span>
					<span class="streak-label">dagar i rad 🌱</span>
				</div>
			{/if}
		</div>

		<div class="share-stats">
			{#if total > 0}
				<div class="stat-item">
					<span class="stat-number">{total}</span>
					<span class="stat-label">incheckningar totalt</span>
				</div>
			{/if}
			{#if weekly > 0}
				<div class="stat-item">
					<span class="stat-number">{weekly}</span>
					<span class="stat-label">den här veckan</span>
				</div>
			{/if}
			{#if streak > 0}
				<div class="stat-item">
					<span class="stat-number">{streak}</span>
					<span class="stat-label">dagars streak</span>
				</div>
			{/if}
		</div>

		<p class="share-tagline">Små steg räknas. I din takt.</p>

		<div class="share-actions">
			<a href="/skriv" class="share-cta">Börja anonymt → www.mittpsyke.se</a>
			<a href="/skriv" class="share-cta share-cta-secondary">Skriv anonymt direkt</a>
		</div>

		<p class="share-domain">www.mittpsyke.se</p>
	</div>
</main>

<style>
	.share-page {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(160deg, #1a2e1a 0%, #0f1f2e 60%, #1a1a2e 100%);
		padding: 2rem 1rem;
	}

	.share-card {
		background: rgba(255, 255, 255, 0.06);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 1.5rem;
		padding: 2.5rem 2rem;
		max-width: 420px;
		width: 100%;
		text-align: center;
		backdrop-filter: blur(12px);
		box-shadow: 0 8px 40px rgba(0, 0, 0, 0.4);
	}

	.share-logo {
		margin-bottom: 2rem;
	}

	.logo-text {
		font-size: 1.1rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: rgba(255, 255, 255, 0.45);
		text-transform: uppercase;
	}

	.share-hero {
		margin-bottom: 2rem;
	}

	.share-anon {
		font-size: 1rem;
		color: rgba(255, 255, 255, 0.6);
		margin-bottom: 1rem;
		font-style: italic;
	}

	.share-streak {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.streak-number {
		font-size: 4.5rem;
		font-weight: 700;
		line-height: 1;
		color: #a8c882;
	}

	.streak-label {
		font-size: 1.2rem;
		color: rgba(255, 255, 255, 0.75);
		font-weight: 500;
	}

	.share-stats {
		display: flex;
		justify-content: center;
		gap: 2rem;
		margin-bottom: 2rem;
		flex-wrap: wrap;
	}

	.stat-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}

	.stat-number {
		font-size: 1.8rem;
		font-weight: 700;
		color: #a8c882;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.5);
		letter-spacing: 0.02em;
	}

	/* Hide streak stat-item since it's already shown in hero */
	.share-stats .stat-item:last-child:not(:first-child) {
		display: none;
	}

	.share-tagline {
		font-size: 0.9rem;
		color: rgba(255, 255, 255, 0.45);
		margin-bottom: 2rem;
		font-style: italic;
	}

	.share-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		margin-bottom: 1.5rem;
	}

	.share-cta {
		display: block;
		padding: 0.85rem 1.5rem;
		border-radius: 999px;
		font-size: 0.95rem;
		font-weight: 600;
		text-decoration: none;
		transition: opacity 0.2s;
		background: #8ca36a;
		color: #182016;
	}

	.share-cta:hover {
		opacity: 0.88;
	}

	.share-cta-secondary {
		background: rgba(255, 255, 255, 0.1);
		color: rgba(255, 255, 255, 0.8);
		border: 1px solid rgba(255, 255, 255, 0.18);
		font-weight: 400;
		font-size: 0.88rem;
	}

	.share-domain {
		font-size: 0.75rem;
		color: rgba(255, 255, 255, 0.25);
		letter-spacing: 0.04em;
	}
</style>

