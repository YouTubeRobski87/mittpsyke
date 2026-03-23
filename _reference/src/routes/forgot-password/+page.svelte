<script lang="ts">
	import { supabase } from '$lib/supabase/client';
	import LegalFooter from '$lib/components/LegalFooter.svelte';
	import IconArrowRight from '$lib/assets/icons/IconArrowRight.svelte';

	let email = $state('');
	let error = $state('');
	let success = $state(false);
	let loading = $state(false);

	async function handleReset(e: SubmitEvent) {
		e.preventDefault();
		error = '';
		loading = true;

		const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${window.location.origin}/auth/callback`
		});

		if (authError) {
			error = authError.message;
			loading = false;
			return;
		}

		success = true;
		loading = false;
	}
</script>

<main class="auth-page">
	<div class="auth-container">
		<header class="auth-header">
			<h1 class="auth-title">Glömt lösenordet?</h1>
			<p class="auth-subtitle">Ange din e-postadress så skickar vi en återställningslänk</p>
		</header>

		{#if success}
			<div class="auth-success">
				<p class="success-title">Kolla din inkorg!</p>
				<p class="success-text">Om det finns ett konto kopplat till <strong>{email}</strong> har vi skickat en länk för att återställa lösenordet.</p>
			</div>
		{:else}
			<form class="auth-form" onsubmit={handleReset}>
				{#if error}
					<div class="auth-error">{error}</div>
				{/if}

				<div class="field-group">
					<label class="field-label" for="email">E-postadress</label>
					<input
						id="email"
						type="email"
						bind:value={email}
						placeholder="din@email.se"
						required
						autocomplete="email"
					/>
				</div>

				<button class="btn btn-primary btn-large auth-submit" type="submit" disabled={loading}>
					{loading ? 'Skickar återställningslänk...' : 'Återställ mitt lösenord'} <IconArrowRight size={18} />
				</button>
			</form>
		{/if}

		<nav class="auth-links">
			<a href="/login">Tillbaka till inloggning</a>
		</nav>
	</div>
	<LegalFooter />
</main>

<style>
	.auth-page {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 1.25rem;
		padding-bottom: 0;
		overflow: hidden;
	}

	.auth-container {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		max-width: 400px;
		width: 100%;
	}

	.auth-header {
		text-align: center;
		margin-bottom: 1.25rem;
	}

	.auth-title {
		font-family: var(--font-primary);
		font-size: var(--text-3xl);
		font-weight: var(--weight-medium);
		font-stretch: 115%;
		letter-spacing: var(--tracking-tighter);
		line-height: var(--leading-tight);
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.auth-subtitle {
		font-family: var(--font-primary);
		font-size: var(--text-base);
		color: var(--color-text-muted);
		font-weight: var(--weight-book);
		letter-spacing: var(--tracking-wide);
	}

	.auth-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		width: 100%;
	}

	.field-group {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.field-label {
		font-family: var(--font-primary);
		font-size: var(--text-xs);
		font-weight: var(--weight-semibold);
		text-transform: uppercase;
		letter-spacing: var(--tracking-widest);
		color: var(--color-text-muted);
	}

	input {
		height: 2.75rem;
		padding: 0 0.875rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg);
		color: var(--color-text);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-book);
		transition: border-color 0.15s ease, box-shadow 0.15s ease;
	}

	input:focus {
		outline: none;
		border-color: var(--color-accent);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-accent) 15%, transparent);
	}

	input::placeholder {
		color: var(--color-text-muted);
		opacity: 0.5;
	}

	.auth-submit {
		margin-top: 0.25rem;
		width: 100%;
		justify-content: center;
	}

	.auth-links {
		display: flex;
		gap: 1.5rem;
		margin-top: 1.25rem;
	}

	.auth-links a {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-accent);
		font-weight: var(--weight-medium);
		text-decoration: none;
		letter-spacing: var(--tracking-normal);
		transition: opacity 0.15s ease;
	}

	.auth-links a:hover {
		opacity: 0.75;
	}

	.auth-error {
		padding: 0.75rem 1rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-accent) 10%, transparent);
		color: var(--color-accent);
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		font-weight: var(--weight-medium);
	}

	.auth-success {
		text-align: center;
		padding: 1.5rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		width: 100%;
	}

	.success-title {
		font-family: var(--font-primary);
		font-size: var(--text-lg);
		font-weight: var(--weight-semibold);
		color: var(--color-text);
		margin-bottom: 0.5rem;
	}

	.success-text {
		font-family: var(--font-primary);
		font-size: var(--text-sm);
		color: var(--color-text-muted);
		font-weight: var(--weight-book);
		line-height: var(--leading-relaxed);
	}

	.success-text strong {
		color: var(--color-text);
		font-weight: var(--weight-semibold);
	}
</style>
