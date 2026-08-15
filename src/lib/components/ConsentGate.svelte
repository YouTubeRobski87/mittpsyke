<script lang="ts">
	let {
		title = 'Innan du börjar',
		dataLabel = '',
		serviceLabel = '',
		policyHref = '/integritet',
		responsibilityHref = '/ansvar',
		onAccept = () => {}
	}: {
		title?: string;
		dataLabel?: string;
		serviceLabel?: string;
		policyHref?: string;
		responsibilityHref?: string;
		onAccept?: () => void | Promise<void>;
	} = $props();

	const usesCustomCopy = $derived(Boolean(dataLabel || serviceLabel));
	let submitting = $state(false);
	let errorMessage = $state('');

	async function handleAccept() {
		if (submitting) return;
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
			MittPsyke är ett stöd i egen takt, inte vård. {dataLabel || 'Det du delar här'} kan
			innehålla känsliga uppgifter om mående och behandlas av {serviceLabel || 'AI- och tredjepartstjänster'}
			för att kunna ge dig stöd här.
		</p>
		<p class="mt-2 text-xs opacity-65">
			Läs mer i <a class="underline underline-offset-2" href={policyHref}>integritetspolicyn</a>
			och <a class="underline underline-offset-2" href={responsibilityHref}>ansvarsinformationen</a>.
		</p>
	{:else}
		<p id="health-consent-copy" class="mt-2 text-sm leading-relaxed opacity-85">
			MittPsyke är ett stöd i egen takt, inte vård. Det du skriver kan handla om mående och
			andra känsliga uppgifter. Texten behandlas för att kunna ge dig stöd här.
		</p>
		<p class="mt-2 text-xs opacity-65">
			Läs mer i <a class="underline underline-offset-2" href={policyHref}>integritetspolicyn</a>
			och <a class="underline underline-offset-2" href={responsibilityHref}>ansvarsinformationen</a>.
		</p>
	{/if}
	<div class="mt-3">
		<button
			type="button"
			class="rounded-[var(--radius-input)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-95 transition-opacity cursor-pointer"
			onclick={() => void handleAccept()}
			disabled={submitting}
		>
			{submitting ? 'Sparar...' : 'Jag förstår och vill fortsätta'}
		</button>
		{#if errorMessage}
			<p class="mt-2 text-sm text-[var(--error-foreground)]" role="alert">{errorMessage}</p>
		{/if}
	</div>
</div>
