<script lang="ts">
	import { getPortalByKey } from '$lib/data/portals';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	const slug = $derived(page.params.slug);
	const portal = $derived(getPortalByKey(slug));

	$effect(() => {
		if (!portal) {
			goto('/');
		}
	});
</script>

<svelte:head>
	<title>{portal ? portal.title : 'Portal'} – MittPsyke</title>
</svelte:head>

{#if portal}
	<section class="container py-16 text-center max-w-xl mx-auto">
		<span class="text-5xl block mb-4">{portal.icon}</span>
		<h1 class="text-3xl font-bold mb-3">{portal.title}</h1>
		<p class="opacity-75 leading-relaxed mb-8">{portal.description}</p>

		<a
			href="/chat/{portal.key}"
			class="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[var(--primary)] text-white font-medium hover:opacity-90 transition-opacity"
		>
			Börja samtala
		</a>
	</section>
{/if}
