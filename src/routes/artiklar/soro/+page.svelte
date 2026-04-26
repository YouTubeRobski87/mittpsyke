<script lang="ts">
	import { onMount } from 'svelte';
	import SEO from '$lib/components/SEO.svelte';

	const soroScriptSrc =
		'https://app.trysoro.com/api/embed/7741c36b-abe9-4f95-8557-3430345576e4?theme=dark';

	let widgetEl: HTMLDivElement | null = null;
	let showFallback = $state(false);

	onMount(() => {
		const script = document.createElement('script');
		const fallbackTimer = window.setTimeout(() => {
			if (!widgetEl?.hasChildNodes()) showFallback = true;
		}, 7000);

		script.src = soroScriptSrc;
		script.defer = true;
		script.onerror = () => {
			showFallback = true;
		};

		document.body.appendChild(script);

		return () => {
			window.clearTimeout(fallbackTimer);
			script.remove();
			widgetEl?.replaceChildren();
		};
	});
</script>

<SEO canonical="https://www.mittpsyke.se/artiklar/soro" />

<svelte:head>
	<title>Artiklar från MittPsyke | MittPsyke</title>
	<meta
		name="description"
		content="Artiklar från MittPsyke om psykiskt välmående, reflektion och stöd i vardagen."
	/>
</svelte:head>

<main class="soro-page">
	<section class="soro-panel" aria-labelledby="soro-heading">
		<div class="soro-header">
			<p class="eyebrow">MittPsyke</p>
			<h1 id="soro-heading">Artiklar från MittPsyke</h1>
			<p>Fördjupande texter om psykiskt välmående, reflektion och stöd i vardagen.</p>
		</div>

		<div class="soro-widget-shell">
			<div id="soro-blog" bind:this={widgetEl}></div>
			{#if showFallback}
				<p class="soro-fallback">
					Artiklarna kunde inte laddas just nu. Försök att uppdatera sidan om en stund.
				</p>
			{/if}
		</div>
	</section>
</main>

<style>
	.soro-page {
		max-width: 1040px;
		margin: 0 auto;
		padding: clamp(2rem, 6vw, 3.5rem) clamp(1rem, 4vw, 1.5rem) clamp(3rem, 8vw, 4.5rem);
	}

	.soro-panel {
		border: 1px solid rgba(77, 95, 86, 0.16);
		border-radius: var(--radius-card);
		background: #f6fbf9;
		padding: clamp(1.1rem, 3vw, 1.6rem);
	}

	.soro-header {
		max-width: 680px;
		margin-bottom: 1.2rem;
	}

	.eyebrow,
	.soro-header h1,
	.soro-header p,
	.soro-fallback {
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

	.soro-header h1 {
		margin-top: 0.35rem;
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 1.45rem + 1.6vw, 2.45rem);
		line-height: 1.08;
	}

	.soro-header p,
	.soro-fallback {
		margin-top: 0.75rem;
		font-family: var(--font-body);
		font-size: 1rem;
		line-height: 1.65;
		color: rgba(22, 33, 28, 0.76);
	}

	.soro-widget-shell {
		min-height: 260px;
		border-radius: calc(var(--radius-card) - 4px);
		background: #101615;
		padding: clamp(0.75rem, 2vw, 1rem);
	}

	:global(.dark) .soro-panel {
		background: #1a2320;
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .soro-header p,
	:global(.dark) .soro-fallback {
		color: rgba(245, 247, 245, 0.76);
	}
</style>
