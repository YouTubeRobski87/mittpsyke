<script lang="ts">
	import { grantSensitiveConsent, type HealthConsentRecord } from '$lib/consent';
	import { supabase } from '$lib/supabase';

	export let onAccept: (consent: HealthConsentRecord) => void | Promise<void> = () => {};

	let confirmed = false;
	let errorMessage = '';

	async function persistConsentForSignedInUser(consent: HealthConsentRecord) {
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session) return;

		const { error } = await supabase.auth.updateUser({
			data: {
				health_data_processing_consent: consent
			}
		});

		if (!error) {
			await supabase.auth.refreshSession();
		}
	}

	async function handleStart() {
		if (!confirmed) {
			errorMessage =
				'Bekräfta först att du samtycker till behandlingen av känsliga uppgifter här.';
			return;
		}

		errorMessage = '';
		const consent = grantSensitiveConsent();
		await persistConsentForSignedInUser(consent);
		await onAccept(consent);
	}
</script>

<div class="consent-overlay">
	<div class="consent-box" role="dialog" aria-modal="true" aria-labelledby="health-consent-title">
		<h2 id="health-consent-title">Innan du börjar</h2>

		<p>
			MittPsyke är ett stöd i egen takt, inte vård. Det du skriver kan handla om mående och
			andra känsliga personuppgifter. För att chatten och dagboken ska kunna svara på det du delar
			behöver texten behandlas här i tjänsten.
		</p>

		<p>
			Samtycket är separat för känsliga uppgifter, sparas med tidpunkt och version och kan
			återkallas senare i dina inställningar.
		</p>

		<label class="consent-check">
			<input type="checkbox" bind:checked={confirmed} />
			<span
				>Jag samtycker uttryckligen till att MittPsyke behandlar det jag skriver som känsliga
				uppgifter för att kunna ge stöd här.</span
			>
		</label>

		<p class="links">
			Läs mer i <a href="/integritet">integritetspolicyn</a> och
			<a href="/ansvar">ansvarsinformationen</a>.
		</p>

		{#if errorMessage}
			<p class="feedback">{errorMessage}</p>
		{/if}

		<div class="actions">
			<button onclick={handleStart} disabled={!confirmed}>Jag samtycker och vill fortsätta</button>
			<a class="secondary-link" href="/">Inte nu</a>
		</div>
	</div>
</div>

<style>
	.consent-overlay {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.55);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.consent-box {
		background: white;
		color: #111827;
		padding: 1.5rem;
		border-radius: 16px;
		max-width: 480px;
		width: 90%;
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
	}

	.consent-check {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-top: 1rem;
		font-size: 0.95rem;
		line-height: 1.55;
	}

	.consent-check input {
		margin-top: 0.2rem;
	}

	.links {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.feedback {
		margin: 0.85rem 0 0;
		font-size: 0.9rem;
		color: #8a5f17;
	}

	.actions {
		margin-top: 1rem;
		display: flex;
		align-items: center;
		gap: 0.85rem;
		flex-wrap: wrap;
	}

	button:disabled {
		opacity: 0.55;
		cursor: not-allowed;
	}

	.secondary-link {
		font-size: 0.95rem;
		color: inherit;
		opacity: 0.78;
	}

	:global(.dark) .consent-box {
		background: #171d24;
		color: #f8fafc;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .consent-box a {
		color: #9ad7ce;
	}

	:global(.dark) .links {
		opacity: 0.9;
		color: #cbd5f5;
	}

	:global(.dark) .feedback {
		color: #f7d487;
	}
</style>
