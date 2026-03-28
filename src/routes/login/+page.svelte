<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { supabase } from '$lib/supabase';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let oauthLoading = $state(false);
	let oauthError = $state('');

	let showReset = $state(false);
	let resetEmail = $state('');
	let resetSending = $state(false);
	let resetSent = $state(false);
	let resetError = $state('');

	async function sendReset() {
		resetError = '';
		const email = resetEmail.trim();
		if (!email) { resetError = 'Ange din e-postadress.'; return; }
		resetSending = true;
		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: window.location.origin + '/aterstall-losenord'
		});
		resetSending = false;
		if (error) { resetError = 'Kunde inte skicka e-post. Kontrollera adressen och försök igen.'; return; }
		resetSent = true;
	}
	async function continueWithGoogle() {
		oauthError = '';
		oauthLoading = true;

		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: `${window.location.origin}/auth/callback?next=/min-portal`
			}
		});

		if (error) {
			oauthError = 'Det gick inte att starta Google-inloggningen. Försök igen om en liten stund.';
			oauthLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Logga in - MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="container max-w-sm py-16">
	<h1 class="text-2xl font-bold text-center mb-6">Logga in</h1>

	<form method="POST" novalidate use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	}} class="space-y-4">
		<label class="block text-sm" for="login-email">E-post</label>
		<input
			id="login-email"
			type="email"
			name="email"
			placeholder="E-post"
			autocomplete="email"
			required
			aria-describedby={form?.error ? 'login-form-error' : undefined}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
		/>
		<div class="flex items-center justify-between">
			<label class="block text-sm" for="login-password">Lösenord</label>
			<button
				type="button"
				class="text-xs opacity-60 hover:opacity-90 underline underline-offset-2 transition-opacity"
				onclick={() => { showReset = !showReset; resetSent = false; resetError = ''; }}
			>Glömt lösenord?</button>
		</div>
		<input
			id="login-password"
			type="password"
			name="password"
			placeholder="Lösenord"
			autocomplete="current-password"
			required
			aria-describedby={form?.error ? 'login-form-error' : undefined}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
		/>

		{#if showReset}
			<div class="p-4 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 space-y-3">
				{#if resetSent}
					<p class="text-sm text-green-600 dark:text-green-400">Kolla din inkorg — ett återställningsmail är på väg.</p>
				{:else}
					<p class="text-sm font-medium">Återställ lösenord</p>
					{#if resetError}
						<p class="text-red-500 text-sm" role="alert">{resetError}</p>
					{/if}
					<input
						type="email"
						bind:value={resetEmail}
						placeholder="Din e-postadress"
						class="w-full px-4 py-2 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
							bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors text-sm"
					/>
					<button
						type="button"
						disabled={resetSending}
						onclick={sendReset}
						class="w-full px-4 py-2 rounded-[var(--radius-input)] bg-[var(--primary)] text-white text-sm font-medium
							disabled:opacity-60 transition-opacity"
					>{resetSending ? 'Skickar...' : 'Skicka återställningsmail'}</button>
				{/if}
			</div>
		{/if}

		{#if form?.error}
			<p id="login-form-error" class="text-red-500 text-sm" role="alert">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={loading}
			class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium
				disabled:opacity-60 transition-opacity"
		>
			{loading ? 'Loggar in...' : 'Logga in'}
		</button>

		<div class="flex items-center gap-3 py-1" aria-hidden="true">
			<div class="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
			<span class="text-xs uppercase tracking-[0.18em] opacity-50">eller</span>
			<div class="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
		</div>

		<button
			type="button"
			disabled={loading || oauthLoading}
			aria-busy={oauthLoading}
			onclick={continueWithGoogle}
			class="w-full px-5 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 font-medium
				disabled:opacity-60 transition-opacity"
		>
			{oauthLoading ? 'Öppnar Google...' : 'Fortsätt med Google'}
		</button>

		{#if oauthError}
			<p class="text-red-500 text-sm" role="alert">{oauthError}</p>
		{/if}
	</form>

	<p class="text-center text-sm mt-4 opacity-70">
		Inget konto? <a href="/register" class="underline">Registrera dig</a>
	</p>

	<p class="text-center text-xs mt-8 opacity-60">
		MittPsyke ersätter inte vård. Vid akut fara ring 112 · Vårdråd 1177.
	</p>
</section>
