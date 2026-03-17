<script lang="ts">
	import { onMount } from 'svelte';
	import { trackHoroscopeCTAClick } from '$lib/analytics';
	import Header from '$lib/components/Header.svelte';
	import Greeting from '$lib/components/dashboard/Greeting.svelte';
	import QuickActions from '$lib/components/dashboard/QuickActions.svelte';

	let user: any = null;
	let loading = true;

	onMount(async () => {
		loading = false;
	});
</script>

<Header />

<div class="container mx-auto px-4 py-8">
	{#if loading}
		<div class="text-center text-neutral-500">Laddar...</div>
	{:else}
		<Greeting {user} />
		
		<div class="mt-8 horoscope-section">
			<a 
				href="/dagbok?from=horoscope" 
				class="horoscope-nudge-link"
				on:click={trackHoroscopeCTAClick}
			>
				Vill du skriva några ord om det här?
			</a>
		</div>
		
		<QuickActions />
	{/if}
</div>
