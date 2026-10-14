<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import GuestQuickEntry from '$lib/components/GuestQuickEntry.svelte';
	import { onMount } from 'svelte';
	import { trackWritePageView } from '$lib/analytics';
	import { dataflowCopy } from '$lib/dataflow-copy';

	onMount(() => {
		trackWritePageView();
	});
</script>

<SEO canonical="https://mittpsyke.se/skriv" />

<main class="write-page">
	<header class="write-intro">
		<h1>Börja skriva direkt</h1>
		<p>Du behöver inget konto. {dataflowCopy.anonymousDiary.short}</p>
	</header>

	<GuestQuickEntry />

	<section class="write-alternative" aria-labelledby="write-alternative-title">
		<div>
			<h2 id="write-alternative-title">Vill du hellre få stöd i ett samtal?</h2>
			<p>{dataflowCopy.guestChat.aiTransfer}</p>
		</div>
		<a href="/chat">Öppna AI-chatten</a>
	</section>

	<p class="write-safety">
		MittPsyke är stöd i text, inte vård eller akuthjälp. Vid akut fara: 112. För vårdråd:
		1177. För vidare stöd: Stödlinjer.se.
	</p>
</main>

<style>
	.write-page {
		padding: clamp(1.5rem, 4vw, 3rem) 0;
	}

	.write-intro,
	.write-alternative,
	.write-safety {
		width: min(100% - 2.5rem, 1080px);
		margin-inline: auto;
	}

	.write-intro {
		display: grid;
		gap: 0.45rem;
	}

	.write-intro h1,
	.write-intro p,
	.write-alternative h2,
	.write-alternative p,
	.write-safety {
		margin: 0;
	}

	.write-intro h1 {
		font-family: var(--font-heading);
		font-size: clamp(1.8rem, 4vw, 2.5rem);
		letter-spacing: -0.03em;
	}

	.write-intro p,
	.write-alternative p,
	.write-safety {
		color: hsl(var(--muted-foreground));
		line-height: 1.6;
	}

	.write-alternative {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		margin-top: 1.25rem;
		padding: 1rem 1.1rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--surface-soft));
	}

	.write-alternative h2 {
		font-family: var(--font-heading);
		font-size: 1rem;
	}

	.write-alternative p {
		margin-top: 0.25rem;
		font-size: 0.88rem;
	}

	.write-alternative a {
		flex: 0 0 auto;
		min-height: 2.75rem;
		display: inline-flex;
		align-items: center;
		padding: 0.55rem 0.9rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-pill);
		color: hsl(var(--foreground));
		font-weight: 600;
		text-decoration: none;
	}

	.write-alternative a:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.write-safety {
		margin-top: 1rem;
		font-size: 0.85rem;
	}

	@media (max-width: 640px) {
		.write-intro,
		.write-alternative,
		.write-safety {
			width: min(100% - 1.5rem, 1080px);
		}

		.write-alternative {
			align-items: stretch;
			flex-direction: column;
		}

		.write-alternative a {
			justify-content: center;
			width: 100%;
		}
	}
</style>
