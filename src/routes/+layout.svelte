<script lang="ts">
	import '../app.css';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { supabase } from '$lib/supabase';
	import type { User } from '@supabase/supabase-js';

	let { children } = $props();

	let user = $state<User | null>(null);
	let displayName = $state<string | null>(null);
	let mobileMenuOpen = $state(false);
	let profileRequestVersion = 0;

	async function syncUser(sessionUser: User | null) {
		user = sessionUser;
		const requestVersion = ++profileRequestVersion;

		if (!sessionUser) {
			displayName = null;
			return;
		}

		const { data, error } = await supabase
			.from('profiles')
			.select('display_name')
			.eq('id', sessionUser.id)
			.maybeSingle();

		if (requestVersion !== profileRequestVersion) return;

		if (error) {
			displayName = null;
			return;
		}

		const nextName = typeof data?.display_name === 'string' ? data.display_name.trim() : '';
		displayName = nextName.length > 0 ? nextName : null;
	}

	$effect(() => {
		supabase.auth.getSession().then(({ data }) => {
			void syncUser(data.session?.user ?? null);
		});

		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, session) => {
			void syncUser(session?.user ?? null);
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

	<meta property="og:title" content="MittPsyke – Digitalt samtalsstöd" />
	<meta
		property="og:description"
		content="Ett lugnt och tryggt digitalt stöd för ångest, nedstämdhet och trauma."
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://mittpsyke.se" />
	<meta property="og:site_name" content="MittPsyke" />

	<meta name="twitter:card" content="summary" />
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
					<span class="text-sm opacity-70">
						{displayName ? `Välkommen, ${displayName}` : 'Välkommen tillbaka'}
					</span>
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
				<p class="text-sm opacity-70">{displayName ? `Välkommen, ${displayName}` : 'Välkommen tillbaka'}</p>
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

<section class="mt-10 px-5">
	<p class="mx-auto max-w-4xl text-center text-xs sm:text-sm opacity-70 leading-relaxed">
		MittPsyke är ett AI-baserat samtalsstöd och ersätter inte medicinsk eller psykologisk vård.
		Vid akut fara: ring 112. Vid behov av vårdråd: 1177.
		<a
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
			class="underline hover:no-underline ml-1"
		>
			Akut hjälp
		</a>
	</p>
</section>

<footer class="border-t border-black/8 py-5 px-5 text-sm opacity-60 text-center mt-12">
	© {new Date().getFullYear()} MittPsyke. Alla rättigheter förbehållna.
	<span class="mx-2">&middot;</span>
	<a href="/om-mittpsyke" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
		Om MittPsyke
	</a>
	<span class="mx-2">&middot;</span>
	<a href="/integritet" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
		Integritetspolicy
	</a>
	<span class="mx-2">&middot;</span>
	<a href="/ansvar" class="text-sm opacity-70 hover:opacity-100 transition-opacity">
		Ansvarsinfo
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


