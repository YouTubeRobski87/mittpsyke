<script lang="ts">
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleRegister(e: Event) {
		e.preventDefault();
		error = '';
		loading = true;

		const { error: err } = await supabase.auth.signUp({ email, password });

		if (err) {
			error = err.message;
			loading = false;
			return;
		}

		alert('Konto skapat! Du kan nu logga in.');
		goto('/login');
	}
</script>

<svelte:head>
	<title>Registrera – MittPsyke</title>
</svelte:head>

<section class="container max-w-sm py-16">
	<h1 class="text-2xl font-bold text-center mb-6">Skapa konto</h1>

	<form onsubmit={handleRegister} class="space-y-4">
		<input
			type="email"
			bind:value={email}
			placeholder="E-post"
			required
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
		/>
		<input
			type="password"
			bind:value={password}
			placeholder="Lösenord"
			required
			minlength={6}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
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
			{loading ? 'Skapar konto...' : 'Registrera'}
		</button>
	</form>

	<p class="text-center text-sm mt-4 opacity-70">
		Har du redan ett konto? <a href="/login" class="underline">Logga in</a>
	</p>
</section>
