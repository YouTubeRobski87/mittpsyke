<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleLogin(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		const { error: err } = await supabase.auth.signInWithPassword({ email, password });

		if (err) {
			error = err.message;
			loading = false;
			return;
		}

		goto('/dashboard');
	}
</script>

<svelte:head>
	<title>Logga in – MittPsyke</title>
</svelte:head>

<section class="container max-w-sm py-16">
	<h1 class="text-2xl font-bold text-center mb-6">Logga in</h1>

	<form onsubmit={handleLogin} class="space-y-4">
		<input
			type="email"
			bind:value={email}
			placeholder="E-post"
			required
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-[var(--bg-card)] outline-none focus:border-[var(--primary)] transition-colors"
		/>
		<input
			type="password"
			bind:value={password}
			placeholder="Lösenord"
			required
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-[var(--bg-card)] outline-none focus:border-[var(--primary)] transition-colors"
		/>

		{#if error}
			<p class="text-red-500 text-sm">{error}</p>
		{/if}

		<button
			type="submit"
			disabled={loading}
			class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium
				disabled:opacity-40 transition-opacity"
		>
			{loading ? 'Loggar in...' : 'Logga in'}
		</button>
	</form>

	<p class="text-center text-sm mt-4 opacity-70">
		Inget konto? <a href="/register" class="underline">Registrera dig</a>
	</p>
</section>

