<script lang="ts">
	import { onMount } from 'svelte';
	import { trackRegisterView } from '$lib/analytics';
	import {
		ANALYTICS_CONSENT_EVENT,
		hasAnalyticsConsent
	} from '$lib/consent';
	import type { ActionData } from './$types';
	let { form }: { form: ActionData } = $props();

	let registerViewTracked = false;

	function maybeTrackRegisterView() {
		if (registerViewTracked || !hasAnalyticsConsent()) return;

		trackRegisterView();
		registerViewTracked = true;
	}

	let tempEntryText = $state('');

	onMount(() => {
		maybeTrackRegisterView();
		tempEntryText = localStorage.getItem('mittpsyke_temp_entry') ?? '';

		const handleConsentChange = () => {
			maybeTrackRegisterView();
		};

		window.addEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);

		return () => {
			window.removeEventListener(ANALYTICS_CONSENT_EVENT, handleConsentChange);
		};
	});
</script>

<svelte:head>
	<title>Registrera - MittPsyke</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<section class="container max-w-sm py-16">
	<!-- Benefits section -->
	<div class="text-center mb-8">
		<h1 class="text-2xl font-bold mb-2">Skapa ditt konto</h1>
		<p class="opacity-70 text-sm leading-relaxed">
			Ett konto ger dig tillgång till verktyg som hjälper dig följa ditt mående över tid.
		</p>
	</div>

	{#if tempEntryText}
	<div class="temp-entry-card">
		<div class="temp-entry-card-header">
			<span class="temp-entry-icon">📓</span>
			<h2 class="temp-entry-title">Ditt första dagboksinlägg</h2>
		</div>
		<blockquote class="temp-entry-preview">
			{tempEntryText.length > 180 ? tempEntryText.slice(0, 180) + '…' : tempEntryText}
		</blockquote>
		<p class="temp-entry-cta">Skapa konto för att spara din resa.</p>
	</div>
	{/if}

	<div class="grid grid-cols-2 gap-3 mb-8">
		<div class="rounded-[var(--radius-card)] border border-black/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] p-3 text-center">
			<span class="text-xl block mb-1">📊</span>
			<p class="text-xs leading-snug opacity-80">Följ ditt mående med visuell statistik</p>
		</div>
		<div class="rounded-[var(--radius-card)] border border-black/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] p-3 text-center">
			<span class="text-xl block mb-1">🔥</span>
			<p class="text-xs leading-snug opacity-80">Bygg streaks och se din resa</p>
		</div>
		<div class="rounded-[var(--radius-card)] border border-black/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] p-3 text-center">
			<span class="text-xl block mb-1">🤖</span>
			<p class="text-xs leading-snug opacity-80">AI-reflektion på dina inlägg</p>
		</div>
		<div class="rounded-[var(--radius-card)] border border-black/8 dark:border-white/8 bg-white/40 dark:bg-white/[0.03] p-3 text-center">
			<span class="text-xl block mb-1">🔒</span>
			<p class="text-xs leading-snug opacity-80">Din data — din kontroll</p>
		</div>
	</div>

	<form method="POST" novalidate class="space-y-4">
		<label class="block text-sm" for="register-email">E-post</label>
		<input
			id="register-email"
			type="email"
			name="email"
			placeholder="E-post"
			autocomplete="email"
			required
			aria-describedby={form?.error ? 'register-form-error register-password-help' : 'register-password-help'}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus-visible:outline-2 focus-visible:outline-[var(--primary)] focus-visible:outline-offset-2 focus:border-[var(--primary)] transition-colors"
		/>
		<label class="block text-sm" for="register-password">Lösenord</label>
		<input
			id="register-password"
			type="password"
			name="password"
			placeholder="Lösenord"
			required
			minlength={6}
			autocomplete="new-password"
			aria-describedby={form?.error ? 'register-form-error register-password-help' : 'register-password-help'}
			class="w-full px-4 py-3 rounded-[var(--radius-input)] border border-black/12 dark:border-white/12
				bg-white dark:bg-white/5 outline-none focus:border-[var(--primary)] transition-colors"
		/>
		<p id="register-password-help" class="text-xs opacity-70">Välj minst 6 tecken.</p>

		{#if form?.error}
			<p id="register-form-error" class="text-red-500 text-sm" role="alert">{form.error}</p>
		{/if}

		<button
			type="submit"
			class="w-full px-5 py-3 rounded-[var(--radius-input)] bg-[var(--primary)] text-white font-medium transition-opacity"
		>
			Registrera
		</button>
	</form>

	<p class="text-center text-xs mt-4 opacity-50">
		Gratis. Inga krav. Du kan ta bort ditt konto när som helst.
	</p>

	<p class="text-center text-sm mt-4 opacity-70">
		Har du redan ett konto? <a href="/login" class="underline">Logga in</a>
	</p>
</section>

<style>
	/* Temp entry card - full preview version */
	.temp-entry-card {
		background: color-mix(in srgb, var(--primary, #7c6af7) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary, #7c6af7) 22%, transparent);
		border-radius: 0.875rem;
		padding: 1.25rem;
		margin-bottom: 1.5rem;
	}

	.temp-entry-card-header {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
	}

	.temp-entry-icon {
		font-size: 1.25rem;
		flex-shrink: 0;
	}

	.temp-entry-title {
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0;
		opacity: 0.85;
	}

	.temp-entry-preview {
		background: rgba(0, 0, 0, 0.04);
		border-left: 3px solid var(--primary, #7c6af7);
		border-radius: 0 6px 6px 0;
		padding: 0.75rem 1rem;
		margin: 0 0 0.75rem;
		font-size: 0.875rem;
		line-height: 1.6;
		font-style: italic;
		color: inherit;
		opacity: 0.8;
		white-space: pre-wrap;
		word-break: break-word;
	}

	:global(html.dark) .temp-entry-preview {
		background: rgba(255, 255, 255, 0.05);
	}

	.temp-entry-cta {
		font-size: 0.82rem;
		font-weight: 500;
		opacity: 0.65;
		margin: 0;
		text-align: center;
	}
</style>
