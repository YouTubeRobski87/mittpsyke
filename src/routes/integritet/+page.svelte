<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';
</script>

<SEO canonical="https://www.mittpsyke.se/integritet" />

<svelte:head>
	<title>Integritetspolicy | MittPsyke</title>
	<meta
		name="description"
		content="Tydlig information om vilka uppgifter MittPsyke kan behandla, varför de används, hur länge de sparas och vilka rättigheter du har."
	/>
</svelte:head>

<main class="mx-auto w-full max-w-3xl px-5 py-10">
	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Integritetspolicy</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke är ett AI-baserat samtalsstöd för reflektion och stöd i vardagen. Här förklarar vi i enkel svenska
		vilka uppgifter som kan behandlas, varför de används och vilka val du har.
	</p>
	<p class="opacity-70 leading-relaxed text-sm mb-4">
		Snabbt svar: du kan börja anonymt utan konto. Med konto kan du spara historik, exportera data och radera konto när du vill.
	</p>
	<p class="opacity-70 leading-relaxed text-sm">
		Hoppa direkt till:
		<a href="#snabb-oversikt" class="underline hover:no-underline">snabb överblick</a>,
		<a href="#anonymt-lage" class="underline hover:no-underline">anonymt läge</a>,
		<a href="#med-konto" class="underline hover:no-underline">med konto</a>,
		<a href="#sa-gor-du" class="underline hover:no-underline">export och radering</a>.
	</p>

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

	<!-- SNABB ÖVERBLICK -->
	<section id="snabb-oversikt" class="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 sm:p-5 mt-6" aria-label="Snabb överblick">
		<h2 class="text-lg font-semibold mt-0 mb-2">Snabb överblick</h2>
		<ul class="opacity-80 leading-relaxed list-disc pl-6 space-y-2.5">
			<li><strong>Är detta vård?</strong> Nej. MittPsyke är ett samtalsstöd, inte vård eller behandling.</li>
			<li><strong>Kan man använda tjänsten anonymt?</strong> Ja. Du kan chatta utan konto.</li>
			<li><strong>Vad sparas med konto?</strong> E-post, dagbok, chatthistorik och inställningar — du väljer själv vad du skriver.</li>
			<li><strong>Kan jag radera allt?</strong> Ja. Du kan radera ditt konto och all data via inställningar eller genom att kontakta oss.</li>
			<li><strong>Kan jag exportera min data?</strong> Ja. Kontakta oss så får du en kopia inom 30 dagar.</li>
			<li><strong>Akut läge?</strong> Ring 112 vid akut fara. För vårdråd i Sverige, kontakta 1177.</li>
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
			<li><strong>Inga kakor utöver funktionella</strong> — om du inte godkänner analytics i cookie-bannern.</li>
		</ul>
		<p class="opacity-70 leading-relaxed text-sm mt-3">
			Tips: Om du vill använda dagbok, se historik eller spara framsteg behöver du skapa ett konto.
		</p>
	</section>

	<section id="med-konto" class="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-4 sm:p-5 mt-2 mb-6" aria-label="Med konto">
		<h2 class="text-lg font-semibold mt-0 mb-2">Med konto — vad du får</h2>
		<ul class="opacity-80 leading-relaxed text-sm list-disc pl-6 space-y-2">
			<li><strong>Spara och fortsätt</strong> — behåll dagbok, chatt och inställningar över tid.</li>
			<li><strong>Följ ditt mående</strong> — se mönster och kom tillbaka där du var.</li>
			<li><strong>Export och radering</strong> — du kan begära en kopia av din data eller radera konto och innehåll.</li>
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
		<li><strong>AI-chatt och dagbok</strong> — genom att använda dessa funktioner samtycker du till att innehåll som kan röra psykisk hälsa behandlas (artikel 9 GDPR).</li>
	</ul>
	<p class="opacity-80 leading-relaxed mb-3">
		Du kan <strong>när som helst återkalla</strong> ditt samtycke genom att radera ditt konto, rensa cookies, eller kontakta oss.
	</p>

	<!-- VILKA UPPGIFTER -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Vilka uppgifter som kan behandlas</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>Kontouppgifter, till exempel e-postadress och tekniska identifierare som behövs för inloggning.</li>
		<li>Innehåll som du själv väljer att skriva eller spara, till exempel i dagbok, chatt eller andra fält i tjänsten.</li>
		<li>Uppgifter i kontoinställningar, till exempel tilltalsnamn och val kring påminnelser eller utskick.</li>
		<li>Tekniska uppgifter som behövs för funktion, säkerhet, missbruksförebyggande arbete och stabil drift.</li>
		<li>Uppgifter om användning av AI-funktioner när du aktivt väljer att använda dem.</li>
	</ul>

	<!-- KÄNSLIGA UPPGIFTER -->
	<section class="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 p-4 sm:p-5 mt-2 mb-6" aria-label="Känsliga uppgifter">
		<h3 class="text-base font-semibold mt-0 mb-2">⚠️ Känsliga uppgifter (artikel 9 GDPR)</h3>
		<p class="opacity-80 leading-relaxed text-sm">
			Innehåll som du delar i chatt eller dagbok kan röra psykisk hälsa och betraktas som
			<strong>känsliga personuppgifter</strong> enligt GDPR artikel 9. Sådana uppgifter behandlas enbart
			med ditt <strong>uttryckliga samtycke</strong>, vilket du lämnar i samband med att du börjar använda
			tjänstens AI-funktioner. Du kan när som helst återkalla samtycket genom att radera ditt konto eller
			kontakta oss.
		</p>
	</section>

	<!-- DATAFLÖDESKARTA -->
	<h2 class="text-lg font-semibold mt-8 mb-1">Så hanteras uppgifter i tjänsten</h2>
	<p class="opacity-70 text-sm leading-relaxed mb-4">
		Tabellen nedan visar vilka uppgifter som behandlas, var de lagras, vilken rättslig grund som gäller och hur länge de sparas.
	</p>
	<div class="overflow-x-auto rounded-2xl border border-black/10 dark:border-white/10 mb-6">
		<table class="w-full text-sm leading-relaxed border-collapse">
			<thead>
				<tr class="bg-black/[0.04] dark:bg-white/[0.04] text-left">
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Datatyp</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">System / leverantör</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Region</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Rättslig grund</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Lagringstid</th>
				</tr>
			</thead>
			<tbody class="opacity-80 divide-y divide-black/[0.06] dark:divide-white/[0.06]">
				<tr>
					<td class="px-4 py-3">Kontouppgifter (e-post, namn)</td>
					<td class="px-4 py-3">Supabase</td>
					<td class="px-4 py-3">EU (Frankfurt)</td>
					<td class="px-4 py-3">Avtal</td>
					<td class="px-4 py-3">Tills kontot raderas</td>
				</tr>
				<tr class="bg-black/[0.01] dark:bg-white/[0.01]">
					<td class="px-4 py-3">Chatt och dagboksinnehåll</td>
					<td class="px-4 py-3">Supabase + OpenAI</td>
					<td class="px-4 py-3">EU / USA&thinsp;<span class="opacity-60 text-xs">(SCC)</span></td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Tills du raderar</td>
				</tr>
				<tr>
					<td class="px-4 py-3">Anonyma chattsamtal (gäst)</td>
					<td class="px-4 py-3">Supabase + OpenAI</td>
					<td class="px-4 py-3">EU / USA&thinsp;<span class="opacity-60 text-xs">(SCC)</span></td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Rensas automatiskt inom 24 timmar</td>
				</tr>
				<tr class="bg-black/[0.01] dark:bg-white/[0.01]">
					<td class="px-4 py-3">Tekniska loggar</td>
					<td class="px-4 py-3">Supabase / Vercel</td>
					<td class="px-4 py-3">EU / USA&thinsp;<span class="opacity-60 text-xs">(SCC)</span></td>
					<td class="px-4 py-3">Berättigat intresse</td>
					<td class="px-4 py-3">Upp till 90 dagar</td>
				</tr>
				<tr>
					<td class="px-4 py-3">Analyskakor</td>
					<td class="px-4 py-3">Google Analytics</td>
					<td class="px-4 py-3">USA&thinsp;<span class="opacity-60 text-xs">(SCC)</span></td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Sessionbaserat</td>
				</tr>
			</tbody>
		</table>
	</div>
	<p class="opacity-60 text-xs leading-relaxed mb-6">
		SCC = EU-kommissionens standardavtalsklausuler, som säkerställer ett adekvat skydd vid överföring av uppgifter till länder utanför EU/EES.
		OpenAI använder inte API-data för att träna sina modeller.
	</p>

	<!-- VARFÖR -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Varför uppgifterna behandlas</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>För att skapa och hantera konto och inloggning.</li>
		<li>För att ge tillgång till funktioner som dagbok, historik, chatt och personliga inställningar.</li>
		<li>För att driva, skydda och förbättra tjänsten, till exempel genom felsökning och säkerhetsarbete.</li>
		<li>För att besvara frågor och hantera support, radering, export och andra integritetsärenden.</li>
		<li>För att uppfylla rättsliga skyldigheter när det krävs.</li>
	</ul>

	<!-- RÄTTSLIG GRUND -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Rättslig grund</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li><strong>Samtycke</strong> – för behandling av känsliga uppgifter om psykisk hälsa (artikel 9.2a GDPR).</li>
		<li><strong>Samtycke</strong> – för analyskakor och statistik (du väljer i cookie-bannern).</li>
		<li><strong>Avtal</strong> – leverans av tjänstens funktioner när du använder konto och innehåll.</li>
		<li><strong>Rättsliga skyldigheter</strong> – när lag kräver behandling.</li>
		<li><strong>Berättigade intressen</strong> – säkerhet, missbruksförebyggande arbete och stabil drift.</li>
	</ul>

	<!-- KAKOR -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Kakor och analyser</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke använder analysverktyg för att förstå hur sajten används och förbättra upplevelsen.
		Dessa analysverktyg aktiveras <strong>endast om du godkänner</strong> det i cookie-bannern som visas
		vid ditt första besök. Du kan när som helst ändra ditt val genom att rensa cookies i din webbläsare.
	</p>

	<!-- LAGRINGSTID -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Lagringstid</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>Kontorelaterade uppgifter sparas så länge kontot är aktivt eller tills du begär radering.</li>
		<li>Chatt- och dagboksinnehåll sparas så länge du har ett aktivt konto och inte raderar innehållet själv.</li>
		<li>Tekniska loggar och säkerhetsuppgifter sparas normalt i upp till 90 dagar.</li>
		<li>Anonym chatt sparas inte i någon historik. Innehållet kan ligga tekniskt tillfälligt under kort tid för att tjänsten ska fungera, och rensas automatiskt senast inom 24 timmar.</li>
		<li>När uppgifter inte längre behövs raderas eller anonymiseras de.</li>
	</ul>

	<!-- LEVERANTÖRER -->
	<h2 class="text-lg font-semibold mt-8 mb-2">Tjänster och leverantörer</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		För att driva MittPsyke används externa tekniska leverantörer. Det kan innebära att uppgifter behandlas av dessa
		leverantörer i den utsträckning det behövs för att tjänsten ska fungera.
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li><strong>Supabase:</strong> konto, inloggning, sessioner och lagring av innehåll. Data lagras inom EU (Frankfurt).</li>
		<li><strong>OpenAI:</strong> AI-funktioner som chatt. OpenAI använder inte API-data för att träna sina modeller. Data kan behandlas i USA – skyddas av standardavtalsklausuler (SCCs).</li>
		<li><strong>Vercel:</strong> hosting och leverans av webbplatsen. Analytics aktiveras endast med ditt samtycke. Data kan behandlas i USA – skyddas av standardavtalsklausuler (SCCs).</li>
	</ul>

	<section class="rounded-2xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] p-4 sm:p-5 mt-2 mb-6" aria-label="Tredjelandsöverföring">
		<h3 class="text-base font-semibold mt-0 mb-2">Överföring utanför EU/EES</h3>
		<p class="opacity-80 leading-relaxed text-sm">
			Flera av våra leverantörer (OpenAI, Vercel) är baserade i USA. Överföring av personuppgifter
			till dessa sker med stöd av EU-kommissionens <strong>standardavtalsklausuler (SCCs)</strong>, vilket
			säkerställer ett adekvat skydd för dina uppgifter i enlighet med GDPR.
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
		<li><strong>Radering</strong> — begära att ditt konto och alla dina uppgifter raderas.</li>
		<li><strong>Dataportabilitet</strong> — få en kopia av dina uppgifter i ett maskinläsbart format.</li>
		<li><strong>Återkalla samtycke</strong> — du kan ångra givna samtycken när som helst.</li>
		<li><strong>Invändning</strong> — invända mot behandling som grundas på berättigade intressen.</li>
		<li><strong>Begränsning</strong> — begära att behandling tillfälligt begränsas medan vi utreder en fråga.</li>
		<li><strong>Klagomål</strong> — lämna klagomål till <a href="https://www.imy.se" class="underline hover:no-underline" target="_blank" rel="noopener">Integritetsskyddsmyndigheten (IMY)</a>.</li>
	</ul>

	<!-- SÅ HÄR GÖR DU -->
	<section id="sa-gor-du" class="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/30 p-4 sm:p-5 mt-4 mb-6" aria-label="Så gör du">
		<h3 class="text-base font-semibold mt-0 mb-2">Så här begär du radering eller export</h3>
		<ol class="opacity-80 leading-relaxed text-sm list-decimal pl-6 space-y-2">
			<li><strong>Via inställningar</strong> — logga in och gå till kontoinställningar för att radera ditt konto direkt.</li>
				<li><strong>Via e-post</strong> — skicka ett mejl till <a href={PUBLIC_CONTACT_MAILTO} class="underline hover:no-underline">{PUBLIC_CONTACT_EMAIL}</a> och ange vad du vill (radering, export, eller båda).</li>
			<li>Vi bekräftar din begäran och genomför den <strong>inom 30 dagar</strong>.</li>
			<li>Vid export får du din data i JSON-format via e-post.</li>
		</ol>
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

	<p class="opacity-60 text-sm mt-10">Senast uppdaterad: 10 juni 2026</p>
</main>
