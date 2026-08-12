<script lang="ts">
	import { onMount, tick } from 'svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import {
		EVENING_CHECKIN_FLOW_VERSION,
		EVENING_PARKING_BUCKETS,
		EVENING_THEMES,
		MAX_EVENING_THOUGHT_LENGTH,
		canAdvanceEveningFlow,
		type EveningParkingBucket,
		type EveningThemeId
	} from '$lib/evening-checkin';
	import {
		grantSensitiveConsent,
		hasSensitiveConsent,
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		type HealthConsentRecord
	} from '$lib/consent';
	import { supabase } from '$lib/supabase';

	let { oncomplete = (_saved: boolean) => {} }: { oncomplete?: (saved: boolean) => void } = $props();

	type Step = 1 | 2 | 3 | 4;

	let step = $state<Step>(1);
	let themeId = $state<EveningThemeId | null>(null);
	let thought = $state('');
	let parkingBucket = $state<EveningParkingBucket | null>(null);
	let hasHealthDataConsent = $state(false);
	let consentLoading = $state(true);
	let saving = $state(false);
	let saveError = $state('');
	let saved = $state(false);
	let finishedWithoutSaving = $state(false);
	let stepHeading = $state<HTMLElement | null>(null);

	function goToStep(next: Step) {
		step = next;
		saveError = '';
		void tick().then(() => stepHeading?.focus());
	}

	function continueFromTheme() {
		if (!canAdvanceEveningFlow(1, { themeId, parkingBucket })) return;
		goToStep(2);
	}

	function continueFromThought() {
		goToStep(3);
	}

	function continueFromParking() {
		if (!canAdvanceEveningFlow(3, { themeId, parkingBucket })) return;
		goToStep(4);
	}

	async function persistUserConsent(consent: HealthConsentRecord) {
		const { error } = await supabase.auth.updateUser({
			data: { health_data_processing_consent: consent }
		});
		if (!error) await supabase.auth.refreshSession();
	}

	function acceptHealthConsent() {
		const consent = grantSensitiveConsent();
		hasHealthDataConsent = true;
		void persistUserConsent(consent);
	}

	function finishWithoutSaving() {
		finishedWithoutSaving = true;
		oncomplete(false);
	}

	async function saveAndFinish() {
		if (!themeId || !parkingBucket || saving || saved || finishedWithoutSaving) return;
		saving = true;
		saveError = '';

		try {
			const response = await fetch('/api/evening-checkins', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
				},
				body: JSON.stringify({
					themeId,
					thought: thought.trim() || null,
					parkingBucket,
					flowVersion: EVENING_CHECKIN_FLOW_VERSION
				})
			});
			const payload = (await response.json().catch(() => null)) as { error?: string } | null;

			if (!response.ok) {
				saveError = payload?.error ?? 'Kunde inte spara just nu. Du kan fortfarande avsluta utan att spara.';
				return;
			}

			saved = true;
			oncomplete(true);
		} catch {
			saveError = 'Kunde inte nå servern. Du kan fortfarande avsluta utan att spara.';
		} finally {
			saving = false;
		}
	}

	onMount(async () => {
		const {
			data: { session }
		} = await supabase.auth.getSession();
		hasHealthDataConsent = hasSensitiveConsent(session?.user.user_metadata);
		consentLoading = false;
	});
</script>

