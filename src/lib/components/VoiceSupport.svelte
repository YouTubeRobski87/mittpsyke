<script>
	import { onMount } from 'svelte';
	import ConsentGate from '$lib/components/ConsentGate.svelte';
	import {
		SENSITIVE_CONSENT_HEADER,
		SENSITIVE_CONSENT_VERSION,
		grantSensitiveConsent,
		hasSensitiveConsent
	} from '$lib/consent';

	let retell;
	let active = $state(false);
	let hasSensitiveDataConsent = $state(false);
	let copied = $state(false);

	function copyNumber() {
		navigator.clipboard.writeText('+1 (567) 292-1889');
		copied = true;
		setTimeout(() => { copied = false; }, 2000);
	}

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
		const { RetellWebClient } = await import('retell-client-js-sdk');

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

<section id="roststod" class="voice-support">
	<h2>Röststöd för reflektion</h2>
	<p>Du kan prata med AI-baserat röststöd för att sätta ord på tankar och känslor. Tjänsten är till för reflektion och självhjälp — inte vård eller akuthjälp.</p>
	<p class="voice-support-note">
		Samtalet hanteras via externa röst- och AI-tjänster från OpenAI och Retell. Läs
		<a href="/integritet">hur det fungerar och vad som sparas</a>
		innan du ringer eller startar ett röstsamtal här.
	</p>
	<p class="voice-support-meta">
		Telefonnumret är internationellt (+1), så eventuell samtalskostnad beror på ditt abonnemang.
	</p>
	<p class="voice-support-note">
		Om du hellre vill prata med en människa finns <a href="https://stodlinjer.se" rel="noopener noreferrer" target="_blank">Stödlinjer</a>. Vid akut fara, ring 112.
	</p>
	{#if hasSensitiveDataConsent}
		<button onclick={startCall} aria-label="Starta röstsamtal med MittPsyke">
			{active ? 'AI-röstsamtal igång...' : 'Starta AI-röstsamtal'}
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
	<a class="voice-support-call-button" href="tel:+15672921889" aria-label="Ring AI-samtalsstöd på +15672921889">
		Ring AI-samtalsstöd
	</a>
	<div class="voice-support-number">
		<p class="phone-number">+1 (567) 292-1889</p>
		<button class="copy-btn" onclick={copyNumber} aria-label="Kopiera telefonnummer">
			{copied ? 'Kopierat!' : 'Kopiera nummer'}
		</button>
	</div>
</section>

<style>
	.voice-support {
		padding: clamp(1.8rem, 4vw, 2.8rem) 1.25rem;
		text-align: center;
		background: #141e2e;
		color: #e0e4ea;
		border-top: 1px solid rgba(148, 163, 184, 0.12);
	}

	.voice-support h2 {
		margin: 0 0 0.5rem;
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.15rem, 2vw, 1.4rem);
		letter-spacing: -0.015em;
		color: #eef1f6;
	}

	.voice-support p {
		margin: 0 auto 0.9rem;
		max-width: 52ch;
		color: rgba(220, 225, 235, 0.78);
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.65;
		font-size: 0.95rem;
	}

	.voice-support-note {
		font-size: 0.95rem;
	}

	.voice-support-meta {
		font-size: 0.88rem;
		opacity: 0.72;
	}

	.voice-support-note a {
		color: #7db4e8;
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.voice-support-consent {
		max-width: 52ch;
		margin: 0 auto;
		text-align: left;
	}

	button,
	.voice-support-call-button {
		background: #3a7bd5;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 10px;
		font-size: 15px;
		cursor: pointer;
		transition: background 0.2s ease, transform 0.2s ease;
		display: inline-block;
		text-decoration: none;
		margin-top: 0.6rem;
	}

	button:hover,
	.voice-support-call-button:hover {
		background: #2e66b8;
		transform: translateY(-2px);
	}

	.voice-support-number {
		margin-top: 1rem;
	}

	.phone-number {
		margin: 0;
		font-family: var(--font-heading);
		font-size: 1.15rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		color: #eef1f6;
		user-select: all;
	}

	.copy-btn {
		background: transparent;
		border: 1px solid rgba(148, 163, 184, 0.2);
		color: rgba(220, 225, 235, 0.7);
		padding: 0.3rem 0.7rem;
		border-radius: 6px;
		font-size: 0.78rem;
		cursor: pointer;
		margin-top: 0.35rem;
		transition: border-color 0.15s ease, color 0.15s ease;
	}

	.copy-btn:hover {
		border-color: rgba(148, 163, 184, 0.4);
		color: #eef1f6;
		background: transparent;
		transform: none;
	}

	:global(.dark) .voice-support {
		background: #0d1520;
	}
</style>
