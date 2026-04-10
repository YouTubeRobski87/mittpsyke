<script lang="ts">
	let {
		title = 'Samtycke krävs',
		dataLabel = 'det du delar här',
		serviceLabel = 'AI- och tredjepartstjänster',
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

	let declined = $state(false);

	function handleAccept() {
		declined = false;
		onAccept();
	}

	function handleDecline() {
		declined = true;
		onDecline();
	}
</script>

<div class="consent-gate relative z-[1] pointer-events-auto rounded-[var(--radius-card)] border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] p-4">
	<h2 class="text-sm font-semibold">{title}</h2>
	<p class="mt-2 text-sm leading-relaxed opacity-85">
		{dataLabel} kan innehålla känsliga uppgifter om psykisk hälsa och kan behandlas av {serviceLabel}.
		MittPsyke är inte vård.
	</p>
	<p class="mt-2 text-xs opacity-65">
		Läs mer i <a class="underline underline-offset-2" href={policyHref}>integritetspolicyn</a>.
	</p>
	<div class="mt-3 flex flex-wrap gap-2">
		<button
			type="button"
			class="rounded-[var(--radius-input)] border border-black/12 dark:border-white/12 px-3 py-2 text-sm opacity-85 hover:opacity-100 transition-opacity cursor-pointer"
			onclick={handleDecline}
		>
			Inte nu
		</button>
		<button
			type="button"
			class="rounded-[var(--radius-input)] bg-[var(--primary)] px-3 py-2 text-sm font-medium text-white hover:opacity-95 transition-opacity cursor-pointer"
			onclick={handleAccept}
		>
			Samtycker
		</button>
	</div>
	{#if declined}
		<p class="mt-2 text-xs opacity-60">Ingen aktivering har skett. Du kan samtycka senare om du vill använda funktionen.</p>
	{/if}
</div>
