<script lang="ts">
	import { dataflowCopy } from '$lib/dataflow-copy';
	import { GENERAL_SAFETY_COPY } from '$lib/safety-copy';

	let {
		title = 'Innan du börjar',
		dataLabel = '',
		serviceLabel = '',
		policyHref = '/integritet',
		responsibilityHref = '/ansvar',
		// Uttryckligt samtycke (GDPR art. 9) kräver en aktiv, separat handling.
		// Ytor som bara behöver en bekräftelseknapp lämnar den här avstängd.
		requireExplicitConfirmation = false,
		confirmationLabel = '',
		showEmergencyGuidance = false,
		showDataflowDetails = false,
		acceptLabel = 'Jag förstår och vill fortsätta',
		onAccept = () => {}
	}: {
		title?: string;
		dataLabel?: string;
		serviceLabel?: string;
		policyHref?: string;
		responsibilityHref?: string;
		requireExplicitConfirmation?: boolean;
		confirmationLabel?: string;
		showEmergencyGuidance?: boolean;
		showDataflowDetails?: boolean;
		acceptLabel?: string;
		onAccept?: () => void | Promise<void>;
	} = $props();

	const usesCustomCopy = $derived(Boolean(dataLabel || serviceLabel));
	let confirmed = $state(false);
	let submitting = $state(false);
	let errorMessage = $state('');

	// Knappen är spärrad tills kryssrutan är ibockad när uttryckligt samtycke
	// krävs. Utan kravet beter den sig exakt som förut.
	const canAccept = $derived(!requireExplicitConfirmation || confirmed);

	async function handleAccept() {
		if (submitting || !canAccept) return;
		submitting = true;
		errorMessage = '';

		try {
			await onAccept();
		} catch {
			errorMessage = 'Kunde inte spara ditt samtycke just nu. Försök igen.';
		} finally {
			submitting = false;
		}
	}
</script>

<div
	class="consent-gate relative z-[1] pointer-events-auto rounded-[var(--radius-card)] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-4"
	role="dialog"
	aria-labelledby="health-consent-title"
	aria-describedby="health-consent-copy"
	tabindex="-1"
>
	<h2 id="health-consent-title" class="text-sm font-semibold">{title}</h2>
	{#if usesCustomCopy}
		<p id="health-consent-copy" class="mt-2 text-sm leading-relaxed opacity-85">
			{GENERAL_SAFETY_COPY} {dataLabel || 'Det du delar här'} kan
			innehålla känsliga uppgifter om mående och behandlas av {serviceLabel || 'AI- och tredjepartstjänster'}
			för att kunna ge dig stöd här.
		</p>
		<p class="mt-2 text-xs opacity-65">
			Läs mer i <a class="underline underline-offset-2" href={policyHref}>integritetspolicyn</a>
			och <a class="underline underline-offset-2" href={responsibilityHref}>ansvarsinformationen</a>.
		</p>
	{:else}
		<p id="health-consent-copy" class="mt-2 text-sm leading-relaxed opacity-85">
			{GENERAL_SAFETY_COPY} Det du skriver kan handla om mående och
			andra känsliga uppgifter. Texten behandlas för att kunna ge dig stöd här.
		</p>
		<p class="mt-2 text-xs opacity-65">
			Läs mer i <a class="underline underline-offset-2" href={policyHref}>integritetspolicyn</a>
			och <a class="underline underline-offset-2" href={responsibilityHref}>ansvarsinformationen</a>.
		</p>
	{/if}

	{#if showEmergencyGuidance}
		<p class="consent-emergency mt-2 text-xs leading-relaxed">
			Vid akut fara: <a class="underline underline-offset-2 font-semibold" href="tel:112">ring 112</a>.
			För vårdråd, kontakta
			<a
				class="underline underline-offset-2"
				href="https://www.1177.se"
				target="_blank"
				rel="noopener noreferrer">1177</a
			>.
		</p>
	{/if}

	{#if showDataflowDetails}
		<details class="consent-more mt-3">
			<summary class="text-xs font-semibold underline underline-offset-2 cursor-pointer">Läs mer</summary>
			<p class="mt-2 text-xs leading-relaxed opacity-80">
				Samtycket gäller meddelanden du aktivt väljer att skicka i chatten. Det är separat för
				känsliga uppgifter och sparas med tidpunkt och version. För anonym chatt kan du återkalla
				samtycket genom att rensa cookies. För kontoanslutna chattfunktioner kan du kontakta oss.
			</p>
			<ul class="consent-dataflow mt-2 text-xs leading-relaxed opacity-80">
				<li><strong>När det skickas:</strong> {dataflowCopy.guestChat.aiTransfer}</li>
				<li><strong>Utan konto:</strong> {dataflowCopy.guestChat.retention}</li>
				<li>
					<strong>Med konto:</strong>
					{dataflowCopy.accountChat.storage}
					{dataflowCopy.accountChat.retention}
				</li>
				<li><strong>OpenAI:</strong> {dataflowCopy.providerRetention}</li>
			</ul>
		</details>
	{/if}

	<!-- Kryssrutan och knappen hålls ihop och klistras mot botten. På en liten
		 skärm är rutan högre än sin skrollbehållare, och då måste själva
		 handlingen synas hela tiden - inte hamna under vecket i en inre skroll. -->
	<div class="consent-actions">
		{#if requireExplicitConfirmation}
			<label class="consent-check flex items-start gap-2 pt-3 text-sm leading-relaxed">
				<input type="checkbox" class="mt-1" bind:checked={confirmed} />
				<span>{confirmationLabel || 'Jag samtycker uttryckligen till behandlingen av känsliga uppgifter här.'}</span>
			</label>
		{/if}

		<div class="pt-3 pb-1">
			<button
				type="button"
				class="rounded-[var(--radius-input)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-95 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-55"
				onclick={() => void handleAccept()}
				disabled={submitting || !canAccept}
			>
				{submitting ? 'Sparar...' : acceptLabel}
			</button>
			{#if errorMessage}
				<p class="mt-2 text-sm text-[var(--error-foreground)]" role="alert">{errorMessage}</p>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Ogenomskinlig bakgrund i samma ton som rutan (sidbakgrund + rutans egen
	   2%-slöja) så texten som skrollar under inte syns igenom. Utan
	   skrollbehållare beter sig sticky som statisk, så de andra ytorna som
	   använder grinden är oförändrade. */
	.consent-actions {
		position: sticky;
		bottom: 0;
		background:
			linear-gradient(rgb(0 0 0 / 0.02), rgb(0 0 0 / 0.02)),
			var(--color-bg, #fff);
	}

	:global(.dark) .consent-actions {
		background:
			linear-gradient(rgb(255 255 255 / 0.04), rgb(255 255 255 / 0.04)),
			var(--color-bg, #111827);
	}

	.consent-dataflow {
		display: grid;
		gap: 0.35rem;
		padding-left: 1.05rem;
		list-style: disc;
	}

	.consent-more summary::-webkit-details-marker {
		display: none;
	}

	.consent-more summary {
		list-style: none;
	}
</style>
