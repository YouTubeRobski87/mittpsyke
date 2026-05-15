<script lang="ts">
	import SEO from '$lib/components/SEO.svelte';

	const faqItems = [
		{
			question: 'Sparas det jag skriver i en anonym dagbok?',
			answer:
				'Om du skriver utan konto på MittPsyke sparas texten lokalt i webbläsaren tills du själv väljer att spara den. Vill du ha historik över tid behöver du skapa konto.'
		},
		{
			question: 'Är en anonym dagbok privat?',
			answer:
				'Den anonyma skrivytan är gjord för låg tröskel. När du skriver utan konto kopplas texten inte till en profil. Tänk ändå på att en del lokal data kan finnas kvar i webbläsaren på den enhet du använder.'
		},
		{
			question: 'Måste jag skriva dagbok varje dag?',
			answer:
				'Nej. Dagbok fungerar ofta bäst när den får vara ett verktyg du återkommer till vid behov, inte en prestation. Några rader ibland kan räcka.'
		},
		{
			question: 'Vad är skillnaden mellan dagbok och terapi?',
			answer:
				'En dagbok kan hjälpa dig att sortera tankar och se mönster. Terapi innebär kontakt med en behandlare och kan behövas när besvären påverkar livet mycket eller håller i sig.'
		},
		{
			question: 'Kan jag spara historik senare?',
			answer:
				'Ja. Du kan börja anonymt och skapa konto senare om du vill spara historik, följa mående över tid eller återkomma till tidigare inlägg.'
		}
	];

	const faqSchema = {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqItems.map((item) => ({
			'@type': 'Question',
			name: item.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: item.answer
			}
		}))
	};

	const articleSchema = {
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: 'Så kan anonym dagbok online hjälpa dig att sortera tankar',
		description:
			'Anonym dagbok kan hjälpa dig sortera tankar när allt känns rörigt. Läs om hur skrivandet fungerar och när det hjälper mest.',
		url: 'https://www.mittpsyke.se/guider/anonym-dagbok-online',
		publisher: {
			'@type': 'Organization',
			name: 'MittPsyke',
			url: 'https://www.mittpsyke.se'
		},
		inLanguage: 'sv-SE'
	};
</script>

<SEO canonical="https://www.mittpsyke.se/guider/anonym-dagbok-online" />

<svelte:head>
	<title>Så kan anonym dagbok online hjälpa dig att sortera tankar | MittPsyke</title>
	<meta
		name="description"
		content="Anonym dagbok kan hjälpa dig sortera tankar när allt känns rörigt. Läs om hur skrivandet fungerar och när det hjälper mest."
	/>
	<meta
		property="og:title"
		content="Så kan anonym dagbok online hjälpa dig att sortera tankar | MittPsyke"
	/>
	<meta
		property="og:description"
		content="Anonym dagbok kan hjälpa dig sortera tankar när allt känns rörigt. Läs om hur skrivandet fungerar och när det hjälper mest."
	/>
	<meta property="og:type" content="article" />
	<meta name="twitter:card" content="summary" />
	{@html `<script type="application/ld+json">${JSON.stringify(articleSchema)}<\/script>`}
	{@html `<script type="application/ld+json">${JSON.stringify(faqSchema)}<\/script>`}
</svelte:head>

