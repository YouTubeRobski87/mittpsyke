<script lang="ts">
	import { onMount } from 'svelte';
	import {
		trackWritePageView,
		trackWriteStarted,
		trackContinueFromWrite,
		trackTempEntrySaved,
		trackRegisterCtaClicked,
		trackContinueAnonymousClicked
	} from '$lib/analytics';
	import { hasAnalyticsConsent } from '$lib/consent';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';

	let note = $state('');
	let saving = $state(false);
	let error = $state('');

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
		trackWriteStarted();
	}

	async function handleContinueAnonymous() {
		// Save draft
		if (note.trim() && typeof window !== 'undefined') {
			localStorage.setItem('mittpsyke_temp_entry', note.trim());
			trackTempEntrySaved();
		}

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

<svelte:head>
	<title>Skriv | MittPsyke</title>
</svelte:head>

<main class="container py-12">
	<h1 class="text-2xl font-bold mb-4">Skriv av dig</h1>
	<p class="mb-6 opacity-70">Börja där du är. Det räcker med några ord.</p>

	<textarea
		bind:value={note}
		onchange={handleInput}
		onkeydown={handleInput}
		rows={10}
		placeholder="Skriv dina tankar här..."
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
			Fortsätta anonymt
		</button>
		<button
			type="button"
			onclick={handleSaveAccount}
			disabled={!note.trim() || saving}
			class="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
		>
			{saving ? 'Sparar...' : 'Skapa konto'}
		</button>
	</div>
</main>
