<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import {
		trackWritePageView,
		trackWriteStarted,
		trackContinueFromWrite,
		trackTempEntrySaved,
		trackRegisterCtaClicked,
		trackContinueAnonymousClicked
	} from '$lib/analytics';
	import { goto } from '$app/navigation';

	let note = $state('');
	let saving = $state(false);
	let error = $state('');
	let hasTrackedWriteStart = $state(false);

	onMount(() => {
		// Track write page view
		trackWritePageView();

		// Load any saved draft
		if (typeof window !== 'undefined') {
			const draft = localStorage.getItem('mittpsyke:draft');
			if (draft) {
				note = draft;
			}
		}
	});

	function handleInput() {
		if (hasTrackedWriteStart) return;
		hasTrackedWriteStart = true;
		trackWriteStarted();
	}

	async function handleContinueAnonymous() {
		// Save draft
		if (note.trim() && typeof window !== 'undefined') {
			localStorage.setItem('mittpsyke_temp_entry', note.trim());
			trackTempEntrySaved();
		}

		trackContinueFromWrite();
		trackContinueAnonymousClicked();
		goto('/chat');
	}

	async function handleSaveAccount() {
		if (!note.trim()) return;

		// Save draft before redirect
		if (typeof window !== 'undefined') {
			localStorage.setItem('mittpsyke_temp_entry', note.trim());
			trackTempEntrySaved();
		}

		trackRegisterCtaClicked();
		goto('/register');
	}

	// Rest of component...
</script>

<SEO canonical="https://www.mittpsyke.se/skriv" />

<svelte:head>
	<meta name="robots" content="noindex, follow" />
	<title>Chatta anonymt utan konto – Skriv av dig | MittPsyke</title>
	<meta
		name="description"
		content="Skriv av dig anonymt utan att skapa konto. MittPsyke erbjuder gratis AI-samtalsstöd för ångest, stress och nedstämdhet – börja direkt, inga uppgifter krävs."
	/>
</svelte:head>

<main class="container py-12">
	<h1 class="text-2xl font-bold mb-4">Börja skriva anonymt i din egen takt</h1>
	<p class="mb-6 opacity-70">
		Börja med några ord om det som känns tungt. Du kan fortsätta utan konto och få stöd i text direkt.
	</p>

	<textarea
		bind:value={note}
		onchange={handleInput}
		onkeydown={handleInput}
		rows={10}
		placeholder="Skriv några ord om hur du har det just nu..."
		class="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 mb-4"
	></textarea>

	{#if error}
		<p class="text-red-600 text-sm mb-4">{error}</p>
	{/if}

	<div class="flex gap-3">
		<button
			type="button"
			onclick={handleContinueAnonymous}
			class="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
		>
			Starta chatten anonymt
		</button>
		<button
			type="button"
			onclick={handleSaveAccount}
			disabled={!note.trim() || saving}
			class="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
		>
			{saving ? 'Sparar...' : 'Skapa konto och spara'}
		</button>
	</div>

	<p class="mt-4 text-sm opacity-70">
		Du kan börja utan konto. MittPsyke är stöd i text, inte vård eller akuthjälp.
	</p>
</main>
