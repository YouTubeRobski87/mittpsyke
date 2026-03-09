<script lang="ts">
	import { goto } from '$app/navigation';
	import { supabase } from '$lib/supabase';
	import type { DeleteAccountErrorResponse, DeleteAccountSuccessResponse } from '$lib/types';

	let loading = $state(true);

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

	// Account deletion
	let deleteConfirm = $state('');
	let deleteLoading = $state(false);
	let deleteMessage = $state('');
	let deleteMessageType = $state<'success' | 'error'>('success');

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

			if (!alive) return;

			// Load display name from user metadata
			displayName = session.user.user_metadata?.display_name ?? '';
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

		// Save to Supabase user metadata (no extra table needed)
		const { error } = await supabase.auth.updateUser({
			data: { display_name: trimmed }
		});

		nameSaving = false;

		if (error) {
			nameMessage = 'N�got gick fel. F�rs�k igen.';
			nameMessageType = 'error';
		} else {
			nameMessage = 'Sparat!';
			nameMessageType = 'success';
		}
	}

	async function savePassword() {
		passwordMessage = '';

		if (newPassword.length < 6) {
			passwordMessage = 'L�senordet m�ste vara minst 6 tecken.';
			passwordMessageType = 'error';
			return;
		}

		if (newPassword !== confirmPassword) {
			passwordMessage = 'L�senorden matchar inte.';
			passwordMessageType = 'error';
			return;
		}

		passwordSaving = true;

		const { error } = await supabase.auth.updateUser({ password: newPassword });

		passwordSaving = false;

		if (error) {
			passwordMessage = 'Kunde inte uppdatera l�senordet. F�rs�k igen.';
			passwordMessageType = 'error';
		} else {
			passwordMessage = 'L�senordet har uppdaterats!';
			passwordMessageType = 'success';
			newPassword = '';
			confirmPassword = '';
		}
	}

	async function deleteAccount() {
		deleteMessage = '';

		const normalized = deleteConfirm.trim().toLowerCase();
		if (normalized !== 'radera') {
			deleteMessage = 'Skriv RADERA i f�ltet f�r att bekr�fta.';
			deleteMessageType = 'error';
			return;
		}

		deleteLoading = true;

		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) {
			deleteLoading = false;
			goto('/login');
			return;
		}

		let response: Response | null = null;

		try {
			response = await fetch('/api/account/delete', {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${session.access_token}`
				}
			});
		} catch {
			deleteLoading = false;
			deleteMessage = 'Kunde inte n� servern. F�rs�k igen.';
			deleteMessageType = 'error';
			return;
		}

		let payload: DeleteAccountSuccessResponse | DeleteAccountErrorResponse | null = null;
		try {
			payload = await response.json();
		} catch {
			payload = null;
		}

		deleteLoading = false;

		if (!response || !response.ok || !payload || payload.success !== true) {
			const serverMessage =
				payload && 'error' in payload && typeof payload.error === 'string'
					? payload.error
					: 'Kunde inte radera kontot.';
			deleteMessage = serverMessage;
			deleteMessageType = 'error';
			return;
		}

		deleteMessage = 'Ditt konto har raderats. Du loggas ut...';
		deleteMessageType = 'success';
		deleteConfirm = '';

		await supabase.auth.signOut();
		setTimeout(() => {
			window.location.href = '/';
		}, 1200);
	}
</script>

<svelte:head>
	<title>Kontoinst�llningar - MittPsyke</title>
</svelte:head>

<main class="settings-page container">
	{#if loading}
		<p class="loading-copy">Laddar inst�llningar...</p>
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
			<h2>Byt l�senord</h2>

			<label class="field-label" for="new-password">Nytt l�senord</label>
			<input
				id="new-password"
				type="password"
				bind:value={newPassword}
				placeholder="Minst 6 tecken"
				class="text-input"
				autocomplete="new-password"
			/>

			<label class="field-label" for="confirm-password">Bekr�fta l�senord</label>
			<input
				id="confirm-password"
				type="password"
				bind:value={confirmPassword}
				placeholder="Upprepa l�senordet"
				class="text-input"
				autocomplete="new-password"
			/>

			<button class="save-btn" onclick={savePassword} disabled={passwordSaving}>
				{passwordSaving ? 'Sparar...' : 'Byt l�senord'}
			</button>

			{#if passwordMessage}
				<p class="feedback {passwordMessageType}">{passwordMessage}</p>
			{/if}
		</section>

		<section class="section-block">
			<h2>Mejlutskick</h2>
			<p class="field-hint">Hantera avregistrering och stoppa framtida utskick.</p>
			<a class="save-btn link-btn" href="/avregistrera">Hantera avregistrering</a>
		</section>

		<!-- Delete Account Section -->
		<section id="radera-konto" class="section-block danger-zone">
			<h2>Radera konto</h2>
			<p class="field-hint danger-copy">
				Detta raderar din dagbok, chatthistorik och profil permanent. �tg�rden g�r inte att �ngra.
			</p>

			<label class="field-label" for="delete-confirm">
				Skriv <span class="confirm-token">RADERA</span> f�r att bekr�fta
			</label>
			<input
				id="delete-confirm"
				type="text"
				class="text-input"
				bind:value={deleteConfirm}
				placeholder="RADERA"
				autocomplete="off"
			/>

			<button
				class="danger-btn"
				onclick={deleteAccount}
				disabled={deleteLoading || deleteConfirm.trim().length === 0}
			>
				{deleteLoading ? 'Raderar...' : 'Radera mitt konto'}
			</button>

			{#if deleteMessage}
				<p class="feedback {deleteMessageType}">{deleteMessage}</p>
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

	.dashboard-tabs {
		display: flex;
		gap: 0.35rem;
		border-radius: var(--radius-card);
		background: #f5f3ef;
		padding: 0.3rem;
	}

	:global(.dark) .dashboard-tabs {
		background: rgba(255, 255, 255, 0.04);
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
		color: #2f2a24;
		opacity: 0.55;
		transition: background-color 160ms ease, opacity 160ms ease;
	}

	.tab:hover {
		opacity: 0.8;
	}

	.tab.active {
		background: rgba(255, 255, 255, 0.7);
		opacity: 1;
	}

	:global(.dark) .tab {
		color: #e8e4de;
	}

	:global(.dark) .tab.active {
		background: rgba(255, 255, 255, 0.08);
	}

	.section-block {
		border-radius: var(--radius-card);
		background: #fcfbf9;
		padding: 1.05rem;
	}

	:global(.dark) .section-block {
		background: rgba(255, 255, 255, 0.04);
	}

	.section-block h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		color: #2f2a24;
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
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.6);
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.95rem;
		letter-spacing: -0.005em;
		color: #2f2a24;
		outline: none;
		transition: border-color 160ms ease;
	}

	.text-input:focus {
		border-color: var(--primary, #0f766e);
	}

	:global(.dark) .text-input {
		border-color: rgba(255, 255, 255, 0.12);
		background: rgba(255, 255, 255, 0.06);
		color: #f0ede8;
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
		border: 1px solid rgba(0, 0, 0, 0.1);
		background: #e5f1ec;
		color: #2e2a24;
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
		background: #dbe9e3;
	}

	.save-btn:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.link-btn {
		text-decoration: none;
	}

	:global(.dark) .save-btn {
		background: rgba(15, 118, 110, 0.18);
		border-color: rgba(255, 255, 255, 0.1);
		color: #e8e4de;
	}

	:global(.dark) .save-btn:hover:not(:disabled) {
		background: rgba(15, 118, 110, 0.28);
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

	
	.danger-zone {
		border: 1px solid rgba(185, 28, 28, 0.18);
		background: #fff6f5;
	}

	:global(.dark) .danger-zone {
		background: rgba(185, 28, 28, 0.08);
		border-color: rgba(248, 113, 113, 0.4);
	}

	.danger-copy {
		color: #9b1c1c;
	}

	.confirm-token {
		font-weight: 600;
		color: #b91c1c;
	}

	.danger-zone .text-input {
		border-color: rgba(185, 28, 28, 0.25);
	}

	:global(.dark) .danger-zone .text-input {
		border-color: rgba(248, 113, 113, 0.35);
	}

	.danger-btn {
		background: #b91c1c;
		color: #fff;
		border-color: transparent;
		margin-top: 0.8rem;
	}

	.danger-btn:hover:not(:disabled) {
		background: #991b1b;
	}

	.danger-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	:global(.dark) .danger-btn {
		background: rgba(248, 113, 113, 0.25);
		color: #fee2e2;
	}

	:global(.dark) .danger-btn:hover:not(:disabled) {
		background: rgba(248, 113, 113, 0.35);
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
</style>












