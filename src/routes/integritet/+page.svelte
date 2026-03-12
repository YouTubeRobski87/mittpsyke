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

	<section class="rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:p-5 mt-6" aria-label="Snabb överblick">
		<h2 class="text-lg font-semibold mt-0 mb-2">Snabb överblick</h2>
		<ul class="opacity-80 leading-relaxed list-disc pl-6 space-y-2.5">
			<li><strong>Är detta vård?</strong> Nej. MittPsyke är ett samtalsstöd, inte vård eller behandling.</li>
			<li><strong>Vad används tjänsten till?</strong> Reflektion, dagbok, samtalsstöd och struktur i vardagen.</li>
			<li><strong>Sparas uppgifter?</strong> Ja, uppgifter kan sparas när du använder konto och funktioner i tjänsten.</li>
			<li><strong>Akut läge?</strong> Ring 112 vid akut fara. För vårdråd i Sverige, kontakta 1177.</li>
			<li><strong>Vem står bakom och hur kontaktar man er?</strong> MittPsyke. Kontakt: <a href="mailto:mittpsyke@ownit.nu" class="underline hover:no-underline">mittpsyke@ownit.nu</a>.</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vilka vi är</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke är en svensk webbtjänst för samtalsstöd, dagbok och reflektion. Om du har frågor om integritet eller
		vill använda dina rättigheter kan du kontakta oss på
		<a href="mailto:mittpsyke@ownit.nu" class="underline hover:no-underline">mittpsyke@ownit.nu</a>.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vilka uppgifter som kan behandlas</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>Kontouppgifter, till exempel e-postadress och tekniska identifierare som behövs för inloggning.</li>
		<li>Innehåll som du själv väljer att skriva eller spara, till exempel i dagbok, chatt eller andra fält i tjänsten.</li>
		<li>Uppgifter i kontoinställningar, till exempel tilltalsnamn och val kring påminnelser eller utskick.</li>
		<li>Tekniska uppgifter som behövs för funktion, säkerhet, missbruksförebyggande arbete och stabil drift.</li>
		<li>Uppgifter om användning av webbsamtal eller AI-funktioner när du aktivt väljer att använda dem.</li>
	</ul>

	<section class="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 sm:p-5 mt-2 mb-6" aria-label="Känsliga uppgifter">
		<h3 class="text-base font-semibold mt-0 mb-2">Känsliga uppgifter (artikel 9 GDPR)</h3>
		<p class="opacity-80 leading-relaxed text-sm">
			Innehåll som du delar i chatt, dagbok eller röstsamtal kan röra psykisk hälsa och betraktas som
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
	<div class="overflow-x-auto rounded-2xl border border-black/10 mb-6">
		<table class="w-full text-sm leading-relaxed border-collapse">
			<thead>
				<tr class="bg-black/[0.04] text-left">
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Datatyp</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">System / leverantör</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Region</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Rättslig grund</th>
					<th class="px-4 py-3 font-semibold opacity-80 whitespace-nowrap">Lagringstid</th>
				</tr>
			</thead>
			<tbody class="opacity-80 divide-y divide-black/[0.06]">
				<tr>
					<td class="px-4 py-3">Kontouppgifter (e-post, namn)</td>
					<td class="px-4 py-3">Supabase</td>
					<td class="px-4 py-3">EU (Frankfurt)</td>
					<td class="px-4 py-3">Avtal</td>
					<td class="px-4 py-3">Tills kontot raderas</td>
				</tr>
				<tr class="bg-black/[0.01]">
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
					<td class="px-4 py-3">Tillfällig session</td>
				</tr>
				<tr class="bg-black/[0.01]">
					<td class="px-4 py-3">Röstsamtal</td>
					<td class="px-4 py-3">OpenAI + Retell</td>
					<td class="px-4 py-3">USA&thinsp;<span class="opacity-60 text-xs">(SCC)</span></td>
					<td class="px-4 py-3">Samtycke</td>
					<td class="px-4 py-3">Bearbetas i realtid, sparas ej</td>
				</tr>
				<tr>
					<td class="px-4 py-3">Tekniska loggar</td>
					<td class="px-4 py-3">Supabase / Vercel</td>
					<td class="px-4 py-3">EU / USA&thinsp;<span class="opacity-60 text-xs">(SCC)</span></td>
					<td class="px-4 py-3">Berättigat intresse</td>
					<td class="px-4 py-3">Upp till 90 dagar</td>
				</tr>
				<tr class="bg-black/[0.01]">
					<td class="px-4 py-3">Analyskakor</td>
					<td class="px-4 py-3">Vercel Analytics</td>
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

	<h2 class="text-lg font-semibold mt-8 mb-2">Varför uppgifterna behandlas</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>För att skapa och hantera konto och inloggning.</li>
		<li>För att ge tillgång till funktioner som dagbok, historik, chatt och personliga inställningar.</li>
		<li>För att driva, skydda och förbättra tjänsten, till exempel genom felsökning och säkerhetsarbete.</li>
		<li>För att besvara frågor och hantera support, radering, export och andra integritetsärenden.</li>
		<li>För att uppfylla rättsliga skyldigheter när det krävs.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Rättslig grund</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li><strong>Samtycke</strong> – för behandling av känsliga uppgifter om psykisk hälsa (artikel 9.2a GDPR).</li>
		<li><strong>Samtycke</strong> – för analyskakor och statistik (du väljer i cookie-bannern).</li>
		<li><strong>Avtal</strong> – leverans av tjänstens funktioner när du använder konto och innehåll.</li>
		<li><strong>Rättsliga skyldigheter</strong> – när lag kräver behandling.</li>
		<li><strong>Berättigade intressen</strong> – säkerhet, missbruksförebyggande arbete och stabil drift.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Kakor och analyser</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		MittPsyke använder Vercel Analytics för att förstå hur sajten används och förbättra upplevelsen.
		Dessa analysverktyg aktiveras <strong>endast om du godkänner</strong> det i cookie-bannern som visas
		vid ditt första besök. Du kan när som helst ändra ditt val genom att rensa cookies i din webbläsare.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Lagringstid</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>Kontorelaterade uppgifter sparas så länge kontot är aktivt eller tills du begär radering.</li>
		<li>Chatt- och dagboksinnehåll sparas så länge du har ett aktivt konto och inte raderar innehållet själv.</li>
		<li>Tekniska loggar och säkerhetsuppgifter sparas normalt i upp till 90 dagar.</li>
		<li>När uppgifter inte längre behövs raderas eller anonymiseras de.</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Tjänster och leverantörer</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		För att driva MittPsyke används externa tekniska leverantörer. Det kan innebära att uppgifter behandlas av dessa
		leverantörer i den utsträckning det behövs för att tjänsten ska fungera.
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li><strong>Supabase:</strong> konto, inloggning, sessioner och lagring av innehåll. Data lagras inom EU (Frankfurt).</li>
		<li><strong>OpenAI:</strong> AI-funktioner som chatt och röstsamtal. OpenAI använder inte API-data för att träna sina modeller. Data kan behandlas i USA – skyddas av standardavtalsklausuler (SCCs).</li>
		<li><strong>Retell:</strong> röstsamtalsfunktionen. Data kan behandlas i USA – skyddas av standardavtalsklausuler (SCCs).</li>
		<li><strong>Vercel:</strong> hosting och leverans av webbplatsen. Analytics aktiveras endast med ditt samtycke. Data kan behandlas i USA – skyddas av standardavtalsklausuler (SCCs).</li>
	</ul>

	<section class="rounded-2xl border border-black/10 bg-black/[0.02] p-4 sm:p-5 mt-2 mb-6" aria-label="Tredjelandsöverföring">
		<h3 class="text-base font-semibold mt-0 mb-2">Överföring utanför EU/EES</h3>
		<p class="opacity-80 leading-relaxed text-sm">
			Flera av våra leverantörer (OpenAI, Retell, Vercel) är baserade i USA. Överföring av personuppgifter
			till dessa sker med stöd av EU-kommissionens <strong>standardavtalsklausuler (SCCs)</strong>, vilket
			säkerställer ett adekvat skydd för dina uppgifter i enlighet med GDPR.
		</p>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Dina rättigheter</h2>
	<p class="opacity-80 leading-relaxed mb-3">Du har rätt att:</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2.5">
		<li>Få tillgång till de uppgifter vi behandlar om dig.</li>
		<li>Begära rättelse av felaktiga uppgifter.</li>
		<li>Begära radering av ditt konto och dina uppgifter.</li>
		<li>Återkalla samtycke som du har lämnat.</li>
		<li>Invända mot behandling som grundas på berättigade intressen.</li>
		<li>Lämna klagomål till Integritetsskyddsmyndigheten (IMY) på <a href="https://www.imy.se" class="underline hover:no-underline" target="_blank" rel="noopener">imy.se</a>.</li>
	</ul>
	<p class="opacity-80 leading-relaxed mb-3">
		För att använda dina rättigheter, kontakta oss på
		<a href="mailto:mittpsyke@ownit.nu" class="underline hover:no-underline">mittpsyke@ownit.nu</a>.
		Vi strävar efter att svara inom 30 dagar.
	</p>

	<p class="opacity-60 text-sm mt-10">Senast uppdaterad: mars 2026</p>
</main>
