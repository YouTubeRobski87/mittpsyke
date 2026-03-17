<script lang="ts">
	import { onMount } from 'svelte';
	import { trackRegisterPageView, trackTempEntryPreviewShown } from '$lib/analytics';
	import { dev } from '$app/environment';

	let tempEntryPreview: { title?: string; content?: string } | null = null;
	let showPreview = false;

	onMount(() => {
		// Load temp entry
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('mittpsyke_temp_entry');
			if (stored) {
				try {
					const data = JSON.parse(stored);
					tempEntryPreview = data;
					showPreview = true;
				} catch (e) {
					// Try as plain text
					tempEntryPreview = { content: stored };
					showPreview = true;
				}
			}
		}

		// Track events
		trackRegisterPageView(tempEntryPreview !== null);
		if (showPreview) {
			trackTempEntryPreviewShown();
		}
	});
</script>

<svelte:head>
	<title>Skapa konto | MittPsyke</title>
</svelte:head>

<main class="container py-12">
	<h1 class="text-2xl font-bold mb-4">Skapa konto</h1>

	{#if showPreview && tempEntryPreview}
		<div class="mb-6 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700/40 p-4">
			<p class="text-sm font-medium mb-2">📓 Ditt första dagboksinlägg</p>
			<p class="text-sm opacity-80 mb-2 line-clamp-3">{tempEntryPreview.content || 'Tomt utkast'}</p>
			<p class="text-xs opacity-60">Vi hittade ett utkast från tidigare — skapa konto för att spara din resa.</p>
		</div>
	{/if}

	<!-- Registration form content -->
	<p>Registreringsformulär här...</p>
</main>
