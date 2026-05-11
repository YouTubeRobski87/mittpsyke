<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';

	const organizationNumber = '198712284895';
</script>

<SEO canonical="https://www.mittpsyke.se/kontakt-och-villkor" />

<svelte:head>
	<title>Kontakt och villkor | MittPsyke</title>
	<meta
		name="description"
		content="Kontaktuppgifter, grundläggande villkor och viktiga gränser för MittPsyke. Läs hur tjänsten får användas och vad den inte ersätter."
	/>
</svelte:head>

<main class="terms-content mx-auto w-full px-5 py-10">
	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Kontakt och villkor</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		Här hittar du kontaktuppgifter, grundläggande användarvillkor och viktiga gränser för
		MittPsyke. Texten är skriven för att vara enkel att förstå, inte som en full juridisk
		genomgång.
	</p>

	<section class="terms-quick" aria-label="Kort sammanfattning">
		<h2 class="text-lg font-semibold mt-0 mb-2">Snabb överblick</h2>
		<ul>
			<li>MittPsyke är stöd för reflektion, dagbok och textbaserade samtal.</li>
			<li>Tjänsten är inte vård, diagnos, behandling, terapi eller akuthjälp.</li>
			<li>Vid akut fara ska du ringa 112. För vårdråd kan du kontakta 1177.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Kontakt</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-none pl-0 space-y-1.5">
		<li><strong>Verksamhet:</strong> MittPsyke</li>
		<li><strong>Organisationsnummer:</strong> {organizationNumber}</li>
		<li>
			<strong>E-post:</strong>
			<a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a>
		</li>
		<li><strong>Postadress:</strong> Kompletteras.</li>
	</ul>
	<p class="opacity-80 leading-relaxed mb-3">
		Du kan kontakta MittPsyke via e-post om du har frågor om konto, data, export,
		radering, tekniska problem eller hur tjänsten fungerar.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vad MittPsyke är</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke är ett digitalt stöd för självreflektion, dagbok, textbaserat samtalsstöd
		och att sortera tankar i lugn takt. Du kan börja anonymt utan konto. Om du vill spara
		historik, dagboksanteckningar eller komma tillbaka till sådant du skrivit över tid
		behöver du skapa ett konto.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vad MittPsyke inte är</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke är inte vård, diagnos, behandling, terapi, akuthjälp eller en ersättning
		för professionell hjälp när sådan behövs. AI-svar kan vara fel eller ofullständiga
		och ska ses som stöd för reflektion, inte som professionella råd.
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>Vid akut fara: ring <a href="tel:112" class="underline hover:no-underline">112</a>.</li>
		<li>För vårdrådgivning: kontakta <a href="https://www.1177.se" class="underline hover:no-underline">1177</a>.</li>
		<li>
			Om du behöver mänskligt stöd kan du hitta stödlinjer via
			<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer" class="underline hover:no-underline">stodlinjer.se</a>.
		</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Grundläggande användarvillkor</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>Du ansvarar för vad du skriver och delar i tjänsten.</li>
		<li>Tjänsten får inte användas för olagligt innehåll, hot, trakasserier, spam eller försök att skada tjänsten.</li>
		<li>Du får inte försöka kringgå säkerhetsfunktioner eller använda tjänsten på ett sätt som stör andra.</li>
		<li>Skriv inte in andra personers känsliga uppgifter utan deras samtycke.</li>
		<li>MittPsyke kan ändras, utvecklas eller tillfälligt vara otillgängligt.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Konto, data och radering</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Med konto kan viss information sparas för att du ska kunna återvända till historik,
		dagbok och inställningar. Du kan begära export eller radering enligt
		<a href="/integritet" class="underline hover:no-underline">integritetspolicyn</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Ålder och samtycke</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Tjänsten riktar sig inte särskilt till barn under 13 år. Användare under 16 år bör
		använda konto med vårdnadshavares samtycke. Om du är ung och känner oro, fara eller
		behöver hjälp från en vuxen, prata med en trygg vuxen. Vid akut fara ska du ringa 112.
		För vårdråd kan du kontakta 1177.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Relaterad information</h2>
	<p class="opacity-80 leading-relaxed">
		Läs också om <a href="/integritet" class="underline hover:no-underline">integritet</a>,
		<a href="/ansvar" class="underline hover:no-underline">ansvar</a>,
		<a href="/tillganglighet" class="underline hover:no-underline">tillgänglighet</a> och
		<a href="/redaktionell-metod" class="underline hover:no-underline">redaktionell metod</a>.
	</p>
</main>

<style>
	.terms-content {
		max-width: 720px;
	}

	.terms-content p,
	.terms-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
	}

	.terms-content p {
		margin-bottom: 1rem;
	}

	.terms-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.terms-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.terms-quick {
		margin-top: 1.1rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.terms-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	@media (max-width: 640px) {
		.terms-quick {
			padding: 0.9rem;
		}
	}
</style>
