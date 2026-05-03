<script lang="ts">
	export let onAccept: () => void;

	const STORAGE_KEY = 'mittpsyke.healthConsent';
	const VERSION = '2026-04-29';

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
		saveConsent();
		onAccept();
	}
</script>

<div class="consent-overlay">
	<div class="consent-box" role="dialog" aria-modal="true">
		<h2>Innan du börjar</h2>

		<p>
			MittPsyke är ett stöd i egen takt, inte vård. Det du skriver kan handla om mående och
			andra känsliga uppgifter. Texten behandlas för att kunna ge dig stöd här.
		</p>

		<p class="links">
			Läs mer i <a href="/integritet">integritetspolicyn</a> och
			<a href="/ansvar">ansvarsinformationen</a>.
		</p>

		<div class="actions">
			<button on:click={handleStart}>Jag förstår och vill fortsätta</button>
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

	.links {
		font-size: 0.9rem;
		opacity: 0.8;
	}

	.actions {
		margin-top: 1rem;
		display: flex;
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
</style>
