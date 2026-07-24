<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
</script>

<SEO canonical="https://www.mittpsyke.se/ansvar" />

<svelte:head>
	<title>Ansvarsinfo | MittPsyke</title>
	<meta
		name="description"
		content="Tydlig information om MittPsyke som AI-baserat samtalsstöd, dess begränsningar och när du bör söka vård."
	/>
</svelte:head>

<main class="ansvar-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Ansvar' }]} />

	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Ansvarsinfo</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke är ett AI-baserat samtalsstöd. Tjänsten är till för reflektion och stöd i vardagen, men ersätter inte
		vård av läkare, psykolog eller annan legitimerad vårdpersonal.
	</p>

	<section class="trust-quick" aria-label="Snabb överblick">
		<h2 class="text-lg font-semibold mt-0 mb-2">Snabb överblick</h2>
		<ul>
			<li><strong>Är detta vård?</strong> Nej, det är ett samtalsstöd i vardagen.</li>
			<li><strong>Vad används tjänsten till?</strong> Reflektion, struktur och stöd i stunden.</li>
			<li><strong>Vad gäller i akut läge?</strong> Ring 112 direkt vid akut fara.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vad tjänsten används till</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Tjänsten är utformad för lugnt samtalsstöd, egen reflektion och hjälp att sortera tankar. Den är ett
		komplement till vård, inte en ersättning.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Viktiga begränsningar</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>Innehållet kan vara ofullständigt eller innehålla fel.</li>
		<li>MittPsyke ställer inte diagnos och erbjuder inte individanpassad behandling.</li>
		<li>Tjänsten ska inte användas som enda underlag för medicinska beslut.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">När du bör söka vård</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Om du mår dåligt under längre tid, får ökade symtom eller behöver professionell bedömning bör du kontakta vården.
		För vårdråd i Sverige kan du kontakta 1177.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Akut situation</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Vid akut fara, ring 112. Du kan också använda
		<a
			href="https://stodlinjer.se"
			target="_blank"
			rel="noopener noreferrer"
			class="underline hover:no-underline"
		>
			Akut hjälp
		</a>
		för att hitta stödlinjer.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke kan vid vissa tecken på akut kris visa ett särskilt säkerhetssvar med hänvisning till akut hjälp och stödlinjer. Tjänsten är ändå inte en akuttjänst och ersätter inte vård eller larm vid fara.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Så använder vi AI</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Läs mer om säkerhetsnätet som körs innan AI:n svarar och vilka gränser som gäller för
		AI-stödet i <a href="/ansvarsfull-ai" class="underline hover:no-underline">Ansvarsfull AI</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Kontakt</h2>
	<p class="opacity-80 leading-relaxed">
		Om du har frågor om ansvar och hur tjänsten fungerar kan du kontakta oss på
		<a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a>.
	</p>
</main>

<style>
	.ansvar-content {
		max-width: 720px;
	}

	.ansvar-content p,
	.ansvar-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
	}

	.ansvar-content p {
		margin-bottom: 1rem;
	}

	.ansvar-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.ansvar-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.trust-quick {
		margin-top: 1.1rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.trust-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	@media (max-width: 640px) {
		.trust-quick {
			padding: 0.9rem;
		}
	}
</style>