{#if consentLoading}
	<p class="evening-loading">Laddar Kvällslugn…</p>
{:else if !hasHealthDataConsent}
	<ConsentGate
		title="Innan du börjar"
		dataLabel="Det du väljer eller skriver i Kvällslugn"
		serviceLabel="MittPsyke om du väljer att spara incheckningen"
		onAccept={acceptHealthConsent}
	/>
{:else}
	<section class="evening-flow" aria-labelledby="evening-flow-title">
		<p class="evening-step" aria-live="polite">Steg {step} av 4</p>

		{#if step === 1}
			<div class="evening-step-content">
				<h2 id="evening-flow-title" bind:this={stepHeading} tabindex="-1">Hur är det ikväll?</h2>
				<div class="evening-options" aria-label="Välj det som passar bäst">
					{#each EVENING_THEMES as theme}
						<button
							type="button"
							class:selected={themeId === theme.id}
							aria-pressed={themeId === theme.id}
							onclick={() => (themeId = theme.id)}
						>
							{theme.label}
						</button>
					{/each}
				</div>
				<button class="evening-primary" type="button" disabled={!themeId} onclick={continueFromTheme}>
					Fortsätt
				</button>
			</div>
		{:else if step === 2}
			<div class="evening-step-content">
				<h2 id="evening-flow-title" bind:this={stepHeading} tabindex="-1">Vad tar mest plats just nu?</h2>
				<p class="evening-hint">Några ord räcker. Du kan också lämna det tomt.</p>
				<label class="sr-only" for="evening-thought">Vad tar mest plats just nu?</label>
				<textarea
					id="evening-thought"
					bind:value={thought}
					maxlength={MAX_EVENING_THOUGHT_LENGTH}
					rows="5"
					placeholder="Skriv om du vill…"
				></textarea>
				<div class="evening-actions">
					<button class="evening-secondary" type="button" onclick={() => goToStep(1)}>Tillbaka</button>
					<button class="evening-primary" type="button" onclick={continueFromThought}>Fortsätt</button>
				</div>
			</div>
		{:else if step === 3}
			<div class="evening-step-content">
				<h2 id="evening-flow-title" bind:this={stepHeading} tabindex="-1">Vad vill du göra med det för ikväll?</h2>
				<div class="evening-options" aria-label="Välj en lugn riktning för ikväll">
					{#each EVENING_PARKING_BUCKETS as bucket}
						<button
							type="button"
							class:selected={parkingBucket === bucket.id}
							aria-pressed={parkingBucket === bucket.id}
							onclick={() => (parkingBucket = bucket.id)}
						>
							{bucket.label}
						</button>
					{/each}
				</div>
				<div class="evening-actions">
					<button class="evening-secondary" type="button" onclick={() => goToStep(2)}>Tillbaka</button>
					<button class="evening-primary" type="button" disabled={!parkingBucket} onclick={continueFromParking}>
						Fortsätt
					</button>
				</div>
			</div>
		{:else}
			<div class="evening-step-content evening-finish">
				<h2 id="evening-flow-title" bind:this={stepHeading} tabindex="-1">Det räcker för ikväll.</h2>
				<p>Du behöver inte bära allt färdigt just nu.</p>
				{#if saved}
					<p class="evening-saved" role="status">Kvällens incheckning är sparad.</p>
				{:else if finishedWithoutSaving}
					<p class="evening-hint" role="status">Inget från den här stunden har sparats.</p>
				{:else}
					<p class="evening-hint">Inget sparas om du avslutar utan att spara.</p>
					<div class="evening-actions evening-actions--stacked">
						<button class="evening-primary" type="button" disabled={saving} onclick={saveAndFinish}>
							{saving ? 'Sparar…' : 'Spara kvällens incheckning'}
						</button>
						<button class="evening-secondary" type="button" disabled={saving} onclick={finishWithoutSaving}>
							Avsluta utan att spara
						</button>
					</div>
				{/if}
				{#if saveError}
					<p class="evening-error" role="alert">{saveError}</p>
				{/if}
				<a class="evening-home-link" href="/dashboard">Till Mitt Hem</a>
			</div>
		{/if}
	</section>
{/if}

<style>
	.evening-loading,
	.evening-flow {
		font-family: var(--font-body);
	}

	.evening-flow {
		padding: clamp(1.1rem, 4vw, 1.8rem);
		border: 1px solid rgb(237 222 194 / 0.28);
		border-radius: 1.2rem;
		background: linear-gradient(145deg, rgb(55 38 29 / 0.96), rgb(28 23 22 / 0.97));
		box-shadow: 0 18px 42px rgb(22 15 12 / 0.28);
		backdrop-filter: blur(8px);
		color: #f7f3eb;
	}

	.evening-step {
		margin: 0 0 1.1rem;
		color: rgb(235 223 200 / 0.72);
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.07em;
		text-transform: uppercase;
	}

	.evening-step-content {
		display: grid;
		gap: 0.85rem;
	}

	.evening-step-content h2 {
		margin: 0;
		font-family: var(--font-heading);
		font-size: clamp(1.35rem, 3vw, 1.7rem);
		line-height: 1.18;
	}

	.evening-step-content h2:focus-visible {
		outline: 2px solid #f5c878;
		outline-offset: 4px;
	}

	.evening-hint,
	.evening-finish p {
		margin: 0;
		color: rgb(240 235 225 / 0.8);
		font-size: 0.94rem;
		line-height: 1.55;
	}

	.evening-options {
		display: grid;
		gap: 0.6rem;
	}

	.evening-options button,
	.evening-primary,
	.evening-secondary,
	.evening-home-link {
		min-height: 44px;
		border-radius: 0.8rem;
		font: inherit;
		font-weight: 650;
		line-height: 1.3;
	}

	.evening-options button {
		width: 100%;
		padding: 0.8rem 0.9rem;
		border: 1px solid rgb(238 225 202 / 0.24);
		background: rgb(255 255 255 / 0.06);
		color: inherit;
		text-align: left;
		cursor: pointer;
		transition: background-color 160ms ease, border-color 160ms ease;
	}

	.evening-options button:hover,
	.evening-options button:focus-visible,
	.evening-options button.selected {
		border-color: rgb(245 200 120 / 0.78);
		background: rgb(245 200 120 / 0.15);
		outline: none;
	}

	textarea {
		width: 100%;
		min-height: 8rem;
		padding: 0.85rem 0.9rem;
		border: 1px solid rgb(238 225 202 / 0.28);
		border-radius: 0.8rem;
		background: rgb(255 255 255 / 0.07);
		color: inherit;
		font: inherit;
		line-height: 1.5;
		resize: vertical;
	}

	textarea::placeholder { color: rgb(240 235 225 / 0.52); }
	textarea:focus-visible { outline: 2px solid #f5c878; outline-offset: 2px; }

	.evening-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.65rem;
		margin-top: 0.25rem;
	}

	.evening-primary,
	.evening-secondary {
		padding: 0.72rem 1rem;
		cursor: pointer;
	}

	.evening-primary {
		border: 1px solid #efc171;
		background: #efc171;
		color: #2b2116;
	}

	.evening-secondary {
		border: 1px solid transparent;
		background: transparent;
		color: rgb(240 235 225 / 0.82);
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.evening-primary:hover:not(:disabled) { background: #f7d28f; }
	.evening-primary:focus-visible,
	.evening-secondary:focus-visible,
	.evening-home-link:focus-visible {
		outline: 2px solid #f5c878;
		outline-offset: 2px;
	}
	.evening-primary:disabled,
	.evening-secondary:disabled { opacity: 0.55; cursor: default; }

	.evening-actions--stacked { display: grid; }
	.evening-saved { color: #d9edc8 !important; font-weight: 650; }
	.evening-error { margin: 0; color: #ffd1cb; font-size: 0.9rem; line-height: 1.45; }

	.evening-home-link {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: fit-content;
		margin-top: 0.45rem;
		color: #f7f3eb;
		text-decoration: underline;
		text-underline-offset: 0.18em;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	@media (max-width: 640px) {
		.evening-actions { display: grid; }
		.evening-primary,
		.evening-secondary { width: 100%; }
	}

	@media (prefers-reduced-motion: reduce) {
		.evening-options button,
		.evening-primary { transition: none; }
	}
</style>
