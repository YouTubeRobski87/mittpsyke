<script lang="ts">
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import { trackRegisterPageView, trackTempEntryPreviewShown } from '$lib/analytics';
	import type { ActionData } from './$types';

	let tempEntryPreview = $state<{ title?: string; content?: string } | null>(null);
	let showPreview = $state(false);
	let { form }: { form: ActionData } = $props();
	let loading = $state(false);

	onMount(() => {
		// Load temp entry
		if (typeof window !== 'undefined') {
			const stored = localStorage.getItem('mittpsyke_temp_entry');
			if (stored) {
				try {
					const data = JSON.parse(stored);
					tempEntryPreview = data;
					showPreview = true;
				} catch (e) {
					// Try as plain text
					tempEntryPreview = { content: stored };
					showPreview = true;
				}
			}
		}

		// Track events
		trackRegisterPageView(tempEntryPreview !== null);
		if (showPreview) {
			trackTempEntryPreviewShown();
		}
	});
</script>

<svelte:head>
	<title>Skapa konto | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="container max-w-sm py-12">
	<h1 class="text-2xl font-bold mb-4">Skapa konto</h1>

	{#if showPreview && tempEntryPreview}
		<div class="mb-6 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700/40 p-4">
			<p class="text-sm font-medium mb-2">📓 Du har redan börjat på ett inlägg</p>
			<p class="text-sm opacity-80 mb-2 line-clamp-3">{tempEntryPreview.content || 'Tomt utkast'}</p>
			<p class="text-xs opacity-60">Skapa konto så finns utkastet kvar i dagboken när du fortsätter.</p>
		</div>
	{/if}

	<form
		method="POST"
		novalidate
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
		class="space-y-4"
	>
		<label class="block text-sm" for="register-email">E-post</label>
		<input
			id="register-email"
			type="email"
			name="email"
			placeholder="E-post"
			autocomplete="email"
			required
			aria-describedby={form?.error ? 'register-form-error' : undefined}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
		/>

		<label class="block text-sm" for="register-password">Lösenord</label>
		<input
			id="register-password"
			type="password"
			name="password"
			placeholder="Minst 6 tecken"
			autocomplete="new-password"
			required
			minlength="6"
			aria-describedby={form?.error ? 'register-form-error' : undefined}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
		/>

		{#if form?.error}
			<p id="register-form-error" class="text-red-500 text-sm" role="alert">{form.error}</p>
		{/if}

		<button
			type="submit"
			disabled={loading}
			class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium disabled:opacity-60 transition-opacity"
		>
			{loading ? 'Skapar konto...' : 'Skapa konto'}
		</button>
	</form>

	<p class="text-center text-sm mt-4 opacity-70">
		Har du redan konto? <a href="/login" class="underline">Logga in</a>
	</p>
</main>