<main class="guide-page">
	<article class="guide-article">
		<header class="guide-header">
			<p class="eyebrow">Guide</p>
			<h1>Så kan anonym dagbok online hjälpa dig att sortera tankar</h1>
			<p>
				När tankar känns röriga kan det vara svårt att veta var man ska börja. De kan ligga omlott,
				byta riktning snabbt eller kännas större just för att de aldrig får en tydlig form. Att
				skriva ner dem kan skapa lite avstånd, utan att du behöver lösa allt på en gång. En anonym
				dagbok kan göra det lättare att börja, särskilt när det du bär på ännu känns ofärdigt.
				Frågan är ofta inte bara varför skriva dagbok, utan varför skrivandet kan kännas lättare när
				ingen annan behöver läsa.
			</p>
		</header>

		<section>
			<h2>Vad som händer när du sätter ord på det som snurrar</h2>
			<p>
				Tankar som stannar i huvudet kan ibland kännas som en enda tät massa. Du vet kanske att något
				stressar dig, men inte riktigt vad. Eller så vet du vad det handlar om, men varje försök att
				tänka klart leder till nya sidospår. När du skriver får tankarna en följd. En mening kommer
				efter en annan. Det gör inte automatiskt situationen enkel, men det kan göra den mer synlig.
			</p>
			<p>
				Det här är en av de stora fördelarna med dagbok: skrivandet flyttar något från insidan till
				utsidan. Du kan se orden framför dig. Du kan upptäcka att en oro egentligen består av flera
				olika saker, eller att något som kändes diffust har en ganska tydlig kärna. Ibland märker man
				först när man skriver att det inte bara handlar om vad som hände, utan om trötthet, väntan,
				skuld, press eller en känsla av att inte hinna med sig själv. Att sortera tankar genom
				skrivande kan vara ett sätt att se vad som faktiskt behöver uppmärksamhet först.
			</p>
			<p>
				Det behöver inte bli klokt eller välformulerat. Poängen är inte att producera en bra text.
				Poängen är att ge tankarna en plats där de kan ligga stilla en stund. Många upplever att det
				blir lättare att andas när det som snurrat runt i huvudet får stå på en rad. Det kan räcka
				med några meningar för att något ska kännas lite mindre hoptrasslat.
			</p>
		</section>

		<section>
			<h2>Varför anonymitet kan göra skrivandet mer ärligt</h2>
			<p>
				En dagbok fungerar ofta bäst när du inte behöver redigera dig själv för hårt. Om du redan från
				början tänker på hur texten skulle låta för någon annan kan skrivandet bli försiktigt. Du
				kanske förklarar, tonar ner eller försöker vara rimlig. Det kan vara värdefullt i ett samtal,
				men i en dagbok kan det ibland stå i vägen.
			</p>
			<p>
				Anonymitet sänker tröskeln. Du behöver inte skapa en profil, välja vem du är eller bestämma
				om texten ska sparas för alltid. Det gör att de första raderna kan få vara precis som de är:
				halva, motsägelsefulla, trötta eller rakt på. För många är det just där dagboken börjar göra
				nytta. Inte när man skriver snyggt, utan när man skriver sant nog för stunden.
			</p>
			<p>
				Det kan också göra det lättare att skriva om sådant som känns skamfyllt, pinsamt eller för
				litet för att ta upp med någon annan. En anonym dagbok kräver ingen förklaring. Den ställer
				inte följdfrågor. Den låter dig formulera något innan du vet om du vill dela det med någon.
				Ibland är det nog. Ibland blir det ett första steg mot att faktiskt söka stöd.
			</p>
		</section>

		<section>
			<h2>Varför dagbok inte behöver vara en vana för att fungera</h2>
			<p>
				Många tänker att dagbok kräver disciplin: varje kväll, samma tid, gärna med insikter. För en
				del kan det fungera så. Men för många andra blir det ännu ett krav, och då tappar skrivandet
				sin trygghet. En dagbok behöver inte vara ett projekt. Den kan vara ett ställe du går till när
				det är mycket, när något skaver eller när du vill förstå varför en liten sak tog så stor plats.
			</p>
			<p>
				Det är också därför anonymitet kan vara värdefull. Om du inte måste skapa ett konto, välja
				en rutin eller spara allt för framtiden blir det lättare att använda skrivandet som en tillfällig
				plats. Du kan skriva en gång och lämna det där. Du kan återkomma om det hjälpte. Du kan ta bort
				texten om den bara behövde komma ut. Själva friheten gör att fler tankar vågar bli formulerade.
			</p>
			<p>
				Fördelar med dagbok handlar ofta mindre om mängden text och mer om ärligheten i stunden. En
				kort rad som "jag är trött på att låtsas att det är lugnt" kan säga mer än en hel sida där du
				försöker skriva rätt. När orden är dina egna och inte behöver passa någon annans bild av dig,
				kan de bli lättare att förstå.
			</p>
		</section>

		<section>
			<h2>Situationer där skrivandet ofta hjälper mest</h2>
			<p>
				Att skriva dagbok vid ångest kan vara hjälpsamt när kroppen går upp i varv och tankarna söker
				efter något att hålla fast vid. I stället för att försöka tänka bort oron kan du skriva ner
				vad den säger, vad du är rädd ska hända och vad som faktiskt finns framför dig just nu. Det
				gör inte ångesten ogiltig, men den kan bli lättare att betrakta.
			</p>
			<p>
				Vid sömnlöshet kan dagboken fungera som en avlastningsplats. Många märker att tankarna blir
				tydligare när dagen tystnar. Då kan några rader hjälpa hjärnan att släppa taget om sådant som
				annars fortsätter kräva uppmärksamhet. Det behöver inte vara en lång kvällsrutin. Det kan vara
				en enkel lista över det som snurrar, följt av en rad om vad som kan vänta till i morgon.
			</p>
			<p>
				När du står inför ett beslut kan skrivandet visa vad som faktiskt väger tungt. Du kan skriva
				ut alternativen, men också vad varje val väcker i dig. Ibland upptäcker man att det svåra inte
				är beslutet i sig, utan rädslan för att göra någon besviken, välja fel eller behöva stå kvar
				i konsekvenserna.
			</p>
			<p>
				Vid prestation och självkritik kan dagboken hjälpa dig höra tonen i dina egna krav. Det är
				lätt att vänja sig vid hårda formuleringar som "jag borde", "jag måste" eller "det räcker
				inte". När de står skrivna blir de lättare att ifrågasätta. Inte genom att tvinga fram positiva
				tankar, utan genom att se vad du faktiskt säger till dig själv.
			</p>
			<p>
				I relationer kan en dagbok ge plats åt det du inte vill säga direkt. Du kan skriva vad som
				hände, vad du önskar att du hade sagt och vad du kanske behöver förstå innan du pratar med
				den andra personen. Det kan minska risken att allt kommer ut i affekt, samtidigt som känslan
				inte behöver tryckas undan.
			</p>
		</section>

		<section>
			<h2>När anonym dagbok inte räcker</h2>
			<p>
				En anonym dagbok kan vara ett varsamt stöd, men den ersätter inte vård. Om du mår mycket
				dåligt, har svårt att klara vardagen, känner dig rädd för dig själv eller har tankar på att
				inte vilja leva, är det viktigt att ta kontakt med människor som kan hjälpa på riktigt.
			</p>
			<p>
				Vid akut fara ska du ringa 112. För vårdråd kan du kontakta 1177. Om du behöver hitta vidare
				stöd, samtalslinjer eller organisationer kan <a href="https://stodlinjer.se" rel="noreferrer">stodlinjer.se</a>
				vara en bra startpunkt. Det är inget misslyckande att behöva mer än skrivande. Dagboken kan
				fortfarande finnas där som ett komplement, men den ska inte bära allt ensam.
			</p>
		</section>

		<section class="cta-section">
			<h2>Hur du kommer igång</h2>
			<p>
				Börja litet. Skriv en mening om vad som tar mest plats just nu. Skriv sedan en rad till om
				vad du hade behövt om du inte behövde prestera inför någon. Om det känns svårt kan du börja
				med "Just nu märker jag..." och låta resten vara ofärdigt.
			</p>
			<p>
				När du är redo att börja, kan du
				<a href="/anonym-dagbok-online">skriva anonymt direkt här</a>. Den sidan är till för själva
				starten: låg tröskel, utan konto och utan krav på att texten ska bli något särskilt.
			</p>
			<p class="cta-row">
				<a class="primary-link" href="/anonym-dagbok-online">Skriv anonym dagbok online</a>
			</p>
		</section>

		<section class="faq-section">
			<h2>Vanliga frågor</h2>
			<div class="faq-list">
				{#each faqItems as item}
					<article class="faq-item">
						<h3>{item.question}</h3>
						<p>{item.answer}</p>
					</article>
				{/each}
			</div>
		</section>
	</article>
</main>

<style>
	.guide-page {
		padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 1.5rem) clamp(4rem, 8vw, 5rem);
	}

	.guide-article {
		max-width: 760px;
		margin: 0 auto;
		display: grid;
		gap: clamp(1.8rem, 4vw, 2.7rem);
	}

	.guide-header,
	section {
		display: grid;
		gap: 0.8rem;
	}

	.eyebrow {
		margin: 0;
		font-size: 0.78rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: hsl(var(--muted-foreground));
	}

	h1,
	h2,
	h3 {
		font-family: var(--font-heading);
		margin: 0;
		letter-spacing: 0;
	}

	h1 {
		font-size: clamp(2rem, 1.5rem + 2.2vw, 3.25rem);
		line-height: 1.08;
	}

	h2 {
		font-size: clamp(1.35rem, 1.15rem + 0.9vw, 1.85rem);
		line-height: 1.25;
	}

	h3 {
		font-size: 1.05rem;
		line-height: 1.35;
	}

	p {
		margin: 0;
		font-family: var(--font-body);
		font-size: clamp(1rem, 0.96rem + 0.25vw, 1.08rem);
		line-height: 1.8;
		color: hsl(var(--foreground) / 0.86);
	}

	a {
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.cta-section {
		padding: clamp(1.2rem, 4vw, 1.6rem);
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-card);
		background: hsl(var(--surface));
	}

	.cta-row {
		margin-top: 0.2rem;
	}

	.primary-link {
		display: inline-flex;
		width: fit-content;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		background: var(--primary, #436e8f);
		padding: 0.7rem 1rem;
		color: white;
		font-weight: 700;
		text-decoration: none;
	}

	.faq-list {
		display: grid;
		gap: 0.85rem;
	}

	.faq-item {
		display: grid;
		gap: 0.35rem;
		border: 1px solid hsl(var(--border));
		border-radius: var(--radius-input);
		background: hsl(var(--surface));
		padding: 1rem 1.1rem;
	}

	.faq-item p {
		color: hsl(var(--muted-foreground));
	}

	@media (max-width: 640px) {
		.primary-link {
			width: 100%;
		}
	}
</style>
