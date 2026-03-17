<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { trackSignupCompleted, trackDiaryPageOpenedFromHoroscope } from '$lib/analytics';
	import Header from '$lib/components/Header.svelte';

	let entries: any[] = [];
	let loading = true;

	onMount(async () => {
		// Track signup completion if coming from welcome flow
		if ($page.url.searchParams.get('welcome') === 'true') {
			trackSignupCompleted();
		}
		
		// Track diary page opened from horoscope source
		if ($page.url.searchParams.get('from') === 'horoscope') {
			trackDiaryPageOpenedFromHoroscope();
		}
		
		loading = false;
	});
</script>

<Header />

<div class="container mx-auto px-4 py-8">
	{#if loading}
		<div class="text-center text-neutral-500">Laddar...</div>
	{:else}
		<div class="diary-entries">
			{#each entries as entry (entry.id)}
				<div class="entry-card">
					<h3>{entry.title}</h3>
					<p>{entry.content}</p>
				</div>
			{/each}
		</div>
	{/if}
</div>
