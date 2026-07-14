<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { goto } from '$app/navigation';
	import PortalSubnav from '$lib/components/PortalSubnav.svelte';
	import CompanionAvatar from '$lib/components/CompanionAvatar.svelte';
	import { supabase } from '$lib/supabase';
	import {
		getSensitiveConsentRecord,
		revokeSensitiveConsent,
		type HealthConsentRecord
	} from '$lib/consent';
	import type {
		DeleteAccountErrorResponse,
		DeleteAccountSuccessResponse,
		SmsPreferenceErrorResponse,
		SmsPreferenceSuccessResponse
	} from '$lib/types';
	import { THEME_STORAGE_KEY } from '$lib/theme';
	import {
	getProgressCompanionAnimal,
	PROGRESS_COMPANION_ANIMALS,
	readProgressCompanionFromMetadata,
		type ProgressCompanionSelection
	} from '$lib/progressCompanion';

	let loading = $state(true);

	// Display name
	let displayName = $state('');
	let birthday = $state('');
	let nameSaving = $state(false);
	let nameMessage = $state('');

	// Personalization
	let progressCompanion = $state<ProgressCompanionSelection | null>(null);
	let companionSaving = $state(false);
	let companionMessage = $state('');
	let companionMessageType = $state<'success' | 'error'>('success');
	let profileTheme = $state('neutral');
	let weeklyGoalType = $state('diary_3_week');
	let dashboardWidget = $state('dagbok');
	let prefSaving = $state(false);
	let prefMessage = $state('');
	let prefMessageType = $state<'success' | 'error'>('success');

	// SMS updates
	let smsPhoneNumber = $state('');
	let smsOptIn = $state(false);
	let smsSaving = $state(false);
	let smsMessage = $state('');
	let smsMessageType = $state<'success' | 'error'>('success');
	let healthConsentRecord = $state<HealthConsentRecord | null>(null);
	let consentSaving = $state(false);
	let consentMessage = $state('');
	let consentMessageType = $state<'success' | 'error'>('success');

	const THEMES = [
		{ value: 'neutral',   label: 'Neutral',    color: '#436e8f' },
		{ value: 'salvia',    label: 'Salvia',      color: '#5f7fa5' },
		{ value: 'havsblå',   label: 'Havsblå',    color: '#5b8db8' },
		{ value: 'lavendel',  label: 'Lavendel',   color: '#8b7ab8' },
		{ value: 'sand',      label: 'Sand',        color: '#b8956a' },
		{ value: 'skogsgrön', label: 'Skogsgrön',  color: '#395d84' },
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
	const selectedCompanion = $derived(getProgressCompanionAnimal(progressCompanion));
	const companionChoices = PROGRESS_COMPANION_ANIMALS.filter(
		(companion) => companion.id === 'fox' || companion.id === 'bear'
	);

	function normalizeSwedishMobileNumber(value: string): string | null {
		const compact = value.trim().replace(/[\s().-]/g, '');
		if (!compact) return null;

		const international = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
		if (/^07\d{8}$/.test(international)) return `+46${international.slice(1)}`;
		if (/^\+467\d{8}$/.test(international)) return international;

		return null;
	}

	function applySmsPreference(payload: SmsPreferenceSuccessResponse['preference']) {
		smsPhoneNumber = payload.phone_number ?? '';
		smsOptIn = payload.sms_opt_in;
	}

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
			progressCompanion = readProgressCompanionFromMetadata(meta) ?? { id: 'fox' };
			profileTheme = typeof meta.profile_theme === 'string' ? meta.profile_theme : 'neutral';
			weeklyGoalType = typeof meta.weekly_goal_type === 'string' ? meta.weekly_goal_type : 'diary_3_week';
			dashboardWidget = typeof meta.dashboard_widget === 'string' ? meta.dashboard_widget : 'dagbok';
			healthConsentRecord = getSensitiveConsentRecord(meta);
			await loadSmsPreference();
			loading = false;
		}

		void init();

		return () => {
			alive = false;
		};
	});

	async function loadSmsPreference() {
		smsMessage = '';

		try {
			const response = await fetch('/api/account/sms-preferences');
			const payload = (await response.json()) as SmsPreferenceSuccessResponse | SmsPreferenceErrorResponse;

			if (!response.ok || payload.success !== true) {
				smsMessage = 'Kunde inte hämta SMS-inställningen just nu.';
				smsMessageType = 'error';
				return;
			}

			applySmsPreference(payload.preference);
		} catch {
			smsMessage = 'Kunde inte hämta SMS-inställningen just nu.';
			smsMessageType = 'error';
		}
	}

	async function saveSmsPreference(nextOptIn = smsOptIn) {
		smsMessage = '';

		const normalizedPhone = normalizeSwedishMobileNumber(smsPhoneNumber);
		if (nextOptIn && !normalizedPhone) {
			smsMessage = 'Ange ett svenskt mobilnummer, till exempel 0701234567.';
			smsMessageType = 'error';
			return;
		}

		smsSaving = true;

		try {
			const response = await fetch('/api/account/sms-preferences', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phoneNumber: nextOptIn ? normalizedPhone : '',
					smsOptIn: nextOptIn
				})
			});
			const payload = (await response.json()) as SmsPreferenceSuccessResponse | SmsPreferenceErrorResponse;

			smsSaving = false;

			if (!response.ok || payload.success !== true) {
				smsMessage =
					payload.success === false ? payload.error : 'Kunde inte spara SMS-inställningen just nu.';
				smsMessageType = 'error';
				return;
			}

			applySmsPreference(payload.preference);
			smsMessage = payload.preference.sms_opt_in
				? 'SMS-inställningen har sparats.'
				: 'SMS-uppdateringar är avstängda.';
			smsMessageType = 'success';
		} catch {
			smsSaving = false;
			smsMessage = 'Kunde inte nå servern. Försök igen.';
			smsMessageType = 'error';
		}
	}

	async function disableSmsUpdates() {
		smsOptIn = false;
		await saveSmsPreference(false);
	}

	function formatConsentTimestamp(value: string) {
		const parsed = new Date(value);
		if (Number.isNaN(parsed.getTime())) return 'okänd tidpunkt';

		return new Intl.DateTimeFormat('sv-SE', {
			dateStyle: 'long',
			timeStyle: 'short'
		}).format(parsed);
	}

	async function withdrawHealthConsent() {
		consentSaving = true;
		consentMessage = '';

		const { error } = await supabase.auth.updateUser({
			data: {
				health_data_processing_consent: null
			}
		});

		consentSaving = false;

		if (error) {
			consentMessage = 'Kunde inte återkalla samtycket just nu.';
			consentMessageType = 'error';
			return;
		}

		revokeSensitiveConsent();
		healthConsentRecord = null;
		await supabase.auth.refreshSession();
		consentMessage =
			'Samtycket har återkallats. MittPsyke ber om nytt samtycke nästa gång känsliga uppgifter behöver behandlas.';
		consentMessageType = 'success';
	}

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
				progress_companion: { id: progressCompanion?.id ?? 'fox' },
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
			await supabase.auth.refreshSession();
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

	async function selectCompanion(id: 'fox' | 'bear') {
		if (companionSaving || progressCompanion?.id === id) return;

		const previousCompanion = progressCompanion;
		progressCompanion = { id };
		companionMessage = '';
		companionSaving = true;

		const { error } = await supabase.auth.updateUser({
			data: { progress_companion: { id } }
		});

		companionSaving = false;

		if (error) {
			progressCompanion = previousCompanion ?? { id: 'fox' };
			companionMessage = 'Kunde inte spara ditt val just nu. Försök igen.';
			companionMessageType = 'error';
			return;
		}

		await supabase.auth.refreshSession();
		companionMessage = `${id === 'fox' ? 'Räv' : 'Björn'} är nu din följeslagare.`;
		companionMessageType = 'success';
		setTimeout(() => {
			companionMessage = '';
		}, 3000);
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

<SEO canonical="https://www.mittpsyke.se/dashboard/installningar" />

<svelte:head>
	<title>Kontoinställningar - MittPsyke</title>
</svelte:head>

<main class="auth-page">
	<PortalSubnav
		active="installningar"
		title="Kontoinställningar"
		description="Hantera konto, tema och personliga val i lugn takt."
	/>

	<div class="settings-page auth-shell">
		{#if loading}
			<p class="loading-copy">Laddar inställningar...</p>
		{:else}

		<!-- Display Name Section -->
		<section class="auth-panel section-block">
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
		<section class="auth-panel section-block">
			<h2>Personalisera portalen</h2>
			<p class="field-hint">Välj tema, mål och vilket kort du vill se på startsidan. Du kan ändra när du vill.</p>

			<!-- Companion profile -->
			<section class="companion-selection" aria-labelledby="companion-heading">
				<h3 id="companion-heading">Välj följeslagare</h3>
				<div class="companion-choice-grid" role="radiogroup" aria-label="Välj följeslagare">
				{#each companionChoices as companion}
					<button
						type="button"
						role="radio"
						class="companion-choice"
						class:companion-choice-active={progressCompanion?.id === companion.id}
						onclick={() => selectCompanion(companion.id as 'fox' | 'bear')}
						aria-checked={progressCompanion?.id === companion.id}
						disabled={companionSaving}
					>
						<CompanionAvatar selection={{ id: companion.id }} size="lg" decorative animated={false} />
						<span><strong>{companion.name}</strong><small>{companion.temperament}</small></span>
						{#if progressCompanion?.id === companion.id}
							<span class="companion-active-badge">Vald</span>
						{/if}
					</button>
				{/each}
				</div>
				{#if companionMessage}
					<p class="feedback {companionMessageType}" aria-live="polite">{companionMessage}</p>
				{/if}
			</section>
			<div class="companion-profile-card">
				<CompanionAvatar selection={progressCompanion} size="xl" decorative animated={false} />
				<div class="companion-profile-copy">
					<strong>{selectedCompanion?.name ?? 'Din följeslagare'}</strong>
					<span>Finns kvar i din värld och möter dig när du återvänder.</span>
				</div>
			</div>

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
			<p class="pref-label">Ditt veckomål</p>
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
		<section class="auth-panel section-block">
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

		<section class="auth-panel section-block">
			<h2>Mejlutskick</h2>
			<p class="field-hint">Hantera avregistrering och stoppa framtida utskick.</p>
			<a class="save-btn link-btn" href="/avregistrera">Hantera avregistrering</a>
			<p class="field-hint">Läs mer om radering, export och hur uppgifter hanteras i <a href="/integritet">integritetspolicyn</a>.</p>
		</section>

		<section class="auth-panel section-block">
			<h2>SMS-uppdateringar</h2>
			<p class="field-hint">
				Få ett SMS när MittPsyke får nya funktioner eller viktiga förbättringar. Du kan stänga av detta när som helst.
			</p>

			<label class="field-label" for="sms-phone">Telefonnummer</label>
			<input
				id="sms-phone"
				type="tel"
				bind:value={smsPhoneNumber}
				placeholder="0701234567"
				class="text-input"
				autocomplete="tel"
				inputmode="tel"
			/>

			<label class="sms-consent-row">
				<input type="checkbox" bind:checked={smsOptIn} />
				<span>Jag vill få frivilliga SMS-uppdateringar från MittPsyke.</span>
			</label>

			<p class="sms-info">
				SMS-utskick är ännu inte aktiverade. Inställningen sparas redan nu för framtida frivilliga uppdateringar.
			</p>

			<div class="sms-actions">
				<button class="save-btn" onclick={() => saveSmsPreference()} disabled={smsSaving}>
					{smsSaving ? 'Sparar...' : 'Spara'}
				</button>
				<button class="save-btn sms-off-btn" onclick={disableSmsUpdates} disabled={smsSaving || (!smsOptIn && !smsPhoneNumber)}>
					Stäng av SMS
				</button>
			</div>

			{#if smsMessage}
				<p class="feedback {smsMessageType}">{smsMessage}</p>
			{/if}
		</section>

		<section class="auth-panel section-block">
			<h2>Samtycke för känsliga uppgifter</h2>
			<p class="field-hint">
				Det här samtycket gäller när MittPsyke behöver behandla sådant du skriver om mående, känslor
				eller andra känsliga uppgifter för att kunna ge stöd i chatten, dagboken och liknande vyer.
			</p>

			{#if healthConsentRecord}
				<p class="field-hint">
					Aktivt samtycke registrerat {formatConsentTimestamp(healthConsentRecord.timestamp)}.
					Version: {healthConsentRecord.policy_version}.
				</p>
				<button class="save-btn sms-off-btn" onclick={withdrawHealthConsent} disabled={consentSaving}>
					{consentSaving ? 'Sparar...' : 'Återkalla samtycke'}
				</button>
			{:else}
				<p class="field-hint">
					Det finns inget aktivt samtycke sparat just nu. MittPsyke frågar igen när du öppnar ett
					flöde där känsliga uppgifter behöver behandlas.
				</p>
			{/if}

			{#if consentMessage}
				<p class="feedback {consentMessageType}">{consentMessage}</p>
			{/if}
		</section>

		<!-- Delete Account Section -->
		<section id="radera-konto" class="auth-panel section-block danger-zone">
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
	</div>
</main>

<style>
	.settings-page {
		max-width: 840px;
		padding-top: 1.1rem;
		padding-bottom: 2.75rem;
		display: grid;
		gap: 1rem;
		min-width: 0;
	}

	.loading-copy {
		font-family: var(--font-body);
		padding: 1.6rem 0;
		opacity: 0.7;
	}

	.section-block {
		padding: 1.05rem;
		min-width: 0;
	}

	.section-block h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		color: hsl(var(--foreground));
		font-size: 1.03rem;
		letter-spacing: -0.02em;
		margin: 0 0 0.25rem;
	}

	.field-hint {
		margin: 0 0 0.7rem;
		font-family: var(--font-body);
		font-size: 0.88rem;
		color: hsl(var(--muted-foreground));
	}

	.birthday-hint {
		margin: 0.35rem 0 0;
	}

	.field-label {
		display: block;
		font-family: var(--font-body);
		font-size: 0.88rem;
		color: hsl(var(--muted-foreground));
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
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		font-family: var(--font-body);
		font-weight: 400;
		font-size: 0.95rem;
		letter-spacing: -0.005em;
		color: hsl(var(--foreground));
		outline: none;
		transition: border-color 160ms ease;
	}

	.text-input:focus {
		border-color: var(--primary, #436e8f);
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
		border: 1px solid hsl(var(--border));
		background: var(--theme-bg, hsl(var(--surface-soft)));
		color: hsl(var(--foreground));
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
		background: hsl(var(--surface-soft));
	}

	.save-btn:disabled {
		opacity: 0.55;
		cursor: default;
	}

	.link-btn {
		text-decoration: none;
	}

	.sms-consent-row {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		margin-top: 0.75rem;
		font-family: var(--font-body);
		font-size: 0.9rem;
		line-height: 1.45;
		color: hsl(var(--foreground));
		cursor: pointer;
	}

	.sms-consent-row input {
		width: 1rem;
		height: 1rem;
		margin-top: 0.15rem;
		accent-color: var(--primary, #2563eb);
		flex-shrink: 0;
	}

	.sms-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.55rem;
		align-items: center;
	}

	.sms-actions .save-btn {
		margin-top: 0.75rem;
	}

	.sms-off-btn {
		background: transparent;
	}

	.sms-info {
		margin: 0.7rem 0 0;
		padding: 0.7rem 0.8rem;
		border-radius: var(--radius-input);
		border: 1px solid rgba(37, 99, 235, 0.14);
		background: rgba(37, 99, 235, 0.06);
		color: #1e3a8a;
		font-family: var(--font-body);
		font-size: 0.86rem;
		line-height: 1.55;
	}

	:global(.dark) .sms-info {
		border-color: rgba(147, 197, 253, 0.2);
		background: rgba(37, 99, 235, 0.14);
		color: #bfdbfe;
	}

	.feedback {
		margin: 0.55rem 0 0;
		font-family: var(--font-body);
		font-size: 0.86rem;
		transition: opacity 400ms ease;
	}

	.feedback.success {
		color: hsl(var(--success-foreground));
	}

	.feedback.error {
		color: hsl(var(--error-foreground));
	}

	
	/* Personalization styles */
	.pref-label {
		font-family: var(--font-body);
		font-size: 0.88rem;
		font-weight: 600;
		opacity: 0.75;
		margin: 1rem 0 0.4rem;
	}

	.companion-profile-card {
		display: flex;
		align-items: center;
		gap: 0.85rem;
		max-width: 32rem;
		padding: 0.75rem;
		border: 1px solid hsl(var(--border));
		border-radius: 14px;
		background: hsl(var(--surface));
	}

	.companion-selection {
		margin-top: 1rem;
	}

	.companion-selection h3 {
		margin: 0 0 0.4rem;
		font-family: var(--font-body);
		font-size: 0.95rem;
		font-weight: 650;
	}

	.companion-choice-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.6rem;
		margin-bottom: 0.75rem;
	}

	.companion-choice {
		display: flex;
		align-items: center;
		gap: 0.65rem;
		min-width: 0;
		padding: 0.7rem;
		border: 1px solid hsl(var(--border));
		border-radius: 12px;
		background: hsl(var(--surface));
		color: inherit;
		text-align: left;
		cursor: pointer;
	}

	.companion-choice:disabled {
		cursor: wait;
	}

	.companion-choice-active {
		border-color: hsl(var(--primary));
		box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.25);
		background: hsl(var(--surface-soft));
	}

	.companion-choice span { min-width: 0; display: grid; gap: 0.12rem; }
	.companion-choice strong { font-size: 0.9rem; }
	.companion-choice small { color: hsl(var(--muted-foreground)); font-size: 0.76rem; line-height: 1.25; }

	.companion-active-badge {
		flex: 0 0 auto;
		padding: 0.2rem 0.45rem;
		border-radius: 999px;
		background: hsl(var(--primary));
		color: hsl(var(--primary-foreground));
		font-family: var(--font-body);
		font-size: 0.72rem;
		font-weight: 650;
	}

	.companion-profile-copy {
		display: grid;
		gap: 0.18rem;
		min-width: 0;
		font-family: var(--font-body);
	}

	.companion-profile-copy strong {
		font-size: 0.95rem;
		line-height: 1.25;
	}

	.companion-profile-copy span {
		font-size: 0.86rem;
		line-height: 1.45;
		color: hsl(var(--muted-foreground));
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
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease;
	}

	.option-row:hover {
		border-color: hsl(var(--muted-foreground) / 0.35);
		background: hsl(var(--surface-soft));
	}

	.option-row.selected {
		border-color: var(--primary, #436e8f);
		background: var(--theme-bg, hsl(var(--surface-soft)));
	}

	.option-dot {
		width: 0.75rem;
		height: 0.75rem;
		border-radius: 50%;
		border: 2px solid var(--primary, #436e8f);
		flex-shrink: 0;
		transition: background 120ms ease;
	}

	.option-row.selected .option-dot {
		background: var(--primary, #436e8f);
	}

	.option-text {
		font-family: var(--font-body);
		font-size: 0.9rem;
		min-width: 0;
	}

	.option-chip {
		padding: 0.4rem 0.85rem;
		border-radius: 2rem;
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface));
		font-family: var(--font-body);
		font-size: 0.88rem;
		cursor: pointer;
		transition: border-color 120ms ease, background 120ms ease;
	}

	.option-chip:hover {
		border-color: hsl(var(--muted-foreground) / 0.35);
	}

	.option-chip.selected {
		border-color: var(--primary, #436e8f);
		background: var(--theme-bg, hsl(var(--surface-soft)));
		font-weight: 500;
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
		background: hsl(var(--error-surface));
		border-color: hsl(var(--error-foreground) / 0.3);
	}

	.danger-copy {
		color: hsl(var(--error-foreground));
	}

	.confirm-token {
		font-weight: 600;
		color: hsl(var(--error-foreground));
	}

	.danger-zone .text-input {
		border-color: hsl(var(--error-foreground) / 0.35);
	}

	.danger-btn {
		background: hsl(var(--error-foreground));
		color: #fff;
		border-color: transparent;
		margin-top: 0.8rem;
	}

	.danger-btn:hover:not(:disabled) {
		filter: brightness(0.93);
	}

	.danger-btn:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	@media (max-width: 739px) {
		.section-block {
			padding: 0.95rem;
		}

		.section-block h2 {
			font-size: 1rem;
		}

		.field-row {
			flex-direction: column;
			gap: 0.5rem;
		}

		.field-row .save-btn,
		.section-block .save-btn,
		.section-block .danger-btn {
			width: 100%;
		}

		.sms-actions {
			flex-direction: column;
			align-items: stretch;
		}

		.companion-profile-card {
			align-items: flex-start;
			border-radius: 12px;
			padding: 0.65rem;
		}

		.companion-choice-grid { grid-template-columns: 1fr; }

		.option-list.widget-row {
			flex-direction: column;
			flex-wrap: nowrap;
		}

		.option-row,
		.option-chip {
			min-width: 0;
		}

		.option-chip {
			width: 100%;
			text-align: left;
		}

		.option-text {
			overflow-wrap: anywhere;
		}
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
















