<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
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
		<label class="block text-sm" for="login-password">Lösenord</label>
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
	</form>

	<p class="text-center text-sm mt-4 opacity-70">
		Inget konto? <a href="/register" class="underline">Registrera dig</a>
	</p>

	<p class="text-center text-xs mt-8 opacity-60">
		MittPsyke ersätter inte vård. Vid akut fara ring 112 · Vårdråd 1177.
	</p>
</section>
