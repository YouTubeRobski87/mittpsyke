<script>
	import { onMount } from 'svelte';
	import { RetellWebClient } from 'retell-client-js-sdk';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';

	let retell;
	let active = false;
	let hasSensitiveDataConsent = false;

	onMount(() => {
		hasSensitiveDataConsent = hasSensitiveConsent();
	});

	async function startCall() {
		if (!hasSensitiveDataConsent) return;

		const res = await fetch('/api/retell-webcall', {
			headers: {
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			}
		});
		const data = await res.json();

		retell = new RetellWebClient();

		await retell.startCall({
			accessToken: data.accessToken
		});

		active = true;
	}

	function acceptSensitiveConsent() {
		grantSensitiveConsent();
		hasSensitiveDataConsent = true;
	}
</script>

<section class="voice-support">
	<h2>Prata direkt här</h2>
	<p>Du kan också prata direkt med MittPsykes AI-baserade samtalsstöd här på sidan.</p>
	<p>Det är till för reflektion och stöd i vardagen. Det ersätter inte vård, ställer inte diagnos och ska inte vara enda underlag för medicinska beslut.</p>
	<p class="voice-support-note">Vid akut fara, ring 112. För vårdråd, kontakta 1177. Du kan också använda Akut hjälp för att hitta stödlinjer.</p>
	{#if hasSensitiveDataConsent}
		<button on:click={startCall}>
			🎤 {active ? 'Samtal igång...' : 'Prata med MittPsyke'}
		</button>
	{:else}
		<div class="voice-support-consent">
			<ConsentGate
				title="Samtycke innan röstsamtal"
				dataLabel="Det du säger i röstsamtalet"
				serviceLabel="AI-, röst- och tredjepartstjänster"
				onAccept={acceptSensitiveConsent}
			/>
		</div>
	{/if}
</section>

<style>
	.voice-support {
		padding: 60px 20px;
		text-align: center;
		background: #eef2f0;
		color: #2c3338;
	}

	.voice-support h2 {
		margin: 0 0 0.75rem;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.55rem, 3vw, 2.2rem);
		letter-spacing: -0.02em;
		color: #263036;
	}

	.voice-support p {
		margin: 0 auto 1.5rem;
		max-width: 52ch;
		color: #516069;
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		font-size: 1rem;
	}

	.voice-support-note {
		font-size: 0.95rem;
	}

	.voice-support-consent {
		max-width: 52ch;
		margin: 0 auto;
		text-align: left;
	}

	button {
		background: #6b8e7a;
		color: white;
		border: none;
		padding: 14px 24px;
		border-radius: 12px;
		font-size: 18px;
		cursor: pointer;
		transition: background 0.2s ease, transform 0.2s ease;
	}

	button:hover {
		background: #557a66;
		transform: translateY(-2px);
	}

	:global(.dark) .voice-support {
		background: #1e2422;
		color: #e8e6e2;
	}

	:global(.dark) .voice-support h2 {
		color: #f0eeea;
	}

	:global(.dark) .voice-support p {
		color: rgba(255, 255, 255, 0.65);
	}
</style>
