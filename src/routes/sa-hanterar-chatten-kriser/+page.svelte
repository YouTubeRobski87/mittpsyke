<script lang="ts">
	import Breadcrumbs from '$lib/components/Breadcrumbs.svelte';
	import SEO from '$lib/components/SEO.svelte';
	import { PUBLIC_CONTACT_EMAIL, PUBLIC_CONTACT_MAILTO } from '$lib/contact';

	// Varje påstående här ska gå att peka ut i koden:
	//   spärren            $lib/ai/crisis-guard.ts, $lib/ai/crisis-keywords.ts
	//   svarstexterna      $lib/ai/crisis-responses.ts
	//   ordningen i chatten routes/api/chat/+server.ts (spärr före lagring,
	//                      rate limit och AI-anrop)
	//   stödpanelerna      $lib/ai/safety.ts, ChatWindow.svelte
	//   dagboken           routes/api/diary/{reflect,checkin-reflection,insights/summary}
	//   chatthistoriken    ChatWindow.svelte (persistHistory: localStorage och
	//                      chat_history för inloggade, inget för gäster)
	// Ändras spärren ska sidan ändras i samma PR. Se crisis-page.test.ts.
</script>

<SEO canonical="https://mittpsyke.se/sa-hanterar-chatten-kriser" />

<svelte:head>
	<title>Så hanterar chatten kriser | MittPsyke</title>
	<meta
		name="description"
		content="Hur MittPsykes chatt upptäcker tecken på kris, vad som händer då och vilka begränsningar säkerhetsspärren har. Vid akut fara, ring 112."
	/>
</svelte:head>

