<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { enhance } from '$app/forms';
	import { onMount } from 'svelte';
	import {
		clearPendingAuthFunnel,
		trackAccountCreatedAfterEntry,
		trackRegisterPageView,
		trackSignUpStarted,
		trackTempEntryPreviewShown
	} from '$lib/analytics';
	import { supabase } from '$lib/supabase';
	import { canUseGoogleOAuth, getStableOAuthCallbackUrl } from '$lib/auth-redirect';
	import { readDiaryDraft } from '$lib/diary-draft';
	import type { ActionData } from './$types';

	let tempEntryPreview = $state<{ title?: string; content?: string } | null>(null);
	let showPreview = $state(false);
	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
	let oauthLoading = $state(false);
	let oauthError = $state('');
	let googleOAuthAvailable = $state(false);

	onMount(() => {
		googleOAuthAvailable = canUseGoogleOAuth(window.location.origin);

		// Utkastet läses via den kanoniska dagboksnyckeln, med den äldre nyckeln
		// som fallback. Tidigare lästes bara den äldre, vilket gjorde att anonyma
		// dagboksutkast aldrig syntes här.
		const storedDraft = readDiaryDraft();
		if (storedDraft) {
			tempEntryPreview = { content: storedDraft };
			showPreview = true;
		}

		// Track events
		trackRegisterPageView(tempEntryPreview !== null);
		if (showPreview) {
			trackTempEntryPreviewShown();
		}
	});

	async function continueWithGoogle() {
		oauthError = '';
		if (!googleOAuthAvailable) {
			oauthError = 'Google-inloggning är tillgänglig på den publika MittPsyke-sidan.';
			return;
		}
		oauthLoading = true;
		trackSignUpStarted();

		const { error } = await supabase.auth.signInWithOAuth({
			provider: 'google',
			options: {
				redirectTo: getStableOAuthCallbackUrl('/dashboard')
			}
		});

		if (error) {
			oauthError = 'Det gick inte att starta Google-inloggningen. Försök igen om en liten stund.';
			oauthLoading = false;
			clearPendingAuthFunnel();
		}
	}
</script>

<SEO canonical="https://mittpsyke.se/register" />

<svelte:head>
	<title>Skapa konto | MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<main class="container max-w-sm py-12">
	<h1 class="text-2xl font-bold mb-3">
		{showPreview ? 'Spara och fortsätt där du var' : 'Skapa konto för att spara och följa över tid'}
	</h1>
	<p class="text-sm opacity-70 mb-6">
		Konto är valfritt, men gör det lättare att spara historik, följa ditt mående och komma tillbaka i din egen takt.
	</p>

	{#if showPreview && tempEntryPreview}
		<div class="mb-6 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700/40 p-4">
			<p class="text-sm font-medium mb-2">Du har redan börjat skriva</p>
			<p class="text-sm opacity-80 mb-2 line-clamp-3">{tempEntryPreview.content || 'Tomt utkast'}</p>
			<p class="text-xs opacity-60">Skapa konto så finns texten kvar när du fortsätter.</p>
		</div>
	{/if}

	<form
		method="POST"
		novalidate
		use:enhance={() => {
			loading = true;
			trackSignUpStarted();
			return async ({ result, update }) => {
				loading = false;
				if (result.type === 'failure' || result.type === 'error') {
					clearPendingAuthFunnel();
				}
				// Kontot skapades med ett anonymt utkast i bagaget. Bara händelsen
				// skickas — aldrig texten.
				if (result.type === 'redirect' && showPreview) {
					trackAccountCreatedAfterEntry();
				}
				await update();
			};
		}}
		class="space-y-4"
	>
		<label class="block text-sm" for="register-email">E-postadress</label>
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
			{loading ? 'Skapar konto...' : 'Skapa konto och fortsätt'}
		</button>

		<div class="flex items-center gap-3 py-1" aria-hidden="true">
			<div class="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
			<span class="text-xs uppercase tracking-[0.18em] opacity-50">eller</span>
			<div class="h-px flex-1 bg-black/10 dark:bg-white/10"></div>
		</div>

		<button
			type="button"
			disabled={loading || oauthLoading || !googleOAuthAvailable}
			aria-busy={oauthLoading}
			onclick={continueWithGoogle}
			class="w-full px-5 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 bg-white dark:bg-white/5 font-medium disabled:opacity-60 transition-opacity"
		>
			{oauthLoading ? 'Öppnar Google...' : 'Fortsätt med Google'}
		</button>

		{#if !googleOAuthAvailable}
			<p class="text-sm opacity-70">
				Öppna den publika MittPsyke-sidan för att fortsätta med Google:
				<a href="https://www.mittpsyke.se/register" class="underline">gå till registreringen</a>.
			</p>
		{/if}

		{#if oauthError}
			<p class="text-red-500 text-sm" role="alert">{oauthError}</p>
		{/if}
	</form>

	<p class="text-center text-sm mt-4 opacity-70">
		Har du redan konto? <a href="/login" class="underline">Logga in</a>
	</p>
	<p class="text-center text-xs mt-3 opacity-60">
		Läs hur integritet och data hanteras i <a href="/integritet" class="underline">integritetspolicyn</a>.
	</p>
</main>
