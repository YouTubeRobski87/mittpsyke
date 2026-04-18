<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import {
		trackWritePageView,
		trackContinueFromWrite,
		trackRegisterCtaClicked,
		trackContinueAnonymousClicked
	} from '$lib/analytics';
	import { goto } from '$app/navigation';

	onMount(() => {
		// Track write page view
		trackWritePageView();
	});

	async function handleContinueAnonymous() {
		trackContinueFromWrite();
		trackContinueAnonymousClicked();
		goto('/chat');
	}

	async function handleSaveAccount() {
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
		Du kan börja direkt utan konto och få stöd i text i lugn takt.
	</p>

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
			class="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
		>
			Skapa konto och spara
		</button>
	</div>

	<p class="mt-4 text-sm opacity-70">
		Du kan börja utan konto. MittPsyke är stöd i text, inte vård eller akuthjälp.
	</p>
	<p class="mt-2 text-sm opacity-70">
		Vid akut fara: 112. För vårdråd: 1177. För vidare stöd: Stödlinjer.se.
	</p>
</main>
