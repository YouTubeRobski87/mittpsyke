<script lang="ts">
	// Samma utkastkontinuitet som tidigare bara fanns på gamla /dashboard,
	// portad hit utan att flytta eller duplicera lagringslogiken - readDiaryDraft
	// är den enda källan till sanning för anonyma dagboksutkast (se
	// $lib/diary-draft). Komponenten läser bara, skriver eller raderar aldrig
	// utkastet, och kör ingen AI-analys.
	import { onMount } from 'svelte';
	import { readDiaryDraft } from '$lib/diary-draft';

	let hasDraft = $state(false);

	onMount(() => {
		hasDraft = Boolean(readDiaryDraft());
	});
</script>

{#if hasDraft}
	<section class="draft-continuity" aria-labelledby="draft-continuity-title">
		<h2 id="draft-continuity-title">Ditt utkast finns kvar</h2>
		<p>Fortsätt där du slutade. Du väljer själv när du vill spara texten som ett inlägg.</p>
		<a class="draft-continuity-action" href="/dagbok/checkin#skriv-sjalv">Fortsätt skriva</a>
	</section>
{/if}

<style>
	.draft-continuity {
		display: grid;
		gap: 0.4rem;
		padding: clamp(0.9rem, 2.4vw, 1.15rem);
		border: 1px solid rgb(237 222 194 / 0.24);
		border-radius: 1rem;
		background: rgb(255 255 255 / 0.05);
		color: #f7f3eb;
	}

	.draft-continuity h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1rem;
	}

	.draft-continuity p {
		margin: 0;
		color: rgb(240 235 225 / 0.82);
		font-size: 0.9rem;
		line-height: 1.5;
	}

	.draft-continuity-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: fit-content;
		min-height: 44px;
		margin-top: 0.15rem;
		padding: 0.6rem 1rem;
		border: 1px solid #efc171;
		border-radius: 0.8rem;
		background: #efc171;
		color: #2b2116;
		font-weight: 650;
		text-decoration: none;
	}

	.draft-continuity-action:hover {
		background: #f7d28f;
	}

	.draft-continuity-action:focus-visible {
		outline: 2px solid #f5c878;
		outline-offset: 2px;
	}
</style>
