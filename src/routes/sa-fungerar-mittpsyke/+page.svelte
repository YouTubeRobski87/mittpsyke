<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
</script>

<SEO canonical="https://mittpsyke.se/sa-fungerar-mittpsyke" />

<svelte:head>
	<title>Så fungerar MittPsyke | AI-stött reflektionsstöd</title>
	<meta
		name="description"
		content="Läs hur MittPsyke fungerar, hur AI används, vad anonymt läge innebär och vad tjänsten inte ersätter."
	/>
</svelte:head>

<main class="how-content mx-auto w-full px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Så fungerar MittPsyke' }]} />

	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Så fungerar MittPsyke</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke är en lugn plats för att skriva av sig, sortera tankar och reflektera i
		egen takt. Du kan börja enkelt, utan att behöva veta exakt vad du vill säga.
	</p>

	<section class="how-quick" aria-label="Kort sammanfattning">
		<h2 class="text-lg font-semibold mt-0 mb-2">Kort sammanfattning</h2>
		<ul>
			<li>MittPsyke är ett digitalt stöd för att skriva av sig och reflektera i lugn takt.</li>
			<li>Du kan börja anonymt utan konto.</li>
			<li>Konto används om du vill spara historik, dagbok eller måendemönster över tid.</li>
			<li>Tjänsten är inte vård, diagnos, behandling, terapi eller akuthjälp.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Hur det fungerar steg för steg</h2>
	<ol class="opacity-80 leading-relaxed mb-3 list-decimal pl-6 space-y-2">
		<li>Du väljer om du vill skriva, chatta, läsa guider, göra övningar eller använda dagboken.</li>
		<li>AI-stödet kan hjälpa till med varsamma frågor, spegling av text och mer struktur.</li>
		<li>Du styr själv takt, innehåll och hur mycket du vill dela.</li>
		<li>Du kan avsluta anonymt eller skapa konto om du vill spara och komma tillbaka senare.</li>
	</ol>

	<h2 class="text-lg font-semibold mt-8 mb-2">Hur AI används</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		AI används för textbaserat reflektionsstöd. Det kan hjälpa dig att formulera tankar,
		sortera det som känns rörigt och ställa lugna följdfrågor när du kör fast.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		AI kan också ha fel, missa saker eller svara ofullständigt. Svaren ska därför inte
		ses som professionella råd, diagnos eller behandlingsplan. De är stöd för reflektion,
		inte vård.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Anonymt läge och konto</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		I anonymt läge kan du börja med låg tröskel utan konto. Då skapas ingen kontohistorik
		som du kan komma tillbaka till senare.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Med konto kan du spara anteckningar, dagbok, historik och återvända till ditt eget
		material över tid. Läs mer om hur uppgifter hanteras i
		<a href="/integritet" class="underline hover:no-underline">integritetspolicyn</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Dagbok, måendelogg och historik</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Dagboken är din egen plats för reflektion. Du kan skriva kort eller långt, ofta eller
		sällan, beroende på vad som passar dig just nu.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Måendelogg och humörspårning kan hjälpa dig att se mönster över tid. Sparade
		anteckningar och reflektionshistorik kan göra det lättare att märka vad som påverkar
		dig, utan att du behöver dra stora slutsatser direkt.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">När MittPsyke inte räcker</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke kan vara ett första steg, men ersätter inte rätt hjälp när sådan behövs.
		Vid akut fara ska du ringa <a href="tel:112" class="underline hover:no-underline">112</a>.
		För vårdråd kan du kontakta
		<a href="https://www.1177.se" class="underline hover:no-underline">1177</a>.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Vid stark oro, långvarigt dåligt mående eller behov av behandling bör du söka
		professionell hjälp. Det går att använda MittPsyke som stöd i vardagen och samtidigt
		ta kontakt med vården eller en annan trygg person.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Trygghet och integritet</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Du kan läsa mer om hur MittPsyke hanterar integritet, ansvar, cookies, villkor och
		tillgänglighet på sidorna nedan.
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li><a href="/integritet" class="underline hover:no-underline">Integritet</a></li>
		<li><a href="/ansvar" class="underline hover:no-underline">Ansvar</a></li>
		<li><a href="/kontakt-och-villkor" class="underline hover:no-underline">Kontakt och villkor</a></li>
		<li><a href="/cookies-och-leverantorer" class="underline hover:no-underline">Cookies och leverantörer</a></li>
		<li><a href="/tillganglighet" class="underline hover:no-underline">Tillgänglighet</a></li>
	</ul>
</main>

<style>
	.how-content {
		max-width: 720px;
	}

	.how-content p,
	.how-content li {
		font-family: var(--font-body);
		font-weight: 400;
		line-height: 1.7;
		letter-spacing: -0.005em;
	}

	.how-content p {
		margin-bottom: 1rem;
	}

	.how-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.how-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.how-quick {
		margin-top: 1.1rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.how-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
	}

	@media (max-width: 640px) {
		.how-quick {
			padding: 0.9rem;
		}
	}
</style>
