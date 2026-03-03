<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';

	let loading = $state(true);
	let userId = $state('');

	// Display name
	let displayName = $state('');
	let nameSaving = $state(false);
	let nameMessage = $state('');
	let nameMessageType = $state<'success' | 'error'>('success');

	// Password
	let newPassword = $state('');
	let confirmPassword = $state('');
	let passwordSaving = $state(false);
	let passwordMessage = $state('');
	let passwordMessageType = $state<'success' | 'error'>('success');

	$effect(() => {
		let alive = true;

		async function init() {
			const {
				data: { session }
			} = await supabase.auth.getSession();

			if (!session) {
				goto('/login');
				return;
			}

			userId = session.user.id;

			const { data: profile } = await supabase
				.from('profiles')
				.select('display_name')
				.eq('id', session.user.id)
				.maybeSingle();

			if (!alive) return;

			displayName = typeof profile?.display_name === 'string' ? profile.display_name.trim() : '';
			loading = false;
		}

		void init();

		return () => {
			alive = false;
		};
	});

	async function saveDisplayName() {
		nameMessage = '';
		const trimmed = displayName.trim();

		nameSaving = true;

		const { error } = await supabase
			.from('profiles')
			.upsert({ id: userId, display_name: trimmed }, { onConflict: 'id' });

		nameSaving = false;

		if (error) {
			nameMessage = 'Något gick fel. Försök igen.';
			nameMessageType = 'error';
		} else {
			nameMessage = 'Sparat!';
			nameMessageType = 'success';
		}
	}

	async function savePassword() {
		passwordMessage = '';

		if (newPassword.length < 6) {
			passwordMessage = 'Lösenordet måste vara minst 6 tecken.';
			passwordMessageType = 'error';
			return;
		}

		if (newPassword !== confirmPassword) {
			passwordMessage = 'Lösenorden matchar inte.';
			passwordMessageType = 'error';
			return;
		}

		passwordSaving = true;

		const { error } = await supabase.auth.updateUser({ password: newPassword });

		passwordSaving = false;

		if (error) {
			passwordMessage = 'Kunde inte uppdatera lösenordet. Försök igen.';
			passwordMessageType = 'error';
		} else {
			passwordMessage = 'Lösenordet har uppdaterats!';
			passwordMessageType = 'success';
			newPassword = '';
			confirmPassword = '';
		}
	}
</script>

<svelte:head>
	<title>Kontoinställningar - MittPsyke</title>
</svelte:head>

