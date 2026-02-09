<script lang="ts">
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { supabase } from '$lib/supabase';

	let { children } = $props();

	let user = $state<{ email?: string } | null>(null);

	$effect(() => {
		supabase.auth.getSession().then(({ data }) => {
			user = data.session?.user ?? null;
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			user = session?.user ?? null;
		});

		return () => subscription.unsubscribe();
	});

	async function logout() {
		await supabase.auth.signOut();
		window.location.href = '/login';
	}
</script>

<header class="flex items-center justify-between px-5 py-3.5 border-b border-black/8">
	<a href="/" class="flex items-center gap-2.5 font-semibold">
		💙 <span>MittPsyke</span>
	</a>

	<nav class="flex items-center gap-4">
		{#if user}
			<a href="/dashboard" class="opacity-85 hover:opacity-100">Min portal</a>
			<button onclick={logout} class="opacity-85 hover:opacity-100 hover:underline">
				Logga ut
			</button>
		{:else}
			<a href="/login" class="opacity-85 hover:opacity-100">Logga in</a>
			<a href="/register" class="opacity-85 hover:opacity-100">Registrera</a>
		{/if}
		<ThemeToggle />
	</nav>
</header>

<main>
	{@render children()}
</main>

<footer class="border-t border-black/8 py-5 px-5 text-sm opacity-60 text-center mt-12">
	© {new Date().getFullYear()} MittPsyke. Alla rättigheter förbehållna.
	<span class="mx-2">&middot;</span>
	<a href="/om-mittpsyke" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
		Om MittPsyke
	</a>
	<span class="mx-2">&middot;</span>
	<a
		href="https://stodlinjer.se"
		target="_blank"
		rel="noopener noreferrer"
		class="text-sm font-medium text-teal-700/90 dark:text-teal-300/90 opacity-90 hover:opacity-100 transition-opacity"
	>
		Akut hjälp (Stödlinjer)
	</a>
</footer>
