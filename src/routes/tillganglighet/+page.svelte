<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
</script>

<SEO canonical="https://www.mittpsyke.se/tillganglighet" />

<svelte:head>
	<title>Tillgänglighet | MittPsyke</title>
	<meta
		name="description"
		content="Så arbetar MittPsyke med tillgänglighet, tydlig struktur och lugna flöden."
	/>
</svelte:head>

<main class="accessibility-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Tillgänglighet' }]} />

	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Tillgänglighet</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke vill vara enkelt att använda även när du är stressad, orolig, trött, har svårt
		att koncentrera dig eller har låg energi. Målet är en tydlig struktur och lugna flöden som
		gör det lättare att ta ett steg i taget.
	</p>

	<section class="accessibility-quick" aria-label="Kort sammanfattning">
		<h2 class="text-lg font-semibold mt-0 mb-2">Så arbetar vi</h2>
		<ul>
			<li>Tydliga rubriker och en enkel sidstruktur.</li>
			<li>Enkel svenska med låg tröskel.</li>
			<li>Kontrast, läsbarhet och lugna flöden utan onödig friktion.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Principer vi utgår från</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Arbetet utgår från relevanta principer i WCAG 2.1 AA och EN 301 549. Vi säger inte att
		MittPsyke är fullt verifierat mot dessa krav, men de används som stöd när vi förbättrar
		struktur, språk och interaktion.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Exempel i tjänsten</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>Rubriker ska göra det lätt att förstå var du är och vad nästa del handlar om.</li>
		<li>Texter ska vara skrivna på enkel svenska utan onödigt kliniskt språk.</li>
		<li>Tangentbordsnavigering ska fungera där det är möjligt.</li>
		<li>Färg, kontrast och textstorlek ska stödja god läsbarhet.</li>
		<li>Flöden ska kännas lugna och undvika onödiga steg.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Kända begränsningar</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		En full extern tillgänglighetsgranskning är ännu inte publicerad. Vissa interaktiva delar,
		som formulär, chatt och mer dynamiska vyer, kan behöva förbättras löpande när vi hittar
		hinder eller får återkoppling.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Rapportera problem</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Om något är svårt att läsa, använda eller förstå får du gärna höra av dig till
		<a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a>.
		Beskriv gärna vilken sida det gäller och vad som hindrade dig.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Relaterad information</h2>
	<p class="opacity-80 leading-relaxed">
		Läs också om <a href="/integritet" class="underline hover:no-underline">integritet</a>,
		<a href="/ansvar" class="underline hover:no-underline">ansvar</a> och
		<a href="/redaktionell-metod" class="underline hover:no-underline">redaktionell metod</a>.
	</p>
</main>

<style>
	.accessibility-content {
		max-width: 720px;
	}

	.accessibility-content p,
	.accessibility-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
	}

	.accessibility-content p {
		margin-bottom: 1rem;
	}

	.accessibility-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.accessibility-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.accessibility-quick {
		margin-top: 1.1rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.accessibility-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	@media (max-width: 640px) {
		.accessibility-quick {
			padding: 0.9rem;
		}
	}
</style>
