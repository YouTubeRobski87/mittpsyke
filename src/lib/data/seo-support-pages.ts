import type { SeoSupportPageConfig } from '$lib/components/SeoSupportPage.svelte';

const updatedDate = '4 april 2026';

export const seoSupportPages: Record<string, SeoSupportPageConfig> = {
	'anonymt-samtalsstod-online': {
		title: 'Anonymt samtalsstöd online | Låg tröskel och trygg start | MittPsyke',
		description:
			'Utforska anonymt samtalsstöd online när du vill börja varsamt. Läs om varför anonymitet sänker tröskeln, hur stödet skiljer sig från vård och när det kan passa.',
		canonical: 'https://www.mittpsyke.se/anonymt-samtalsstod-online',
		ogTitle: 'Anonymt samtalsstöd online | MittPsyke',
		ogDescription:
			'När du inte orkar förklara allt direkt kan anonymt samtalsstöd vara en trygg första ingång.',
		h1: 'Anonymt samtalsstöd online',
		lead:
			'Ibland är det lättare att börja utan att först behöva presentera sig, boka tid eller veta exakt vad man vill säga. Här kan du läsa om hur anonymt samtalsstöd online kan fungera som ett lugnt första steg när något känns tungt.',
		primaryCta: { href: '/chat', label: 'Prata anonymt nu' },
		secondaryCta: { href: '/dagbok', label: 'Skriv i dagboken' },
		sections: [
			{
				title: 'Varför anonymitet kan sänka tröskeln',
				paragraphs: [
					'Anonymitet kan göra det lättare att börja när skam, osäkerhet eller rädsla för att bli missförstådd står i vägen. Många drar sig för att söka stöd för att de inte vill bli bedömda, inte vet om deras mående är “tillräckligt allvarligt” eller inte orkar ta kontakt i ett formellt system. När du kan börja i text och utan att först lämna ifrån dig hela din berättelse blir tröskeln lägre. Det betyder inte att det du känner är litet, utan att ingången får vara enkel nog för att faktiskt bli av.'
				]
			},
			{
				title: 'Skillnaden mellan digitalt samtalsstöd och traditionell vård',
				paragraphs: [
					'Anonymt samtalsstöd online är inte samma sak som bedömning, diagnos eller behandling i vården. Det är snarare ett stöd för att sortera tankar, sätta ord på det som händer och hitta nästa steg medan du fortfarande försöker förstå ditt eget läge. I traditionell vård finns journalföring, kliniska bedömningar och behandlingsansvar. Här handlar det i stället om låg tröskel, tillgänglighet och möjlighet att börja i liten skala. För många kan det vara ett komplement före, mellan eller vid sidan av annan hjälp, men inte en ersättning när behovet är medicinskt eller akut.'
				]
			},
			{
				title: 'När anonymt samtalsstöd kan passa bäst',
				paragraphs: [
					'Den här typen av stöd kan passa när du känner oro, nedstämdhet, stress eller ensamhet men ännu inte vet vad du behöver. Det kan också passa om du vill prova att uttrycka dig i text innan du pratar med någon människa, eller om du vill reflektera i lugn takt mellan andra insatser. Det passar sämre när du behöver snabb medicinsk bedömning, är i akut fara eller har symtom som kräver professionell behandling. Då är 1177, vårdcentral, psykiatri eller akuta stödlinjer viktigare vägar vidare.'
				]
			}
		],
		resourceListTitle: 'Det här kan du göra vidare på MittPsyke',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med någon', description: 'om du vill förstå hur ett anonymt samtal brukar börja.' },
			{ href: '/chattstod-psykisk-ohalsa', label: 'Läs om chattstöd vid psykisk ohälsa', description: 'för att få en bredare bild av hur textbaserat stöd kan hjälpa tidigt.' },
			{ href: '/prata-anonymt-online', label: 'Prata anonymt online', description: 'om du vill läsa mer om vad du kan ta upp och hur du kommer igång.' },
			{ href: '/dagbok', label: 'Använd dagboken', description: 'när det känns lättare att skriva för dig själv först.' }
		],
		nextStepTitle: 'Välj nästa steg i lugn takt',
		nextStepParagraphs: [
			'Om du märker att det hjälper att formulera dig i små delar kan du fortsätta i chatten, skriva i dagboken eller läsa en guide som matchar det du går igenom. Om du i stället känner att du behöver mänsklig kontakt eller tydligare vårdråd finns 1177 och stodlinjer.se som viktiga vägar vidare.',
			'Vid akut fara eller om du inte känner att du kan hålla dig själv eller någon annan säker ska du inte vänta i ett digitalt stödflöde. Ring 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Öppna chatten' },
			{ href: '/prata-anonymt-online', label: 'Läs om att prata anonymt' },
			{ href: '/om-mittpsyke', label: 'Så fungerar MittPsyke' }
		],
		faq: [
			{
				question: 'Måste jag logga in för att börja?',
				answer: 'Nej. Du kan börja med låg tröskel och skapa konto först om du senare vill spara innehåll över tid.'
			},
			{
				question: 'Är anonymt samtalsstöd samma sak som vård?',
				answer: 'Nej. Det är ett digitalt stöd för reflektion och nästa steg, inte diagnos, behandling eller akut hjälp.'
			},
			{
				question: 'När ska jag söka mer hjälp än detta?',
				answer: 'Om du är i akut fara, mår snabbt sämre eller behöver medicinsk bedömning ska du kontakta 112, 1177 eller annan professionell vård.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'chatta-anonymt-med-nagon': {
		title: 'Chatta anonymt med någon | Så fungerar stödet online | MittPsyke',
		description:
			'Lär dig vad som händer i en anonym chatt, hur AI-stöd fungerar och vad du kan förvänta dig när du vill chatta anonymt om psykisk hälsa.',
		canonical: 'https://www.mittpsyke.se/chatta-anonymt-med-nagon',
		ogTitle: 'Chatta anonymt med någon | MittPsyke',
		ogDescription:
			'En genomgång av hur anonym chatt kan fungera när du behöver börja enkelt och utan press.',
		h1: 'Chatta anonymt med någon',
		lead:
			'När något känns svårt kan text vara en enklare start än att prata högt. Den här sidan förklarar hur en anonym chatt brukar fungera, vad AI-stöd faktiskt gör och vad som är rimligt att förvänta sig innan du öppnar samtalet.',
		primaryCta: { href: '/chat', label: 'Öppna chatten' },
		secondaryCta: { href: '/prata-anonymt-online', label: 'Läs om att prata anonymt' },
		sections: [
			{
				title: 'Vad som brukar hända i en anonym chatt',
				paragraphs: [
					'En anonym chatt börjar ofta enklare än man tror. Du behöver inte skriva en full bakgrund eller formulera allt perfekt. Många börjar med något kort som “jag känner mig stressad”, “jag vet inte varför jag mår så här” eller “jag behöver bara få ur mig något”. Därifrån kan samtalet hjälpas fram steg för steg genom frågor, speglingar och struktur. Tempot är ditt. Du kan stanna upp, skriva om, byta ämne eller avsluta när du behöver. För vissa blir chatten ett sätt att tänka klart, för andra ett sätt att våga börja alls.'
				]
			},
			{
				title: 'Hur AI-stöd fungerar i praktiken',
				paragraphs: [
					'AI-stöd i den här typen av chatt fungerar inte som en människa med eget behandlingsansvar. Det är snarare ett verktyg som hjälper dig att sätta ord på känslor, se mönster, bryta upp stora tankeknutar och föreslå lugna nästa steg. Det kan till exempel hjälpa dig att skilja mellan oro, stress och nedstämdhet, föreslå en övning eller sammanfatta det du själv redan har beskrivit. Det viktiga är att använda stödet som en reflekterande yta, inte som ett medicinskt besked. Vid akut fara eller behov av vård räcker inte AI-stöd.'
				]
			},
			{
				title: 'Vad du kan förvänta dig och vad du inte ska förvänta dig',
				paragraphs: [
					'Det är rimligt att förvänta sig ett lugnt samtalsutrymme där du kan börja sortera det som känns svårt. Du kan ofta få hjälp att hitta språk för känslor, komma vidare när tankarna fastnar och välja ett första steg som känns möjligt idag. Däremot ska du inte förvänta dig diagnos, krishantering i realtid eller att en chatt löser allt på en gång. För många är värdet i stället att det blir lättare att förstå sitt läge, fortsätta skriva i dagboken eller söka mer stöd med lite mer klarhet.'
				]
			}
		],
		resourceListTitle: 'Fortsätt i rätt riktning',
		resourceListItems: [
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstöd online', description: 'om du vill förstå varför anonymitet ofta gör första steget lättare.' },
			{ href: '/chattstod-psykisk-ohalsa', label: 'Chattstöd vid psykisk ohälsa', description: 'för en bredare bild av hur tidigt stöd i text kan fungera.' },
			{ href: '/dagbok', label: 'Skriv i dagboken', description: 'om du vill formulera mer i lugn och ro efter chatten.' },
			{ href: '/om-mittpsyke', label: 'Läs om MittPsyke', description: 'för att förstå tjänstens roll, gränser och nästa steg.' }
		],
		nextStepTitle: 'Om du vill börja nu',
		nextStepParagraphs: [
			'Du behöver inte vänta tills du vet exakt vad du ska säga. Ett enkelt första meddelande räcker ofta för att samtalet ska börja röra sig framåt. Om det känns lättare kan du också skriva några rader i dagboken först och sedan fortsätta därifrån.',
			'Behöver du mänsklig kontakt eller mer akut vägledning finns stodlinjer.se och 1177. Vid akut fara ska du alltid ringa 112.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Starta chatten' },
			{ href: '/dagbok', label: 'Börja i dagboken' },
			{ href: '/anonymt-samtalsstod-online', label: 'Läs mer om anonymt stöd' }
		],
		faq: [
			{
				question: 'Måste jag ha konto för att chatta anonymt?',
				answer: 'Nej. Du kan börja utan konto och först senare välja om du vill spara något över tid.'
			},
			{
				question: 'Är AI-stöd samma sak som att prata med en behandlare?',
				answer: 'Nej. AI-stöd kan hjälpa dig att reflektera och strukturera, men det ersätter inte vård, diagnos eller behandling.'
			},
			{
				question: 'Vad gör jag om det blir akut?',
				answer: 'Vid akut fara eller om någon riskerar att skadas ska du lämna chatten och ringa 112 direkt.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'chattstod-psykisk-ohalsa': {
		title: 'Chattstöd vid psykisk ohälsa | Tidigt stöd online | MittPsyke',
		description:
			'Förstå vad psykisk ohälsa kan innebära i vardagen och hur chattstöd kan hjälpa tidigt när du vill sätta ord på det som känns tungt.',
		canonical: 'https://www.mittpsyke.se/chattstod-psykisk-ohalsa',
		ogTitle: 'Chattstöd vid psykisk ohälsa | MittPsyke',
		ogDescription:
			'En lugn genomgång av hur textbaserat stöd kan hjälpa dig att börja tidigt när måendet skaver.',
		h1: 'Chattstöd vid psykisk ohälsa',
		lead:
			'Psykisk ohälsa kan synas på många olika sätt i vardagen. Här kan du läsa om hur textbaserat stöd online kan hjälpa tidigt, innan allt hunnit bli större eller mer låst.',
		primaryCta: { href: '/chat', label: 'Öppna chatten' },
		secondaryCta: { href: '/psykiskt-stod-online', label: 'Läs om psykiskt stöd online' },
		sections: [
			{
				title: 'Vad psykisk ohälsa kan innebära i vardagen',
				paragraphs: [
					'Psykisk ohälsa är ett brett begrepp och behöver inte se likadant ut från person till person. För någon märks det som sömnsvårigheter, irritation, trötthet eller att allt känns tyngre än vanligt. För någon annan handlar det om stark oro, undvikande, känslor av hopplöshet eller svårigheter att fokusera på det vardagliga. Just därför kan det vara svårt att veta om det “räcker” att söka stöd. Ofta är det klokare att lyssna på om måendet påverkar vardagen än att försöka avgöra om man får kalla det något särskilt.'
				]
			},
			{
				title: 'Hur chattstöd kan hjälpa tidigt',
				paragraphs: [
					'Textbaserat stöd kan vara hjälpsamt tidigt eftersom det inte kräver att du är helt säker på vad som händer. Du kan börja mitt i det röriga och få hjälp att sortera om det mest liknar stress, oro, nedstämdhet, ensamhet eller överbelastning. När du sätter ord på det som pågår blir det ofta lättare att se mönster och nästa steg. För en del räcker det som en första avlastning. För andra blir det ett sätt att samla tankarna innan de pratar med vård, stödlinje eller någon i sin närhet.'
				]
			},
			{
				title: 'När textstöd räcker och när mer stöd behövs',
				paragraphs: [
					'Chattstöd kan vara en god början när du behöver reflektera, få struktur eller minska ensamhetskänslan i det du bär på. Men om du har återkommande självmordstankar, snabbt försämrat mående, svåra sömnproblem, stark ångest som inte går över eller andra symtom som tydligt påverkar säkerhet och funktion behöver du mer än ett digitalt reflektionsstöd. Då är det viktigt att söka professionell hjälp. Låg tröskel ska göra det lättare att börja, inte göra att du stannar för länge på en nivå som inte räcker.'
				]
			}
		],
		resourceListTitle: 'Stöd som kan passa beroende på vad som känns närmast',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med någon', description: 'om du vill läsa mer om hur själva samtalet brukar fungera.' },
			{ href: '/hjalp-mot-oro-online', label: 'Hjälp mot oro online', description: 'om det framför allt är grubbel, rastlöshet eller framtidstankar som tar plats.' },
			{ href: '/hjalp-vid-depression-online', label: 'Hjälp vid depression online', description: 'om tyngd, låg ork och nedstämdhet är det som dominerar.' },
			{ href: '/stod-vid-stress-online', label: 'Stöd vid stress online', description: 'om kroppen och vardagen känns överbelastade.' }
		],
		nextStepTitle: 'Börja smått och följ upp',
		nextStepParagraphs: [
			'Om du inte vet var du ska börja kan du välja den känsla eller situation som är lättast att beskriva just idag. Det räcker ofta för att få syn på ett första mönster. När du vill kan du följa upp i dagboken eller läsa mer i en guide som passar det du går igenom.',
			'Behöver du vårdråd ska du kontakta 1177. Vid akut fara eller om någon riskerar att skadas ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Starta samtal' },
			{ href: '/dagbok', label: 'Skriv i dagboken' },
			{ href: '/guider', label: 'Läs guider' }
		],
		faq: [
			{
				question: 'Måste jag veta exakt vad jag mår dåligt av?',
				answer: 'Nej. Chattstöd kan vara användbart just när du fortfarande försöker förstå vad som händer.'
			},
			{
				question: 'Kan chattstöd hjälpa innan problemen blivit stora?',
				answer: 'Ja. Många använder textstöd tidigt för att få ordning på tankar och känslor innan läget hinner växa.'
			},
			{
				question: 'Ersätter detta professionell vård?',
				answer: 'Nej. Det är ett lågtröskelstöd och ett komplement, inte medicinsk eller psykiatrisk behandling.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		]
	},
	'hjalp-mot-oro-online': {
		title: 'Hjälp mot oro online | Skillnaden mellan oro och ångest | MittPsyke',
		description:
			'Läs om skillnaden mellan oro och ångest, vilka tekniker som kan hjälpa och när oron har börjat ta för mycket plats i vardagen.',
		canonical: 'https://www.mittpsyke.se/hjalp-mot-oro-online',
		ogTitle: 'Hjälp mot oro online | MittPsyke',
		ogDescription:
			'När tankarna fastnar i framtiden kan det hjälpa att förstå oron och välja lugna nästa steg.',
		h1: 'Hjälp mot oro online',
		lead:
			'Oro kan handla om allt från ekonomi och relationer till hälsa, framtid och vardagsbeslut. Här kan du läsa om vad som skiljer oro från ångest, vad som kan hjälpa i stunden och när det är dags att ta oron på större allvar.',
		primaryCta: { href: '/chat/e', label: 'Starta samtal om oro' },
		secondaryCta: { href: '/guider/overtankande', label: 'Läs guide om övertänkande' },
		sections: [
			{
				title: 'Skillnaden mellan oro och ångest',
				paragraphs: [
					'Oro handlar ofta om tankar som går framåt i tiden: tänk om något går fel, tänk om jag missar något, tänk om jag inte klarar det. Ångest kan också innehålla sådana tankar men märks ofta starkare i kroppen, med till exempel tryck över bröstet, hjärtklappning, yrsel eller en känsla av att tappa kontrollen. Skillnaden är inte alltid knivskarp, och många upplever båda samtidigt. Men det kan ändå vara hjälpsamt att fråga sig om det främst är grubbel och scenarier, eller om kroppen också går upp i tydligt alarm.'
				]
			},
			{
				title: 'Konkreta tekniker som kan göra oron mindre styrande',
				paragraphs: [
					'När oro tar fart hjälper det sällan att bara säga åt sig själv att sluta tänka. Ofta fungerar det bättre att ge tankarna en tydlig form. Du kan skriva ner exakt vad du oroar dig för, sortera vad du kan påverka idag och vad som bara är hypotetiska scenarier, eller sätta en kort “orostid” senare på dagen så att grubblandet inte tar över allt. Kroppen kan också behöva hjälp att varva ner genom andning, kort promenad eller att rikta uppmärksamheten mot något konkret i rummet just nu.'
				]
			},
			{
				title: 'När oron har börjat ta för mycket plats',
				paragraphs: [
					'Oron är värd att ta på allvar när den påverkar sömn, koncentration, relationer, arbete eller din förmåga att vara närvarande i vardagen. Det gäller också om du märker att du undviker situationer, söker ständig försäkran från andra eller känner att tankarna fortsätter trots att du försöker vila. Då kan det vara hjälpsamt att inte bara stå ut, utan att aktivt söka stöd. Ett första steg kan vara att skriva av dig, prata i chatten eller läsa en guide. I vissa lägen behövs också professionell vård.'
				]
			}
		],
		resourceListTitle: 'Stöd som kan hjälpa när tankarna snurrar',
		resourceListItems: [
			{ href: '/4-7-8-andning-ovning', label: '4-7-8-andning', description: 'när du vill ge kroppen ett konkret lugnare tempo.' },
			{ href: '/andningsovningar-mot-angest', label: 'Andningsövningar mot ångest', description: 'om oron går över i stark kroppslig anspänning.' },
			{ href: '/ovningar/daglig-reflektionsmall', label: 'Daglig reflektionsmall', description: 'för att få ut grubbel ur huvudet och ner i ord.' },
			{ href: '/dagbok', label: 'Dagbok', description: 'om du vill följa återkommande mönster i det som oroar dig.' }
		],
		nextStepTitle: 'När du vill ta nästa steg',
		nextStepParagraphs: [
			'Om oron mest snurrar i tankarna kan en övning eller kort skrivstund räcka som första hjälp. Om du märker att kroppen går upp i starkt alarm kan du läsa mer om ångest och andningsövningar. Om allt fortsätter att växa trots att du försöker hantera det själv är det klokt att prata med vården.',
			'För vårdråd kan du kontakta 1177. Vid akut fara ska du ringa 112.'
		],
		nextStepLinks: [
			{ href: '/hjalp-vid-angest-online', label: 'Läs om ångest' },
			{ href: '/ovningar', label: 'Se övningar' },
			{ href: '/dagbok', label: 'Skriv i dagboken' }
		],
		faq: [
			{
				question: 'Är oro och ångest samma sak?',
				answer: 'De kan överlappa, men oro märks ofta mest i tankarna medan ångest ofta känns starkare i kroppen också.'
			},
			{
				question: 'Vad kan jag göra när jag fastnar i grubbel?',
				answer: 'Det kan hjälpa att skriva ner oron, sortera vad du kan påverka och använda en enkel övning eller andning för att bryta spiralen.'
			},
			{
				question: 'När bör jag söka mer hjälp?',
				answer: 'När oron påverkar sömn, funktion eller relationer tydligt, eller när du inte kommer ur den på egen hand, är det bra att söka mer stöd.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'hjalp-vid-depression-online': {
		title: 'Hjälp vid depression online | Symtom, stöd och nästa steg | MittPsyke',
		description:
			'Läs om vanliga depressionssymtom, varför tidig hjälp spelar roll och vad du kan göra idag om nedstämdheten tar mycket plats.',
		canonical: 'https://www.mittpsyke.se/hjalp-vid-depression-online',
		ogTitle: 'Hjälp vid depression online | MittPsyke',
		ogDescription:
			'När orken är låg kan det hjälpa att börja varsamt och förstå vad som faktiskt händer.',
		h1: 'Hjälp vid depression online',
		lead:
			'När allt känns tyngre än vanligt kan även små saker bli svåra att få gjort. Den här sidan samlar lugn information om vanliga symtom vid depression, varför tidigt stöd spelar roll och hur du kan börja idag utan att pressa dig mer än du orkar.',
		primaryCta: { href: '/chat/b', label: 'Starta samtal om nedstämdhet' },
		secondaryCta: { href: '/depression', label: 'Läs översikt om depression' },
		sections: [
			{
				title: 'Vanliga symtom när depression tar plats',
				paragraphs: [
					'Depression handlar inte bara om att känna sig ledsen. För många märks det lika mycket som låg energi, tappad lust, svårigheter att koncentrera sig, sömnförändringar eller att sådant som brukade kännas meningsfullt plötsligt blir tomt. En del känner mer irritation än sorg. Andra upplever skuld, hopplöshet eller att vardagliga beslut blir övermäktiga. Det viktiga är inte att alla symtom stämmer in, utan att du märker om måendet håller i sig och påverkar hur du fungerar och orkar i vardagen.'
				]
			},
			{
				title: 'Varför tidig hjälp spelar roll',
				paragraphs: [
					'När nedstämdhet får fortsätta i tysthet blir det ofta svårare att bryta mönster av isolering, passivitet och självkritik. Tidig hjälp behöver inte betyda att allt måste lösas direkt. Det kan handla om att du får syn på hur du mår, börjar följa dina dagar, sätter ord på det som känns tungt eller vågar be om mer stöd i tid. Små steg tidigt kan göra stor skillnad eftersom de minskar risken att allt låser sig ytterligare. Att söka stöd tidigt är inte att överdriva, utan att ta sitt mående på allvar.'
				]
			},
			{
				title: 'Vad du kan göra idag om orken är låg',
				paragraphs: [
					'Om du har låg ork är det sällan hjälpsamt att lägga en stor plan. Börja hellre med något mycket litet: skriv några rader om hur dagen känns, öppna ett samtal och beskriv nuläget, ät något enkelt, gå ut en kort stund eller skicka ett meddelande till någon du litar på. Målet är inte att känna dig bra direkt, utan att minska ensamheten och skapa en liten rörelse framåt. Om du har tankar på att inte vilja leva eller svårt att hålla dig säker ska du söka akut hjälp direkt.'
				]
			}
		],
		resourceListTitle: 'Stöd att använda i din takt',
		resourceListItems: [
			{ href: '/dagbok', label: 'Dagbok', description: 'för att skriva av dig när tankarna känns tröga eller otydliga.' },
			{ href: '/framsteg', label: 'Framsteg', description: 'om du vill kunna följa små förändringar över tid när du har konto.' },
			{ href: '/chat/b', label: 'Samtal om nedstämdhet', description: 'när du vill börja i text i stället för att bära allt själv.' },
			{ href: '/om-mittpsyke', label: 'Om MittPsyke', description: 'om du vill förstå vad tjänsten är och inte är innan du använder den.' }
		],
		nextStepTitle: 'Om du behöver mer än ett första steg',
		nextStepParagraphs: [
			'Digitalt stöd kan hjälpa dig att börja, men ibland behöver låg ork, stark hopplöshet eller långvarig nedstämdhet mötas med professionell vård. Om du känner att symtomen håller i sig eller blir djupare är det klokt att kontakta vården tidigare hellre än senare.',
			'Vid vårdråd kan du vända dig till 1177. Vid akut fara eller om du inte kan hålla dig själv säker ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat/b', label: 'Öppna samtalet' },
			{ href: '/dagbok', label: 'Skriv några rader' },
			{ href: '/depression', label: 'Gå till översikt om depression' }
		],
		faq: [
			{
				question: 'Är depression samma sak som att vara tillfälligt nere?',
				answer: 'Inte alltid. Depression brukar påverka ork, lust och vardagsfunktion mer ihållande än en vanlig tillfällig svacka.'
			},
			{
				question: 'Vad kan jag göra om jag inte orkar så mycket?',
				answer: 'Börja mycket smått. Några ord i chatten eller dagboken kan vara ett rimligt första steg när orken är låg.'
			},
			{
				question: 'När behöver jag söka mer hjälp?',
				answer: 'Om nedstämdheten håller i sig, blir djupare eller om du har tankar på att inte vilja leva behöver du mer stöd än ett digitalt första steg.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Depression – 1177 Vårdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/depression/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		]
	},
	'ovningar-mot-angest-online': {
		title: 'Övningar mot ångest online | KBT, andning och exponering | MittPsyke',
		description:
			'Utforska KBT-baserade övningar mot ångest online. Läs om andning, exponering och varför praktiska övningar ofta hjälper mer än att bara försöka tänka bort ångesten.',
		canonical: 'https://www.mittpsyke.se/ovningar-mot-angest-online',
		ogTitle: 'Övningar mot ångest online | MittPsyke',
		ogDescription:
			'När ångest tar plats kan övningar ge kroppen och tankarna något konkret att hålla i.',
		h1: 'Övningar mot ångest online',
		lead:
			'När ångest är starkt känns det ofta som att kroppen och tankarna springer före dig. Övningar kan hjälpa just för att de gör något konkret av ett annars diffust och överväldigande läge.',
		primaryCta: { href: '/ovningar', label: 'Se övningar' },
		secondaryCta: { href: '/hjalp-vid-angest-online', label: 'Läs om hjälp vid ångest' },
		sections: [
			{
				title: 'Varför KBT-baserade övningar ofta fungerar',
				paragraphs: [
					'Många övningar mot ångest bygger på principer från KBT, där fokus ligger på sambandet mellan tankar, känslor, kroppsliga reaktioner och beteenden. När du blir ångestfylld är det vanligt att börja undvika, kontrollera eller försöka tänka bort obehaget snabbt. Det kan hjälpa kortsiktigt men håller ofta igång problemet längre. Övningar fungerar därför inte för att de magiskt tar bort ångest, utan för att de tränar något nytt: att stanna kvar, reglera kroppen, observera tankar och stegvis bygga mer handlingsutrymme.'
				]
			},
			{
				title: 'Andning och kroppslig nedvarvning',
				paragraphs: [
					'När kroppen går upp i alarm kan det vara svårt att tänka klart. Då kan andningsövningar vara ett rimligt första steg, inte för att “andas rätt” perfekt utan för att ge nervsystemet en tydlig signal om att tempot kan sjunka något. Långsammare utandning, rytmisk andning eller att räkna andetag kan hjälpa dig att komma tillbaka till nuet. Det betyder inte att allt blir bra på en gång, men ofta att intensiteten sjunker tillräckligt för att du ska kunna välja nästa steg i stället för att bara reagera på ångesten.'
				]
			},
			{
				title: 'Exponering och varför undvikande ofta stärker ångest',
				paragraphs: [
					'Exponering handlar om att närma sig sådant som väcker ångest i små, planerade steg i stället för att fortsätta backa undan. När vi undviker får hjärnan aldrig chans att lära om. Det som kändes farligt fortsätter därför att verka farligt. Exponering behöver vara varsam och genomtänkt, inte brutal. Målet är att bygga tolerans, inte att pressa sig över gränsen. För vissa går det bra att börja med enkla vardagssituationer på egen hand. För svårare problem kan det vara klokt att få professionell hjälp.'
				]
			}
		],
		resourceListTitle: 'Övningar och vägar vidare',
		resourceListItems: [
			{ href: '/andningsovningar-mot-angest', label: 'Andningsövningar mot ångest', description: 'när du behöver börja i kroppen och sakta ner tempot.' },
			{ href: '/4-7-8-andning-ovning', label: '4-7-8-andning', description: 'om du vill testa en enkel, tydlig övning direkt.' },
			{ href: '/exponering-ovningar-mot-angest', label: 'Exponeringsövningar mot ångest', description: 'om undvikande har blivit ett återkommande mönster.' },
			{ href: '/chat/a', label: 'Samtal om ångest', description: 'när du vill kombinera övningar med reflektion i text.' }
		],
		nextStepTitle: 'Välj en nivå som känns möjlig',
		nextStepParagraphs: [
			'Om ångesten är stark i stunden är det ofta bäst att börja med en enkel andnings- eller jordningsövning. Om du i stället märker att problemet sitter i undvikande över tid kan exponering vara mer hjälpsamt. Du kan också använda dagboken för att se vilka situationer som triggar mest.',
			'Om ångesten blir så stark att du har svårt att fungera eller känna dig trygg behöver du mer stöd än övningar på egen hand. Kontakta då vården eller 1177.'
		],
		nextStepLinks: [
			{ href: '/andningsovningar-mot-angest', label: 'Börja med andning' },
			{ href: '/exponering-ovningar-mot-angest', label: 'Läs om exponering' },
			{ href: '/dagbok', label: 'Följ mönster i dagboken' }
		],
		faq: [
			{
				question: 'Hjälper övningar verkligen mot ångest?',
				answer: 'Ja, ofta som ett sätt att träna nya reaktioner och skapa mer handlingsutrymme, även om de sällan löser allt på en gång.'
			},
			{
				question: 'Ska jag börja med andning eller exponering?',
				answer: 'Börja ofta med andning när ångesten är stark i kroppen just nu, och titta på exponering när undvikande blivit ett större mönster över tid.'
			},
			{
				question: 'När behöver jag professionell hjälp?',
				answer: 'Om ångesten är återkommande, mycket stark eller begränsar vardagen tydligt är det klokt att söka mer stöd än övningar på egen hand.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Ångest – 1177 Vårdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'psykiskt-stod-online': {
		title: 'Psykiskt stöd online | Vad digitalt stöd är och inte är | MittPsyke',
		description:
			'Läs vad digitalt psykiskt stöd online kan vara, vilka fördelar och begränsningar som finns och när det fungerar som en bra första ingång.',
		canonical: 'https://www.mittpsyke.se/psykiskt-stod-online',
		ogTitle: 'Psykiskt stöd online | MittPsyke',
		ogDescription:
			'Digitalt stöd kan vara ett lugnt första steg, men det är inte samma sak som vård.',
		h1: 'Psykiskt stöd online',
		lead:
			'Digitalt psykiskt stöd kan fylla olika roller beroende på vad du behöver. Här går vi igenom vad stödet faktiskt kan hjälpa med, vad det inte ska blandas ihop med och vilka styrkor och begränsningar som är viktiga att känna till.',
		primaryCta: { href: '/chat/a', label: 'Börja anonymt' },
		secondaryCta: { href: '/register', label: 'Skapa din egen plats' },
		sections: [
			{
				title: 'Vad digitalt psykiskt stöd faktiskt är',
				paragraphs: [
					'Digitalt psykiskt stöd kan vara en plats för reflektion, struktur och första hjälp när något skaver men det känns svårt att börja i vården direkt. För många innebär det att skriva i chatten, få ordning på tankar, testa övningar eller använda en dagbok för att se mönster. Det kan minska känslan av kaos och ge ett första språk för det som känns svårt. Just därför passar det ofta bra när du vill börja i liten skala eller behöver något tillgängligt här och nu snarare än att vänta på rätt tillfälle.'
				]
			},
			{
				title: 'Vad det inte är och varför den skillnaden spelar roll',
				paragraphs: [
					'Digitalt stöd är inte detsamma som vård, psykologisk behandling eller medicinsk bedömning. Den skillnaden är viktig eftersom den hjälper dig att välja rätt nivå av hjälp. Ett stöd som MittPsyke kan hjälpa dig att reflektera, följa ditt mående och hitta nästa steg, men det tar inte över vårdens ansvar. Om du behöver diagnostik, behandling, läkemedelsbedömning eller stöd i akuta situationer ska du söka professionell hjälp. Att förstå gränsen gör att digitalt stöd blir ett användbart komplement i stället för en otydlig ersättning.'
				]
			},
			{
				title: 'Fördelar och begränsningar med stöd online',
				paragraphs: [
					'De tydligaste fördelarna är låg tröskel, tillgänglighet och att du kan börja i din egen takt. Du behöver inte boka en lång process för att få syn på hur du mår idag. För vissa är textformatet också lättare än att prata högt. Samtidigt finns begränsningar. Det är svårare att fånga hela din situation digitalt, och det finns lägen där du behöver mer än reflektion och självstöd. Därför fungerar stöd online bäst när det används ärligt: som första ingång, komplement eller mellanrum, inte som lösning på allt.'
				]
			}
		],
		resourceListTitle: 'Välj det format som passar dig bäst',
		resourceListItems: [
			{ href: '/chat', label: 'Chatten', description: 'om du vill börja i samtal direkt och sätta ord på det som känns närmast.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva i lugn takt och återkomma över tid.' },
			{ href: '/ovningar', label: 'Övningar', description: 'om du vill börja konkret med något som går att göra här och nu.' },
			{ href: '/guider', label: 'Guider', description: 'om du först vill läsa och förstå mer om det du går igenom.' }
		],
		nextStepTitle: 'När du vill använda stödet klokt',
		nextStepParagraphs: [
			'Det kan vara hjälpsamt att börja med en fråga: behöver du någonstans att sortera, eller behöver du vård och bedömning? Om du främst behöver struktur och lugn start kan digitalt stöd passa bra. Om du märker att symtomen är svåra, långvariga eller akuta behöver du söka mer hjälp.',
			'Vid vårdråd kan du kontakta 1177. Vid akut fara ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Öppna chatten' },
			{ href: '/dagbok', label: 'Skriv i dagboken' },
			{ href: '/om-mittpsyke', label: 'Läs om MittPsyke' }
		],
		faq: [
			{
				question: 'Är psykiskt stöd online anonymt?',
				answer: 'Du kan börja utan konto i flera delar av tjänsten. Konto behövs först när du vill spara mer över tid.'
			},
			{
				question: 'Är detta samma sak som terapi?',
				answer: 'Nej. Det är ett digitalt stöd för reflektion och nästa steg, inte terapi eller medicinsk vård.'
			},
			{
				question: 'När passar stöd online bäst?',
				answer: 'Det passar ofta bäst som lågtröskelstöd när du vill börja enkelt, få struktur eller komplettera annan hjälp.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'prata-anonymt-online': {
		title: 'Prata anonymt online | Hur du börjar och vad du kan ta upp | MittPsyke',
		description:
			'Läs varför anonymitet kan hjälpa, vad du kan prata om i ett anonymt stöd och hur du kommer igång när du vill börja utan press.',
		canonical: 'https://www.mittpsyke.se/prata-anonymt-online',
		ogTitle: 'Prata anonymt online | MittPsyke',
		ogDescription:
			'När du vill börja utan press kan anonymitet göra det lättare att sätta ord på det som känns svårt.',
		h1: 'Prata anonymt online',
		lead:
			'Att prata anonymt online kan vara ett första steg när du vill uttrycka något svårt utan att först behöva förklara allt om dig själv. Den här sidan går igenom varför anonymitet kan hjälpa, vad du kan ta upp och hur du kan komma igång i lugn takt.',
		primaryCta: { href: '/chat', label: 'Öppna chatten' },
		secondaryCta: { href: '/om-mittpsyke', label: 'Så fungerar MittPsyke' },
		sections: [
			{
				title: 'Varför anonymitet hjälper många att börja',
				paragraphs: [
					'Anonymitet kan minska flera hinder på samma gång. Du slipper fundera över hur du uppfattas, om du formulerar dig rätt eller om någon kommer tycka att dina problem inte är tillräckligt stora. För personer som bär mycket skam, är ovana vid att prata om känslor eller bara är utmattade av att hålla ihop vardagen kan det vara avgörande. När ingången är enklare blir det också lättare att vara ärlig. Det betyder inte att det du känner är mindre viktigt, utan att formen gör det mer möjligt att faktiskt börja.'
				]
			},
			{
				title: 'Vad du kan prata om här',
				paragraphs: [
					'Du behöver inte komma med ett färdigt ämne. Många börjar med något brett som oro, stress, ångest, nedstämdhet, ensamhet eller bara en känsla av att något inte står rätt till. Du kan också prata om relationer, press, sömn, skuldkänslor, tomhet eller att du har svårt att förstå dina reaktioner. Om du inte vet vad det “handlar om” ännu går det bra att börja just där. Det viktiga är inte att sätta rätt etikett direkt, utan att ge det som känns svårt lite mer form och riktning.'
				]
			},
			{
				title: 'Hur du börjar när allt känns diffust',
				paragraphs: [
					'Det enklaste sättet att börja är ofta att skriva det mest konkreta du vet just nu. Det kan vara en kroppslig känsla, en situation från idag eller en tanke som går runt. Du behöver inte skriva långt. En eller två meningar räcker för att samtalet ska kunna ta form. Om du hellre vill skriva först för dig själv kan dagboken vara ett bra mellanled. När du väl börjar märker många att det blir lättare att fortsätta, just för att de inte längre behöver bära allt ensam i huvudet.'
				]
			}
		],
		resourceListTitle: 'Sidor som kan hjälpa dig vidare',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med någon', description: 'om du vill läsa mer om hur ett anonymt samtal brukar fungera.' },
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstöd online', description: 'för en djupare genomgång av varför låg tröskel kan spela stor roll.' },
			{ href: '/chattstod-psykisk-ohalsa', label: 'Chattstöd vid psykisk ohälsa', description: 'om du vill förstå hur stöd i text kan hjälpa tidigt.' },
			{ href: '/dagbok', label: 'Dagbok', description: 'om du vill börja skriva för dig själv innan du öppnar ett samtal.' }
		],
		nextStepTitle: 'Börja med det som känns möjligt',
		nextStepParagraphs: [
			'Det finns inget rätt sätt att ta första steget. För vissa passar ett kort anonymt meddelande bäst. För andra känns det bättre att skriva i dagboken först eller läsa en sida som sätter ord på det man upplever. Huvudsaken är att steget är tillräckligt litet för att bli taget idag.',
			'Om du behöver mänsklig kontakt finns stodlinjer.se. Vid akut fara ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Starta chatten' },
			{ href: '/dagbok', label: 'Skriv i dagboken' },
			{ href: '/chatta-anonymt-med-nagon', label: 'Läs om anonym chatt' }
		],
		faq: [
			{
				question: 'Måste jag veta vad jag vill prata om innan jag börjar?',
				answer: 'Nej. Du kan börja med något litet och oklart. Samtalet kan hjälpa dig att sortera vidare.'
			},
			{
				question: 'Vad kan jag ta upp i ett anonymt samtal?',
				answer: 'Du kan ta upp allt från oro och ångest till stress, relationer, ensamhet eller att du bara känner dig låg utan att veta varför.'
			},
			{
				question: 'Är detta akut hjälp?',
				answer: 'Nej. Vid akut fara eller om någon riskerar att skadas ska du ringa 112.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'samtalsstod-utan-vantetid': {
		title: 'Samtalsstöd utan väntetid | När du behöver börja nu | MittPsyke',
		description:
			'Läs om hur digitalt samtalsstöd kan fylla ett gap när vårdköer eller trösklar gör att hjälpen känns långt bort, och vad som skiljer det från traditionell vård.',
		canonical: 'https://www.mittpsyke.se/samtalsstod-utan-vantetid',
		ogTitle: 'Samtalsstöd utan väntetid | MittPsyke',
		ogDescription:
			'När du behöver börja nu kan digitalt stöd vara en första ingång, men det är inte samma sak som vård.',
		h1: 'Samtalsstöd utan väntetid',
		lead:
			'Ibland är det inte brist på vilja som gör att stöd dröjer, utan att vägarna dit känns för långa eller för tunga. Här går vi igenom varför väntan blir ett problem, hur digitalt stöd kan fylla ett mellanrum och vad som skiljer det från vård.',
		primaryCta: { href: '/chat', label: 'Öppna chatten' },
		secondaryCta: { href: '/prata-anonymt-online', label: 'Läs om att prata anonymt' },
		sections: [
			{
				title: 'Problemet med att vänta när måendet redan skaver',
				paragraphs: [
					'När du mår dåligt kan även kort väntan kännas lång. Det är svårt att samla kraft till att söka hjälp när sömn, oro, nedstämdhet eller stress redan tar mycket energi. För vissa handlar väntan om vårdköer. För andra handlar den om att det känns för stort att boka, ringa eller förklara sig. Under tiden riskerar problemen att växa, inte alltid för att något dramatiskt händer utan för att du blir mer ensam med det som pågår. Därför kan en tillgänglig första ingång vara viktig även när den inte löser allt.'
				]
			},
			{
				title: 'Hur digitalt stöd kan fylla gapet',
				paragraphs: [
					'Digitalt samtalsstöd kan fylla ett mellanrum mellan att bära allt själv och att få mer omfattande hjälp. Det ger möjlighet att börja samma dag, sätta ord på läget medan det fortfarande är färskt och hitta en liten riktning i stället för att fastna i passiv väntan. För vissa blir det ett sätt att hålla ihop vardagen medan de söker mer hjälp. För andra räcker det som lågtröskelstöd i en period. Värdet ligger ofta i att något faktiskt kan börja nu, inte först när du orkar perfekt.'
				]
			},
			{
				title: 'Vad som skiljer digitalt stöd från vård',
				paragraphs: [
					'Det viktiga är att inte blanda ihop tillgänglighet med behandlingsansvar. Digitalt samtalsstöd utan väntetid kan hjälpa dig att reflektera, skriva, få struktur och ta nästa steg, men det ersätter inte utredning, behandling eller akut stöd. Om du behöver medicinsk bedömning, riskbedömning eller långsiktig behandling behöver du fortfarande professionell vård. Det ena utesluter inte det andra. För många fungerar det bäst när digitalt stöd används som en bro: något som gör väntan mindre passiv och nästa vårdkontakt mer möjlig.'
				]
			}
		],
		resourceListTitle: 'Bra nästa steg beroende på behov',
		resourceListItems: [
			{ href: '/chat/a', label: 'Samtal om ångest', description: 'om oron eller kroppslig ångest är det som känns mest akut just nu.' },
			{ href: '/chat/b', label: 'Samtal om nedstämdhet', description: 'om orken är låg och du vill börja varsamt i text.' },
			{ href: '/chat/e', label: 'Samtal om stress och oro', description: 'om du främst känner överbelastning eller grubbel.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva först och återkomma när du behöver.' }
		],
		nextStepTitle: 'När du behöver något nu och något mer senare',
		nextStepParagraphs: [
			'Det går att använda digitalt stöd som ett första steg redan idag och samtidigt planera för mer hjälp om du behöver det. Att börja nu behöver inte betyda att du nöjer dig med mindre än du behöver. Det kan i stället vara ett sätt att orka ta nästa kontakt med lite mer tydlighet.',
			'För vårdråd kan du kontakta 1177. Vid akut fara ska du ringa 112.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Börja nu' },
			{ href: '/dagbok', label: 'Skriv först' },
			{ href: '/om-mittpsyke', label: 'Läs om tjänsten' }
		],
		faq: [
			{
				question: 'Är samtalsstöd utan väntetid samma sak som vård?',
				answer: 'Nej. Det är ett snabbt tillgängligt lågtröskelstöd, inte medicinsk bedömning eller behandling.'
			},
			{
				question: 'När kan det vara hjälpsamt?',
				answer: 'När du behöver börja nu, få ordning på tankar eller minska passiv väntan innan eller vid sidan av annan hjälp.'
			},
			{
				question: 'Vad gör jag om jag behöver akut hjälp?',
				answer: 'Vid akut fara eller om någon riskerar att skadas ska du ringa 112 direkt.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'stod-vid-stress-online': {
		title: 'Stöd vid stress online | Kronisk stress, symtom och hjälp | MittPsyke',
		description:
			'Läs om kronisk stress, vanliga stressymtom och vad som kan hjälpa när belastningen blivit långvarig eller svår att återhämta sig från.',
		canonical: 'https://www.mittpsyke.se/stod-vid-stress-online',
		ogTitle: 'Stöd vid stress online | MittPsyke',
		ogDescription:
			'När kroppen går länge på högvarv kan det hjälpa att förstå stressymtom och börja sänka tempot stegvis.',
		h1: 'Stöd vid stress online',
		lead:
			'Stress blir lätt ett ord för allt, men långvarig stress sätter sig ofta tydligt i både kropp, tankar och vardag. Här kan du läsa om hur kronisk stress kan märkas och vad som kan hjälpa när återhämtningen inte längre kommer av sig själv.',
		primaryCta: { href: '/chat/e', label: 'Starta samtal om stress' },
		secondaryCta: { href: '/guider/stress-utmattning', label: 'Läs guide om stress' },
		sections: [
			{
				title: 'När stress blir långvarig',
				paragraphs: [
					'Kortvarig stress är en normal reaktion när något kräver mycket av dig. Problemet uppstår när belastningen fortsätter utan att kroppen får tillräcklig återhämtning. Då kan stressen bli mer kronisk och börja kännas som ett grundläge snarare än en tillfällig topp. Många beskriver att de hela tiden ligger ett steg efter sig själva, blir lättare irriterade eller känner att det är svårt att varva ner även när det egentligen är lugnt. Då handlar det inte bara om att “ha mycket”, utan om att systemet gått länge på för hög belastning.'
				]
			},
			{
				title: 'Vanliga stressymtom i kropp och vardag',
				paragraphs: [
					'Stress märks ofta både fysiskt och mentalt. Du kan känna muskelspänning, hjärtklappning, huvudvärk, sömnsvårigheter, magbesvär eller ett ständigt inre tryck. Samtidigt blir tankarna ofta mer splittrade, tålamodet kortare och minnet sämre. Det är också vanligt att man tappar kontakt med vad man själv behöver eftersom all energi går åt till att hålla ihop dagen. När stressen pågår länge kan även sådant du tidigare klarade utan problem börja kännas tungt. Det betyder inte att du blivit svag, utan att belastningen fått pågå för länge.'
				]
			},
			{
				title: 'Vad som brukar hjälpa när allt går för fort',
				paragraphs: [
					'Det som hjälper mest är sällan ytterligare prestation, utan att skapa små pauser där kroppen och tankarna hinner ikapp. Det kan handla om att skriva ner vad som faktiskt belastar dig, skala bort något, sänka kraven för dagen, använda en kort reflektionsövning eller återinföra rutiner för sömn, mat och återhämtning. För vissa är nästa steg att prata i chatten och få mer överblick. För andra handlar det om att inse att den långvariga stressen blivit så tydlig att vård eller arbetsanpassning behöver bli en del av lösningen.'
				]
			}
		],
		resourceListTitle: 'Stöd som kan passa vid stress',
		resourceListItems: [
			{ href: '/ovningar/daglig-reflektionsmall', label: 'Daglig reflektionsmall', description: 'för att stanna upp och få syn på vad som faktiskt belastar dig.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill följa återkommande stressmönster över tid.' },
			{ href: '/framsteg', label: 'Framsteg', description: 'för att kunna se små förändringar när du använder dagboken regelbundet.' },
			{ href: '/guider/stress-utmattning', label: 'Guide om stress och utmattning', description: 'om du vill läsa mer om långvarig belastning.' }
		],
		nextStepTitle: 'När det är dags att söka mer hjälp',
		nextStepParagraphs: [
			'Om stressen påverkar sömn, minne, arbetsförmåga eller återhämtning tydligt under längre tid kan det vara klokt att söka professionell hjälp och inte bara försöka kompensera med mer disciplin. Kroppen brukar till slut säga ifrån tydligare när den inte får återhämtning.',
			'För vårdråd kan du kontakta 1177. Vid akut fara ska du ringa 112.'
		],
		nextStepLinks: [
			{ href: '/chat/e', label: 'Prata om stress' },
			{ href: '/dagbok', label: 'Skriv av dig' },
			{ href: '/guider/stress-utmattning', label: 'Läs mer om stress' }
		],
		faq: [
			{
				question: 'Hur vet jag om stressen blivit långvarig?',
				answer: 'Om återhämtningen uteblir, symtomen håller i sig och vardagen påverkas tydligt är stressen värd att ta på allvar som mer än en tillfällig topp.'
			},
			{
				question: 'Vilka symtom är vanliga vid hög stress?',
				answer: 'Det kan handla om sömnsvårigheter, spänningar, hjärtklappning, irritabilitet, minnessvårigheter och känslan av att aldrig riktigt komma ner i varv.'
			},
			{
				question: 'När behöver jag söka vård för stress?',
				answer: 'När stressen är långvarig, påverkar funktion och återhämtning tydligt eller när du känner att du inte längre kommer tillbaka på egen hand.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Stress – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'stod-vid-ptsd-online': {
		title: 'Stöd vid PTSD online | Symtom, vardagsstöd och nästa steg | MittPsyke',
		description:
			'Läs om vanliga PTSD-symtom, vad som kan hjälpa i vardagen och när det är viktigt att söka professionell hjälp utöver digitalt stöd.',
		canonical: 'https://www.mittpsyke.se/stod-vid-ptsd-online',
		ogTitle: 'Stöd vid PTSD online | MittPsyke',
		ogDescription:
			'När svåra minnen och reaktioner tar plats kan varsamt stöd hjälpa dig att börja förstå ditt läge.',
		h1: 'Stöd vid PTSD online',
		lead:
			'Traumarelaterade symtom kan vara svåra att beskriva och ännu svårare att leva med. Den här sidan samlar varsam information om vanliga PTSD-symtom, vad som kan hjälpa i vardagen och när digitalt stöd behöver kompletteras med professionell hjälp.',
		primaryCta: { href: '/chat/a', label: 'Starta ett lugnt samtal' },
		secondaryCta: { href: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma', label: 'Läs om samtalsstöd vid trauma' },
		sections: [
			{
				title: 'Vanliga symtom vid PTSD',
				paragraphs: [
					'PTSD kan visa sig som påträngande minnen, flashbacks, mardrömmar, stark vaksamhet eller kroppsliga reaktioner som kommer snabbt och känns svåra att stoppa. Det är också vanligt att försöka undvika platser, personer, tankar eller situationer som påminner om det som hänt. För vissa märks det mest som avstängdhet, irritabilitet eller svårigheter att känna sig trygg även i vanliga vardagssituationer. Symtomen handlar inte om svaghet utan om att nervsystemet fortsatt reagera som om faran fortfarande pågår, trots att situationen kan vara över.'
				]
			},
			{
				title: 'Vad som kan hjälpa i vardagen',
				paragraphs: [
					'Vardagsstöd vid traumarelaterade symtom behöver ofta vara varsamt och stabiliserande. Målet är inte att pressa fram minnen eller förstå allt på en gång, utan att skapa lite mer trygghet i nuet. Det kan handla om att lägga märke till vad som triggar starka reaktioner, använda jordningsövningar, skriva kort om nuläget i stället för om själva traumat och försöka bygga rutiner som gör dagen mer förutsägbar. För vissa är det också hjälpsamt att följa mönster i dagboken för att se vad som lugnar och vad som ökar anspänningen.'
				]
			},
			{
				title: 'När du bör söka professionell hjälp',
				paragraphs: [
					'Om symtomen är återkommande, starka eller påverkar din sömn, trygghet och funktion tydligt behöver du ofta mer än ett digitalt reflektionsstöd. Det gäller särskilt om du har kraftiga flashbacks, dissociation, svårt att känna dig säker eller om vardagen krymper på grund av undvikande. Då är det viktigt att få professionell bedömning och behandling. Digitalt stöd kan fortfarande vara ett komplement, men det ska inte bära hela ansvaret när traumarelaterade symtom blivit omfattande eller akuta.'
				]
			}
		],
		resourceListTitle: 'Varsamma vägar vidare',
		resourceListItems: [
			{ href: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma', label: 'Samtalsstöd vid trauma', description: 'om du vill läsa mer om en lugn första ingång kring trauma och reaktioner.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'för att notera nuläge, triggers och sådant som hjälper utan att pressa fram mer än du orkar.' },
			{ href: '/framsteg', label: 'Framsteg', description: 'om du vill följa små skiften över tid när du använder dagboken.' },
			{ href: '/om-mittpsyke', label: 'Om MittPsyke', description: 'för att förstå tjänstens gränser och när annan hjälp behövs.' }
		],
		nextStepTitle: 'Börja varsamt och ta symtomen på allvar',
		nextStepParagraphs: [
			'Det kan vara klokt att börja med att beskriva nuläget snarare än att försöka återberätta allt som hänt. Om du märker att symtomen snabbt blir starka är det viktigt att sakta ner och söka mer stöd, inte pressa dig igenom på egen hand.',
			'Vid akut fara eller om du inte känner dig säker ska du ringa 112. För vårdråd kan du kontakta 1177.'
		],
		nextStepLinks: [
			{ href: '/chat/a', label: 'Börja försiktigt i chatten' },
			{ href: '/dagbok', label: 'Skriv om nuläget' },
			{ href: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma', label: 'Läs mer om trauma' }
		],
		faq: [
			{
				question: 'Måste jag berätta hela traumat för att få stöd?',
				answer: 'Nej. Det kan vara bättre att börja med nuläget, symtomen och vad som triggar dig än att pressa fram hela berättelsen direkt.'
			},
			{
				question: 'Kan digitalt stöd hjälpa vid PTSD?',
				answer: 'Det kan hjälpa som varsam reflektion och struktur i vardagen, men det ersätter inte professionell behandling när symtomen är tydliga.'
			},
			{
				question: 'När behöver jag professionell hjälp?',
				answer: 'När symtomen är starka, återkommande eller påverkar trygghet, sömn och funktion tydligt behöver du professionell bedömning och stöd.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Posttraumatiskt stressyndrom (PTSD) – 1177 Vårdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'chatta-anonymt': {
		title: 'Chatta anonymt utan konto | Börja direkt i webbläsaren | MittPsyke',
		description:
			'Chatta anonymt utan konto direkt i webbläsaren. Få lugnt stöd i text för oro, stress och nedstämdhet. Ingen registrering krävs för att börja.',
		canonical: 'https://www.mittpsyke.se/chatta-anonymt',
		ogTitle: 'Chatta anonymt utan konto | Börja direkt i webbläsaren | MittPsyke',
		ogDescription:
			'Börja chatta anonymt utan konto. Få lugnt stöd i text direkt i webbläsaren.',
		h1: 'Chatta anonymt utan konto',
		lead:
			'Du kan börja direkt utan registrering. Skriv några rader om det som känns tungt och få lugnt stöd i text i din egen takt. MittPsyke är ett samtalsstöd, inte vård eller akuthjälp.',
		primaryCta: { href: '/skriv', label: 'Börja skriva anonymt' },
		sections: [
			{
				title: 'En lugn start utan registrering',
				paragraphs: [
					'Ibland är det lättare att börja skriva än att förklara allt för någon annan. Här kan du ta första steget direkt, utan konto och utan att först lämna några uppgifter. Det gör tröskeln lägre när du bara behöver få ur dig något eller sortera det som känns svårt.'
				]
			},
			{
				title: 'Stöd för ångest, stress och nedstämdhet',
				paragraphs: [
					'Du kan använda sidan när tankarna snurrar, när kroppen går på högvarv eller när allt känns tungt och oklart. MittPsyke är byggt för låg tröskel och lugn reflektion i text. Det är ett digitalt stöd för att börja formulera dig, inte en ersättning för vård eller akut hjälp.'
				]
			}
		],
		resourceListTitle: 'Du kan också fortsätta här',
		resourceListItems: [
			{ href: '/prata-anonymt-online', label: 'Prata anonymt online', description: 'om du vill läsa mer om hur anonymt samtalsstöd fungerar.' },
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstöd online', description: 'om du vill förstå varför låg tröskel kan göra det lättare att börja.' },
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med någon', description: 'om du vill få en tydligare bild av hur själva samtalet brukar gå till.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva vidare över tid när du känner dig redo.' }
		],
		nextStepTitle: 'Nästa steg i din takt',
		nextStepParagraphs: [
			'Om det känns lättare att börja direkt kan du gå vidare till skrivytan nu. Du kan också läsa mer först och komma tillbaka när du vill.',
			'Vid akut fara ska du ringa 112. För vårdråd finns 1177 och för vidare stöd finns stodlinjer.se.'
		],
		nextStepLinks: [
			{ href: '/skriv', label: 'Börja skriva direkt' },
			{ href: '/chat', label: 'Öppna chatten' },
			{ href: '/om-mittpsyke', label: 'Läs om MittPsyke' }
		],
		faq: [
			{
				question: 'Måste jag skapa konto för att börja?',
				answer: 'Nej. Du kan börja skriva direkt utan att registrera dig eller uppge några uppgifter.'
			},
			{
				question: 'Vad kan jag skriva om?',
				answer: 'Du kan skriva om ångest, stress, nedstämdhet eller något annat som känns tungt och svårt att bära själv.'
			},
			{
				question: 'Är detta samma sak som vård?',
				answer: 'Nej. MittPsyke är ett AI-baserat samtalsstöd för reflektion och nästa steg, inte vård, diagnos eller akut hjälp.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'anonym-chatt': {
		title: 'Chatta anonymt om din psykiska hälsa | Låg tröskel online | MittPsyke',
		description:
			'Chatta anonymt om din psykiska hälsa på svenska. Läs hur anonym chatt fungerar, vad du kan ta upp, vad AI-stöd kan hjälpa med och när du bör söka mer hjälp.',
		canonical: 'https://www.mittpsyke.se/anonym-chatt',
		ogTitle: 'Chatta anonymt om din psykiska hälsa | MittPsyke',
		ogDescription:
			'En lågtröskelsida om anonym chatt för psykisk hälsa, med FAQ och tydliga nästa steg.',
		h1: 'Chatta anonymt om din psykiska hälsa',
		lead:
			'Att börja prata om sitt mående kan vara svårt, särskilt när man inte riktigt vet vad man känner eller hur mycket man vill säga. En anonym chatt kan då vara ett första steg som känns mer hanterbart. Du kan börja i text, i din egen takt, utan att först behöva boka tid eller formulera en hel livsberättelse.',
		primaryCta: { href: '/chat', label: 'Starta anonym chatt' },
		secondaryCta: { href: '/prata-anonymt-online', label: 'Läs mer om att prata anonymt' },
		sections: [
			{
				title: 'När anonym chatt kan vara en bra början',
				paragraphs: [
					'För många är det svåraste inte att prata, utan att börja. Du kanske oroar dig för att bli missförstådd, känner skam över hur du mår eller är för trött för att ta dig igenom ännu en kontaktväg som kräver energi. Då kan anonym chatt vara ett mer realistiskt första steg. Du behöver inte ha alla svar, inte veta exakt om det handlar om ångest, stress eller nedstämdhet, och inte känna dig “tillräckligt dålig” för att få ta plats. Det räcker att något känns tungt nog för att du ska vilja sätta ord på det.'
				]
			},
			{
				title: 'Vad du kan ta upp i en anonym chatt om psykisk hälsa',
				paragraphs: [
					'Du kan prata om mycket mer än tydliga diagnoser eller stora kriser. Många använder anonym chatt när de känner oro som aldrig riktigt släpper, stark stress, tomhet, ensamhet, relationsproblem eller en låg känsla i kroppen som är svår att beskriva. Du kan också skriva om sömn, självkritik, överbelastning eller att du bara vill få ur dig sådant du inte orkar bära själv just nu. Om orden inte kommer går det bra att börja med en enda mening om hur dagen känns. Samtalet kan hjälpa dig vidare därifrån.'
				]
			},
			{
				title: 'Hur AI-stöd kan hjälpa och var gränsen går',
				paragraphs: [
					'AI-stöd kan hjälpa genom att spegla det du skriver, ställa lugna frågor, hjälpa dig sortera tankar och föreslå ett nästa steg som känns möjligt. Det kan också vara ett sätt att känna mindre ensamhet i stunden när du behöver formulera något svårt. Men AI är inte vård, terapi eller akut hjälp. Det gör ingen medicinsk bedömning och kan inte ersätta professionellt ansvar. Därför fungerar anonym chatt bäst som en första ingång eller ett komplement, särskilt när du vill börja enkelt men fortfarande behöver vara uppmärksam på om mer hjälp behövs.'
				]
			}
		],
		resourceListTitle: 'Sidor som passar bra tillsammans med anonym chatt',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med någon', description: 'om du vill läsa mer om hur själva samtalet brukar gå till.' },
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstöd online', description: 'för en bredare bild av varför låg tröskel kan göra stor skillnad.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva vidare efter chatten och få mer kontinuitet.' },
			{ href: '/guider', label: 'Guider', description: 'om du vill förstå mer om det du känner efter att du har börjat sätta ord på det.' }
		],
		nextStepTitle: 'Om du vill fortsätta efter första samtalet',
		nextStepParagraphs: [
			'För vissa räcker ett första samtal för att få mer luft. För andra blir det tydligt att man behöver fortsätta följa sitt mående i dagboken, prova en övning eller ta kontakt med vården. Det viktiga är att du inte behöver bestämma allt från början. Ett första steg får just vara ett första steg.',
			'Vid vårdråd kan du kontakta 1177. Vid akut fara eller om du inte kan hålla dig själv eller någon annan säker ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Öppna chatten' },
			{ href: '/dagbok', label: 'Skriv vidare i dagboken' },
			{ href: '/guider', label: 'Läs vidare i guider' }
		],
		faq: [
			{
				question: 'Måste jag veta exakt vad jag mår dåligt av för att börja chatta?',
				answer: 'Nej. Du kan börja med en känsla, en situation eller bara att något känns fel. Chatten kan hjälpa dig att sortera vidare.'
			},
			{
				question: 'Är anonym chatt samma sak som terapi eller vård?',
				answer: 'Nej. Det är ett lågtröskelstöd för reflektion och nästa steg, inte diagnos, behandling eller akut vård.'
			},
			{
				question: 'När ska jag söka mer hjälp än en anonym chatt?',
				answer: 'Om du är i akut fara, har svårt att hålla dig säker eller behöver medicinsk bedömning ska du söka professionell hjälp direkt via 112 eller 1177 beroende på läget.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hälsa – 1177 Vårdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hälsa och suicidprevention – Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hälsa – Folkhälsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqSchema: true
	}
};

export const seoSupportPagePaths = Object.values(seoSupportPages).map((page) =>
	page.canonical.replace('https://www.mittpsyke.se', '')
);