<main class="settings-page container">
	{#if loading}
		<p class="loading-copy">Laddar inställningar...</p>
	{:else}
		<!-- Tab Navigation -->
		<nav class="dashboard-tabs" aria-label="Portalnavigering">
			<a href="/dashboard" class="tab">Min portal</a>
			<a href="/dashboard/installningar" class="tab active" aria-current="page">Kontoinst&auml;llningar</a>
		</nav>

		<!-- Display Name Section -->
		<section class="section-block">
			<h2>Tilltalsnamn</h2>
			<p class="field-hint">Vad vill du bli kallad?</p>

			<div class="field-row">
				<input
					type="text"
					bind:value={displayName}
					placeholder="Ditt tilltalsnamn"
					class="text-input"
					maxlength="80"
				/>
				<button class="save-btn" onclick={saveDisplayName} disabled={nameSaving}>
					{nameSaving ? 'Sparar...' : 'Spara'}
				</button>
			</div>

			{#if nameMessage}
				<p class="feedback {nameMessageType}">{nameMessage}</p>
			{/if}
		</section>

		<!-- Password Section -->
		<section class="section-block">
			<h2>Byt lösenord</h2>

			<label class="field-label" for="new-password">Nytt lösenord</label>
			<input
				id="new-password"
				type="password"
				bind:value={newPassword}
				placeholder="Minst 6 tecken"
				class="text-input"
				autocomplete="new-password"
			/>

			<label class="field-label" for="confirm-password">Bekräfta lösenord</label>
			<input
				id="confirm-password"
				type="password"
				bind:value={confirmPassword}
				placeholder="Upprepa lösenordet"
				class="text-input"
				autocomplete="new-password"
			/>

			<button class="save-btn" onclick={savePassword} disabled={passwordSaving}>
				{passwordSaving ? 'Sparar...' : 'Byt lösenord'}
			</button>

			{#if passwordMessage}
				<p class="feedback {passwordMessageType}">{passwordMessage}</p>
			{/if}
		</section>
	{/if}
</main>

<style>
	.settings-page {
		max-width: 840px;
		padding-top: 1.1rem;
		padding-bottom: 2.75rem;
		display: grid;
		gap: 1rem;
	}

	.loading-copy {
		font-family: var(--font-body);
		padding: 1.6rem 0;
		opacity: 0.7;
	}

	/* Tab Navigation */
	.dashboard-tabs {
		display: flex;
		gap: 0.35rem;
		border-radius: var(--radius-card);
		background: var(--bg-card);
		padding: 0.3rem;
	}

	:global(.dark) .dashboard-tabs {
		background: var(--bg-card);
	}

	.tab {
		flex: 1;
		text-align: center;
		padding: 0.55rem 0.8rem;
		border-radius: var(--radius-input);
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 0.9rem;
		letter-spacing: -0.01em;
		color: var(--text-main);
		opacity: 0.55;
		transition: background-color 160ms ease, opacity 160ms ease;
	}

	.tab:hover {
		opacity: 0.8;
	}

	.tab.active {
		background: rgba(76, 122, 150, 0.24);
		opacity: 1;
	}

	:global(.dark) .tab {
		color: #e8e4de;
	}

	:global(.dark) .tab.active {
		background: rgba(63, 103, 127, 0.4);
	}

	.section-block {
		border-radius: var(--radius-card);
		background: var(--bg-card);
		padding: 1.05rem;
	}

	:global(.dark) .section-block {
		background: var(--bg-card);
	}

	.section-block h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		color: var(--text-main);
		font-size: 1.03rem;
		letter-spacing: -0.02em;
		margin: 0 0 0.25rem;
	}

	:global(.dark) .section-block h2 {
		color: #e8e4de;
	}

	.field-hint {
		margin: 0 0 0.7rem;
		font-family: var(--font-body);
		font-size: 0.88rem;
		opacity: 0.65;
	}

	.field-label {
		display: block;
		font-family: var(--font-body);
		font-size: 0.88rem;
		opacity: 0.75;
		margin: 0.7rem 0 0.3rem;
	}

	.field-label:first-of-type {
		margin-top: 0.25rem;
	}

	.text-input {
		display: block;
		width: 100%;
		padding: 0.65rem 0.75rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(255, 255, 255, 0.05);
		background: var(--bg-card);
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.95rem;
		letter-spacing: -0.005em;
		color: var(--text-main);
		outline: none;
		transition: border-color 160ms ease;
	}

	.text-input:focus {
		border-color: var(--primary, #0f766e);
	}

	:global(.dark) .text-input {
		border-color: rgba(255, 255, 255, 0.05);
		background: var(--bg-card);
		color: var(--text-main);
	}

	:global(.dark) .text-input:focus {
		border-color: var(--primary, #0f766e);
	}

	.field-row {
		display: flex;
		gap: 0.6rem;
		align-items: stretch;
	}

	.field-row .text-input {
		flex: 1;
	}

	.save-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.65rem 1.25rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(255, 255, 255, 0.05);
		background: var(--accent);
		color: var(--text-main);
		font-family: var(--font-heading);
		font-weight: 500;
		font-size: 0.92rem;
		letter-spacing: -0.005em;
		cursor: pointer;
		transition: background-color 160ms ease, opacity 160ms ease;
		margin-top: 0.7rem;
		white-space: nowrap;
	}

	.field-row .save-btn {
		margin-top: 0;
	}

	.save-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.save-btn:disabled {
		opacity: 0.55;
		cursor: default;
	}

	:global(.dark) .save-btn {
		background: var(--accent);
		border-color: rgba(255, 255, 255, 0.05);
		color: var(--text-main);
	}

	:global(.dark) .save-btn:hover:not(:disabled) {
		background: var(--accent-hover);
	}

	.feedback {
		margin: 0.55rem 0 0;
		font-family: var(--font-body);
		font-size: 0.86rem;
	}

	.feedback.success {
		color: #0f766e;
	}

	.feedback.error {
		color: #b91c1c;
	}

	:global(.dark) .feedback.success {
		color: #5eead4;
	}

	:global(.dark) .feedback.error {
		color: #fca5a5;
	}

	@media (min-width: 740px) {
		.settings-page {
			gap: 1.2rem;
			padding-top: 1.5rem;
		}

		.section-block {
			padding: 1.35rem;
		}
	}

	/* Unified dark therapeutic theme */
	.dashboard-tabs,
	.section-block,
	.text-input,
	.save-btn,
	.tab.active {
		background: var(--bg-card) !important;
		border: 1px solid rgba(255, 255, 255, 0.05);
		box-shadow: var(--shadow-elevated);
	}

	.save-btn {
		background: var(--accent) !important;
		color: var(--text-main);
	}

	.save-btn:hover:not(:disabled) {
		background: var(--accent-hover) !important;
	}

	h1,
	h2,
	h3 {
		color: var(--text-main) !important;
	}

	p,
	span,
	label {
		color: var(--text-muted) !important;
	}
</style>
