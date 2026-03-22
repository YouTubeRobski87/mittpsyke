<script lang="ts">
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';

	type Phase = 'loading' | 'form' | 'success' | 'invalid';
	let phase = $state<Phase>('loading');
	let password = $state('');
	let password2 = $state('');
	let saving = $state(false);
	let errorMsg = $state('');

	onMount(() => {
		// Hantera PKCE-kod (?code=...) eller hash-baserat flöde
		const params = new URLSearchParams(window.location.search);
		const code = params.get('code');

		if (code) {
			supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
				if (error) { phase = 'invalid'; return; }
				phase = 'form';
			});
			return;
		}

		// Hash-baserat flöde — PASSWORD_RECOVERY event triggas automatiskt
		const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
			if (event === 'PASSWORD_RECOVERY') phase = 'form';
		});

		// Kontrollera om session redan finns (t.ex. vid omladdning)
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session && phase === 'loading') phase = 'form';
		});

		// Timeout om varken kod eller hash finns
		const timeout = setTimeout(() => {
			if (phase === 'loading') phase = 'invalid';
		}, 5000);

		return () => {
			subscription.unsubscribe();
			clearTimeout(timeout);
		};
	});

	async function updatePassword() {
		errorMsg = '';
		if (password.length < 8) { errorMsg = 'Lösenordet måste vara minst 8 tecken.'; return; }
		if (password !== password2) { errorMsg = 'Lösenorden matchar inte.'; return; }
		saving = true;
		const { error } = await supabase.auth.updateUser({ password });
		saving = false;
		if (error) { errorMsg = 'Kunde inte uppdatera lösenordet. Länken kan ha gått ut — begär ett nytt mail.'; return; }
		phase = 'success';
	}
</script>

<svelte:head>
	<title>Återställ lösenord - MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="container max-w-sm py-16">
	{#if phase === 'loading'}
		<p class="text-center opacity-60 text-sm">Verifierar länk…</p>

	{:else if phase === 'invalid'}
		<h1 class="text-2xl font-bold text-center mb-4">Länken är ogiltig</h1>
		<p class="text-center text-sm opacity-70 mb-6">Länken har gått ut eller använts redan. Begär ett nytt återställningsmail.</p>
		<a
			href="/login"
			class="block w-full text-center px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium"
		>Tillbaka till inloggning</a>

	{:else if phase === 'success'}
		<h1 class="text-2xl font-bold text-center mb-4">Lösenordet är uppdaterat</h1>
		<p class="text-center text-sm opacity-70 mb-6">Du kan nu logga in med ditt nya lösenord.</p>
		<a
			href="/dashboard"
			class="block w-full text-center px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium"
		>Gå till dashboarden</a>

	{:else}
		<h1 class="text-2xl font-bold text-center mb-6">Välj nytt lösenord</h1>
		<div class="space-y-4">
			{#if errorMsg}
				<p class="text-red-500 text-sm" role="alert">{errorMsg}</p>
			{/if}
			<div>
				<label class="block text-sm mb-1" for="new-password">Nytt lösenord</label>
				<input
					id="new-password"
					type="password"
					bind:value={password}
					placeholder="Minst 8 tecken"
					autocomplete="new-password"
					class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
						bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
				/>
			</div>
			<div>
				<label class="block text-sm mb-1" for="new-password2">Bekräfta lösenord</label>
				<input
					id="new-password2"
					type="password"
					bind:value={password2}
					placeholder="Upprepa lösenordet"
					autocomplete="new-password"
					class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
						bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
				/>
			</div>
			<button
				type="button"
				disabled={saving}
				onclick={updatePassword}
				class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium
					disabled:opacity-60 transition-opacity"
			>{saving ? 'Sparar...' : 'Spara nytt lösenord'}</button>
		</div>
	{/if}
</section>
