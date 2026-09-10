<script lang="ts">
	// QA-harness, se +page.ts. Ingen del av produkten - den monterar den
	// riktiga SleepModePanel så flödet, fokus och mobillayouten går att köra i
	// webbläsaren utan att logga in i Kvällsstugan.
	import SleepModePanel from '$lib/components/evening/SleepModePanel.svelte';
	import type { SleepStage } from '$lib/evening-sleep-mode';

	let stage = $state<SleepStage>('closed');
	const isSleepMode = $derived(stage === 'active');
</script>

<svelte:head>
	<title>QA: Sovläge</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="harness">
	<h1>QA: Sovläge</h1>
	<p class="harness-note">
		Utvecklingsharness. Rutan nedan står för Kvällsstugans scen och speglar bara dimningen –
		den riktiga scenen ligger i <code>/dashboard/kvallsstugan</code>.
	</p>

	<p class="harness-state" data-testid="harness-stage">stage: {stage}</p>

	<div class="harness-scene" data-sleep={isSleepMode ? 'on' : 'off'}>
		<span>Scen (16:9)</span>
	</div>

	{#if stage === 'closed'}
		<button class="harness-open" type="button" onclick={() => (stage = 'source')}>
			Lägg dig till rätta
		</button>
	{/if}

	<SleepModePanel bind:stage />
</main>

<style>
	.harness {
		display: grid;
		gap: 1rem;
		width: min(100% - 1.25rem, 44rem);
		margin: 0 auto;
		padding: 1rem 0 3rem;
		font-family: var(--font-body);
	}

	h1 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.5rem;
	}

	.harness-note,
	.harness-state {
		margin: 0;
		color: hsl(var(--muted-foreground));
		font-size: 0.85rem;
		line-height: 1.5;
	}

	.harness-scene {
		display: grid;
		place-items: center;
		aspect-ratio: 16 / 9;
		min-height: 180px;
		border: 1px solid rgb(92 72 47 / 0.26);
		border-radius: 1rem;
		background: #2b2119;
		color: rgb(247 243 235 / 0.6);
		transition: filter 900ms ease;
	}

	.harness-scene[data-sleep='on'] {
		filter: brightness(0.62) saturate(0.86);
	}

	.harness-open {
		justify-self: start;
		min-height: 44px;
		padding: 0.6rem 0.9rem;
		border: 1px dashed rgb(245 200 120 / 0.6);
		border-radius: 0.8rem;
		background: transparent;
		color: rgb(245 200 120 / 0.9);
		font: inherit;
		font-weight: 650;
		cursor: pointer;
	}

	@media (min-width: 900px) {
		.harness {
			width: min(100% - 2rem, 60rem);
		}
	}
</style>
