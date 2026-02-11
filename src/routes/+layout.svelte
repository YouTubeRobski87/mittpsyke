<script lang="ts">
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { supabase } from '$lib/supabase';

	let { children } = $props();

	let user = $state<{ email?: string } | null>(null);
	let mobileMenuOpen = $state(false);

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

<svelte:head>
	<title>MittPsyke – Digitalt samtalsstöd för ångest och nedstämdhet</title>

	<meta
		name="description"
		content="MittPsyke är ett lugnt och tryggt digitalt samtalsstöd för ångest, nedstämdhet och trauma. Samtala i din egen takt."
	/>

	<meta name="robots" content="index, follow" />
	<meta name="author" content="MittPsyke" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />

	<link rel="canonical" href="https://mittpsyke.se" />
</svelte:head>

<header class="sticky top-0 z-30 border-b border-black/8 bg-white/75 dark:bg-black/35 backdrop-blur">
	<div class="flex items-center justify-between gap-3 px-5 py-3.5">
		<div class="flex items-center gap-3 sm:gap-4 min-w-0">
			<a href="/" class="flex items-center gap-2.5 font-semibold opacity-95 hover:opacity-100 transition-opacity">
				💙 <span>MittPsyke</span>
			</a>

			<nav class="hidden md:flex items-center gap-4">
				<a
					href="/om-mittpsyke"
					class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
				>
					Om MittPsyke
				</a>
				<a
					href="https://stodlinjer.se"
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
				>
					Akut hjälp (Stödlinjer)
				</a>
			</nav>
		</div>

		<div class="flex items-center gap-3">
			<nav class="hidden md:flex items-center gap-4">
				{#if user}
					<a href="/dagbok" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
						+ Dagbok
					</a>
					<a href="/dashboard" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
						Min portal
					</a>
					<button
						onclick={logout}
						class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
					>
						Logga ut
					</button>
				{:else}
					<a href="/login" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
						Logga in
					</a>
					<a href="/register" class="text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity">
						Registrera
					</a>
				{/if}
			</nav>

			<ThemeToggle />

			<button
				type="button"
				class="md:hidden inline-flex items-center justify-center rounded-md border border-black/10 dark:border-white/10 px-2.5 py-2 text-sm opacity-80 hover:opacity-100 transition-opacity"
				aria-label="Öppna meny"
				aria-expanded={mobileMenuOpen}
				onclick={() => (mobileMenuOpen = !mobileMenuOpen)}
			>
				☰
			</button>
		</div>
	</div>

	{#if mobileMenuOpen}
		<div class="md:hidden border-t border-black/8 dark:border-white/10 px-5 py-3 space-y-2">
			<a
				href="/om-mittpsyke"
				class="block text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
				onclick={() => (mobileMenuOpen = false)}
			>
				Om MittPsyke
			</a>
			<a
				href="https://stodlinjer.se"
				target="_blank"
				rel="noopener noreferrer"
				class="block text-sm opacity-80 hover:opacity-100 hover:underline transition-opacity"
				onclick={() => (mobileMenuOpen = false)}
			>
				Akut hjälp (Stödlinjer)
			</a>
			{#if user}
				<a
					href="/dagbok"
					class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					+ Dagbok
				</a>
				<a
					href="/dashboard"
					class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					Min portal
				</a>
				<button
					onclick={() => {
						mobileMenuOpen = false;
						logout();
					}}
					class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
				>
					Logga ut
				</button>
			{:else}
				<a
					href="/login"
					class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					Logga in
				</a>
				<a
					href="/register"
					class="block text-sm opacity-85 hover:opacity-100 hover:underline transition-opacity"
					onclick={() => (mobileMenuOpen = false)}
				>
					Registrera
				</a>
			{/if}
			<p class="pt-1 text-xs opacity-60">Vid akut fara: ring 112</p>
		</div>
	{/if}
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

