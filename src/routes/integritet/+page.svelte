<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
	import { dataflowCopy } from '$lib/dataflow-copy';
</script>

<SEO canonical="https://mittpsyke.se/integritet" />

<svelte:head>
	<title>Integritetspolicy | MittPsyke</title>
	<meta
		name="description"
		content="Tydlig information om vilka uppgifter MittPsyke kan behandla, varför de används, hur länge de sparas och vilka rättigheter du har."
	/>
</svelte:head>

<main class="mx-auto w-full max-w-3xl px-5 py-10">
	<Breadcrumbs items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Integritet' }]} />

	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Integritetspolicy</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke är en plats för att skriva, reflektera och följa hur du har det över tid, med en AI-chatt som du
		kan använda om du vill. Här förklarar vi i enkel svenska vilka uppgifter som kan behandlas, varför de används
		och vilka val du har.
	</p>
	<p class="opacity-70 leading-relaxed text-sm">
		Hoppa direkt till:
		<a href="#sammanfattning" class="underline hover:no-underline">sammanfattning</a>,
		<a href="#anonymt-lage" class="underline hover:no-underline">anonymt läge</a>,
		<a href="#med-konto" class="underline hover:no-underline">med konto</a>,
		<a href="#ai-minne" class="underline hover:no-underline">AI-minne</a>,
		<a href="#diktering" class="underline hover:no-underline">diktering</a>,
		<a href="#leverantorer" class="underline hover:no-underline">leverantörer</a>,
		<a href="#sa-gor-du" class="underline hover:no-underline">export och radering</a>.
	</p>

	<!-- SAMMANFATTNING -->
	<section id="sammanfattning" class="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 sm:p-5 mt-6" aria-label="Sammanfattning">
		<h2 class="text-lg font-semibold mt-0 mb-3">Sammanfattning</h2>
		<div class="grid gap-4 sm:grid-cols-3">
			<div>
				<h3 class="text-sm font-semibold mt-0 mb-1.5">Utan konto</h3>
				<ul class="opacity-80 leading-relaxed text-sm list-disc pl-5 space-y-1.5">
					<li>Dagboksutkast stannar i din webbläsare.</li>
					<li>Gästchattar sparas inte av MittPsyke. Det du skickar går till OpenAI för att ett svar ska skapas.</li>
					<li>Analysverktyg används bara om du godkänner dem.</li>
				</ul>
			</div>
			<div>
				<h3 class="text-sm font-semibold mt-0 mb-1.5">Med konto</h3>
				<ul class="opacity-80 leading-relaxed text-sm list-disc pl-5 space-y-1.5">
					<li>Det du sparar lagras i Supabase inom EU.</li>
					<li>Chatten kan spara ett kort AI-minne, högst tio teman.</li>
					<li>Du kan själv exportera din data och radera kontot i inställningarna.</li>
				</ul>
			</div>
			<div>
				<h3 class="text-sm font-semibold mt-0 mb-1.5">Externa tjänster</h3>
				<ul class="opacity-80 leading-relaxed text-sm list-disc pl-5 space-y-1.5">
					<li>OpenAI och Anthropic när du använder en AI-funktion.</li>
					<li>Webbläsarens taligenkänning när du använder Prata in.</li>
					<li>Have I Been Pwned när du kontrollerar en e-postadress.</li>
					<li>Render, Cloudflare och Supabase för drift och lagring.</li>
				</ul>
			</div>
		</div>
		<p class="opacity-70 leading-relaxed text-sm mt-4 mb-0">
			MittPsyke är inte vård eller behandling. Vid akut fara, ring 112. För vårdråd i Sverige, kontakta 1177.
		</p>
	</section>

	<!-- PERSONUPPGIFTSANSVARIG -->
	<section class="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 sm:p-5 mt-6" aria-label="Personuppgiftsansvarig">
		<h2 class="text-lg font-semibold mt-0 mb-2">Personuppgiftsansvarig</h2>
		<ul class="opacity-80 leading-relaxed list-none space-y-1.5 text-sm">
			<li><strong>Företag:</strong> MittPsyke (Enskild näringsverksamhet)</li>
			<li><strong>Organisationsnummer:</strong> 198712284895</li>
			<li><strong>Grundare:</strong> Robert Claesson</li>
			<li><strong>E-post:</strong> <a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a></li>
		</ul>
	</section>

	<!-- ANONYMT LÄGE -->
	<section id="anonymt-lage" class="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 sm:p-5 mt-6 mb-6" aria-label="Anonymt läge">
		<h2 class="text-lg font-semibold mt-0 mb-2">Anonymt läge — så fungerar det</h2>
		<p class="opacity-80 leading-relaxed text-sm mb-3">
			Du kan använda MittPsyke utan att skapa konto. Då gäller:
		</p>
		<ul class="opacity-80 leading-relaxed text-sm list-disc pl-6 space-y-2">
			<li><strong>Ingen profil skapas</strong> — du använder tjänsten utan konto.</li>
			<li><strong>Ingen historik i konto</strong> — om du inte skapar konto finns ingen sparad historik kopplad till ett konto i MittPsyke.</li>
			<li><strong>Ingen e-post krävs</strong> — du behöver inte registrera dig.</li>
			<li><strong>Inga kakor utöver funktionella</strong> — om du inte godkänner analys i cookie-bannern.</li>
		</ul>
		<p class="opacity-70 leading-relaxed text-sm mt-3">
			{dataflowCopy.guestChat.retention} {dataflowCopy.guestChat.aiTransfer}
		</p>
		<p class="opacity-70 leading-relaxed text-sm mt-3">
			För anonym dagbok gäller: {dataflowCopy.anonymousDiary.storage}
			{dataflowCopy.anonymousDiary.transfer}
		</p>
	</section>

	<section id="med-konto" class="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-4 sm:p-5 mt-2 mb-6" aria-label="Med konto">
		<h2 class="text-lg font-semibold mt-0 mb-2">Med konto</h2>
		<ul class="opacity-80 leading-relaxed text-sm list-disc pl-6 space-y-2">
			<li><strong>Spara och fortsätt</strong> — dagbok, kvällsincheckningar, chattar och inställningar sparas i Supabase så att du kan komma tillbaka till dem.</li>
			<li><strong>Följ ditt mående</strong> — det du själv sparar kan visas som mönster över tid.</li>
			<li><strong>AI-minne i chatten</strong> — chatten kan spara korta teman för kontinuitet, se <a href="#ai-minne" class="underline hover:no-underline">AI-minne</a>.</li>
			<li><strong>Export och radering</strong> — du exporterar din data och raderar kontot själv i inställningarna, se <a href="#sa-gor-du" class="underline hover:no-underline">export och radering</a>.</li>
		</ul>
	</section>

	<!-- NÄR SAMTYCKE KRÄVS -->
	<h2 class="text-lg font-semibold mt-8 mb-2">När krävs ditt samtycke?</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke ber om ditt samtycke i följande situationer:
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li><strong>Cookie-bannern</strong> — innan analysverktyg aktiveras.</li>
		<li><strong>Kontoskapande</strong> — när du registrerar dig godkänner du att kontouppgifter sparas.</li>
		<li><strong>AI-funktioner</strong> — innan du skickar ett chattmeddelande eller aktivt använder AI på sparad dagbokstext ber vi om samtycke till den behandlingen (artikel 9 GDPR). Att skriva ett anonymt, lokalt dagboksutkast startar inte AI-behandling.</li>
		<li><strong>Anonyma berättelser</strong> — innan du skickar en berättelse ber vi separat om godkännande att skicka texten till OpenAI för en första AI-granskning före manuell granskning.</li>
	</ul>
	<p class="opacity-80 leading-relaxed mb-3">
		Du kan <strong>när som helst återkalla</strong> ett samtycke. Samtycket för anonym chatt ligger i en
		kaka som upphör av sig själv inom ett dygn, och försvinner direkt om du rensar webbläsarens kakor.
		Är du inloggad återkallar du i stället i
		<a href="/dashboard/installningar" class="underline hover:no-underline">kontoinställningarna</a>,
		där du var för sig kan dra tillbaka samtycket för känsliga uppgifter, dagbokens AI-reflektioner
		och Dagens fråga. Återkallar du samtycket för känsliga uppgifter stängs även AI-chatten
		tills du lämnar ett nytt samtycke.
	</p>

	<!-- VILKA UPPGIFTER -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Vilka uppgifter som kan behandlas</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>Kontouppgifter, till exempel e-postadress och tekniska identifierare som behövs för inloggning.</li>
		<li>Innehåll som du själv väljer att skriva eller spara, till exempel i dagbok, chatt eller andra fält i tjänsten.</li>
		<li>Korta teman som chatten sparar som AI-minne när du är inloggad.</li>
		<li>Uppgifter i kontoinställningar, till exempel tilltalsnamn och val kring påminnelser eller utskick.</li>
		<li>Tekniska uppgifter som behövs för funktion, säkerhet, missbruksförebyggande arbete och stabil drift.</li>
		<li>Uppgifter om användning av AI-funktioner när du aktivt väljer att använda dem.</li>
		<li>Anonyma berättelser som du väljer att skicka in, samt en hash av IP-adressen för att begränsa spam och koppla samman bidrag från samma IP-adress.</li>
		<li>Pseudonymiserade användningshändelser, se <a href="#handelser" class="underline hover:no-underline">användningshändelser</a>.</li>
		<li>En e-postadress som du själv kontrollerar i <a href="/dataintrang" class="underline hover:no-underline">dataintrångskontrollen</a>.</li>
	</ul>

	<!-- KÄNSLIGA UPPGIFTER -->
	<section class="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-4 sm:p-5 mt-2 mb-6" aria-label="Känsliga uppgifter">
		<h3 class="text-base font-semibold mt-0 mb-2">⚠️ Känsliga uppgifter (artikel 9 GDPR)</h3>
		<p class="opacity-80 leading-relaxed text-sm">
			Innehåll som du väljer att skicka i chatt eller använda i en AI-funktion kan röra psykisk hälsa och betraktas som
			<strong>känsliga personuppgifter</strong> enligt GDPR artikel 9. I tjänstens UI ber MittPsyke om ditt
			<strong>uttryckliga samtycke</strong> innan den relevanta AI-funktionen startar. Du kan när som helst
			återkalla samtycket i
			<a href="/dashboard/installningar" class="underline hover:no-underline">kontoinställningarna</a>,
			genom att radera ditt konto eller genom att kontakta oss.
		</p>
	</section>

	<!-- AI-MINNE -->
	<section id="ai-minne" class="scroll-mt-6" aria-label="AI-minne">
		<h2 class="text-lg font-semibold mt-8 mb-2">AI-minne i chatten</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			När du är inloggad och chattar kan MittPsyke spara ett kort minne: högst tio korta teman som
			sammanfattas ur dina senaste chattmeddelanden, till exempel något du ofta återkommer till.
			Syftet är kontinuitet, så att chatten inte behöver börja om från början varje gång.
		</p>
		<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
			<li><strong>Bara med konto.</strong> Gästchatten har inget minne.</li>
			<li><strong>När det skapas.</strong> Minnet uppdateras tidigast efter tre meddelanden från dig och sedan
				ungefär var tredje meddelande. Då skickas de senaste delarna av samtalet (högst 16 meddelanden) och de
				teman som redan finns till OpenAI, som returnerar en uppdaterad lista. Det sker bara när du använder
				chatten efter att ha gett samtycke till AI-behandling.</li>
			<li><strong>Vad som sparas.</strong> Korta, neutrala teman på högst 240 tecken vardera. AI:n instrueras att
				inte spara namn, platser, hälsouppgifter eller krisinnehåll, men en sammanfattning kan ändå råka
				innehålla sådant du själv skrivit.</li>
			<li><strong>Inte en diagnos.</strong> Minnet är ingen bedömning, diagnos eller medicinsk profil. Temana
				följer bara med som bakgrund till chatten i dina kommande samtal.</li>
			<li><strong>Var det lagras.</strong> I Supabase inom EU (Frankfurt), bara åtkomligt för ditt konto.</li>
			<li><strong>Export och radering.</strong> Minnet ingår som ”sparade teman” i din dataexport och raderas när
				du raderar kontot. Det finns i dag ingen knapp för att radera enbart minnet. Vill du det, mejla
				<a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a>.</li>
		</ul>
	</section>

	<!-- DIKTERING -->
	<section id="diktering" class="scroll-mt-6" aria-label="Diktering och uppläsning">
		<h2 class="text-lg font-semibold mt-8 mb-2">Diktering och uppläsning i chatten</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			<strong>Prata in</strong> använder din webbläsares inbyggda taligenkänning (Web Speech API). Det är
			webbläsaren, inte MittPsyke, som omvandlar tal till text. Beroende på webbläsare och enhet kan det ske på
			själva enheten eller hos webbläsarens leverantör, till exempel Google eller Apple. Den behandlingen sker
			utanför MittPsykes server och styrs av webbläsarleverantörens villkor.
		</p>
		<p class="opacity-80 leading-relaxed mb-3">
			MittPsyke tar inte emot något ljud. Den färdiga texten hamnar i chattfältet och hanteras som ett vanligt
			chattmeddelande när det skickas. Med automatisk sändning skickas texten efter en kort paus, och du kan
			avbryta innan dess. Vill du undvika taligenkänningen skriver du i stället i textfältet.
		</p>
		<p class="opacity-80 leading-relaxed mb-3">
			<strong>Lyssna</strong> läser upp svar med webbläsarens talsyntes. Vissa röster, till exempel
			webbläsarens molnbaserade röster, kan skicka texten som läses upp till webbläsarens leverantör.
		</p>
	</section>

	<!-- DATAINTRÅNGSKONTROLL -->
	<section id="dataintrang" class="scroll-mt-6" aria-label="Dataintrångskontroll">
		<h2 class="text-lg font-semibold mt-8 mb-2">Kontroll av e-post i dataintrång</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			På <a href="/dataintrang" class="underline hover:no-underline">dataintrångssidan</a> kan du kontrollera om en
			e-postadress förekommer i kända dataintrång. Kontrollen görs bara när du själv skriver in en adress och
			startar den.
		</p>
		<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
			<li>Adressen skickas via MittPsykes server till den externa tjänsten <strong>Have I Been Pwned</strong>, som
				svarar med vilka kända intrång adressen finns med i.</li>
			<li>Eftersom anropet görs från servern skickas din IP-adress inte till Have I Been Pwned. Servern använder
				IP-adressen kortvarigt för att begränsa hur många kontroller som kan göras per minut.</li>
			<li>MittPsyke sparar inte adressen eller resultatet i någon databas, och resultatet visas bara i din
				webbläsare.</li>
		</ul>
	</section>

	<!-- ANVÄNDNINGSHÄNDELSER -->
	<section id="handelser" class="scroll-mt-6" aria-label="Användningshändelser">
		<h2 class="text-lg font-semibold mt-8 mb-2">Användningshändelser på servern</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			För att förstå om människor börjar använda tjänsten och återkommer över tid kan servern
			registrera pseudonymiserade användningshändelser för användare med konto som omfattas av mätningen.
			En händelse skapas först efter att ett dagboksinlägg, ett verkligt användarmeddelande i en inloggad
			chatt eller en kvällsincheckning faktiskt har sparats. Mätningen visar den första meningsfulla
			användningen och om användaren återkommer ungefär vecka 1 och vecka 4.
		</p>
		<p class="opacity-80 leading-relaxed mb-3">
			Mätningen börjar när funktionen aktiveras. Äldre användning analyseras inte bakåt för att skapa
			dessa händelser.
		</p>
		<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
			<li>En händelse består av ett fast händelsenamn, en tidpunkt och en servergenererad pseudonym.
				<strong>Dagbokstext, chattmeddelanden, kvällsincheckningens text, humörvärden, ämnen eller diagnoser,
				AI-svar, e-post och rått användar-id ingår aldrig.</strong></li>
			<li>Pseudonymen skapas som en hash av ditt användar-id med en hemlig nyckel på servern, så varken id eller
				e-post står i klartext. Det är en pseudonymisering, inte en anonymisering: MittPsyke kan räkna fram
				samma pseudonym igen från ett känt användar-id.</li>
			<li>Händelserna lagras i Supabase inom EU. De raderas inte när kontot raderas, men kan då inte längre
				kopplas till ett konto i MittPsyke.</li>
		</ul>
	</section>

	<!-- DATAFLÖDESKARTA -->
	<h2 class="text-lg font-semibold mt-8 mb-1">Så hanteras uppgifter i tjänsten</h2>
	<p class="opacity-70 text-sm leading-relaxed mb-4">
		Tabellen nedan visar vilka uppgifter som behandlas, var de lagras, vilken rättslig grund som gäller och hur länge de sparas.
	</p>
	<div class="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 mb-6">
		<table class="w-full text-sm leading-relaxed border-collapse">
			<caption class="sr-only">Översikt över personuppgifter, system, region, rättslig grund och lagringstid</caption>
			<thead>
				<tr class="bg-black/[0.04] dark:bg-white/[0.04] text-left">
					<th scope="col" class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Datatyp</th>
					<th scope="col" class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">System / leverantör</th>
					<th scope="col" class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Region</th>
					<th scope="col" class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Rättslig grund</th>
					<th scope="col" class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Lagringstid</th>
				</tr>
			</thead>
			<tbody class="opacity-80 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
				<tr>
					<th scope="row" class="px-4 py-3 font-normal text-left">Kontouppgifter (e-post, namn)</th>
					<td class="px-4 py-3">Supabase</td>
					<td class="px-4 py-3">EU (Frankfurt)</td>
					<td class="px-4 py-3">Avtal</td>
					<td class="px-4 py-3">Tills kontot raderas</td>
				</tr>
				<tr class="bg-black/[0.01] dark:bg-white/[0.01]">
					<th scope="row" class="px-4 py-3 font-normal text-left">Gästchatt</th>
					<td class="px-4 py-3">MittPsyke + OpenAI när du skickar</td>
					<td class="px-4 py-3">Se leverantörsavtal</td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Endast öppen chattvy i MittPsyke</td>
				</tr>
				<tr>
					<th scope="row" class="px-4 py-3 font-normal text-left">Sparad chatt med konto</th>
					<td class="px-4 py-3">Supabase</td>
					<td class="px-4 py-3">EU (Frankfurt)</td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Tills kontot raderas</td>
				</tr>
				<tr class="bg-black/[0.01] dark:bg-white/[0.01]">
					<th scope="row" class="px-4 py-3 font-normal text-left">AI-minne (sparade teman)</th>
					<td class="px-4 py-3">Supabase. Sammanfattas av OpenAI.</td>
					<td class="px-4 py-3">Lagring: EU (Frankfurt)</td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Ersätts löpande, högst tio teman. Tills kontot raderas</td>
				</tr>
				<tr>
					<th scope="row" class="px-4 py-3 font-normal text-left">Sparad dagbokstext</th>
					<td class="px-4 py-3">Supabase. {dataflowCopy.savedDiary.aiTransfer}</td>
					<td class="px-4 py-3">Se leverantörsavtal</td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Tills inlägget eller kontot raderas</td>
				</tr>
				<tr class="bg-black/[0.01] dark:bg-white/[0.01]">
					<th scope="row" class="px-4 py-3 font-normal text-left">Diktering (Prata in)</th>
					<td class="px-4 py-3">Din webbläsares taligenkänning</td>
					<td class="px-4 py-3">Beror på webbläsare och enhet</td>
					<td class="px-4 py-3">Du startar den själv</td>
					<td class="px-4 py-3">Styrs av webbläsarleverantören. MittPsyke tar inte emot ljud</td>
				</tr>
				<!-- JURIDISKT EJ VERIFIERAT: "Berättigat intresse" som rättslig grund för
				     dataintrångskontrollen och för de pseudonymiserade användningshändelserna
				     är MittPsykes egen bedömning och har inte granskats av jurist. -->
				<tr>
					<th scope="row" class="px-4 py-3 font-normal text-left">E-post i dataintrångskontrollen</th>
					<td class="px-4 py-3">MittPsykes server + Have I Been Pwned</td>
					<td class="px-4 py-3">Se leverantörens villkor</td>
					<td class="px-4 py-3">Berättigat intresse (kontrollen du begär)</td>
					<td class="px-4 py-3">Sparas inte av MittPsyke</td>
				</tr>
				<tr class="bg-black/[0.01] dark:bg-white/[0.01]">
					<th scope="row" class="px-4 py-3 font-normal text-left">Användningshändelser (pseudonym)</th>
					<td class="px-4 py-3">Supabase</td>
					<td class="px-4 py-3">EU (Frankfurt)</td>
					<td class="px-4 py-3">Berättigat intresse</td>
					<td class="px-4 py-3">Sparas utan koppling till kontot i klartext. Raderas inte med kontot</td>
				</tr>
				<tr>
					<th scope="row" class="px-4 py-3 font-normal text-left">Tekniska loggar</th>
					<td class="px-4 py-3">Render (drift) och Cloudflare (förmedling och skydd)</td>
					<td class="px-4 py-3">Se leverantörsavtal</td>
					<td class="px-4 py-3">Berättigat intresse</td>
					<td class="px-4 py-3">Enligt respektive leverantörs lagringstid</td>
				</tr>
				<tr class="bg-black/[0.01] dark:bg-white/[0.01]">
					<th scope="row" class="px-4 py-3 font-normal text-left">Analyskakor</th>
					<td class="px-4 py-3">Google Analytics</td>
					<td class="px-4 py-3">Se leverantörsavtal</td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Styrs av lagringstiden i Google Analytics</td>
				</tr>
				<tr>
					<th scope="row" class="px-4 py-3 font-normal text-left">Cookie-fri webbstatistik</th>
					<td class="px-4 py-3">Ahrefs Web Analytics</td>
					<td class="px-4 py-3">Se leverantörsavtal</td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Aggregerad statistik</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p class="opacity-60 text-xs leading-relaxed mb-6">
		SCC = EU-kommissionens standardavtalsklausuler. De kan användas som en skyddsmekanism vid överföring av uppgifter till länder utanför EU/EES.
		{dataflowCopy.providerRetention}
	</p>

	<!-- VARFÖR -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Varför uppgifterna behandlas</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>För att skapa och hantera konto och inloggning.</li>
		<li>För att ge tillgång till funktioner som dagbok, historik, chatt och personliga inställningar.</li>
		<li>För att ge chatten kontinuitet mellan samtal genom AI-minnet.</li>
		<li>För att driva, skydda och förbättra tjänsten, till exempel genom felsökning och säkerhetsarbete.</li>
		<li>För att förstå om tjänstens kärnfunktioner används, genom pseudonymiserade användningshändelser.</li>
		<li>För att besvara frågor och hantera support, radering, export och andra integritetsärenden.</li>
		<li>För att uppfylla rättsliga skyldigheter när det krävs.</li>
	</ul>

	<!-- RÄTTSLIG GRUND
	     JURIDISKT EJ VERIFIERAT: berättigat intresse för dataintrångskontrollen och de
	     pseudonymiserade användningshändelserna. Se kommentaren vid tabellen ovan. -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Rättslig grund</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li><strong>Samtycke</strong> – för behandling av känsliga uppgifter om psykisk hälsa (artikel 9.2a GDPR), inklusive AI-minnet i chatten.</li>
		<li><strong>Samtycke</strong> – för analyskakor och statistik (du väljer i cookie-bannern).</li>
		<li><strong>Avtal</strong> – leverans av tjänstens funktioner när du använder konto och innehåll.</li>
		<li><strong>Rättsliga skyldigheter</strong> – när lag kräver behandling.</li>
		<li><strong>Berättigade intressen</strong> – säkerhet, missbruksförebyggande arbete, stabil drift, pseudonymiserade användningshändelser och dataintrångskontrollen när du själv startar den.</li>
	</ul>

	<!-- KAKOR -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Kakor och analyser</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke använder analysverktyg för att förstå hur sajten används och förbättra upplevelsen.
		Google Analytics och Ahrefs Web Analytics aktiveras <strong>endast om du godkänner</strong>
		analys i cookie-bannern. Ahrefs används utan cookies men behandlar bland annat sid-URL,
		referrer och teknisk användningsdata. Du kan när som helst ändra ditt val i cookieinställningarna.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Till Google Analytics skickas sidadresser utan sökfrågor och utan chattens ämne. Ahrefs laddas inte alls på
		chattens sidor eller på sökningen.
	</p>

	<!-- LAGRINGSTID -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Lagringstid</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>Kontorelaterade uppgifter sparas så länge kontot är aktivt eller tills du begär radering.</li>
		<li>{dataflowCopy.accountChat.storage} {dataflowCopy.accountChat.retention}</li>
		<li>{dataflowCopy.savedDiary.storage}</li>
		<li>AI-minnet ersätts löpande och innehåller högst tio teman. Det raderas när du raderar kontot.</li>
		<li>Pseudonymiserade användningshändelser raderas inte när kontot raderas, men kan då inte längre kopplas till ett konto.</li>
		<li>Tekniska loggar och säkerhetsuppgifter sparas hos Render och Cloudflare enligt deras egna lagringstider.</li>
		<li>{dataflowCopy.guestChat.retention}</li>
		<li>När uppgifter inte längre behövs raderas eller anonymiseras de.</li>
	</ul>

	<!-- LEVERANTÖRER -->
	<section id="leverantorer" class="scroll-mt-6" aria-label="Tjänster och leverantörer">
		<h2 class="text-lg font-semibold mt-8 mb-2">Tjänster och leverantörer</h2>
		<p class="opacity-80 leading-relaxed mb-3">
			För att driva MittPsyke används externa tekniska leverantörer. Det kan innebära att uppgifter behandlas av dessa
			leverantörer i den utsträckning det behövs för att tjänsten ska fungera.
		</p>
		<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
			<li><strong>Supabase:</strong> databas, konto, inloggning, sessioner och lagring av innehåll, bilder och videor. Data lagras inom EU (Frankfurt).</li>
			<li><strong>Render:</strong> kör MittPsykes server och hanterar tekniska loggar som behövs för drift och säkerhet.</li>
			<li><strong>Cloudflare:</strong> förmedlar trafiken till och från mittpsyke.se och skyddar sajten. Det innebär att tekniska uppgifter som IP-adress och sidförfrågningar passerar Cloudflare.</li>
			<li><strong>OpenAI:</strong> AI-funktioner som chatt, AI-minnet och aktivt valda AI-funktioner för sparad dagbokstext. {dataflowCopy.providerRetention}</li>
			<li><strong>OpenAI för anonyma berättelser:</strong> en första AI-granskning av berättelsetext som du uttryckligen har godkänt att skicka. Berättelsen granskas därefter manuellt före eventuell publicering.</li>
			<li><strong>Anthropic:</strong> den guidade dagboken och vissa sammanfattningar, efter ett funktionsspecifikt samtycke.</li>
			<li><strong>Din webbläsares taligenkänning:</strong> när du använder Prata in, se <a href="#diktering" class="underline hover:no-underline">diktering</a>. Leverantören beror på webbläsare och enhet.</li>
			<li><strong>Have I Been Pwned:</strong> när du själv kontrollerar en e-postadress, se <a href="#dataintrang" class="underline hover:no-underline">dataintrångskontrollen</a>.</li>
			<li><strong>Soro:</strong> levererar bloggartiklarna. Artiklarna hämtas normalt av MittPsykes server, men om de inte kan laddas den vägen hämtar din webbläsare dem direkt från Soro. Artiklarnas bilder laddas direkt från Soros bildlagring. Soro används inte för analys eller spårning.</li>
			<li><strong>Google Analytics och Ahrefs:</strong> statistik om hur sajten används, bara efter ditt samtycke.</li>
		</ul>
	</section>

	<section class="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 sm:p-5 mt-2 mb-6" aria-label="Tredjelandsöverföring">
		<h3 class="text-base font-semibold mt-0 mb-2">Överföring utanför EU/EES</h3>
		<p class="opacity-80 leading-relaxed text-sm">
			När en leverantör behandlar personuppgifter utanför EU/EES kan EU-kommissionens
			<strong>standardavtalsklausuler (SCCs)</strong> vara en möjlig skyddsmekanism. Vilket skydd som
			gäller för en enskild överföring beror på det aktuella leverantörsavtalet och överföringens förutsättningar.
		</p>
	</section>

	<!-- BARN OCH MINDERÅRIGA -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Barn och minderåriga</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke riktar sig inte specifikt till barn under 13 år. Användare under 16 år bör ha vårdnadshavares
		samtycke för att skapa konto. Det anonyma chattläget kan användas av alla åldrar utan registrering.
		Om vi får kännedom om att ett barn under 13 år har skapat konto utan vårdnadshavares samtycke
		kommer vi att radera kontot.
	</p>

	<!-- DINA RÄTTIGHETER -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Dina rättigheter</h2>
	<p class="opacity-80 leading-relaxed mb-3">Enligt GDPR har du rätt att:</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li><strong>Tillgång</strong> — få veta vilka uppgifter vi behandlar om dig.</li>
		<li><strong>Rättelse</strong> — korrigera felaktiga uppgifter.</li>
		<li><strong>Radering</strong> — begära att ditt konto och dina uppgifter raderas.</li>
		<li><strong>Dataportabilitet</strong> — få en kopia av dina uppgifter i ett maskinläsbart format.</li>
		<li><strong>Återkalla samtycke</strong> — du kan ångra givna samtycken när som helst.</li>
		<li><strong>Invändning</strong> — invända mot behandling som grundas på berättigade intressen.</li>
		<li><strong>Begränsning</strong> — begära att behandling tillfälligt begränsas medan vi utreder en fråga.</li>
		<li><strong>Klagomål</strong> — lämna klagomål till <a href="https://www.imy.se" class="underline hover:no-underline" target="_blank" rel="noopener">Integritetsskyddsmyndigheten (IMY)</a>.</li>
	</ul>

	<!-- EXPORT OCH RADERING -->
	<section id="sa-gor-du" class="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-4 sm:p-5 mt-4 mb-6" aria-label="Export och radering">
		<h3 class="text-base font-semibold mt-0 mb-2">Export och radering</h3>
		<p class="opacity-80 leading-relaxed text-sm mb-2"><strong>Exportera själv.</strong> Logga in och gå till
			<a href="/dashboard/installningar#din-data" class="underline hover:no-underline">Din data</a> i
			kontoinställningarna. Där laddar du ner en JSON-fil direkt i webbläsaren. Den innehåller e-post och
			skapandedatum för kontot, dina dagboksinlägg, kvällsincheckningar, svar till följeslagaren, rörelsedata,
			veckoreflektioner, sparade teman (AI-minnet), dina chattar, inlägg och kommentarer i gemenskapen, trådar
			och svar från det tidigare forumet, SMS-inställningar samt dina egna inställningar och mål. För bilder och
			videor innehåller filen deras sökvägar, inte själva filerna. Inlägg och kommentarer i gemenskapen som du
			redan tagit bort kommer inte med.</p>
		<p class="opacity-80 leading-relaxed text-sm mb-2"><strong>Radera själv.</strong> Enskilda dagboksinlägg
			raderar du i dagboken. Hela kontot raderar du under
			<a href="/dashboard/installningar#radera-konto" class="underline hover:no-underline">Radera konto</a>.
			Då raderas kontot tillsammans med dagbok, bilder och videor, kvällsincheckningar, chattar, AI-minnet,
			inlägg och kommentarer i gemenskapen, trådar och svar i det tidigare forumet, samtycken och
			inställningar. En forumtråd du startat raderas med alla svar i den. Pseudonymiserade
			användningshändelser och tekniska loggar hos driftleverantörerna raderas inte på det sättet, se ovan.
			Feedback du skickat via feedbackformuläret och anmälningar du gjort i forumet sparas vidare utan
			koppling till kontot.</p>
		<p class="opacity-80 leading-relaxed text-sm mb-2"><strong>Via e-post.</strong> Du kan också mejla
			<a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a> och ange
			vad du vill: export, radering av hela kontot eller radering av en viss del, till exempel AI-minnet eller
			bilder och videor. Begär du export via mejl får du samma JSON-fil, och vill du ha själva bild- och
			videofilerna skickar vi dem också. Vi bekräftar din begäran och genomför den <strong>inom 30 dagar</strong>.</p>
	</section>

	<!-- ÄNDRINGAR -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Ändringar i policyn</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Vi kan komma att uppdatera denna integritetspolicy. Vid väsentliga ändringar informerar vi via tjänsten
		eller e-post (om du har konto). Den senaste versionen finns alltid tillgänglig på denna sida.
	</p>

	<!-- KONTAKT -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Kontakt</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Har du frågor om hur vi hanterar dina uppgifter? Kontakta oss:
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-none space-y-1.5">
		<li><a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a></li>
		<li>MittPsyke, Org.nr: 198712284895</li>
	</ul>
	<p class="opacity-80 leading-relaxed mb-3">
		Vi strävar efter att svara inom 30 dagar.
	</p>

	<p class="opacity-60 text-sm mt-10">Senast uppdaterad: 21 september 2026</p>
</main>
