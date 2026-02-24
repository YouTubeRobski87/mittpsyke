<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let user = $state<{ id?: string } | null>(null);
	let loading = $state(true);

	$effect(() => {
		supabase.auth.getSession().then(({ data }) => {
			if (!data.session) {
				goto('/login');
				return;
			}

			user = data.session.user;
			loading = false;
		});
	});
</script>

<svelte:head>
	<title>Min portal – MittPsyke</title>
</svelte:head>

{#if loading}
	<div class="container py-16 text-center text-gray-700 dark:text-gray-200/80">Laddar...</div>
{:else if user}
	<section class="container py-12">
		<div class="min-h-[60vh] flex items-center justify-center px-6">
			<div class="text-center text-gray-700 dark:text-gray-200">
				<h1 class="text-3xl font-semibold mb-3">Sidan är under konstruktion</h1>
				<p class="text-base sm:text-lg opacity-85">Det finns inget att göra här just nu.</p>
			</div>
		</div>
	</section>
{/if}
