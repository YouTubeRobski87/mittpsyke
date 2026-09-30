<script lang="ts">
	// QA-harness, se +page.ts. Ingen del av produkten - den monterar den riktiga
	// Framsteg-sidan med ett syntetiskt konto, så varje stadium kan jämföras med
	// samma scen, dygn, årstid och pose.
	import ProgressPage from '../../framsteg/+page.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>QA: Världsstadier</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<p class="harness-note" data-testid="harness-fixture">
	QA: {data.fixtureLabel} - dagar {data.presence.activeDays}, veckor {data.presence.activeWeeks},
	månader {data.presence.activeMonths}, registreringar {data.presence.registrationCount}, ålder
	{data.presence.accountAgeDays} d, stadium {data.progress.worldProgress.stage}
	{#each data.fixtureKeys as key (key)}
		· <a href={`?fixture=${key}`}>{key}</a>
	{/each}
</p>

<ProgressPage data={data.progress} />

<style>
	.harness-note {
		margin: 0;
		padding: 0.5rem 1rem;
		font: 0.8rem/1.4 system-ui, sans-serif;
		background: #fff7d6;
		color: #3b3200;
	}
</style>