<div class="crisis-content mx-auto w-full px-5 py-10">
	<Breadcrumbs
		items={[{ label: 'Om MittPsyke', href: '/om-mittpsyke' }, { label: 'Så hanterar chatten kriser' }]}
	/>

	<h1 class="text-2xl sm:text-3xl font-semibold mb-4">Så hanterar chatten kriser</h1>
	<p class="opacity-80 leading-relaxed mb-4">
		MittPsyke är inte en akuttjänst, och ingen människa läser chatten medan du skriver. Därför finns
		en säkerhetsspärr som körs innan AI:n får se ditt meddelande. Den här sidan beskriver hur spärren
		fungerar i dag, vad den fångar och vad den inte fångar.
	</p>

	<section class="crisis-now" aria-labelledby="crisis-now-title">
		<h2 id="crisis-now-title" class="text-lg font-semibold mt-0 mb-2">Om du är i fara just nu</h2>
		<ul>
			<li><a href="tel:112"><strong>Ring 112</strong></a> om du eller någon annan är i omedelbar fara.</li>
			<li><a href="tel:90101">Mind Självmordslinjen 90101</a>, öppen dygnet runt.</li>
			<li><a href="tel:1177">1177</a> för råd om psykisk hälsa och vård.</li>
			<li>
				<a href="https://stodlinjer.se" target="_blank" rel="noopener noreferrer">Stödlinjer.se</a> för
				fler stödlinjer och chattar med människor.
			</li>
		</ul>
	</section>

	<section class="crisis-quick" aria-label="Snabb överblick">
		<h2 class="text-lg font-semibold mt-0 mb-2">Snabb överblick</h2>
		<ul>
			<li><strong>Före AI:n.</strong> Spärren körs på servern innan något skickas till AI-modellen.</li>
			<li>
				<strong>Fasta formuleringar.</strong> Den letar efter bestämda ord och fraser, inte efter
				betydelse.
			</li>
			<li>
				<strong>Ett meddelande i taget.</strong> Den tittar bara på meddelandet du just skickade.
			</li>
			<li>
				<strong>Ingen larmar.</strong> Ingen människa underrättas och ingen kontaktar dig.
			</li>
		</ul>
	</section>

	<h2 class="text-lg font-semibold mt-8 mb-2">Det här händer när du skickar ett meddelande</h2>
	<ol class="opacity-80 leading-relaxed mb-3 list-decimal pl-6 space-y-2">
		<li>Servern kontrollerar att du har gett samtycke till AI-chatten.</li>
		<li>
			Meddelandet jämförs med listor över formuleringar som tyder på akut kris. Det sker innan
			meddelandet sparas, innan gränsen för antal meddelanden kontrolleras och innan AI-modellen
			anropas.
		</li>
		<li>
			Vid en träff avbryts allt där. Du får ett fast säkerhetssvar i stället för ett AI-svar.
		</li>
		<li>Utan träff går meddelandet vidare till AI-modellen som vanligt.</li>
	</ol>
	<p class="opacity-80 leading-relaxed mb-3">
		Att spärren ligger före gränsen för antal meddelanden är medvetet: den som skriver om en kris ska
		alltid få säkerhetssvaret, även efter många meddelanden.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vad spärren letar efter</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Spärren har två listor. Den ena gäller risk mot dig själv, till exempel självmordstankar,
		självskada, att inte vilja leva eller att ha en plan. Den andra gäller risk mot någon annan, till
		exempel att vilja skada någon. De två ger olika svarstexter.
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Före jämförelsen görs texten om till små bokstäver, å, ä och ö jämställs med a och o, och extra
		mellanslag tas bort. Matchningen sker på hela ord, så att en fras inte ska träffa mitt inne i ett
		annat ord. Vissa ord räknas som ordstammar och träffar även längre böjningar, till exempel
		"självmord" i "självmordstankar".
	</p>
	<p class="opacity-80 leading-relaxed mb-3">
		Listorna är medvetet smala. En träff stoppar samtalet, så breda vardagsuttryck som "orkar inte
		mer med plugget" ska inte göra det. Sådana uttryck höjer i stället stödpanelen, se nedan.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Vad som händer vid en träff</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>
			Meddelandet skickas inte till AI-modellen för att skapa ett svar. När du skriver nästa gång
			skickar chattfönstret med upp till tio av de senaste meddelandena som sammanhang, och då kan
			krismeddelandet och säkerhetssvaret följa med till AI-modellen. Det gäller både gäster och
			inloggade.
		</li>
		<li>Servern sparar inte meddelandet eller säkerhetssvaret bland chattens sparade meddelanden.</li>
		<li>
			Båda visas ändå i chattfönstret. Är du inloggad ingår de i chatthistoriken som chattfönstret
			sparar i din webbläsare och i ditt konto, precis som dina andra meddelanden. Du kan ta bort den
			med Rensa historik. Som gäst sparas chatten inte i någon beständig historik. Den finns bara kvar
			tills du laddar om sidan eller lämnar chatten.
		</li>
		<li>
			Du får ett fast svar som hänvisar till 112, Mind Självmordslinjen 90101, 1177 och
			Stödlinjer.se. Gäller det risk mot någon annan hänvisar svaret till 112, 1177 och Stödlinjer.se.
		</li>
		<li>
			I serverns drifts­logg noteras att spärren slog till, vilken av de två listorna som träffade,
			om du var gäst eller inloggad och hur långt meddelandet var. Texten i meddelandet loggas inte.
		</li>
		<li>
			Chatten är fortfarande öppen. Nästa meddelande kontrolleras på samma sätt och går vidare till
			AI:n om det inte träffar listorna.
		</li>
	</ul>

	<h2 class="text-lg font-semibold mt-8 mb-2">Stödpanelen i chatten</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Ovanför skrivfältet finns en panel som ändras efter ditt senaste meddelande. Den kontrollen görs
		i webbläsaren med samma listor.
	</p>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>
			<strong>Akut:</strong> en röd panel med knappar för 112, Mind 90101, 1177 och Stödlinjer.se.
		</li>
		<li>
			<strong>Förhöjd:</strong> vid uttryck för hopplöshet, utmattning eller ensamhet visas en
			lugnare panel med länk till stödlinjer. Samtalet fortsätter som vanligt.
		</li>
		<li>
			<strong>Standard:</strong> en diskret länk, "Behöver du mänskligt stöd?", som visar
			stödlinjer när du klickar på den.
		</li>
	</ul>
	<p class="opacity-80 leading-relaxed mb-3">
		AI-modellen har dessutom en instruktion om att lugnt påminna om 112 och Mind Självmordslinjen om
		du verkar vara i akut kris. Det är ett komplement, inte en garanti. Spärren ovan är det som är
		byggt för att alltid fungera på samma sätt.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Samma spärr i dagboken</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Spärren körs också innan dagboken ber AI:n om en reflektion på ett inlägg eller en incheckning.
		Vid en träff skickas texten inte till AI:n, och du får samma säkerhetssvar. Sammanfattningar av
		dina insikter skapas inte alls om underlaget innehåller krisformuleringar.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Hur spärren testas</h2>
	<p class="opacity-80 leading-relaxed mb-3">
		Listorna har automatiska tester med formuleringar som ska träffa och formuleringar som inte ska
		träffa. Det finns också ett antal påhittade krisscenarier som körs vid varje kodändring. De
		testerna visar att spärren och de inspelade svaren beter sig som tänkt. De mäter inte hur väl
		spärren fungerar mot verkliga meddelanden, och vi har inga siffror på hur ofta den missar.
	</p>

	<h2 class="text-lg font-semibold mt-8 mb-2">Kända begränsningar</h2>
	<ul class="opacity-80 leading-relaxed mb-3 list-disc pl-6 space-y-2">
		<li>
			Spärren förstår inte betydelse. Omskrivningar, stavfel, slang, ironi och indirekta
			formuleringar kan passera.
		</li>
		<li>
			Den tittar bara på det senaste meddelandet. Om något trappas upp gradvis över flera
			meddelanden, utan att ett enskilt meddelande träffar listorna, fångas det inte.
		</li>
		<li>
			Den kan också slå till i onödan, till exempel om du citerar någon annan eller skriver om något
			som redan har hänt.
		</li>
		<li>
			Ingen människa ser när spärren slår till, och MittPsyke kan inte skicka hjälp. Du behöver själv
			kontakta 112, 1177 eller en stödlinje.
		</li>
	</ul>
	<p class="opacity-80 leading-relaxed mb-3">
		Sidan uppdateras när spärren ändras. Har du synpunkter eller har spärren missat något den borde
		ha fångat, skriv till
		<a href={PUBLIC_CONTACT_MAILTO} class="underline underline-offset-2">{PUBLIC_CONTACT_EMAIL}</a>.
		Mer om hur AI-stödet är byggt finns på
		<a href="/ansvarsfull-ai" class="underline underline-offset-2">Ansvarsfull AI</a>, och om vad som
		sparas på <a href="/integritet" class="underline underline-offset-2">integritetssidan</a>.
	</p>
</div>

<style>
	.crisis-content {
		max-width: 72ch;
	}

	.crisis-content p {
		margin-bottom: 1rem;
	}

	.crisis-content h1 {
		font-family: var(--font-heading);
		font-weight: 850;
		letter-spacing: -0.025em;
		line-height: 1.1;
	}

	.crisis-content h2 {
		font-family: var(--font-heading);
		font-weight: 700;
		letter-spacing: -0.02em;
		line-height: 1.15;
	}

	.crisis-now,
	.crisis-quick {
		margin-top: 1.1rem;
		padding: 1rem;
		border-radius: var(--radius-card);
		border: 1px solid hsl(var(--border));
		background: hsl(var(--surface-soft));
	}

	.crisis-now {
		border-color: rgba(251, 113, 133, 0.45);
		background: rgba(136, 19, 55, 0.18);
	}

	.crisis-now a {
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.crisis-now ul,
	.crisis-quick ul {
		margin: 0.55rem 0 0;
		padding-left: 1.1rem;
		display: grid;
		gap: 0.35rem;
		list-style: disc;
	}

	@media (max-width: 640px) {
		.crisis-now,
		.crisis-quick {
			padding: 0.9rem;
		}
	}
</style>
