<script lang="ts">
	export let onAccept: () => void;

	const STORAGE_KEY = 'mittpsyke.healthConsent';
	const VERSION = '2026-04-29';

	let accepted = false;

	function saveConsent() {
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({
					accepted: true,
					type: 'health_data_processing',
					timestamp: new Date().toISOString(),
					policy_version: VERSION
				})
			);
		} catch {
			// fail silently
		}
	}

	function handleStart() {
		if (!accepted) return;
		saveConsent();
		onAccept();
	}
</script>

<div class="consent-overlay">
	<div class="consent-box" role="dialog" aria-modal="true">
		<h2>Innan du börjar</h2>

		<p>Det du skriver här kan innehålla känsliga uppgifter om hur du mår.</p>

		<p>
			För att kunna ge stöd behöver MittPsyke behandla innehållet enligt
			<a href="/integritet">integritetspolicyn</a>.
		</p>

		<p class="warning">
			Tjänsten är inte vård, diagnos eller behandling. Vid akuta lägen – ring 112.
			För vårdråd – kontakta 1177.
		</p>

		<label class="checkbox">
			<input type="checkbox" bind:checked={accepted} />
			Jag förstår och samtycker till att mitt innehåll behandlas enligt integritetspolicyn
		</label>

		<div class="actions">
			<button on:click={handleStart} disabled={!accepted}>Börja skriva</button>
			<a href="/">Avbryt</a>
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
		border-radius: 12px;
		max-width: 480px;
		width: 90%;
		box-shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
	}

	.warning {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.checkbox {
		display: flex;
		gap: 0.55rem;
		margin-top: 1rem;
		line-height: 1.5;
	}

	.actions {
		margin-top: 1rem;
		display: flex;
		gap: 1rem;
		align-items: center;
	}

	button:disabled {
		opacity: 0.5;
	}

	:global(.dark) .consent-box {
		background: #171d24;
		color: #f8fafc;
		border: 1px solid rgba(255, 255, 255, 0.12);
	}

	:global(.dark) .consent-box a {
		color: #9ad7ce;
	}

	:global(.dark) .warning {
		opacity: 0.9;
		color: #cbd5f5;
	}
</style>