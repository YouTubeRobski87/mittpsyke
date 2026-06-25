<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>Sidan hittades inte | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="error-page">
	<div class="error-inner">
		<p class="error-code">{page.status}</p>
		<h1 class="error-heading">
			{#if page.status === 404}
				Sidan hittades inte
			{:else}
				Något gick fel
			{/if}
		</h1>
		<p class="error-body">
			{#if page.status === 404}
				Den här sidan finns inte eller har flyttats. Du kan gå tillbaka till startsidan eller söka efter det du letar efter.
			{:else}
				Ett oväntat fel uppstod. Försök igen om en liten stund.
			{/if}
		</p>

		<div class="error-actions">
			<a href="/" class="error-btn error-btn-primary">Gå till startsidan</a>
			<a href="/chat" class="error-btn error-btn-secondary">Börja chatta</a>
		</div>

		<nav class="error-nav" aria-label="Snabblänkar">
			<p class="error-nav-label">Du kanske letar efter:</p>
			<ul class="error-nav-list">
				<li><a href="/dagbok">Dagboken</a></li>
				<li><a href="/blogg">Artiklar</a></li>
				<li><a href="/guider">Guider &amp; övningar</a></li>
				<li><a href="/anonyma-berattelser">Anonyma berättelser</a></li>
				<li><a href="/om-mittpsyke">Om MittPsyke</a></li>
				<li><a href="/sok">Sök</a></li>
			</ul>
		</nav>

		<div class="error-safety">
			<p>Vid akut fara: <a href="tel:112">ring 112</a>. Vårdråd: <a href="https://www.1177.se" target="_blank" rel="noopener noreferrer">1177</a>. Mer stöd: <a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a>.</p>
		</div>
	</div>
</main>

<style>
	.error-page {
		min-height: 60vh;
		display: grid;
		place-items: center;
		padding: clamp(3rem, 8vw, 5rem) 1.25rem;
	}

	.error-inner {
		width: min(580px, 100%);
		text-align: center;
	}

	.error-code {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(3.5rem, 10vw, 6rem);
		font-weight: 850;
		letter-spacing: -0.04em;
		line-height: 1;
		opacity: 0.12;
	}

	.error-heading {
		margin: 0.25rem 0 0;
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 3.5vw, 2.2rem);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.1;
	}

	.error-body {
		margin: 0.85rem 0 0;
		font-size: 1rem;
		line-height: 1.65;
		opacity: 0.72;
		max-width: 46ch;
		margin-inline: auto;
	}

	.error-actions {
		margin-top: 1.75rem;
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		justify-content: center;
	}

	.error-btn {
		display: inline-block;
		padding: 0.7rem 1.3rem;
		font-family: var(--font-heading);
		font-size: 0.9rem;
		font-weight: 700;
		border-radius: var(--radius-pill);
		text-decoration: none;
		transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
	}

	.error-btn-primary {
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		box-shadow: 0 4px 14px hsl(var(--primary) / 0.28);
	}

	.error-btn-primary:hover {
		transform: translateY(-1px);
		box-shadow: 0 6px 18px hsl(var(--primary) / 0.34);
	}

	.error-btn-secondary {
		background: transparent;
		color: inherit;
		border: 1.5px solid hsl(var(--border));
		opacity: 0.8;
	}

	.error-btn-secondary:hover {
		opacity: 1;
		border-color: hsl(var(--primary) / 0.5);
	}

	.error-nav {
		margin-top: 2.5rem;
		padding-top: 1.5rem;
		border-top: 1px solid hsl(var(--border));
	}

	.error-nav-label {
		margin: 0 0 0.75rem;
		font-size: 0.82rem;
		opacity: 0.5;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		font-family: var(--font-heading);
		font-weight: 700;
	}

	.error-nav-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.45rem;
		justify-content: center;
	}

	.error-nav-list a {
		display: inline-block;
		padding: 0.35rem 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-pill);
		font-size: 0.84rem;
		text-decoration: none;
		color: inherit;
		opacity: 0.72;
		transition: opacity 0.15s ease, border-color 0.15s ease;
	}

	.error-nav-list a:hover {
		opacity: 1;
		border-color: hsl(var(--primary) / 0.4);
	}

	.error-safety {
		margin-top: 2rem;
		font-size: 0.82rem;
		opacity: 0.5;
		line-height: 1.6;
	}

	.error-safety a {
		color: inherit;
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.error-safety a:hover {
		opacity: 1;
	}
</style>
