<script lang="ts">
	import { goto } from '$app/navigation';
	import PortalSubnav from '/components/PortalSubnav.svelte';
	import { supabase } from '$lib/supabase';
	import type { DeleteAccountErrorResponse, DeleteAccountSuccessResponse } from '$lib/types';
	import { THEME_STORAGE_KEY } from '$lib/theme';

	let loading = $state(true);

	// Display name
	let displayName = $state('');
	let birthday = $state('');
	let nameSaving = $state(false);
	let nameMessage = $state('');

	// Personalization
	let profileTheme = $state('neutral');
	let weeklyGoalType = $state('diary_3_week');
	let dashboardWidget = $state('dagbok');
	let prefSaving = $state(false);
	let prefMessage = $state('');
	let prefMessageType = $state<'success' | 'error'>('success');

	const THEMES = [
		{ value: 'neutral',   label: 'Neutral',    color: '#0f766e' },
		{ value: 'salvia',    label: 'Salvia',      color: '#7a9e7e' },
		{ value: 'havsblå',   label: 'Havsblå',    color: '#5b8db8' },
		{ value: 'lavendel',  label: 'Lavendel',   color: '#8b7ab8' },
		{ value: 'sand',      label: 'Sand',        color: '#b8956a' },
		{ value: 'skogsgrön', label: 'Skogsgrön',  color: '#4a7c59' },
	];

	const GOALS = [
		{ value: 'diary_3_week',     label: 'Skriva i dagboken 3 gånger i veckan' },
		{ value: 'mood_daily',       label: 'Checka in mitt humör varje dag' },
		{ value: 'write_when_needed', label: 'Skriva när tankarna blir mycket' },
		{ value: 'calm_moments',     label: 'Skapa en lugn stund för mig själv några gånger i veckan' },
		{ value: 'none',             label: 'Inget mål just nu' },
	];

	const WIDGETS = [
		{ value: 'dagbok', label: 'Dagboken' },
		{ value: 'mood',   label: 'Senaste humör' },
		{ value: 'guide',  label: 'Guider' },
		{ value: 'chat',   label: 'Chatten' },
	];
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

			// Load display name and personalization from user metadata
			const meta = (session.user.user_metadata ?? {}) as Record<string, unknown>;
			displayName = typeof meta.display_name === 'string' ? meta.display_name : '';
			birthday = typeof meta.birthday === 'string' ? meta.birthday : '';
			profileTheme = typeof meta.profile_theme === 'string' ? meta.profile_theme : 'neutral';
			weeklyGoalType = typeof meta.weekly_goal_type === 'string' ? meta.weekly_goal_type : 'diary_3_week';
			dashboardWidget = typeof meta.dashboard_widget === 'string' ? meta.dashboard_widget : 'dagbok';
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
			data: { display_name: trimmed, birthday: birthday.trim() }
		});

		nameSaving = false;

		if (error) {
			nameMessage = 'N\u00e5got gick fel. F\u00f6rs\u00f6k igen.';
			nameMessageType = 'error';
		} else {
			nameMessage = 'Sparat ✓';
			nameMessageType = 'success';
			setTimeout(() => { nameMessage = ''; }, 3000);
		}
	}

	async function savePreferences() {
		prefMessage = '';
		prefSaving = true;

		const { error } = await supabase.auth.updateUser({
			data: {
				profile_theme: profileTheme,
				weekly_goal_type: weeklyGoalType,
				dashboard_widget: dashboardWidget
			}
		});

		prefSaving = false;

		if (error) {
			prefMessage = 'Något gick fel. Försök igen.';
			prefMessageType = 'error';
		} else {
			prefMessage = 'Dina val har sparats ✓';
			prefMessageType = 'success';
			setTimeout(() => { prefMessage = ''; }, 3000);
			// Cache theme locally for instant load on dashboard
			if (typeof localStorage !== 'undefined') {
				localStorage.setItem(THEME_STORAGE_KEY, profileTheme);
				window.dispatchEvent(new CustomEvent('mittpsyke:theme-changed'));
			}
		}
	}

	async function savePassword() {
		passwordMessage = '';

		if (newPassword.length < 6) {
			passwordMessage = 'L\u00f6senordet m\u00e5ste vara minst 6 tecken.';
			passwordMessageType = 'error';
			return;
		}

		if (newPassword !== confirmPassword) {
			passwordMessage = 'L\u00f6senorden matchar inte.';
			passwordMessageType = 'error';
			return;
		}

		passwordSaving = true;

		const { error } = await supabase.auth.updateUser({ password: newPassword });

		passwordSaving = false;

		if (error) {
			passwordMessage = 'Kunde inte uppdatera l\u00f6senordet. F\u00f6rs\u00f6k igen.';
			passwordMessageType = 'error';
		} else {
			passwordMessage = 'L\u00f6senordet har uppdaterats!';
			passwordMessageType = 'success';
			newPassword = '';
			confirmPassword = '';
		}
	}

	async function deleteAccount() {
		deleteMessage = '';

		const normalized = deleteConfirm.trim().toLowerCase();
		if (normalized !== 'radera') {
			deleteMessage = 'Skriv RADERA i f\u00e4ltet f\u00f6r att bekr\u00e4fta.';
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
			deleteMessage = 'Kunde inte n\u00e5 servern. F\u00f6rs\u00f6k igen.';
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
	<title>Kontoinställningar - MittPsyke</title>
</svelte:head>

<main class="settings-page container">
	{#if loading}
		<p class="loading-copy">Laddar inställningar...</p>
	{:else}
		<!-- Tab Navigation -->
		<nav class="dashboard-tabs" aria-label="Portalnavigering">
			<a href="/dashboard" class="tab">Min portal</a>
			<a href="/dashboard/installningar" class="tab active" aria-current="page">Kontoinställningar</a>
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
				<button class="save-btn" onclick={saveDisplayName} aria-label="Spara visningsnamn" disabled={nameSaving}>
					{nameSaving ? 'Sparar...' : 'Spara'}
				</button>
			</div>

			<label class="field-label" for="birthday">Födelsedag</label>
			<input
				id="birthday"
				type="date"
				bind:value={birthday}
				class="text-input"
				max={new Date().toISOString().slice(0, 10)}
			/>
			<p class="field-hint birthday-hint">Används för ditt dagliga horoskop 🔮</p>

			{#if nameMessage}
				<p class="feedback {nameMessageType}">{nameMessage}</p>
			{/if}
		</section>

		<!-- Personalization Section -->
		<section class="section-block">
			<h2>Personalisera portalen</h2>
			<p class="field-hint">Välj tema, mål och vilket kort du vill se på startsidan. Du kan ändra när du vill.</p>

			<!-- Theme picker -->
			<p class="pref-label">Ditt tema</p>
			<div class="theme-row" role="group" aria-label="Välj tema">
				{#each THEMES as t}
					<button
						class="theme-dot {profileTheme === t.value ? 'selected' : ''}"
						style="--dot-color: {t.color};"
						onclick={() => (profileTheme = t.value)}
						aria-label={t.label}
						aria-pressed={profileTheme === t.value}
						title={t.label}
					></button>
				{/each}
				<span class="theme-name">{THEMES.find(t => t.value === profileTheme)?.label ?? ''}</span>
			</div>

			<!-- Goal picker -->
			<p class="pref-label">Ditt veckliga mål</p>
			<div class="option-list" role="radiogroup" aria-label="Välj veckomål">
				{#each GOALS as g}
					<label class="option-row {weeklyGoalType === g.value ? 'selected' : ''}">
						<input
							type="radio"
							name="weeklyGoal"
							value={g.value}
							bind:group={weeklyGoalType}
							class="sr-only"
						/>
						<span class="option-dot"></span>
						<span class="option-text">{g.label}</span>
					</label>
				{/each}
			</div>

			<!-- Widget picker -->
			<p class="pref-label">Ditt valda kort på startsidan</p>
			<div class="option-list widget-row" role="radiogroup" aria-label="Välj widget">
				{#each WIDGETS as w}
					<label class="option-chip {dashboardWidget === w.value ? 'selected' : ''}">
						<input
							type="radio"
							name="dashboardWidget"
							value={w.value}
							bind:group={dashboardWidget}
							class="sr-only"
						/>
						{w.label}
					</label>
				{/each}
			</div>

			<button class="save-btn" onclick={savePreferences} aria-label="Spara personalisering" disabled={prefSaving}>
				{prefSaving ? 'Sparar...' : 'Spara'}
			</button>

			{#if prefMessage}
				<p class="feedback {prefMessageType}">{prefMessage}</p>
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

			<button class="save-btn" onclick={savePassword} aria-label="Spara lösenord" disabled={passwordSaving}>
				{passwordSaving ? 'Sparar...' : 'Byt l\u00f6senord'}
			</button>

			{#if passwordMessage}
				<p class="feedback {passwordMessageType}">{passwordMessage}</p>
			{/if}
		</section>

		<section class="section-block">
			<h2>Mejlutskick</h2>
			<p class="field-hint">Hantera avregistrering och stoppa framtida utskick.</p>
			<a class="save-btn link-btn" href="/avregistrera">Hantera avregistrering</a>
			<p class="field-hint">Läs mer om radering, export och hur uppgifter hanteras i <a href="/integritet">integritetspolicyn</a>.</p>
		</section>

		<!-- Delete Account Section -->
		<section id="radera-konto" class="section-block danger-zone">
			<h2>Radera konto</h2>
			<p class="field-hint danger-copy">
				Detta raderar din dagbok, chatthistorik och profil permanent. Åtgärden går inte att ångra.
			</p>

			<label class="field-label" for="delete-confirm">
				Skriv <span class="confirm-token">RADERA</span> för att bekräfta
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

	.birthday-hint {
		margin: 0.35rem 0 0;
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
		transition: opacity 400ms ease;
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

	
	/* Personalization styles */
	.pref-label {
		font-family: var(--font-body);
		font-size: 0.88rem;
		font-weight: 600;
		opacity: 0.75;
		margin: 1rem 0 0.4rem;
	}

	.theme-row {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		flex-wrap: wrap;
		margin-bottom: 0.25rem;
	}

	.theme-dot {
		width: 2rem;
		height: 2rem;
		border-radius: 50%;
		background: var(--dot-color);
		border: 3px solid transparent;
		cursor: pointer;
		transition: transform 120ms ease, border-color 120ms ease;
		outline: none;
		padding: 0;
	}

	.theme-dot:hover {
		transform: scale(1.12);
	}

	.theme-dot.selected {
		border-color: var(--dot-color);
		box-shadow: 0 0 0 2px white, 0 0 0 4px var(--dot-color);
	}

	:global(.dark) .theme-dot.selected {
		box-shadow: 0 0 0 2px #1a1814, 0 0 0 4px var(--dot-color);
	}

	.theme-name {
		font-family: var(--font-body);
		font-size: 0.84rem;
		opacity: 0.65;
		margin-left: 0.2rem;
	}

	.option-list {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin-bottom: 0.25rem;
	}

	.option-list.widget-row {
		flex-direction: row;
		flex-wrap: wrap;
	}

	.option-row {
		display: flex;
		align-items: center;
		gap: 0.55rem;
		padding: 0.55rem 0.75rem;
		border-radius: var(--radius-input);
		border: 1.5px solid rgba(0, 0, 0, 0.08);
		background: rgba(255, 255, 255, 0.5);
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease;
	}

	.option-row:hover {
		border-color: rgba(15, 118, 110, 0.3);
		background: rgba(15, 118, 110, 0.04);
	}

	.option-row.selected {
		border-color: #0f766e;
		background: rgba(15, 118, 110, 0.07);
	}

	:global(.dark) .option-row {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
	}

	:global(.dark) .option-row.selected {
		border-color: #5eead4;
		background: rgba(94, 234, 212, 0.08);
	}

	.option-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		border: 2px solid #0f766e;
		flex-shrink: 0;
		transition: background 120ms ease;
	}

	.option-row.selected .option-dot {
		background: #0f766e;
	}

	.option-text {
		font-family: var(--font-body);
		font-size: 0.9rem;
	}

	.option-chip {
		padding: 0.4rem 0.85rem;
		border-radius: 2rem;
		border: 1.5px solid rgba(0, 0, 0, 0.1);
		background: rgba(255, 255, 255, 0.5);
		font-family: var(--font-body);
		font-size: 0.88rem;
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease;
	}

	.option-chip:hover {
		border-color: rgba(15, 118, 110, 0.3);
	}

	.option-chip.selected {
		border-color: #0f766e;
		background: rgba(15, 118, 110, 0.09);
		font-weight: 500;
	}

	:global(.dark) .option-chip {
		border-color: rgba(255, 255, 255, 0.1);
		background: rgba(255, 255, 255, 0.04);
		color: #e8e4de;
	}

	:global(.dark) .option-chip.selected {
		border-color: #5eead4;
		background: rgba(94, 234, 212, 0.08);
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		border: 0;
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
















