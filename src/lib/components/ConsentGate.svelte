<script lang="ts">
	let {
		title = 'Innan du börjar',
		dataLabel = '',
		serviceLabel = '',
		policyHref = '/integritet',
		onAccept = () => {},
		onDecline = () => {}
	}: {
		title?: string;
		dataLabel?: string;
		serviceLabel?: string;
		policyHref?: string;
		onAccept?: () => void;
		onDecline?: () => void;
	} = $props();

	let checked = $state(false);
	let declined = $state(false);
	const usesCustomCopy = $derived(Boolean(dataLabel || serviceLabel));

	function handleAccept() {
		if (!checked) return;
		declined = false;
		onAccept();
	}

	function handleDecline() {
		declined = true;
		onDecline();
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
			{dataLabel || 'Det du delar här'} kan innehålla känsliga uppgifter om psykisk hälsa och kan behandlas av {serviceLabel || 'AI- och tredjepartstjänster'}.
			MittPsyke är inte vård.
		</p>
		<p class="mt-2 text-xs opacity-65">
			Läs mer i <a class="underline underline-offset-2" href={policyHref}>integritetspolicyn</a>.
		</p>
	{:else}
		<p class="mt-2 text-sm leading-relaxed opacity-85">
			Det du skriver här kan innehålla känsliga uppgifter om hur du mår.
		</p>
		<p id="health-consent-copy" class="mt-2 text-sm leading-relaxed opacity-85">
			För att kunna ge stöd behöver MittPsyke behandla innehållet enligt
			<a class="underline underline-offset-2" href={policyHref}>integritetspolicyn</a>.
		</p>
		<p class="mt-2 text-sm leading-relaxed opacity-85">
			Tjänsten är inte vård, diagnos eller behandling. Vid akuta lägen – ring 112. För vårdråd – kontakta 1177.
		</p>
	{/if}
	<label class="consent-check mt-3 flex items-start gap-2 text-sm leading-relaxed">
		<input type="checkbox" bind:checked class="mt-1" />
		<span>
			{usesCustomCopy
				? 'Jag förstår och samtycker till att innehållet behandlas enligt integritetspolicyn'
				: 'Jag förstår och samtycker till att mitt innehåll behandlas enligt integritetspolicyn'}
		</span>
	</label>
	<div class="mt-3 flex flex-wrap gap-2">
		<button
			type="button"
			class="rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 px-3 py-2 text-sm opacity-85 hover:opacity-100 transition-opacity cursor-pointer"
			onclick={handleDecline}
		>
			{usesCustomCopy ? 'Inte nu' : 'Avbryt'}
		</button>
		<button
			type="button"
			class="rounded-[var(--radius-input)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-95 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
			disabled={!checked}
			onclick={handleAccept}
		>
			{usesCustomCopy ? 'Samtycker' : 'Börja skriva'}
		</button>
	</div>
	{#if declined}
		<p class="mt-2 text-xs opacity-60">Ingen aktivering har skett. Du kan samtycka senare om du vill använda funktionen.</p>
	{/if}
</div>

<style>
	.consent-check input {
		width: 1rem;
		height: 1rem;
		flex: 0 0 auto;
		accent-color: var(--primary);
	}
</style>
