<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';

	const SORO_EMBED_SRC =
		'https://app.trysoro.com/api/embed/7741c36b-abe9-4f95-8557-3430345576e4?theme=dark';

	let widgetRoot: HTMLDivElement | null = null;
	let loading = $state(true);
	let errorText = $state<string | null>(null);

	onMount(() => {
		if (!widgetRoot) return;

		if (document.querySelector('script[data-soro-blog-script="true"]')) return;

		const script = document.createElement('script');
		script.src = SORO_EMBED_SRC;
		script.defer = true;
		script.dataset.soroBlogScript = 'true';
		script.onerror = () => {
			errorText = 'Artiklarna kunde inte laddas just nu. Försök igen om en stund.';
			loading = false;
		};
		document.body.appendChild(script);

		const observer = new MutationObserver(() => {
			if (widgetRoot?.childNodes.length) loading = false;
		});
		observer.observe(widgetRoot, { childList: true, subtree: true });

		const timeout = window.setTimeout(() => {
			if (widgetRoot?.childNodes.length) {
				loading = false;
				return;
			}
			errorText = 'Artiklarna tar längre tid att ladda. Prova att uppdatera sidan.';
			loading = false;
		}, 12000);

		return () => {
			window.clearTimeout(timeout);
			observer.disconnect();
			script.remove();
			widgetRoot?.replaceChildren();
		};
	});
</script>

<SEO canonical="https://www.mittpsyke.se/blogg" />

<svelte:head>
	<title>Blogg – artiklar om psykiskt mående | MittPsyke</title>
	<meta
		name="description"
		content="Läs artiklar om att skriva av sig, psykiskt mående, oro, stress och återhämtning i din egen takt."
	/>
	<meta property="og:type" content="website" />
</svelte:head>

<main class="blog-page">
	<section class="blog-hero">
		<p class="eyebrow">MittPsyke blogg</p>
		<h1>Blogg</h1>
		<p>
			Läs lugna och konkreta texter om att skriva av sig, förstå tankar och hitta små steg framåt.
		</p>
	</section>

	<section class="blog-widget" aria-label="Bloggartiklar">
		<div class="blog-widget-card">
			<div id="soro-blog" bind:this={widgetRoot}></div>
			{#if loading}
				<p class="blog-fallback">Artiklarna laddas...</p>
			{:else if errorText}
				<p class="blog-fallback">{errorText}</p>
			{/if}
		</div>
	</section>
</main>

<style>
	.blog-page {
		max-width: 1040px;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 3.2rem) clamp(1rem, 4vw, 1.4rem) clamp(3rem, 8vw, 4.2rem);
	}

	.blog-hero {
		max-width: 780px;
	}

	.eyebrow,
	.blog-hero h1,
	.blog-hero p,
	.blog-fallback {
		margin: 0;
	}

	.eyebrow {
		font-family: var(--font-heading);
		font-size: 0.82rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #5f8170;
	}

	.blog-hero h1 {
		margin-top: 0.35rem;
		font-family: var(--font-heading);
		letter-spacing: -0.02em;
		font-size: clamp(1.9rem, 1.5rem + 2vw, 2.5rem);
		line-height: 1.08;
	}

	.blog-hero p {
		margin-top: 0.75rem;
		font-family: var(--font-body);
		font-size: 1.02rem;
		line-height: 1.68;
		opacity: 0.84;
	}

	.blog-widget {
		margin-top: 1.35rem;
	}

	.blog-widget-card {
		border: 1px solid rgba(77, 95, 86, 0.16);
		border-radius: var(--radius-card);
		background: #f6fbf9;
		padding: clamp(0.75rem, 2vw, 1rem);
		min-height: 280px;
	}

	.blog-fallback {
		margin-top: 0.75rem;
		font-family: var(--font-body);
		font-size: 0.95rem;
		line-height: 1.6;
		opacity: 0.78;
	}

	:global(.dark) .blog-widget-card {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	@media (max-width: 640px) {
		.blog-hero p {
			font-size: 1rem;
		}
	}
</style>
