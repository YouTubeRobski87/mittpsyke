<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
</script>

<SEO canonical="https://www.mittpsyke.se/redaktionell-metod" />

<svelte:head>
	<title>Redaktionell metod | MittPsyke</title>
	<meta
		name="description"
		content="Så arbetar MittPsyke med innehåll, källor, uppdateringar och gränsen mellan vardagsstöd och vård."
	/>
</svelte:head>

<main class="method-content mx-auto w-full px-5 py-10">
	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Redaktionell metod</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke skriver för att göra psykiskt mående lättare att förstå och prata om i vardagen.
		Innehållet är till för reflektion, förståelse och stöd i egen takt.
	</p>

	<section class="method-quick" aria-label="Kort sammanfattning">
		<h2 class="text-lg font-semibold mt-0 mb-2">Kort sammanfattning</h2>
		<ul>
			<li>MittPsyke är inte vård och ersätter inte vårdkontakt.</li>
			<li>Guider och artiklar ska vara skrivna på enkel svenska.</li>
			<li>AI-stödet ställer inte diagnos och ger inte medicinska beslut.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Gränsen mot vård</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke kan ge struktur, frågor och lugnt stöd när du vill sätta ord på något. Det är inte
		vård, diagnos eller behandling. Om du behöver bedömning, behandling eller vårdråd ska du
		kontakta vården, till exempel 1177.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Källor och saklighet</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		När innehåll ligger nära symtom, psykisk ohälsa eller vårdnära frågor ska det luta mot
		källor som 1177, Socialstyrelsen, Folkhälsomyndigheten och andra relevanta offentliga
		eller seriösa källor.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Vi försöker skriva utan onödig tyngd. Det betyder enkel svenska, tydliga avgränsningar och
		formuleringar som inte lovar mer än innehållet kan bära.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Guider, artiklar och AI-stöd</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li><strong>Guider</strong> är praktiska texter som hjälper dig förstå ett område och hitta nästa steg.</li>
		<li><strong>Artiklar</strong> förklarar ämnen mer redaktionellt och kan ge bakgrund, perspektiv och exempel.</li>
		<li><strong>AI-stöd</strong> är ett samtalsstöd i stunden. Det kan hjälpa dig reflektera, men ställer inte diagnos och ska inte användas för medicinska beslut.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Uppdateringar</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Innehåll kan uppdateras när bättre information, tydligare språk eller bättre
		säkerhetsformuleringar behövs. Ibland handlar en uppdatering om fakta, ibland om att göra
		texten lugnare, mer begriplig eller mer varsam.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Integritet och ansvar</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Läs mer om data och personuppgifter i <a href="/integritet" class="underline hover:no-underline">integritetspolicyn</a>.
		MittPsykes avgränsningar finns samlade i <a href="/ansvar" class="underline hover:no-underline">ansvarsinformationen</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Rapportera fel eller otydligheter</h2>
	<p class="opacity-80 leading-relaxed">
		Om du ser något som verkar fel, för otydligt eller behöver formuleras tryggare kan du kontakta
		oss på <a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a>.
	</p>
</main>

<style>
	.method-content {
		max-width: 720px;
	}

	.method-content p,
	.method-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
	}

	.method-content p {
		margin-bottom: 1rem;
	}

	.method-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.method-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.method-quick {
		margin-top: 1.1rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.method-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	@media (max-width: 640px) {
		.method-quick {
			padding: 0.9rem;
		}
	}
</style>
