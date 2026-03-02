<script lang="ts">
	import { browser } from '$app/environment';
	import ChatWindow from '$lib/components/ChatWindow.svelte';
	import { getPortalByKey } from '$lib/data/portals';
	import { page } from '$app/state';

	const category = $derived(page.params.category ?? '');
	const portal = $derived(getPortalByKey(category));

	$effect(() => {
		if (!browser || !category) return;
		window.localStorage.setItem('mittpsyke:last-chat-category', category);
	});
</script>

<svelte:head>
	<title>{portal ? portal.title : 'Chatt'} - MittPsyke</title>
</svelte:head>

<div class="container py-6">
	{#if portal}
		<div class="text-center mb-4">
			<span class="text-2xl">{portal.icon}</span>
			<h1 class="text-xl font-semibold mt-1">{portal.title}</h1>
			<p class="text-sm opacity-70">{portal.description}</p>
		</div>
	{/if}

	<ChatWindow category={category} />
</div>