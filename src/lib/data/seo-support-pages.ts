import type { SeoSupportPageConfig } from '$lib/components/SeoSupportPage.svelte';

const updatedDate = '4 april 2026';

export const seoSupportPages: Record<string, SeoSupportPageConfig> = {
	'anonymt-samtalsstod-online': {
		title: 'Anonymt samtalsstÃ¶d online | LÃ¥g trÃ¶skel och trygg start | MittPsyke',
		description:
			'Utforska anonymt samtalsstÃ¶d online nÃ¤r du vill bÃ¶rja varsamt. LÃ¤s om varfÃ¶r anonymitet sÃ¤nker trÃ¶skeln, hur stÃ¶det skiljer sig frÃ¥n vÃ¥rd och nÃ¤r det kan passa.',
		canonical: 'https://www.mittpsyke.se/anonymt-samtalsstod-online',
		ogTitle: 'Anonymt samtalsstÃ¶d online | MittPsyke',
		ogDescription:
			'NÃ¤r du inte orkar fÃ¶rklara allt direkt kan anonymt samtalsstÃ¶d vara en trygg fÃ¶rsta ingÃ¥ng.',
		h1: 'Anonymt samtalsstÃ¶d online',
		lead:
			'Ibland Ã¤r det lÃ¤ttare att bÃ¶rja utan att fÃ¶rst behÃ¶va presentera sig, boka tid eller veta exakt vad man vill sÃ¤ga. HÃ¤r kan du lÃ¤sa om hur anonymt samtalsstÃ¶d online kan fungera som ett lugnt fÃ¶rsta steg nÃ¤r nÃ¥got kÃ¤nns tungt.',
		primaryCta: { href: '/chat', label: 'Prata anonymt nu' },
		secondaryCta: { href: '/dagbok', label: 'Skriv i dagboken' },
		sections: [
			{
				title: 'VarfÃ¶r anonymitet kan sÃ¤nka trÃ¶skeln',
				paragraphs: [
					'Anonymitet kan gÃ¶ra det lÃ¤ttare att bÃ¶rja nÃ¤r skam, osÃ¤kerhet eller rÃ¤dsla fÃ¶r att bli missfÃ¶rstÃ¥dd stÃ¥r i vÃ¤gen. MÃ¥nga drar sig fÃ¶r att sÃ¶ka stÃ¶d fÃ¶r att de inte vill bli bedÃ¶mda, inte vet om deras mÃ¥ende Ã¤r â€œtillrÃ¤ckligt allvarligtâ€ eller inte orkar ta kontakt i ett formellt system. NÃ¤r du kan bÃ¶rja i text och utan att fÃ¶rst lÃ¤mna ifrÃ¥n dig hela din berÃ¤ttelse blir trÃ¶skeln lÃ¤gre. Det betyder inte att det du kÃ¤nner Ã¤r litet, utan att ingÃ¥ngen fÃ¥r vara enkel nog fÃ¶r att faktiskt bli av.'
				]
			},
			{
				title: 'Skillnaden mellan digitalt samtalsstÃ¶d och traditionell vÃ¥rd',
				paragraphs: [
					'Anonymt samtalsstÃ¶d online Ã¤r inte samma sak som bedÃ¶mning, diagnos eller behandling i vÃ¥rden. Det Ã¤r snarare ett stÃ¶d fÃ¶r att sortera tankar, sÃ¤tta ord pÃ¥ det som hÃ¤nder och hitta nÃ¤sta steg medan du fortfarande fÃ¶rsÃ¶ker fÃ¶rstÃ¥ ditt eget lÃ¤ge. I traditionell vÃ¥rd finns journalfÃ¶ring, kliniska bedÃ¶mningar och behandlingsansvar. HÃ¤r handlar det i stÃ¤llet om lÃ¥g trÃ¶skel, tillgÃ¤nglighet och mÃ¶jlighet att bÃ¶rja i liten skala. FÃ¶r mÃ¥nga kan det vara ett komplement fÃ¶re, mellan eller vid sidan av annan hjÃ¤lp, men inte en ersÃ¤ttning nÃ¤r behovet Ã¤r medicinskt eller akut.'
				]
			},
			{
				title: 'NÃ¤r anonymt samtalsstÃ¶d kan passa bÃ¤st',
				paragraphs: [
					'Den hÃ¤r typen av stÃ¶d kan passa nÃ¤r du kÃ¤nner oro, nedstÃ¤mdhet, stress eller ensamhet men Ã¤nnu inte vet vad du behÃ¶ver. Det kan ocksÃ¥ passa om du vill prova att uttrycka dig i text innan du pratar med nÃ¥gon mÃ¤nniska, eller om du vill reflektera i lugn takt mellan andra insatser. Det passar sÃ¤mre nÃ¤r du behÃ¶ver snabb medicinsk bedÃ¶mning, Ã¤r i akut fara eller har symtom som krÃ¤ver professionell behandling. DÃ¥ Ã¤r 1177, vÃ¥rdcentral, psykiatri eller akuta stÃ¶dlinjer viktigare vÃ¤gar vidare.'
				]
			}
		],
		resourceListTitle: 'Det hÃ¤r kan du gÃ¶ra vidare pÃ¥ MittPsyke',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med nÃ¥gon', description: 'om du vill fÃ¶rstÃ¥ hur ett anonymt samtal brukar bÃ¶rja.' },
			{ href: '/chattstod-psykisk-ohalsa', label: 'LÃ¤s om chattstÃ¶d vid psykisk ohÃ¤lsa', description: 'fÃ¶r att fÃ¥ en bredare bild av hur textbaserat stÃ¶d kan hjÃ¤lpa tidigt.' },
			{ href: '/prata-anonymt-online', label: 'Prata anonymt online', description: 'om du vill lÃ¤sa mer om vad du kan ta upp och hur du kommer igÃ¥ng.' },
			{ href: '/dagbok', label: 'AnvÃ¤nd dagboken', description: 'nÃ¤r det kÃ¤nns lÃ¤ttare att skriva fÃ¶r dig sjÃ¤lv fÃ¶rst.' }
		],
		nextStepTitle: 'VÃ¤lj nÃ¤sta steg i lugn takt',
		nextStepParagraphs: [
			'Om du mÃ¤rker att det hjÃ¤lper att formulera dig i smÃ¥ delar kan du fortsÃ¤tta i chatten, skriva i dagboken eller lÃ¤sa en guide som matchar det du gÃ¥r igenom. Om du i stÃ¤llet kÃ¤nner att du behÃ¶ver mÃ¤nsklig kontakt eller tydligare vÃ¥rdrÃ¥d finns 1177 och stodlinjer.se som viktiga vÃ¤gar vidare.',
			'Vid akut fara eller om du inte kÃ¤nner att du kan hÃ¥lla dig sjÃ¤lv eller nÃ¥gon annan sÃ¤ker ska du inte vÃ¤nta i ett digitalt stÃ¶dflÃ¶de. Ring 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Ã–ppna chatten' },
			{ href: '/prata-anonymt-online', label: 'LÃ¤s om att prata anonymt' },
			{ href: '/om-mittpsyke', label: 'SÃ¥ fungerar MittPsyke' }
		],
		faq: [
			{
				question: 'MÃ¥ste jag logga in fÃ¶r att bÃ¶rja?',
				answer: 'Nej. Du kan bÃ¶rja med lÃ¥g trÃ¶skel och skapa konto fÃ¶rst om du senare vill spara innehÃ¥ll Ã¶ver tid.'
			},
			{
				question: 'Ã„r anonymt samtalsstÃ¶d samma sak som vÃ¥rd?',
				answer: 'Nej. Det Ã¤r ett digitalt stÃ¶d fÃ¶r reflektion och nÃ¤sta steg, inte diagnos, behandling eller akut hjÃ¤lp.'
			},
			{
				question: 'NÃ¤r ska jag sÃ¶ka mer hjÃ¤lp Ã¤n detta?',
				answer: 'Om du Ã¤r i akut fara, mÃ¥r snabbt sÃ¤mre eller behÃ¶ver medicinsk bedÃ¶mning ska du kontakta 112, 1177 eller annan professionell vÃ¥rd.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃ¤lsa â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'chatta-anonymt-med-nagon': {
		title: 'Chatta anonymt med nÃ¥gon | SÃ¥ fungerar stÃ¶det online | MittPsyke',
		description:
			'LÃ¤r dig vad som hÃ¤nder i en anonym chatt, hur AI-stÃ¶d fungerar och vad du kan fÃ¶rvÃ¤nta dig nÃ¤r du vill chatta anonymt om psykisk hÃ¤lsa.',
		canonical: 'https://www.mittpsyke.se/chatta-anonymt-med-nagon',
		ogTitle: 'Chatta anonymt med nÃ¥gon | MittPsyke',
		ogDescription:
			'En genomgÃ¥ng av hur anonym chatt kan fungera nÃ¤r du behÃ¶ver bÃ¶rja enkelt och utan press.',
		h1: 'Chatta anonymt med nÃ¥gon',
		lead:
			'NÃ¤r nÃ¥got kÃ¤nns svÃ¥rt kan text vara en enklare start Ã¤n att prata hÃ¶gt. Den hÃ¤r sidan fÃ¶rklarar hur en anonym chatt brukar fungera, vad AI-stÃ¶d faktiskt gÃ¶r och vad som Ã¤r rimligt att fÃ¶rvÃ¤nta sig innan du Ã¶ppnar samtalet.',
		primaryCta: { href: '/chat', label: 'Ã–ppna chatten' },
		secondaryCta: { href: '/prata-anonymt-online', label: 'LÃ¤s om att prata anonymt' },
		sections: [
			{
				title: 'Vad som brukar hÃ¤nda i en anonym chatt',
				paragraphs: [
					'En anonym chatt bÃ¶rjar ofta enklare Ã¤n man tror. Du behÃ¶ver inte skriva en full bakgrund eller formulera allt perfekt. MÃ¥nga bÃ¶rjar med nÃ¥got kort som â€œjag kÃ¤nner mig stressadâ€, â€œjag vet inte varfÃ¶r jag mÃ¥r sÃ¥ hÃ¤râ€ eller â€œjag behÃ¶ver bara fÃ¥ ur mig nÃ¥gotâ€. DÃ¤rifrÃ¥n kan samtalet hjÃ¤lpas fram steg fÃ¶r steg genom frÃ¥gor, speglingar och struktur. Tempot Ã¤r ditt. Du kan stanna upp, skriva om, byta Ã¤mne eller avsluta nÃ¤r du behÃ¶ver. FÃ¶r vissa blir chatten ett sÃ¤tt att tÃ¤nka klart, fÃ¶r andra ett sÃ¤tt att vÃ¥ga bÃ¶rja alls.'
				]
			},
			{
				title: 'Hur AI-stÃ¶d fungerar i praktiken',
				paragraphs: [
					'AI-stÃ¶d i den hÃ¤r typen av chatt fungerar inte som en mÃ¤nniska med eget behandlingsansvar. Det Ã¤r snarare ett verktyg som hjÃ¤lper dig att sÃ¤tta ord pÃ¥ kÃ¤nslor, se mÃ¶nster, bryta upp stora tankeknutar och fÃ¶reslÃ¥ lugna nÃ¤sta steg. Det kan till exempel hjÃ¤lpa dig att skilja mellan oro, stress och nedstÃ¤mdhet, fÃ¶reslÃ¥ en Ã¶vning eller sammanfatta det du sjÃ¤lv redan har beskrivit. Det viktiga Ã¤r att anvÃ¤nda stÃ¶det som en reflekterande yta, inte som ett medicinskt besked. Vid akut fara eller behov av vÃ¥rd rÃ¤cker inte AI-stÃ¶d.'
				]
			},
			{
				title: 'Vad du kan fÃ¶rvÃ¤nta dig och vad du inte ska fÃ¶rvÃ¤nta dig',
				paragraphs: [
					'Det Ã¤r rimligt att fÃ¶rvÃ¤nta sig ett lugnt samtalsutrymme dÃ¤r du kan bÃ¶rja sortera det som kÃ¤nns svÃ¥rt. Du kan ofta fÃ¥ hjÃ¤lp att hitta sprÃ¥k fÃ¶r kÃ¤nslor, komma vidare nÃ¤r tankarna fastnar och vÃ¤lja ett fÃ¶rsta steg som kÃ¤nns mÃ¶jligt idag. DÃ¤remot ska du inte fÃ¶rvÃ¤nta dig diagnos, krishantering i realtid eller att en chatt lÃ¶ser allt pÃ¥ en gÃ¥ng. FÃ¶r mÃ¥nga Ã¤r vÃ¤rdet i stÃ¤llet att det blir lÃ¤ttare att fÃ¶rstÃ¥ sitt lÃ¤ge, fortsÃ¤tta skriva i dagboken eller sÃ¶ka mer stÃ¶d med lite mer klarhet.'
				]
			}
		],
		resourceListTitle: 'FortsÃ¤tt i rÃ¤tt riktning',
		resourceListItems: [
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstÃ¶d online', description: 'om du vill fÃ¶rstÃ¥ varfÃ¶r anonymitet ofta gÃ¶r fÃ¶rsta steget lÃ¤ttare.' },
			{ href: '/chattstod-psykisk-ohalsa', label: 'ChattstÃ¶d vid psykisk ohÃ¤lsa', description: 'fÃ¶r en bredare bild av hur tidigt stÃ¶d i text kan fungera.' },
			{ href: '/dagbok', label: 'Skriv i dagboken', description: 'om du vill formulera mer i lugn och ro efter chatten.' },
			{ href: '/om-mittpsyke', label: 'LÃ¤s om MittPsyke', description: 'fÃ¶r att fÃ¶rstÃ¥ tjÃ¤nstens roll, grÃ¤nser och nÃ¤sta steg.' }
		],
		nextStepTitle: 'Om du vill bÃ¶rja nu',
		nextStepParagraphs: [
			'Du behÃ¶ver inte vÃ¤nta tills du vet exakt vad du ska sÃ¤ga. Ett enkelt fÃ¶rsta meddelande rÃ¤cker ofta fÃ¶r att samtalet ska bÃ¶rja rÃ¶ra sig framÃ¥t. Om det kÃ¤nns lÃ¤ttare kan du ocksÃ¥ skriva nÃ¥gra rader i dagboken fÃ¶rst och sedan fortsÃ¤tta dÃ¤rifrÃ¥n.',
			'BehÃ¶ver du mÃ¤nsklig kontakt eller mer akut vÃ¤gledning finns stodlinjer.se och 1177. Vid akut fara ska du alltid ringa 112.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Starta chatten' },
			{ href: '/dagbok', label: 'BÃ¶rja i dagboken' },
			{ href: '/anonymt-samtalsstod-online', label: 'LÃ¤s mer om anonymt stÃ¶d' }
		],
		faq: [
			{
				question: 'MÃ¥ste jag ha konto fÃ¶r att chatta anonymt?',
				answer: 'Nej. Du kan bÃ¶rja utan konto och fÃ¶rst senare vÃ¤lja om du vill spara nÃ¥got Ã¶ver tid.'
			},
			{
				question: 'Ã„r AI-stÃ¶d samma sak som att prata med en behandlare?',
				answer: 'Nej. AI-stÃ¶d kan hjÃ¤lpa dig att reflektera och strukturera, men det ersÃ¤tter inte vÃ¥rd, diagnos eller behandling.'
			},
			{
				question: 'Vad gÃ¶r jag om det blir akut?',
				answer: 'Vid akut fara eller om nÃ¥gon riskerar att skadas ska du lÃ¤mna chatten och ringa 112 direkt.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃ¤lsa â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'chattstod-psykisk-ohalsa': {
		title: 'ChattstÃ¶d vid psykisk ohÃ¤lsa | Tidigt stÃ¶d online | MittPsyke',
		description:
			'FÃ¶rstÃ¥ vad psykisk ohÃ¤lsa kan innebÃ¤ra i vardagen och hur chattstÃ¶d kan hjÃ¤lpa tidigt nÃ¤r du vill sÃ¤tta ord pÃ¥ det som kÃ¤nns tungt.',
		canonical: 'https://www.mittpsyke.se/chattstod-psykisk-ohalsa',
		ogTitle: 'ChattstÃ¶d vid psykisk ohÃ¤lsa | MittPsyke',
		ogDescription:
			'En lugn genomgÃ¥ng av hur textbaserat stÃ¶d kan hjÃ¤lpa dig att bÃ¶rja tidigt nÃ¤r mÃ¥endet skaver.',
		h1: 'ChattstÃ¶d vid psykisk ohÃ¤lsa',
		lead:
			'Psykisk ohÃ¤lsa kan synas pÃ¥ mÃ¥nga olika sÃ¤tt i vardagen. HÃ¤r kan du lÃ¤sa om hur textbaserat stÃ¶d online kan hjÃ¤lpa tidigt, innan allt hunnit bli stÃ¶rre eller mer lÃ¥st.',
		primaryCta: { href: '/chat', label: 'Ã–ppna chatten' },
		secondaryCta: { href: '/psykiskt-stod-online', label: 'LÃ¤s om psykiskt stÃ¶d online' },
		sections: [
			{
				title: 'Vad psykisk ohÃ¤lsa kan innebÃ¤ra i vardagen',
				paragraphs: [
					'Psykisk ohÃ¤lsa Ã¤r ett brett begrepp och behÃ¶ver inte se likadant ut frÃ¥n person till person. FÃ¶r nÃ¥gon mÃ¤rks det som sÃ¶mnsvÃ¥righeter, irritation, trÃ¶tthet eller att allt kÃ¤nns tyngre Ã¤n vanligt. FÃ¶r nÃ¥gon annan handlar det om stark oro, undvikande, kÃ¤nslor av hopplÃ¶shet eller svÃ¥righeter att fokusera pÃ¥ det vardagliga. Just dÃ¤rfÃ¶r kan det vara svÃ¥rt att veta om det â€œrÃ¤ckerâ€ att sÃ¶ka stÃ¶d. Ofta Ã¤r det klokare att lyssna pÃ¥ om mÃ¥endet pÃ¥verkar vardagen Ã¤n att fÃ¶rsÃ¶ka avgÃ¶ra om man fÃ¥r kalla det nÃ¥got sÃ¤rskilt.'
				]
			},
			{
				title: 'Hur chattstÃ¶d kan hjÃ¤lpa tidigt',
				paragraphs: [
					'Textbaserat stÃ¶d kan vara hjÃ¤lpsamt tidigt eftersom det inte krÃ¤ver att du Ã¤r helt sÃ¤ker pÃ¥ vad som hÃ¤nder. Du kan bÃ¶rja mitt i det rÃ¶riga och fÃ¥ hjÃ¤lp att sortera om det mest liknar stress, oro, nedstÃ¤mdhet, ensamhet eller Ã¶verbelastning. NÃ¤r du sÃ¤tter ord pÃ¥ det som pÃ¥gÃ¥r blir det ofta lÃ¤ttare att se mÃ¶nster och nÃ¤sta steg. FÃ¶r en del rÃ¤cker det som en fÃ¶rsta avlastning. FÃ¶r andra blir det ett sÃ¤tt att samla tankarna innan de pratar med vÃ¥rd, stÃ¶dlinje eller nÃ¥gon i sin nÃ¤rhet.'
				]
			},
			{
				title: 'NÃ¤r textstÃ¶d rÃ¤cker och nÃ¤r mer stÃ¶d behÃ¶vs',
				paragraphs: [
					'ChattstÃ¶d kan vara en god bÃ¶rjan nÃ¤r du behÃ¶ver reflektera, fÃ¥ struktur eller minska ensamhetskÃ¤nslan i det du bÃ¤r pÃ¥. Men om du har Ã¥terkommande sjÃ¤lvmordstankar, snabbt fÃ¶rsÃ¤mrat mÃ¥ende, svÃ¥ra sÃ¶mnproblem, stark Ã¥ngest som inte gÃ¥r Ã¶ver eller andra symtom som tydligt pÃ¥verkar sÃ¤kerhet och funktion behÃ¶ver du mer Ã¤n ett digitalt reflektionsstÃ¶d. DÃ¥ Ã¤r det viktigt att sÃ¶ka professionell hjÃ¤lp. LÃ¥g trÃ¶skel ska gÃ¶ra det lÃ¤ttare att bÃ¶rja, inte gÃ¶ra att du stannar fÃ¶r lÃ¤nge pÃ¥ en nivÃ¥ som inte rÃ¤cker.'
				]
			}
		],
		resourceListTitle: 'StÃ¶d som kan passa beroende pÃ¥ vad som kÃ¤nns nÃ¤rmast',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med nÃ¥gon', description: 'om du vill lÃ¤sa mer om hur sjÃ¤lva samtalet brukar fungera.' },
			{ href: '/hjalp-mot-oro-online', label: 'HjÃ¤lp mot oro online', description: 'om det framfÃ¶r allt Ã¤r grubbel, rastlÃ¶shet eller framtidstankar som tar plats.' },
			{ href: '/hjalp-vid-depression-online', label: 'HjÃ¤lp vid depression online', description: 'om tyngd, lÃ¥g ork och nedstÃ¤mdhet Ã¤r det som dominerar.' },
			{ href: '/stod-vid-stress-online', label: 'StÃ¶d vid stress online', description: 'om kroppen och vardagen kÃ¤nns Ã¶verbelastade.' }
		],
		nextStepTitle: 'BÃ¶rja smÃ¥tt och fÃ¶lj upp',
		nextStepParagraphs: [
			'Om du inte vet var du ska bÃ¶rja kan du vÃ¤lja den kÃ¤nsla eller situation som Ã¤r lÃ¤ttast att beskriva just idag. Det rÃ¤cker ofta fÃ¶r att fÃ¥ syn pÃ¥ ett fÃ¶rsta mÃ¶nster. NÃ¤r du vill kan du fÃ¶lja upp i dagboken eller lÃ¤sa mer i en guide som passar det du gÃ¥r igenom.',
			'BehÃ¶ver du vÃ¥rdrÃ¥d ska du kontakta 1177. Vid akut fara eller om nÃ¥gon riskerar att skadas ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Starta samtal' },
			{ href: '/dagbok', label: 'Skriv i dagboken' },
			{ href: '/guider', label: 'LÃ¤s guider' }
		],
		faq: [
			{
				question: 'MÃ¥ste jag veta exakt vad jag mÃ¥r dÃ¥ligt av?',
				answer: 'Nej. ChattstÃ¶d kan vara anvÃ¤ndbart just nÃ¤r du fortfarande fÃ¶rsÃ¶ker fÃ¶rstÃ¥ vad som hÃ¤nder.'
			},
			{
				question: 'Kan chattstÃ¶d hjÃ¤lpa innan problemen blivit stora?',
				answer: 'Ja. MÃ¥nga anvÃ¤nder textstÃ¶d tidigt fÃ¶r att fÃ¥ ordning pÃ¥ tankar och kÃ¤nslor innan lÃ¤get hinner vÃ¤xa.'
			},
			{
				question: 'ErsÃ¤tter detta professionell vÃ¥rd?',
				answer: 'Nej. Det Ã¤r ett lÃ¥gtrÃ¶skelstÃ¶d och ett komplement, inte medicinsk eller psykiatrisk behandling.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃ¤lsa â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		]
	},
	'hjalp-mot-oro-online': {
		title: 'HjÃ¤lp mot oro online | Skillnaden mellan oro och Ã¥ngest | MittPsyke',
		description:
			'LÃ¤s om skillnaden mellan oro och Ã¥ngest, vilka tekniker som kan hjÃ¤lpa och nÃ¤r oron har bÃ¶rjat ta fÃ¶r mycket plats i vardagen.',
		canonical: 'https://www.mittpsyke.se/hjalp-mot-oro-online',
		ogTitle: 'HjÃ¤lp mot oro online | MittPsyke',
		ogDescription:
			'NÃ¤r tankarna fastnar i framtiden kan det hjÃ¤lpa att fÃ¶rstÃ¥ oron och vÃ¤lja lugna nÃ¤sta steg.',
		h1: 'HjÃ¤lp mot oro online',
		lead:
			'Oro kan handla om allt frÃ¥n ekonomi och relationer till hÃ¤lsa, framtid och vardagsbeslut. HÃ¤r kan du lÃ¤sa om vad som skiljer oro frÃ¥n Ã¥ngest, vad som kan hjÃ¤lpa i stunden och nÃ¤r det Ã¤r dags att ta oron pÃ¥ stÃ¶rre allvar.',
		primaryCta: { href: '/chat/e', label: 'Starta samtal om oro' },
		secondaryCta: { href: '/guider/overtankande', label: 'LÃ¤s guide om Ã¶vertÃ¤nkande' },
		sections: [
			{
				title: 'Skillnaden mellan oro och Ã¥ngest',
				paragraphs: [
					'Oro handlar ofta om tankar som gÃ¥r framÃ¥t i tiden: tÃ¤nk om nÃ¥got gÃ¥r fel, tÃ¤nk om jag missar nÃ¥got, tÃ¤nk om jag inte klarar det. Ã…ngest kan ocksÃ¥ innehÃ¥lla sÃ¥dana tankar men mÃ¤rks ofta starkare i kroppen, med till exempel tryck Ã¶ver brÃ¶stet, hjÃ¤rtklappning, yrsel eller en kÃ¤nsla av att tappa kontrollen. Skillnaden Ã¤r inte alltid knivskarp, och mÃ¥nga upplever bÃ¥da samtidigt. Men det kan Ã¤ndÃ¥ vara hjÃ¤lpsamt att frÃ¥ga sig om det frÃ¤mst Ã¤r grubbel och scenarier, eller om kroppen ocksÃ¥ gÃ¥r upp i tydligt alarm.'
				]
			},
			{
				title: 'Konkreta tekniker som kan gÃ¶ra oron mindre styrande',
				paragraphs: [
					'NÃ¤r oro tar fart hjÃ¤lper det sÃ¤llan att bara sÃ¤ga Ã¥t sig sjÃ¤lv att sluta tÃ¤nka. Ofta fungerar det bÃ¤ttre att ge tankarna en tydlig form. Du kan skriva ner exakt vad du oroar dig fÃ¶r, sortera vad du kan pÃ¥verka idag och vad som bara Ã¤r hypotetiska scenarier, eller sÃ¤tta en kort â€œorostidâ€ senare pÃ¥ dagen sÃ¥ att grubblandet inte tar Ã¶ver allt. Kroppen kan ocksÃ¥ behÃ¶va hjÃ¤lp att varva ner genom andning, kort promenad eller att rikta uppmÃ¤rksamheten mot nÃ¥got konkret i rummet just nu.'
				]
			},
			{
				title: 'NÃ¤r oron har bÃ¶rjat ta fÃ¶r mycket plats',
				paragraphs: [
					'Oron Ã¤r vÃ¤rd att ta pÃ¥ allvar nÃ¤r den pÃ¥verkar sÃ¶mn, koncentration, relationer, arbete eller din fÃ¶rmÃ¥ga att vara nÃ¤rvarande i vardagen. Det gÃ¤ller ocksÃ¥ om du mÃ¤rker att du undviker situationer, sÃ¶ker stÃ¤ndig fÃ¶rsÃ¤kran frÃ¥n andra eller kÃ¤nner att tankarna fortsÃ¤tter trots att du fÃ¶rsÃ¶ker vila. DÃ¥ kan det vara hjÃ¤lpsamt att inte bara stÃ¥ ut, utan att aktivt sÃ¶ka stÃ¶d. Ett fÃ¶rsta steg kan vara att skriva av dig, prata i chatten eller lÃ¤sa en guide. I vissa lÃ¤gen behÃ¶vs ocksÃ¥ professionell vÃ¥rd.'
				]
			}
		],
		resourceListTitle: 'StÃ¶d som kan hjÃ¤lpa nÃ¤r tankarna snurrar',
		resourceListItems: [
			{ href: '/4-7-8-andning-ovning', label: '4-7-8-andning', description: 'nÃ¤r du vill ge kroppen ett konkret lugnare tempo.' },
			{ href: '/andningsovningar-mot-angest', label: 'AndningsÃ¶vningar mot Ã¥ngest', description: 'om oron gÃ¥r Ã¶ver i stark kroppslig anspÃ¤nning.' },
			{ href: '/ovningar/daglig-reflektionsmall', label: 'Daglig reflektionsmall', description: 'fÃ¶r att fÃ¥ ut grubbel ur huvudet och ner i ord.' },
			{ href: '/dagbok', label: 'Dagbok', description: 'om du vill fÃ¶lja Ã¥terkommande mÃ¶nster i det som oroar dig.' }
		],
		nextStepTitle: 'NÃ¤r du vill ta nÃ¤sta steg',
		nextStepParagraphs: [
			'Om oron mest snurrar i tankarna kan en Ã¶vning eller kort skrivstund rÃ¤cka som fÃ¶rsta hjÃ¤lp. Om du mÃ¤rker att kroppen gÃ¥r upp i starkt alarm kan du lÃ¤sa mer om Ã¥ngest och andningsÃ¶vningar. Om allt fortsÃ¤tter att vÃ¤xa trots att du fÃ¶rsÃ¶ker hantera det sjÃ¤lv Ã¤r det klokt att prata med vÃ¥rden.',
			'FÃ¶r vÃ¥rdrÃ¥d kan du kontakta 1177. Vid akut fara ska du ringa 112.'
		],
		nextStepLinks: [
			{ href: '/hjalp-vid-angest-online', label: 'LÃ¤s om Ã¥ngest' },
			{ href: '/ovningar', label: 'Se Ã¶vningar' },
			{ href: '/dagbok', label: 'Skriv i dagboken' }
		],
		faq: [
			{
				question: 'Ã„r oro och Ã¥ngest samma sak?',
				answer: 'De kan Ã¶verlappa, men oro mÃ¤rks ofta mest i tankarna medan Ã¥ngest ofta kÃ¤nns starkare i kroppen ocksÃ¥.'
			},
			{
				question: 'Vad kan jag gÃ¶ra nÃ¤r jag fastnar i grubbel?',
				answer: 'Det kan hjÃ¤lpa att skriva ner oron, sortera vad du kan pÃ¥verka och anvÃ¤nda en enkel Ã¶vning eller andning fÃ¶r att bryta spiralen.'
			},
			{
				question: 'NÃ¤r bÃ¶r jag sÃ¶ka mer hjÃ¤lp?',
				answer: 'NÃ¤r oron pÃ¥verkar sÃ¶mn, funktion eller relationer tydligt, eller nÃ¤r du inte kommer ur den pÃ¥ egen hand, Ã¤r det bra att sÃ¶ka mer stÃ¶d.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Ã…ngest â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'hjalp-vid-depression-online': {
		title: 'HjÃ¤lp vid depression online | Symtom, stÃ¶d och nÃ¤sta steg | MittPsyke',
		description:
			'LÃ¤s om vanliga depressionssymtom, varfÃ¶r tidig hjÃ¤lp spelar roll och vad du kan gÃ¶ra idag om nedstÃ¤mdheten tar mycket plats.',
		canonical: 'https://www.mittpsyke.se/hjalp-vid-depression-online',
		ogTitle: 'HjÃ¤lp vid depression online | MittPsyke',
		ogDescription:
			'NÃ¤r orken Ã¤r lÃ¥g kan det hjÃ¤lpa att bÃ¶rja varsamt och fÃ¶rstÃ¥ vad som faktiskt hÃ¤nder.',
		h1: 'HjÃ¤lp vid depression online',
		lead:
			'NÃ¤r allt kÃ¤nns tyngre Ã¤n vanligt kan Ã¤ven smÃ¥ saker bli svÃ¥ra att fÃ¥ gjort. Den hÃ¤r sidan samlar lugn information om vanliga symtom vid depression, varfÃ¶r tidigt stÃ¶d spelar roll och hur du kan bÃ¶rja idag utan att pressa dig mer Ã¤n du orkar.',
		primaryCta: { href: '/chat/b', label: 'Starta samtal om nedstÃ¤mdhet' },
		secondaryCta: { href: '/depression', label: 'LÃ¤s Ã¶versikt om depression' },
		sections: [
			{
				title: 'Vanliga symtom nÃ¤r depression tar plats',
				paragraphs: [
					'Depression handlar inte bara om att kÃ¤nna sig ledsen. FÃ¶r mÃ¥nga mÃ¤rks det lika mycket som lÃ¥g energi, tappad lust, svÃ¥righeter att koncentrera sig, sÃ¶mnfÃ¶rÃ¤ndringar eller att sÃ¥dant som brukade kÃ¤nnas meningsfullt plÃ¶tsligt blir tomt. En del kÃ¤nner mer irritation Ã¤n sorg. Andra upplever skuld, hopplÃ¶shet eller att vardagliga beslut blir Ã¶vermÃ¤ktiga. Det viktiga Ã¤r inte att alla symtom stÃ¤mmer in, utan att du mÃ¤rker om mÃ¥endet hÃ¥ller i sig och pÃ¥verkar hur du fungerar och orkar i vardagen.'
				]
			},
			{
				title: 'VarfÃ¶r tidig hjÃ¤lp spelar roll',
				paragraphs: [
					'NÃ¤r nedstÃ¤mdhet fÃ¥r fortsÃ¤tta i tysthet blir det ofta svÃ¥rare att bryta mÃ¶nster av isolering, passivitet och sjÃ¤lvkritik. Tidig hjÃ¤lp behÃ¶ver inte betyda att allt mÃ¥ste lÃ¶sas direkt. Det kan handla om att du fÃ¥r syn pÃ¥ hur du mÃ¥r, bÃ¶rjar fÃ¶lja dina dagar, sÃ¤tter ord pÃ¥ det som kÃ¤nns tungt eller vÃ¥gar be om mer stÃ¶d i tid. SmÃ¥ steg tidigt kan gÃ¶ra stor skillnad eftersom de minskar risken att allt lÃ¥ser sig ytterligare. Att sÃ¶ka stÃ¶d tidigt Ã¤r inte att Ã¶verdriva, utan att ta sitt mÃ¥ende pÃ¥ allvar.'
				]
			},
			{
				title: 'Vad du kan gÃ¶ra idag om orken Ã¤r lÃ¥g',
				paragraphs: [
					'Om du har lÃ¥g ork Ã¤r det sÃ¤llan hjÃ¤lpsamt att lÃ¤gga en stor plan. BÃ¶rja hellre med nÃ¥got mycket litet: skriv nÃ¥gra rader om hur dagen kÃ¤nns, Ã¶ppna ett samtal och beskriv nulÃ¤get, Ã¤t nÃ¥got enkelt, gÃ¥ ut en kort stund eller skicka ett meddelande till nÃ¥gon du litar pÃ¥. MÃ¥let Ã¤r inte att kÃ¤nna dig bra direkt, utan att minska ensamheten och skapa en liten rÃ¶relse framÃ¥t. Om du har tankar pÃ¥ att inte vilja leva eller svÃ¥rt att hÃ¥lla dig sÃ¤ker ska du sÃ¶ka akut hjÃ¤lp direkt.'
				]
			}
		],
		resourceListTitle: 'StÃ¶d att anvÃ¤nda i din takt',
		resourceListItems: [
			{ href: '/dagbok', label: 'Dagbok', description: 'fÃ¶r att skriva av dig nÃ¤r tankarna kÃ¤nns trÃ¶ga eller otydliga.' },
			{ href: '/framsteg', label: 'Framsteg', description: 'om du vill kunna fÃ¶lja smÃ¥ fÃ¶rÃ¤ndringar Ã¶ver tid nÃ¤r du har konto.' },
			{ href: '/chat/b', label: 'Samtal om nedstÃ¤mdhet', description: 'nÃ¤r du vill bÃ¶rja i text i stÃ¤llet fÃ¶r att bÃ¤ra allt sjÃ¤lv.' },
			{ href: '/om-mittpsyke', label: 'Om MittPsyke', description: 'om du vill fÃ¶rstÃ¥ vad tjÃ¤nsten Ã¤r och inte Ã¤r innan du anvÃ¤nder den.' }
		],
		nextStepTitle: 'Om du behÃ¶ver mer Ã¤n ett fÃ¶rsta steg',
		nextStepParagraphs: [
			'Digitalt stÃ¶d kan hjÃ¤lpa dig att bÃ¶rja, men ibland behÃ¶ver lÃ¥g ork, stark hopplÃ¶shet eller lÃ¥ngvarig nedstÃ¤mdhet mÃ¶tas med professionell vÃ¥rd. Om du kÃ¤nner att symtomen hÃ¥ller i sig eller blir djupare Ã¤r det klokt att kontakta vÃ¥rden tidigare hellre Ã¤n senare.',
			'Vid vÃ¥rdrÃ¥d kan du vÃ¤nda dig till 1177. Vid akut fara eller om du inte kan hÃ¥lla dig sjÃ¤lv sÃ¤ker ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat/b', label: 'Ã–ppna samtalet' },
			{ href: '/dagbok', label: 'Skriv nÃ¥gra rader' },
			{ href: '/depression', label: 'GÃ¥ till Ã¶versikt om depression' }
		],
		faq: [
			{
				question: 'Ã„r depression samma sak som att vara tillfÃ¤lligt nere?',
				answer: 'Inte alltid. Depression brukar pÃ¥verka ork, lust och vardagsfunktion mer ihÃ¥llande Ã¤n en vanlig tillfÃ¤llig svacka.'
			},
			{
				question: 'Vad kan jag gÃ¶ra om jag inte orkar sÃ¥ mycket?',
				answer: 'BÃ¶rja mycket smÃ¥tt. NÃ¥gra ord i chatten eller dagboken kan vara ett rimligt fÃ¶rsta steg nÃ¤r orken Ã¤r lÃ¥g.'
			},
			{
				question: 'NÃ¤r behÃ¶ver jag sÃ¶ka mer hjÃ¤lp?',
				answer: 'Om nedstÃ¤mdheten hÃ¥ller i sig, blir djupare eller om du har tankar pÃ¥ att inte vilja leva behÃ¶ver du mer stÃ¶d Ã¤n ett digitalt fÃ¶rsta steg.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Depression â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/depression/depression/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Om psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/om-psykisk-halsa/' }
		]
	},
	'ovningar-mot-angest-online': {
		title: 'Ã–vningar mot Ã¥ngest online | KBT, andning och exponering | MittPsyke',
		description:
			'Utforska KBT-baserade Ã¶vningar mot Ã¥ngest online. LÃ¤s om andning, exponering och varfÃ¶r praktiska Ã¶vningar ofta hjÃ¤lper mer Ã¤n att bara fÃ¶rsÃ¶ka tÃ¤nka bort Ã¥ngesten.',
		canonical: 'https://www.mittpsyke.se/ovningar-mot-angest-online',
		ogTitle: 'Ã–vningar mot Ã¥ngest online | MittPsyke',
		ogDescription:
			'NÃ¤r Ã¥ngest tar plats kan Ã¶vningar ge kroppen och tankarna nÃ¥got konkret att hÃ¥lla i.',
		h1: 'Ã–vningar mot Ã¥ngest online',
		lead:
			'NÃ¤r Ã¥ngest Ã¤r starkt kÃ¤nns det ofta som att kroppen och tankarna springer fÃ¶re dig. Ã–vningar kan hjÃ¤lpa just fÃ¶r att de gÃ¶r nÃ¥got konkret av ett annars diffust och Ã¶vervÃ¤ldigande lÃ¤ge.',
		primaryCta: { href: '/ovningar', label: 'Se Ã¶vningar' },
		secondaryCta: { href: '/hjalp-vid-angest-online', label: 'LÃ¤s om hjÃ¤lp vid Ã¥ngest' },
		sections: [
			{
				title: 'VarfÃ¶r KBT-baserade Ã¶vningar ofta fungerar',
				paragraphs: [
					'MÃ¥nga Ã¶vningar mot Ã¥ngest bygger pÃ¥ principer frÃ¥n KBT, dÃ¤r fokus ligger pÃ¥ sambandet mellan tankar, kÃ¤nslor, kroppsliga reaktioner och beteenden. NÃ¤r du blir Ã¥ngestfylld Ã¤r det vanligt att bÃ¶rja undvika, kontrollera eller fÃ¶rsÃ¶ka tÃ¤nka bort obehaget snabbt. Det kan hjÃ¤lpa kortsiktigt men hÃ¥ller ofta igÃ¥ng problemet lÃ¤ngre. Ã–vningar fungerar dÃ¤rfÃ¶r inte fÃ¶r att de magiskt tar bort Ã¥ngest, utan fÃ¶r att de trÃ¤nar nÃ¥got nytt: att stanna kvar, reglera kroppen, observera tankar och stegvis bygga mer handlingsutrymme.'
				]
			},
			{
				title: 'Andning och kroppslig nedvarvning',
				paragraphs: [
					'NÃ¤r kroppen gÃ¥r upp i alarm kan det vara svÃ¥rt att tÃ¤nka klart. DÃ¥ kan andningsÃ¶vningar vara ett rimligt fÃ¶rsta steg, inte fÃ¶r att â€œandas rÃ¤ttâ€ perfekt utan fÃ¶r att ge nervsystemet en tydlig signal om att tempot kan sjunka nÃ¥got. LÃ¥ngsammare utandning, rytmisk andning eller att rÃ¤kna andetag kan hjÃ¤lpa dig att komma tillbaka till nuet. Det betyder inte att allt blir bra pÃ¥ en gÃ¥ng, men ofta att intensiteten sjunker tillrÃ¤ckligt fÃ¶r att du ska kunna vÃ¤lja nÃ¤sta steg i stÃ¤llet fÃ¶r att bara reagera pÃ¥ Ã¥ngesten.'
				]
			},
			{
				title: 'Exponering och varfÃ¶r undvikande ofta stÃ¤rker Ã¥ngest',
				paragraphs: [
					'Exponering handlar om att nÃ¤rma sig sÃ¥dant som vÃ¤cker Ã¥ngest i smÃ¥, planerade steg i stÃ¤llet fÃ¶r att fortsÃ¤tta backa undan. NÃ¤r vi undviker fÃ¥r hjÃ¤rnan aldrig chans att lÃ¤ra om. Det som kÃ¤ndes farligt fortsÃ¤tter dÃ¤rfÃ¶r att verka farligt. Exponering behÃ¶ver vara varsam och genomtÃ¤nkt, inte brutal. MÃ¥let Ã¤r att bygga tolerans, inte att pressa sig Ã¶ver grÃ¤nsen. FÃ¶r vissa gÃ¥r det bra att bÃ¶rja med enkla vardagssituationer pÃ¥ egen hand. FÃ¶r svÃ¥rare problem kan det vara klokt att fÃ¥ professionell hjÃ¤lp.'
				]
			}
		],
		resourceListTitle: 'Ã–vningar och vÃ¤gar vidare',
		resourceListItems: [
			{ href: '/andningsovningar-mot-angest', label: 'AndningsÃ¶vningar mot Ã¥ngest', description: 'nÃ¤r du behÃ¶ver bÃ¶rja i kroppen och sakta ner tempot.' },
			{ href: '/4-7-8-andning-ovning', label: '4-7-8-andning', description: 'om du vill testa en enkel, tydlig Ã¶vning direkt.' },
			{ href: '/exponering-ovningar-mot-angest', label: 'ExponeringsÃ¶vningar mot Ã¥ngest', description: 'om undvikande har blivit ett Ã¥terkommande mÃ¶nster.' },
			{ href: '/chat/a', label: 'Samtal om Ã¥ngest', description: 'nÃ¤r du vill kombinera Ã¶vningar med reflektion i text.' }
		],
		nextStepTitle: 'VÃ¤lj en nivÃ¥ som kÃ¤nns mÃ¶jlig',
		nextStepParagraphs: [
			'Om Ã¥ngesten Ã¤r stark i stunden Ã¤r det ofta bÃ¤st att bÃ¶rja med en enkel andnings- eller jordningsÃ¶vning. Om du i stÃ¤llet mÃ¤rker att problemet sitter i undvikande Ã¶ver tid kan exponering vara mer hjÃ¤lpsamt. Du kan ocksÃ¥ anvÃ¤nda dagboken fÃ¶r att se vilka situationer som triggar mest.',
			'Om Ã¥ngesten blir sÃ¥ stark att du har svÃ¥rt att fungera eller kÃ¤nna dig trygg behÃ¶ver du mer stÃ¶d Ã¤n Ã¶vningar pÃ¥ egen hand. Kontakta dÃ¥ vÃ¥rden eller 1177.'
		],
		nextStepLinks: [
			{ href: '/andningsovningar-mot-angest', label: 'BÃ¶rja med andning' },
			{ href: '/exponering-ovningar-mot-angest', label: 'LÃ¤s om exponering' },
			{ href: '/dagbok', label: 'FÃ¶lj mÃ¶nster i dagboken' }
		],
		faq: [
			{
				question: 'HjÃ¤lper Ã¶vningar verkligen mot Ã¥ngest?',
				answer: 'Ja, ofta som ett sÃ¤tt att trÃ¤na nya reaktioner och skapa mer handlingsutrymme, Ã¤ven om de sÃ¤llan lÃ¶ser allt pÃ¥ en gÃ¥ng.'
			},
			{
				question: 'Ska jag bÃ¶rja med andning eller exponering?',
				answer: 'BÃ¶rja ofta med andning nÃ¤r Ã¥ngesten Ã¤r stark i kroppen just nu, och titta pÃ¥ exponering nÃ¤r undvikande blivit ett stÃ¶rre mÃ¶nster Ã¶ver tid.'
			},
			{
				question: 'NÃ¤r behÃ¶ver jag professionell hjÃ¤lp?',
				answer: 'Om Ã¥ngesten Ã¤r Ã¥terkommande, mycket stark eller begrÃ¤nsar vardagen tydligt Ã¤r det klokt att sÃ¶ka mer stÃ¶d Ã¤n Ã¶vningar pÃ¥ egen hand.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Ã…ngest â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'psykiskt-stod-online': {
		title: 'Psykiskt stÃ¶d online | Vad digitalt stÃ¶d Ã¤r och inte Ã¤r | MittPsyke',
		description:
			'LÃ¤s vad digitalt psykiskt stÃ¶d online kan vara, vilka fÃ¶rdelar och begrÃ¤nsningar som finns och nÃ¤r det fungerar som en bra fÃ¶rsta ingÃ¥ng.',
		canonical: 'https://www.mittpsyke.se/psykiskt-stod-online',
		ogTitle: 'Psykiskt stÃ¶d online | MittPsyke',
		ogDescription:
			'Digitalt stÃ¶d kan vara ett lugnt fÃ¶rsta steg, men det Ã¤r inte samma sak som vÃ¥rd.',
		h1: 'Psykiskt stÃ¶d online',
		lead:
			'Digitalt psykiskt stÃ¶d kan fylla olika roller beroende pÃ¥ vad du behÃ¶ver. HÃ¤r gÃ¥r vi igenom vad stÃ¶det faktiskt kan hjÃ¤lpa med, vad det inte ska blandas ihop med och vilka styrkor och begrÃ¤nsningar som Ã¤r viktiga att kÃ¤nna till.',
		primaryCta: { href: '/chat/a', label: 'BÃ¶rja anonymt' },
		secondaryCta: { href: '/register', label: 'Skapa din egen plats' },
		sections: [
			{
				title: 'Vad digitalt psykiskt stÃ¶d faktiskt Ã¤r',
				paragraphs: [
					'Digitalt psykiskt stÃ¶d kan vara en plats fÃ¶r reflektion, struktur och fÃ¶rsta hjÃ¤lp nÃ¤r nÃ¥got skaver men det kÃ¤nns svÃ¥rt att bÃ¶rja i vÃ¥rden direkt. FÃ¶r mÃ¥nga innebÃ¤r det att skriva i chatten, fÃ¥ ordning pÃ¥ tankar, testa Ã¶vningar eller anvÃ¤nda en dagbok fÃ¶r att se mÃ¶nster. Det kan minska kÃ¤nslan av kaos och ge ett fÃ¶rsta sprÃ¥k fÃ¶r det som kÃ¤nns svÃ¥rt. Just dÃ¤rfÃ¶r passar det ofta bra nÃ¤r du vill bÃ¶rja i liten skala eller behÃ¶ver nÃ¥got tillgÃ¤ngligt hÃ¤r och nu snarare Ã¤n att vÃ¤nta pÃ¥ rÃ¤tt tillfÃ¤lle.'
				]
			},
			{
				title: 'Vad det inte Ã¤r och varfÃ¶r den skillnaden spelar roll',
				paragraphs: [
					'Digitalt stÃ¶d Ã¤r inte detsamma som vÃ¥rd, psykologisk behandling eller medicinsk bedÃ¶mning. Den skillnaden Ã¤r viktig eftersom den hjÃ¤lper dig att vÃ¤lja rÃ¤tt nivÃ¥ av hjÃ¤lp. Ett stÃ¶d som MittPsyke kan hjÃ¤lpa dig att reflektera, fÃ¶lja ditt mÃ¥ende och hitta nÃ¤sta steg, men det tar inte Ã¶ver vÃ¥rdens ansvar. Om du behÃ¶ver diagnostik, behandling, lÃ¤kemedelsbedÃ¶mning eller stÃ¶d i akuta situationer ska du sÃ¶ka professionell hjÃ¤lp. Att fÃ¶rstÃ¥ grÃ¤nsen gÃ¶r att digitalt stÃ¶d blir ett anvÃ¤ndbart komplement i stÃ¤llet fÃ¶r en otydlig ersÃ¤ttning.'
				]
			},
			{
				title: 'FÃ¶rdelar och begrÃ¤nsningar med stÃ¶d online',
				paragraphs: [
					'De tydligaste fÃ¶rdelarna Ã¤r lÃ¥g trÃ¶skel, tillgÃ¤nglighet och att du kan bÃ¶rja i din egen takt. Du behÃ¶ver inte boka en lÃ¥ng process fÃ¶r att fÃ¥ syn pÃ¥ hur du mÃ¥r idag. FÃ¶r vissa Ã¤r textformatet ocksÃ¥ lÃ¤ttare Ã¤n att prata hÃ¶gt. Samtidigt finns begrÃ¤nsningar. Det Ã¤r svÃ¥rare att fÃ¥nga hela din situation digitalt, och det finns lÃ¤gen dÃ¤r du behÃ¶ver mer Ã¤n reflektion och sjÃ¤lvstÃ¶d. DÃ¤rfÃ¶r fungerar stÃ¶d online bÃ¤st nÃ¤r det anvÃ¤nds Ã¤rligt: som fÃ¶rsta ingÃ¥ng, komplement eller mellanrum, inte som lÃ¶sning pÃ¥ allt.'
				]
			}
		],
		resourceListTitle: 'VÃ¤lj det format som passar dig bÃ¤st',
		resourceListItems: [
			{ href: '/chat', label: 'Chatten', description: 'om du vill bÃ¶rja i samtal direkt och sÃ¤tta ord pÃ¥ det som kÃ¤nns nÃ¤rmast.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva i lugn takt och Ã¥terkomma Ã¶ver tid.' },
			{ href: '/ovningar', label: 'Ã–vningar', description: 'om du vill bÃ¶rja konkret med nÃ¥got som gÃ¥r att gÃ¶ra hÃ¤r och nu.' },
			{ href: '/guider', label: 'Guider', description: 'om du fÃ¶rst vill lÃ¤sa och fÃ¶rstÃ¥ mer om det du gÃ¥r igenom.' }
		],
		nextStepTitle: 'NÃ¤r du vill anvÃ¤nda stÃ¶det klokt',
		nextStepParagraphs: [
			'Det kan vara hjÃ¤lpsamt att bÃ¶rja med en frÃ¥ga: behÃ¶ver du nÃ¥gonstans att sortera, eller behÃ¶ver du vÃ¥rd och bedÃ¶mning? Om du frÃ¤mst behÃ¶ver struktur och lugn start kan digitalt stÃ¶d passa bra. Om du mÃ¤rker att symtomen Ã¤r svÃ¥ra, lÃ¥ngvariga eller akuta behÃ¶ver du sÃ¶ka mer hjÃ¤lp.',
			'Vid vÃ¥rdrÃ¥d kan du kontakta 1177. Vid akut fara ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Ã–ppna chatten' },
			{ href: '/dagbok', label: 'Skriv i dagboken' },
			{ href: '/om-mittpsyke', label: 'LÃ¤s om MittPsyke' }
		],
		faq: [
			{
				question: 'Ã„r psykiskt stÃ¶d online anonymt?',
				answer: 'Du kan bÃ¶rja utan konto i flera delar av tjÃ¤nsten. Konto behÃ¶vs fÃ¶rst nÃ¤r du vill spara mer Ã¶ver tid.'
			},
			{
				question: 'Ã„r detta samma sak som terapi?',
				answer: 'Nej. Det Ã¤r ett digitalt stÃ¶d fÃ¶r reflektion och nÃ¤sta steg, inte terapi eller medicinsk vÃ¥rd.'
			},
			{
				question: 'NÃ¤r passar stÃ¶d online bÃ¤st?',
				answer: 'Det passar ofta bÃ¤st som lÃ¥gtrÃ¶skelstÃ¶d nÃ¤r du vill bÃ¶rja enkelt, fÃ¥ struktur eller komplettera annan hjÃ¤lp.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃ¤lsa â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'prata-anonymt-online': {
		title: 'Prata anonymt online | Hur du bÃ¶rjar och vad du kan ta upp | MittPsyke',
		description:
			'LÃ¤s varfÃ¶r anonymitet kan hjÃ¤lpa, vad du kan prata om i ett anonymt stÃ¶d och hur du kommer igÃ¥ng nÃ¤r du vill bÃ¶rja utan press.',
		canonical: 'https://www.mittpsyke.se/prata-anonymt-online',
		ogTitle: 'Prata anonymt online | MittPsyke',
		ogDescription:
			'NÃ¤r du vill bÃ¶rja utan press kan anonymitet gÃ¶ra det lÃ¤ttare att sÃ¤tta ord pÃ¥ det som kÃ¤nns svÃ¥rt.',
		h1: 'Prata anonymt online',
		lead:
			'Att prata anonymt online kan vara ett fÃ¶rsta steg nÃ¤r du vill uttrycka nÃ¥got svÃ¥rt utan att fÃ¶rst behÃ¶va fÃ¶rklara allt om dig sjÃ¤lv. Den hÃ¤r sidan gÃ¥r igenom varfÃ¶r anonymitet kan hjÃ¤lpa, vad du kan ta upp och hur du kan komma igÃ¥ng i lugn takt.',
		primaryCta: { href: '/chat', label: 'Ã–ppna chatten' },
		secondaryCta: { href: '/om-mittpsyke', label: 'SÃ¥ fungerar MittPsyke' },
		sections: [
			{
				title: 'VarfÃ¶r anonymitet hjÃ¤lper mÃ¥nga att bÃ¶rja',
				paragraphs: [
					'Anonymitet kan minska flera hinder pÃ¥ samma gÃ¥ng. Du slipper fundera Ã¶ver hur du uppfattas, om du formulerar dig rÃ¤tt eller om nÃ¥gon kommer tycka att dina problem inte Ã¤r tillrÃ¤ckligt stora. FÃ¶r personer som bÃ¤r mycket skam, Ã¤r ovana vid att prata om kÃ¤nslor eller bara Ã¤r utmattade av att hÃ¥lla ihop vardagen kan det vara avgÃ¶rande. NÃ¤r ingÃ¥ngen Ã¤r enklare blir det ocksÃ¥ lÃ¤ttare att vara Ã¤rlig. Det betyder inte att det du kÃ¤nner Ã¤r mindre viktigt, utan att formen gÃ¶r det mer mÃ¶jligt att faktiskt bÃ¶rja.'
				]
			},
			{
				title: 'Vad du kan prata om hÃ¤r',
				paragraphs: [
					'Du behÃ¶ver inte komma med ett fÃ¤rdigt Ã¤mne. MÃ¥nga bÃ¶rjar med nÃ¥got brett som oro, stress, Ã¥ngest, nedstÃ¤mdhet, ensamhet eller bara en kÃ¤nsla av att nÃ¥got inte stÃ¥r rÃ¤tt till. Du kan ocksÃ¥ prata om relationer, press, sÃ¶mn, skuldkÃ¤nslor, tomhet eller att du har svÃ¥rt att fÃ¶rstÃ¥ dina reaktioner. Om du inte vet vad det â€œhandlar omâ€ Ã¤nnu gÃ¥r det bra att bÃ¶rja just dÃ¤r. Det viktiga Ã¤r inte att sÃ¤tta rÃ¤tt etikett direkt, utan att ge det som kÃ¤nns svÃ¥rt lite mer form och riktning.'
				]
			},
			{
				title: 'Hur du bÃ¶rjar nÃ¤r allt kÃ¤nns diffust',
				paragraphs: [
					'Det enklaste sÃ¤ttet att bÃ¶rja Ã¤r ofta att skriva det mest konkreta du vet just nu. Det kan vara en kroppslig kÃ¤nsla, en situation frÃ¥n idag eller en tanke som gÃ¥r runt. Du behÃ¶ver inte skriva lÃ¥ngt. En eller tvÃ¥ meningar rÃ¤cker fÃ¶r att samtalet ska kunna ta form. Om du hellre vill skriva fÃ¶rst fÃ¶r dig sjÃ¤lv kan dagboken vara ett bra mellanled. NÃ¤r du vÃ¤l bÃ¶rjar mÃ¤rker mÃ¥nga att det blir lÃ¤ttare att fortsÃ¤tta, just fÃ¶r att de inte lÃ¤ngre behÃ¶ver bÃ¤ra allt ensam i huvudet.'
				]
			}
		],
		resourceListTitle: 'Sidor som kan hjÃ¤lpa dig vidare',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med nÃ¥gon', description: 'om du vill lÃ¤sa mer om hur ett anonymt samtal brukar fungera.' },
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstÃ¶d online', description: 'fÃ¶r en djupare genomgÃ¥ng av varfÃ¶r lÃ¥g trÃ¶skel kan spela stor roll.' },
			{ href: '/chattstod-psykisk-ohalsa', label: 'ChattstÃ¶d vid psykisk ohÃ¤lsa', description: 'om du vill fÃ¶rstÃ¥ hur stÃ¶d i text kan hjÃ¤lpa tidigt.' },
			{ href: '/dagbok', label: 'Dagbok', description: 'om du vill bÃ¶rja skriva fÃ¶r dig sjÃ¤lv innan du Ã¶ppnar ett samtal.' }
		],
		nextStepTitle: 'BÃ¶rja med det som kÃ¤nns mÃ¶jligt',
		nextStepParagraphs: [
			'Det finns inget rÃ¤tt sÃ¤tt att ta fÃ¶rsta steget. FÃ¶r vissa passar ett kort anonymt meddelande bÃ¤st. FÃ¶r andra kÃ¤nns det bÃ¤ttre att skriva i dagboken fÃ¶rst eller lÃ¤sa en sida som sÃ¤tter ord pÃ¥ det man upplever. Huvudsaken Ã¤r att steget Ã¤r tillrÃ¤ckligt litet fÃ¶r att bli taget idag.',
			'Om du behÃ¶ver mÃ¤nsklig kontakt finns stodlinjer.se. Vid akut fara ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Starta chatten' },
			{ href: '/dagbok', label: 'Skriv i dagboken' },
			{ href: '/chatta-anonymt-med-nagon', label: 'LÃ¤s om anonym chatt' }
		],
		faq: [
			{
				question: 'MÃ¥ste jag veta vad jag vill prata om innan jag bÃ¶rjar?',
				answer: 'Nej. Du kan bÃ¶rja med nÃ¥got litet och oklart. Samtalet kan hjÃ¤lpa dig att sortera vidare.'
			},
			{
				question: 'Vad kan jag ta upp i ett anonymt samtal?',
				answer: 'Du kan ta upp allt frÃ¥n oro och Ã¥ngest till stress, relationer, ensamhet eller att du bara kÃ¤nner dig lÃ¥g utan att veta varfÃ¶r.'
			},
			{
				question: 'Ã„r detta akut hjÃ¤lp?',
				answer: 'Nej. Vid akut fara eller om nÃ¥gon riskerar att skadas ska du ringa 112.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃ¤lsa â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'samtalsstod-utan-vantetid': {
		title: 'SamtalsstÃ¶d utan vÃ¤ntetid | NÃ¤r du behÃ¶ver bÃ¶rja nu | MittPsyke',
		description:
			'LÃ¤s om hur digitalt samtalsstÃ¶d kan fylla ett gap nÃ¤r vÃ¥rdkÃ¶er eller trÃ¶sklar gÃ¶r att hjÃ¤lpen kÃ¤nns lÃ¥ngt bort, och vad som skiljer det frÃ¥n traditionell vÃ¥rd.',
		canonical: 'https://www.mittpsyke.se/samtalsstod-utan-vantetid',
		ogTitle: 'SamtalsstÃ¶d utan vÃ¤ntetid | MittPsyke',
		ogDescription:
			'NÃ¤r du behÃ¶ver bÃ¶rja nu kan digitalt stÃ¶d vara en fÃ¶rsta ingÃ¥ng, men det Ã¤r inte samma sak som vÃ¥rd.',
		h1: 'SamtalsstÃ¶d utan vÃ¤ntetid',
		lead:
			'Ibland Ã¤r det inte brist pÃ¥ vilja som gÃ¶r att stÃ¶d drÃ¶jer, utan att vÃ¤garna dit kÃ¤nns fÃ¶r lÃ¥nga eller fÃ¶r tunga. HÃ¤r gÃ¥r vi igenom varfÃ¶r vÃ¤ntan blir ett problem, hur digitalt stÃ¶d kan fylla ett mellanrum och vad som skiljer det frÃ¥n vÃ¥rd.',
		primaryCta: { href: '/chat', label: 'Ã–ppna chatten' },
		secondaryCta: { href: '/prata-anonymt-online', label: 'LÃ¤s om att prata anonymt' },
		sections: [
			{
				title: 'Problemet med att vÃ¤nta nÃ¤r mÃ¥endet redan skaver',
				paragraphs: [
					'NÃ¤r du mÃ¥r dÃ¥ligt kan Ã¤ven kort vÃ¤ntan kÃ¤nnas lÃ¥ng. Det Ã¤r svÃ¥rt att samla kraft till att sÃ¶ka hjÃ¤lp nÃ¤r sÃ¶mn, oro, nedstÃ¤mdhet eller stress redan tar mycket energi. FÃ¶r vissa handlar vÃ¤ntan om vÃ¥rdkÃ¶er. FÃ¶r andra handlar den om att det kÃ¤nns fÃ¶r stort att boka, ringa eller fÃ¶rklara sig. Under tiden riskerar problemen att vÃ¤xa, inte alltid fÃ¶r att nÃ¥got dramatiskt hÃ¤nder utan fÃ¶r att du blir mer ensam med det som pÃ¥gÃ¥r. DÃ¤rfÃ¶r kan en tillgÃ¤nglig fÃ¶rsta ingÃ¥ng vara viktig Ã¤ven nÃ¤r den inte lÃ¶ser allt.'
				]
			},
			{
				title: 'Hur digitalt stÃ¶d kan fylla gapet',
				paragraphs: [
					'Digitalt samtalsstÃ¶d kan fylla ett mellanrum mellan att bÃ¤ra allt sjÃ¤lv och att fÃ¥ mer omfattande hjÃ¤lp. Det ger mÃ¶jlighet att bÃ¶rja samma dag, sÃ¤tta ord pÃ¥ lÃ¤get medan det fortfarande Ã¤r fÃ¤rskt och hitta en liten riktning i stÃ¤llet fÃ¶r att fastna i passiv vÃ¤ntan. FÃ¶r vissa blir det ett sÃ¤tt att hÃ¥lla ihop vardagen medan de sÃ¶ker mer hjÃ¤lp. FÃ¶r andra rÃ¤cker det som lÃ¥gtrÃ¶skelstÃ¶d i en period. VÃ¤rdet ligger ofta i att nÃ¥got faktiskt kan bÃ¶rja nu, inte fÃ¶rst nÃ¤r du orkar perfekt.'
				]
			},
			{
				title: 'Vad som skiljer digitalt stÃ¶d frÃ¥n vÃ¥rd',
				paragraphs: [
					'Det viktiga Ã¤r att inte blanda ihop tillgÃ¤nglighet med behandlingsansvar. Digitalt samtalsstÃ¶d utan vÃ¤ntetid kan hjÃ¤lpa dig att reflektera, skriva, fÃ¥ struktur och ta nÃ¤sta steg, men det ersÃ¤tter inte utredning, behandling eller akut stÃ¶d. Om du behÃ¶ver medicinsk bedÃ¶mning, riskbedÃ¶mning eller lÃ¥ngsiktig behandling behÃ¶ver du fortfarande professionell vÃ¥rd. Det ena utesluter inte det andra. FÃ¶r mÃ¥nga fungerar det bÃ¤st nÃ¤r digitalt stÃ¶d anvÃ¤nds som en bro: nÃ¥got som gÃ¶r vÃ¤ntan mindre passiv och nÃ¤sta vÃ¥rdkontakt mer mÃ¶jlig.'
				]
			}
		],
		resourceListTitle: 'Bra nÃ¤sta steg beroende pÃ¥ behov',
		resourceListItems: [
			{ href: '/chat/a', label: 'Samtal om Ã¥ngest', description: 'om oron eller kroppslig Ã¥ngest Ã¤r det som kÃ¤nns mest akut just nu.' },
			{ href: '/chat/b', label: 'Samtal om nedstÃ¤mdhet', description: 'om orken Ã¤r lÃ¥g och du vill bÃ¶rja varsamt i text.' },
			{ href: '/chat/e', label: 'Samtal om stress och oro', description: 'om du frÃ¤mst kÃ¤nner Ã¶verbelastning eller grubbel.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva fÃ¶rst och Ã¥terkomma nÃ¤r du behÃ¶ver.' }
		],
		nextStepTitle: 'NÃ¤r du behÃ¶ver nÃ¥got nu och nÃ¥got mer senare',
		nextStepParagraphs: [
			'Det gÃ¥r att anvÃ¤nda digitalt stÃ¶d som ett fÃ¶rsta steg redan idag och samtidigt planera fÃ¶r mer hjÃ¤lp om du behÃ¶ver det. Att bÃ¶rja nu behÃ¶ver inte betyda att du nÃ¶jer dig med mindre Ã¤n du behÃ¶ver. Det kan i stÃ¤llet vara ett sÃ¤tt att orka ta nÃ¤sta kontakt med lite mer tydlighet.',
			'FÃ¶r vÃ¥rdrÃ¥d kan du kontakta 1177. Vid akut fara ska du ringa 112.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'BÃ¶rja nu' },
			{ href: '/dagbok', label: 'Skriv fÃ¶rst' },
			{ href: '/om-mittpsyke', label: 'LÃ¤s om tjÃ¤nsten' }
		],
		faq: [
			{
				question: 'Ã„r samtalsstÃ¶d utan vÃ¤ntetid samma sak som vÃ¥rd?',
				answer: 'Nej. Det Ã¤r ett snabbt tillgÃ¤ngligt lÃ¥gtrÃ¶skelstÃ¶d, inte medicinsk bedÃ¶mning eller behandling.'
			},
			{
				question: 'NÃ¤r kan det vara hjÃ¤lpsamt?',
				answer: 'NÃ¤r du behÃ¶ver bÃ¶rja nu, fÃ¥ ordning pÃ¥ tankar eller minska passiv vÃ¤ntan innan eller vid sidan av annan hjÃ¤lp.'
			},
			{
				question: 'Vad gÃ¶r jag om jag behÃ¶ver akut hjÃ¤lp?',
				answer: 'Vid akut fara eller om nÃ¥gon riskerar att skadas ska du ringa 112 direkt.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃ¤lsa â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'stod-vid-stress-online': {
		title: 'StÃ¶d vid stress online | Kronisk stress, symtom och hjÃ¤lp | MittPsyke',
		description:
			'LÃ¤s om kronisk stress, vanliga stressymtom och vad som kan hjÃ¤lpa nÃ¤r belastningen blivit lÃ¥ngvarig eller svÃ¥r att Ã¥terhÃ¤mta sig frÃ¥n.',
		canonical: 'https://www.mittpsyke.se/stod-vid-stress-online',
		ogTitle: 'StÃ¶d vid stress online | MittPsyke',
		ogDescription:
			'NÃ¤r kroppen gÃ¥r lÃ¤nge pÃ¥ hÃ¶gvarv kan det hjÃ¤lpa att fÃ¶rstÃ¥ stressymtom och bÃ¶rja sÃ¤nka tempot stegvis.',
		h1: 'StÃ¶d vid stress online',
		lead:
			'Stress blir lÃ¤tt ett ord fÃ¶r allt, men lÃ¥ngvarig stress sÃ¤tter sig ofta tydligt i bÃ¥de kropp, tankar och vardag. HÃ¤r kan du lÃ¤sa om hur kronisk stress kan mÃ¤rkas och vad som kan hjÃ¤lpa nÃ¤r Ã¥terhÃ¤mtningen inte lÃ¤ngre kommer av sig sjÃ¤lv.',
		primaryCta: { href: '/chat/e', label: 'Starta samtal om stress' },
		secondaryCta: { href: '/guider/stress-utmattning', label: 'LÃ¤s guide om stress' },
		sections: [
			{
				title: 'NÃ¤r stress blir lÃ¥ngvarig',
				paragraphs: [
					'Kortvarig stress Ã¤r en normal reaktion nÃ¤r nÃ¥got krÃ¤ver mycket av dig. Problemet uppstÃ¥r nÃ¤r belastningen fortsÃ¤tter utan att kroppen fÃ¥r tillrÃ¤cklig Ã¥terhÃ¤mtning. DÃ¥ kan stressen bli mer kronisk och bÃ¶rja kÃ¤nnas som ett grundlÃ¤ge snarare Ã¤n en tillfÃ¤llig topp. MÃ¥nga beskriver att de hela tiden ligger ett steg efter sig sjÃ¤lva, blir lÃ¤ttare irriterade eller kÃ¤nner att det Ã¤r svÃ¥rt att varva ner Ã¤ven nÃ¤r det egentligen Ã¤r lugnt. DÃ¥ handlar det inte bara om att â€œha mycketâ€, utan om att systemet gÃ¥tt lÃ¤nge pÃ¥ fÃ¶r hÃ¶g belastning.'
				]
			},
			{
				title: 'Vanliga stressymtom i kropp och vardag',
				paragraphs: [
					'Stress mÃ¤rks ofta bÃ¥de fysiskt och mentalt. Du kan kÃ¤nna muskelspÃ¤nning, hjÃ¤rtklappning, huvudvÃ¤rk, sÃ¶mnsvÃ¥righeter, magbesvÃ¤r eller ett stÃ¤ndigt inre tryck. Samtidigt blir tankarna ofta mer splittrade, tÃ¥lamodet kortare och minnet sÃ¤mre. Det Ã¤r ocksÃ¥ vanligt att man tappar kontakt med vad man sjÃ¤lv behÃ¶ver eftersom all energi gÃ¥r Ã¥t till att hÃ¥lla ihop dagen. NÃ¤r stressen pÃ¥gÃ¥r lÃ¤nge kan Ã¤ven sÃ¥dant du tidigare klarade utan problem bÃ¶rja kÃ¤nnas tungt. Det betyder inte att du blivit svag, utan att belastningen fÃ¥tt pÃ¥gÃ¥ fÃ¶r lÃ¤nge.'
				]
			},
			{
				title: 'Vad som brukar hjÃ¤lpa nÃ¤r allt gÃ¥r fÃ¶r fort',
				paragraphs: [
					'Det som hjÃ¤lper mest Ã¤r sÃ¤llan ytterligare prestation, utan att skapa smÃ¥ pauser dÃ¤r kroppen och tankarna hinner ikapp. Det kan handla om att skriva ner vad som faktiskt belastar dig, skala bort nÃ¥got, sÃ¤nka kraven fÃ¶r dagen, anvÃ¤nda en kort reflektionsÃ¶vning eller Ã¥terinfÃ¶ra rutiner fÃ¶r sÃ¶mn, mat och Ã¥terhÃ¤mtning. FÃ¶r vissa Ã¤r nÃ¤sta steg att prata i chatten och fÃ¥ mer Ã¶verblick. FÃ¶r andra handlar det om att inse att den lÃ¥ngvariga stressen blivit sÃ¥ tydlig att vÃ¥rd eller arbetsanpassning behÃ¶ver bli en del av lÃ¶sningen.'
				]
			}
		],
		resourceListTitle: 'StÃ¶d som kan passa vid stress',
		resourceListItems: [
			{ href: '/ovningar/daglig-reflektionsmall', label: 'Daglig reflektionsmall', description: 'fÃ¶r att stanna upp och fÃ¥ syn pÃ¥ vad som faktiskt belastar dig.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill fÃ¶lja Ã¥terkommande stressmÃ¶nster Ã¶ver tid.' },
			{ href: '/framsteg', label: 'Framsteg', description: 'fÃ¶r att kunna se smÃ¥ fÃ¶rÃ¤ndringar nÃ¤r du anvÃ¤nder dagboken regelbundet.' },
			{ href: '/guider/stress-utmattning', label: 'Guide om stress och utmattning', description: 'om du vill lÃ¤sa mer om lÃ¥ngvarig belastning.' }
		],
		nextStepTitle: 'NÃ¤r det Ã¤r dags att sÃ¶ka mer hjÃ¤lp',
		nextStepParagraphs: [
			'Om stressen pÃ¥verkar sÃ¶mn, minne, arbetsfÃ¶rmÃ¥ga eller Ã¥terhÃ¤mtning tydligt under lÃ¤ngre tid kan det vara klokt att sÃ¶ka professionell hjÃ¤lp och inte bara fÃ¶rsÃ¶ka kompensera med mer disciplin. Kroppen brukar till slut sÃ¤ga ifrÃ¥n tydligare nÃ¤r den inte fÃ¥r Ã¥terhÃ¤mtning.',
			'FÃ¶r vÃ¥rdrÃ¥d kan du kontakta 1177. Vid akut fara ska du ringa 112.'
		],
		nextStepLinks: [
			{ href: '/chat/e', label: 'Prata om stress' },
			{ href: '/dagbok', label: 'Skriv av dig' },
			{ href: '/guider/stress-utmattning', label: 'LÃ¤s mer om stress' }
		],
		faq: [
			{
				question: 'Hur vet jag om stressen blivit lÃ¥ngvarig?',
				answer: 'Om Ã¥terhÃ¤mtningen uteblir, symtomen hÃ¥ller i sig och vardagen pÃ¥verkas tydligt Ã¤r stressen vÃ¤rd att ta pÃ¥ allvar som mer Ã¤n en tillfÃ¤llig topp.'
			},
			{
				question: 'Vilka symtom Ã¤r vanliga vid hÃ¶g stress?',
				answer: 'Det kan handla om sÃ¶mnsvÃ¥righeter, spÃ¤nningar, hjÃ¤rtklappning, irritabilitet, minnessvÃ¥righeter och kÃ¤nslan av att aldrig riktigt komma ner i varv.'
			},
			{
				question: 'NÃ¤r behÃ¶ver jag sÃ¶ka vÃ¥rd fÃ¶r stress?',
				answer: 'NÃ¤r stressen Ã¤r lÃ¥ngvarig, pÃ¥verkar funktion och Ã¥terhÃ¤mtning tydligt eller nÃ¤r du kÃ¤nner att du inte lÃ¤ngre kommer tillbaka pÃ¥ egen hand.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Stress â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/stresshantering-och-somn/stress/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' }
		]
	},
	'stod-vid-ptsd-online': {
		title: 'StÃ¶d vid PTSD online | Symtom, vardagsstÃ¶d och nÃ¤sta steg | MittPsyke',
		description:
			'LÃ¤s om vanliga PTSD-symtom, vad som kan hjÃ¤lpa i vardagen och nÃ¤r det Ã¤r viktigt att sÃ¶ka professionell hjÃ¤lp utÃ¶ver digitalt stÃ¶d.',
		canonical: 'https://www.mittpsyke.se/stod-vid-ptsd-online',
		ogTitle: 'StÃ¶d vid PTSD online | MittPsyke',
		ogDescription:
			'NÃ¤r svÃ¥ra minnen och reaktioner tar plats kan varsamt stÃ¶d hjÃ¤lpa dig att bÃ¶rja fÃ¶rstÃ¥ ditt lÃ¤ge.',
		h1: 'StÃ¶d vid PTSD online',
		lead:
			'Traumarelaterade symtom kan vara svÃ¥ra att beskriva och Ã¤nnu svÃ¥rare att leva med. Den hÃ¤r sidan samlar varsam information om vanliga PTSD-symtom, vad som kan hjÃ¤lpa i vardagen och nÃ¤r digitalt stÃ¶d behÃ¶ver kompletteras med professionell hjÃ¤lp.',
		primaryCta: { href: '/chat/a', label: 'Starta ett lugnt samtal' },
		secondaryCta: { href: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma', label: 'LÃ¤s om samtalsstÃ¶d vid trauma' },
		sections: [
			{
				title: 'Vanliga symtom vid PTSD',
				paragraphs: [
					'PTSD kan visa sig som pÃ¥trÃ¤ngande minnen, flashbacks, mardrÃ¶mmar, stark vaksamhet eller kroppsliga reaktioner som kommer snabbt och kÃ¤nns svÃ¥ra att stoppa. Det Ã¤r ocksÃ¥ vanligt att fÃ¶rsÃ¶ka undvika platser, personer, tankar eller situationer som pÃ¥minner om det som hÃ¤nt. FÃ¶r vissa mÃ¤rks det mest som avstÃ¤ngdhet, irritabilitet eller svÃ¥righeter att kÃ¤nna sig trygg Ã¤ven i vanliga vardagssituationer. Symtomen handlar inte om svaghet utan om att nervsystemet fortsatt reagera som om faran fortfarande pÃ¥gÃ¥r, trots att situationen kan vara Ã¶ver.'
				]
			},
			{
				title: 'Vad som kan hjÃ¤lpa i vardagen',
				paragraphs: [
					'VardagsstÃ¶d vid traumarelaterade symtom behÃ¶ver ofta vara varsamt och stabiliserande. MÃ¥let Ã¤r inte att pressa fram minnen eller fÃ¶rstÃ¥ allt pÃ¥ en gÃ¥ng, utan att skapa lite mer trygghet i nuet. Det kan handla om att lÃ¤gga mÃ¤rke till vad som triggar starka reaktioner, anvÃ¤nda jordningsÃ¶vningar, skriva kort om nulÃ¤get i stÃ¤llet fÃ¶r om sjÃ¤lva traumat och fÃ¶rsÃ¶ka bygga rutiner som gÃ¶r dagen mer fÃ¶rutsÃ¤gbar. FÃ¶r vissa Ã¤r det ocksÃ¥ hjÃ¤lpsamt att fÃ¶lja mÃ¶nster i dagboken fÃ¶r att se vad som lugnar och vad som Ã¶kar anspÃ¤nningen.'
				]
			},
			{
				title: 'NÃ¤r du bÃ¶r sÃ¶ka professionell hjÃ¤lp',
				paragraphs: [
					'Om symtomen Ã¤r Ã¥terkommande, starka eller pÃ¥verkar din sÃ¶mn, trygghet och funktion tydligt behÃ¶ver du ofta mer Ã¤n ett digitalt reflektionsstÃ¶d. Det gÃ¤ller sÃ¤rskilt om du har kraftiga flashbacks, dissociation, svÃ¥rt att kÃ¤nna dig sÃ¤ker eller om vardagen krymper pÃ¥ grund av undvikande. DÃ¥ Ã¤r det viktigt att fÃ¥ professionell bedÃ¶mning och behandling. Digitalt stÃ¶d kan fortfarande vara ett komplement, men det ska inte bÃ¤ra hela ansvaret nÃ¤r traumarelaterade symtom blivit omfattande eller akuta.'
				]
			}
		],
		resourceListTitle: 'Varsamma vÃ¤gar vidare',
		resourceListItems: [
			{ href: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma', label: 'SamtalsstÃ¶d vid trauma', description: 'om du vill lÃ¤sa mer om en lugn fÃ¶rsta ingÃ¥ng kring trauma och reaktioner.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'fÃ¶r att notera nulÃ¤ge, triggers och sÃ¥dant som hjÃ¤lper utan att pressa fram mer Ã¤n du orkar.' },
			{ href: '/framsteg', label: 'Framsteg', description: 'om du vill fÃ¶lja smÃ¥ skiften Ã¶ver tid nÃ¤r du anvÃ¤nder dagboken.' },
			{ href: '/om-mittpsyke', label: 'Om MittPsyke', description: 'fÃ¶r att fÃ¶rstÃ¥ tjÃ¤nstens grÃ¤nser och nÃ¤r annan hjÃ¤lp behÃ¶vs.' }
		],
		nextStepTitle: 'BÃ¶rja varsamt och ta symtomen pÃ¥ allvar',
		nextStepParagraphs: [
			'Det kan vara klokt att bÃ¶rja med att beskriva nulÃ¤get snarare Ã¤n att fÃ¶rsÃ¶ka Ã¥terberÃ¤tta allt som hÃ¤nt. Om du mÃ¤rker att symtomen snabbt blir starka Ã¤r det viktigt att sakta ner och sÃ¶ka mer stÃ¶d, inte pressa dig igenom pÃ¥ egen hand.',
			'Vid akut fara eller om du inte kÃ¤nner dig sÃ¤ker ska du ringa 112. FÃ¶r vÃ¥rdrÃ¥d kan du kontakta 1177.'
		],
		nextStepLinks: [
			{ href: '/chat/a', label: 'BÃ¶rja fÃ¶rsiktigt i chatten' },
			{ href: '/dagbok', label: 'Skriv om nulÃ¤get' },
			{ href: '/samtalsstod-utan-vantetid/samtalsstod-vid-trauma', label: 'LÃ¤s mer om trauma' }
		],
		faq: [
			{
				question: 'MÃ¥ste jag berÃ¤tta hela traumat fÃ¶r att fÃ¥ stÃ¶d?',
				answer: 'Nej. Det kan vara bÃ¤ttre att bÃ¶rja med nulÃ¤get, symtomen och vad som triggar dig Ã¤n att pressa fram hela berÃ¤ttelsen direkt.'
			},
			{
				question: 'Kan digitalt stÃ¶d hjÃ¤lpa vid PTSD?',
				answer: 'Det kan hjÃ¤lpa som varsam reflektion och struktur i vardagen, men det ersÃ¤tter inte professionell behandling nÃ¤r symtomen Ã¤r tydliga.'
			},
			{
				question: 'NÃ¤r behÃ¶ver jag professionell hjÃ¤lp?',
				answer: 'NÃ¤r symtomen Ã¤r starka, Ã¥terkommande eller pÃ¥verkar trygghet, sÃ¶mn och funktion tydligt behÃ¶ver du professionell bedÃ¶mning och stÃ¶d.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Posttraumatiskt stressyndrom (PTSD) â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/sjukdomar--besvar/psykiska-sjukdomar-och-besvar/angest/posttraumatiskt-stressyndrom-ptsd/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
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
					'Ibland Ã¤r det lÃ¤ttare att bÃ¶rja skriva Ã¤n att fÃ¶rklara allt fÃ¶r nÃ¥gon annan. HÃ¤r kan du ta fÃ¶rsta steget direkt, utan konto och utan att fÃ¶rst lÃ¤mna nÃ¥gra uppgifter. Det gÃ¶r trÃ¶skeln lÃ¤gre nÃ¤r du bara behÃ¶ver fÃ¥ ur dig nÃ¥got eller sortera det som kÃ¤nns svÃ¥rt.'
				]
			},
			{
				title: 'StÃ¶d fÃ¶r Ã¥ngest, stress och nedstÃ¤mdhet',
				paragraphs: [
					'Du kan anvÃ¤nda sidan nÃ¤r tankarna snurrar, nÃ¤r kroppen gÃ¥r pÃ¥ hÃ¶gvarv eller nÃ¤r allt kÃ¤nns tungt och oklart. MittPsyke Ã¤r byggt fÃ¶r lÃ¥g trÃ¶skel och lugn reflektion i text. Det Ã¤r ett digitalt stÃ¶d fÃ¶r att bÃ¶rja formulera dig, inte en ersÃ¤ttning fÃ¶r vÃ¥rd eller akut hjÃ¤lp.'
				]
			}
		],
		resourceListTitle: 'Du kan ocksÃ¥ fortsÃ¤tta hÃ¤r',
		resourceListItems: [
			{ href: '/prata-anonymt-online', label: 'Prata anonymt online', description: 'om du vill lÃ¤sa mer om hur anonymt samtalsstÃ¶d fungerar.' },
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstÃ¶d online', description: 'om du vill fÃ¶rstÃ¥ varfÃ¶r lÃ¥g trÃ¶skel kan gÃ¶ra det lÃ¤ttare att bÃ¶rja.' },
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med nÃ¥gon', description: 'om du vill fÃ¥ en tydligare bild av hur sjÃ¤lva samtalet brukar gÃ¥ till.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva vidare Ã¶ver tid nÃ¤r du kÃ¤nner dig redo.' }
		],
		nextStepTitle: 'NÃ¤sta steg i din takt',
		nextStepParagraphs: [
			'Om det kÃ¤nns lÃ¤ttare att bÃ¶rja direkt kan du gÃ¥ vidare till skrivytan nu. Du kan ocksÃ¥ lÃ¤sa mer fÃ¶rst och komma tillbaka nÃ¤r du vill.',
			'Vid akut fara ska du ringa 112. FÃ¶r vÃ¥rdrÃ¥d finns 1177 och fÃ¶r vidare stÃ¶d finns stodlinjer.se.'
		],
		nextStepLinks: [
			{ href: '/skriv', label: 'BÃ¶rja skriva direkt' },
			{ href: '/chat', label: 'Ã–ppna chatten' },
			{ href: '/om-mittpsyke', label: 'LÃ¤s om MittPsyke' }
		],
		faq: [
			{
				question: 'MÃ¥ste jag skapa konto fÃ¶r att bÃ¶rja?',
				answer: 'Nej. Du kan bÃ¶rja skriva direkt utan att registrera dig eller uppge nÃ¥gra uppgifter.'
			},
			{
				question: 'Vad kan jag skriva om?',
				answer: 'Du kan skriva om Ã¥ngest, stress, nedstÃ¤mdhet eller nÃ¥got annat som kÃ¤nns tungt och svÃ¥rt att bÃ¤ra sjÃ¤lv.'
			},
			{
				question: 'Ã„r detta samma sak som vÃ¥rd?',
				answer: 'Nej. MittPsyke Ã¤r ett AI-baserat samtalsstÃ¶d fÃ¶r reflektion och nÃ¤sta steg, inte vÃ¥rd, diagnos eller akut hjÃ¤lp.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃƒÂ¤lsa Ã¢â‚¬â€œ 1177 VÃƒÂ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃƒÂ¤lsa och suicidprevention Ã¢â‚¬â€œ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hÃƒÂ¤lsa Ã¢â‚¬â€œ FolkhÃƒÂ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		]
	},
	'anonym-chatt': {
		title: 'Chatta anonymt om din psykiska hÃ¤lsa | LÃ¥g trÃ¶skel online | MittPsyke',
		description:
			'Chatta anonymt om din psykiska hÃ¤lsa pÃ¥ svenska. LÃ¤s hur anonym chatt fungerar, vad du kan ta upp, vad AI-stÃ¶d kan hjÃ¤lpa med och nÃ¤r du bÃ¶r sÃ¶ka mer hjÃ¤lp.',
		canonical: 'https://www.mittpsyke.se/anonym-chatt',
		ogTitle: 'Chatta anonymt om din psykiska hÃ¤lsa | MittPsyke',
		ogDescription:
			'En lÃ¥gtrÃ¶skelsida om anonym chatt fÃ¶r psykisk hÃ¤lsa, med FAQ och tydliga nÃ¤sta steg.',
		h1: 'Chatta anonymt om din psykiska hÃ¤lsa',
		lead:
			'Att bÃ¶rja prata om sitt mÃ¥ende kan vara svÃ¥rt, sÃ¤rskilt nÃ¤r man inte riktigt vet vad man kÃ¤nner eller hur mycket man vill sÃ¤ga. En anonym chatt kan dÃ¥ vara ett fÃ¶rsta steg som kÃ¤nns mer hanterbart. Du kan bÃ¶rja i text, i din egen takt, utan att fÃ¶rst behÃ¶va boka tid eller formulera en hel livsberÃ¤ttelse.',
		primaryCta: { href: '/chat', label: 'Starta anonym chatt' },
		secondaryCta: { href: '/prata-anonymt-online', label: 'LÃ¤s mer om att prata anonymt' },
		sections: [
			{
				title: 'NÃ¤r anonym chatt kan vara en bra bÃ¶rjan',
				paragraphs: [
					'FÃ¶r mÃ¥nga Ã¤r det svÃ¥raste inte att prata, utan att bÃ¶rja. Du kanske oroar dig fÃ¶r att bli missfÃ¶rstÃ¥dd, kÃ¤nner skam Ã¶ver hur du mÃ¥r eller Ã¤r fÃ¶r trÃ¶tt fÃ¶r att ta dig igenom Ã¤nnu en kontaktvÃ¤g som krÃ¤ver energi. DÃ¥ kan anonym chatt vara ett mer realistiskt fÃ¶rsta steg. Du behÃ¶ver inte ha alla svar, inte veta exakt om det handlar om Ã¥ngest, stress eller nedstÃ¤mdhet, och inte kÃ¤nna dig â€œtillrÃ¤ckligt dÃ¥ligâ€ fÃ¶r att fÃ¥ ta plats. Det rÃ¤cker att nÃ¥got kÃ¤nns tungt nog fÃ¶r att du ska vilja sÃ¤tta ord pÃ¥ det.'
				]
			},
			{
				title: 'Vad du kan ta upp i en anonym chatt om psykisk hÃ¤lsa',
				paragraphs: [
					'Du kan prata om mycket mer Ã¤n tydliga diagnoser eller stora kriser. MÃ¥nga anvÃ¤nder anonym chatt nÃ¤r de kÃ¤nner oro som aldrig riktigt slÃ¤pper, stark stress, tomhet, ensamhet, relationsproblem eller en lÃ¥g kÃ¤nsla i kroppen som Ã¤r svÃ¥r att beskriva. Du kan ocksÃ¥ skriva om sÃ¶mn, sjÃ¤lvkritik, Ã¶verbelastning eller att du bara vill fÃ¥ ur dig sÃ¥dant du inte orkar bÃ¤ra sjÃ¤lv just nu. Om orden inte kommer gÃ¥r det bra att bÃ¶rja med en enda mening om hur dagen kÃ¤nns. Samtalet kan hjÃ¤lpa dig vidare dÃ¤rifrÃ¥n.'
				]
			},
			{
				title: 'Hur AI-stÃ¶d kan hjÃ¤lpa och var grÃ¤nsen gÃ¥r',
				paragraphs: [
					'AI-stÃ¶d kan hjÃ¤lpa genom att spegla det du skriver, stÃ¤lla lugna frÃ¥gor, hjÃ¤lpa dig sortera tankar och fÃ¶reslÃ¥ ett nÃ¤sta steg som kÃ¤nns mÃ¶jligt. Det kan ocksÃ¥ vara ett sÃ¤tt att kÃ¤nna mindre ensamhet i stunden nÃ¤r du behÃ¶ver formulera nÃ¥got svÃ¥rt. Men AI Ã¤r inte vÃ¥rd, terapi eller akut hjÃ¤lp. Det gÃ¶r ingen medicinsk bedÃ¶mning och kan inte ersÃ¤tta professionellt ansvar. DÃ¤rfÃ¶r fungerar anonym chatt bÃ¤st som en fÃ¶rsta ingÃ¥ng eller ett komplement, sÃ¤rskilt nÃ¤r du vill bÃ¶rja enkelt men fortfarande behÃ¶ver vara uppmÃ¤rksam pÃ¥ om mer hjÃ¤lp behÃ¶vs.'
				]
			}
		],
		resourceListTitle: 'Sidor som passar bra tillsammans med anonym chatt',
		resourceListItems: [
			{ href: '/chatta-anonymt-med-nagon', label: 'Chatta anonymt med nÃ¥gon', description: 'om du vill lÃ¤sa mer om hur sjÃ¤lva samtalet brukar gÃ¥ till.' },
			{ href: '/anonymt-samtalsstod-online', label: 'Anonymt samtalsstÃ¶d online', description: 'fÃ¶r en bredare bild av varfÃ¶r lÃ¥g trÃ¶skel kan gÃ¶ra stor skillnad.' },
			{ href: '/dagbok', label: 'Dagboken', description: 'om du vill skriva vidare efter chatten och fÃ¥ mer kontinuitet.' },
			{ href: '/guider', label: 'Guider', description: 'om du vill fÃ¶rstÃ¥ mer om det du kÃ¤nner efter att du har bÃ¶rjat sÃ¤tta ord pÃ¥ det.' }
		],
		nextStepTitle: 'Om du vill fortsÃ¤tta efter fÃ¶rsta samtalet',
		nextStepParagraphs: [
			'FÃ¶r vissa rÃ¤cker ett fÃ¶rsta samtal fÃ¶r att fÃ¥ mer luft. FÃ¶r andra blir det tydligt att man behÃ¶ver fortsÃ¤tta fÃ¶lja sitt mÃ¥ende i dagboken, prova en Ã¶vning eller ta kontakt med vÃ¥rden. Det viktiga Ã¤r att du inte behÃ¶ver bestÃ¤mma allt frÃ¥n bÃ¶rjan. Ett fÃ¶rsta steg fÃ¥r just vara ett fÃ¶rsta steg.',
			'Vid vÃ¥rdrÃ¥d kan du kontakta 1177. Vid akut fara eller om du inte kan hÃ¥lla dig sjÃ¤lv eller nÃ¥gon annan sÃ¤ker ska du ringa 112 direkt.'
		],
		nextStepLinks: [
			{ href: '/chat', label: 'Ã–ppna chatten' },
			{ href: '/dagbok', label: 'Skriv vidare i dagboken' },
			{ href: '/guider', label: 'LÃ¤s vidare i guider' }
		],
		faq: [
			{
				question: 'MÃ¥ste jag veta exakt vad jag mÃ¥r dÃ¥ligt av fÃ¶r att bÃ¶rja chatta?',
				answer: 'Nej. Du kan bÃ¶rja med en kÃ¤nsla, en situation eller bara att nÃ¥got kÃ¤nns fel. Chatten kan hjÃ¤lpa dig att sortera vidare.'
			},
			{
				question: 'Ã„r anonym chatt samma sak som terapi eller vÃ¥rd?',
				answer: 'Nej. Det Ã¤r ett lÃ¥gtrÃ¶skelstÃ¶d fÃ¶r reflektion och nÃ¤sta steg, inte diagnos, behandling eller akut vÃ¥rd.'
			},
			{
				question: 'NÃ¤r ska jag sÃ¶ka mer hjÃ¤lp Ã¤n en anonym chatt?',
				answer: 'Om du Ã¤r i akut fara, har svÃ¥rt att hÃ¥lla dig sÃ¤ker eller behÃ¶ver medicinsk bedÃ¶mning ska du sÃ¶ka professionell hjÃ¤lp direkt via 112 eller 1177 beroende pÃ¥ lÃ¤get.'
			}
		],
		updatedDate,
		sources: [
			{ label: 'Psykisk hÃ¤lsa â€“ 1177 VÃ¥rdguiden', href: 'https://www.1177.se/liv--halsa/psykisk-halsa/' },
			{ label: 'Psykisk hÃ¤lsa och suicidprevention â€“ Socialstyrelsen', href: 'https://www.socialstyrelsen.se/kunskapsstod-och-regler/omraden/psykisk-ohalsa/' },
			{ label: 'Psykisk hÃ¤lsa â€“ FolkhÃ¤lsomyndigheten', href: 'https://www.folkhalsomyndigheten.se/vara-amnesomraden/psykisk-halsa/' }
		],
		faqSchema: true
	}
};

export const seoSupportPagePaths = Object.values(seoSupportPages).map((page) =>
	page.canonical.replace('https://www.mittpsyke.se', '')
);

