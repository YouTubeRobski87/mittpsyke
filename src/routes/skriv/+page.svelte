<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { onMount } from 'svelte';
	import type { Session } from '@supabase/supabase-js';
	import {
		trackWritePageView,
		trackContinueFromWrite,
		trackContinueAnonymousClicked
	} from '$lib/analytics';
	import { goto } from '$app/navigation';

	type PageData = {
		session?: Session | null;
	};

	let { data } = $props<{ data: PageData }>();
	let isLoggedIn = $derived(Boolean(data.session?.user));

	onMount(() => {
		// Track write page view
		trackWritePageView();
	});

	async function handleStartChat() {
		trackContinueFromWrite();
		if (!isLoggedIn) {
			trackContinueAnonymousClicked();
		}
		goto('/chat');
	}

	async function handleOpenDiary() {
		goto('/dagbok');
	}

	// Rest of component...
</script>

<SEO canonical="https://www.mittpsyke.se/skriv" />

<main class="container py-12">
	<h1 class="text-2xl font-bold mb-4">Skriv av dig anonymt</h1>
	<p class="mb-6 opacity-70">
		{isLoggedIn
			? 'Du kan börja direkt i chatten eller skriva vidare i dagboken.'
			: 'Du kan börja direkt utan konto och få stöd i text i lugn takt.'}
	</p>

	<div class="flex flex-wrap gap-3">
		<button
			type="button"
			onclick={handleStartChat}
			class="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
		>
			Starta chatten
		</button>
		<button
			type="button"
			onclick={handleOpenDiary}
			class="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
		>
			Öppna dagboken
		</button>
	</div>

	<section class="mt-7 grid gap-3 sm:grid-cols-3">
		<article class="rounded-lg border border-gray-200 bg-white/70 p-4 dark:border-gray-700 dark:bg-gray-900/50">
			<h2 class="text-base font-semibold mb-1">Börja utan konto</h2>
			<p class="text-sm leading-relaxed opacity-75">Du kan skriva direkt och välja senare om du vill spara.</p>
		</article>
		<article class="rounded-lg border border-gray-200 bg-white/70 p-4 dark:border-gray-700 dark:bg-gray-900/50">
			<h2 class="text-base font-semibold mb-1">Skriv i din egen takt</h2>
			<p class="text-sm leading-relaxed opacity-75">Du behöver inte formulera dig perfekt.</p>
		</article>
		<article class="rounded-lg border border-gray-200 bg-white/70 p-4 dark:border-gray-700 dark:bg-gray-900/50">
			<h2 class="text-base font-semibold mb-1">Inte vård eller diagnos</h2>
			<p class="text-sm leading-relaxed opacity-75">MittPsyke är stöd i text och ersätter inte vårdkontakt.</p>
		</article>
	</section>

	<p class="mt-4 text-sm opacity-70">
		{isLoggedIn
			? 'MittPsyke är stöd i text, inte vård eller akuthjälp.'
			: 'Du kan börja utan konto. MittPsyke är stöd i text, inte vård eller akuthjälp.'}
	</p>
	<p class="mt-2 text-sm opacity-70">
		Vid akut fara: 112. För vårdråd: 1177. För vidare stöd: Stödlinjer.se.
	</p>
</main>
