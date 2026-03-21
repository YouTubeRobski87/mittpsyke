export type RelatedArticle = {
	title: string;
	href: string;
};

export type Pillar = {
	slug: string;
	title: string;
	description: string;
	clusterTopics: string[];
	toolSlugs: string[];
	relatedArticles?: RelatedArticle[];
};

export type Tool = {
	slug: string;
	title: string;
	description: string;
	purpose?: string;
	steps?: string[];
	reflections?: string[];
	pillarSlug: string;
};

export const pillars: Pillar[] = [
	{
		slug: 'angest',
		title: 'Ångest',
		description: 'Hjälp vid ångest online med tydliga verktyg, reflektion och varsamma nästa steg i din egen takt.',
		clusterTopics: [
			'Vad händer i kroppen vid ångest?',
			'Är ångest farligt?',
			'5 andningsövningar mot ångest',
			'Skillnaden mellan oro och ångest',
			'Hur slutar man undvika saker?',
			'Ångest på kvällen',
			'Ångest och fysisk aktivitet',
			'Acceptans och att leva med ångest'
		],
		toolSlugs: ['grounding-5-4-3-2-1', '4-7-8-andning', 'cbt-katastroftankar'],
		relatedArticles: [
			{ title: 'Panikattack eller ångest – vad är skillnaden?', href: '/guider-seo/angest/panikangest-och-kroppen' },
			{ title: 'Ångest på kvällen – varför det ofta blir värre', href: '/guider-seo/angest/angest-och-somn' },
			{ title: 'Undvikande och hur det håller ångesten vid liv', href: '/guider-seo/trauma/undvikande-efter-trauma' },
			{ title: 'Kroppen vid ångest – symtom du kan lära dig förstå', href: '/guider-seo/angest/panikangest-och-kroppen' }
		]
	},
	{
		slug: 'stress-utmattning',
		title: 'Stress och utmattning',
		description: 'Stöd vid stress online med återhämtning, struktur och varsamma nästa steg i ett lugnt tempo.',
		clusterTopics: [
			'Stresshormon och din kropp',
			'Burnout-test',
			'Återhämta dig från utmattning',
			'Gränssättning och nej utan skuld',
			'Balans mellan arbete och liv utan prestationsmyter',
			'Mini-pauser som återställer',
			'Stress och sömnproblem',
			'När ska man söka professionell hjälp?'
		],
		toolSlugs: ['dagens-avslut-reflektion', 'tacksamhetsovning', 'daglig-reflektionsmall'],
		relatedArticles: [
			{ title: 'Gränssättning – varför det är svårt och hur du börjar', href: '/guider-seo/sjalvkansla/gransen-och-sjalvkansla' }
		]
	},
	{
		slug: 'sjalvkansla',
		title: 'Självkänsla och självtillit',
		description: 'Bygg en stabil självkänsla med praktiska steg och vardagliga övningar.',
		clusterTopics: [
			'Den inre kritikern',
			'Perfektionism och självkritik',
			'Jämförelse i sociala medier',
			'Självmedkänsla i praktiken',
			'Återhämtning från skam och skuld',
			'Imposter-syndrom',
			'Bekräftelser som fungerar'
		],
		toolSlugs: ['skrivovningar-sjalvkansla', 'sjalvmedkansla-ovning', 'vardekartlaggning'],
		relatedArticles: [
			{ title: 'Den inre kritikern – vad den säger och hur du svarar', href: '/guider-seo/sjalvkansla/inre-kritikern' },
			{ title: 'Jämförelse och sociala medier – varför det sår tvivel', href: '/guider-seo/sjalvkansla/jamforelse-och-sjalvbild' }
		]
	},
	{
		slug: 'sovproblem',
		title: 'Sömnproblem',
		description: 'Stöd vid sömnproblem – lugna tankarna, förstå mönstren och hitta din väg till bättre sömn.',
		clusterTopics: [
			'Varför kan jag inte sova?',
			'Tankar som snurrar på natten',
			'Sömnhygien i praktiken',
			'Ångest och sömnproblem',
			'Sova utan lugnande medel',
			'Vakna på natten – vad göra?',
			'KBT för sömnproblem (CBT-i)'
		],
		toolSlugs: ['4-7-8-andning', 'body-scan', 'dagens-avslut-reflektion'],
		relatedArticles: [
			{ title: 'Stress och sömn – när kroppen inte kan varva ner', href: '/guider-seo/sovproblem/stress-och-somn' },
			{ title: 'Ältande på kvällen – varför tankarna blir starkare i sängen', href: '/guider-seo/sovproblem/altande-pa-kvallen' },
			{ title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget', href: '/guider-seo/sovproblem/trott-men-uppvarvad' },
			{ title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet', href: '/guider-seo/sovproblem/somnbrist-och-maendet' }
		]
	},
	{
		slug: 'depression',
		title: 'Nedstämdhet och depression',
		description: 'Hjälp vid depression online med lugn reflektion, struktur och möjlighet att följa små steg över tid.',
		clusterTopics: [
			'Symtom på depression',
			'Depression och energi',
			'Negativa tankar och depression',
			'Små steg när allt känns tungt',
			'Träning och rörelse',
			'Isolering och vägen tillbaka',
			'Hopp och återhämtning'
		],
		toolSlugs: ['daglig-reflektionsmall', 'tacksamhetsovning', 'body-scan'],
		relatedArticles: [
			{ title: 'Energi och depression – varför det känns omöjligt att göra saker', href: '/guider-seo/depression/trotthet-och-meningsloshet' },
			{ title: 'Aktivering – rörelse och rutiner som faktiskt hjälper', href: '/guider-seo/depression/sma-steg-vid-nedstamdhet' }
		]
	},
	{
		slug: 'overtankande',
		title: 'Övertänkande och grubblande',
		description: 'Hjälp mot oro online med tydliga sätt att bryta tankeloopar och hitta mer lugn i vardagen.',
		clusterTopics: [
			'Varför grubblande inte löser problem',
			'Mental rumination',
			'Rädsla för egna tankar',
			'Släppa tanken med ACT',
			'Mindfulness för ett överaktivt sinne',
			'Nattligt övertänkande',
			'Fokusera på nuet'
		],
		toolSlugs: ['tankefallor-kartlaggning', 'cbt-katastroftankar', 'body-scan']
	},
	{
		slug: 'social-angest',
		title: 'Social ångest',
		description: 'Stegvis stöd för social trygghet, exponering och sociala färdigheter.',
		clusterTopics: [
			'Fysiska symtom på social ångest',
			'Rodnad, darrningar och kroppens reaktioner',
			'Exponering för social ångest',
			'Sociala färdigheter i praktiken',
			'Introvert eller social ångest?',
			'Att övervinna gruppångest'
		],
		toolSlugs: ['trygghetscirkel-exponering', 'grounding-5-4-3-2-1', '4-7-8-andning']
	},
	{
		slug: 'relationsproblem',
		title: 'Relationsproblem och kommunikation',
		description: 'Verktyg för tydligare samtal, gränssättning och tryggare relationer.',
		clusterTopics: [
			'Kommunikationsmönster som skadar',
			'Hur man tar svåra samtal',
			'Gränssättning i relationer',
			'Anknytningsmönster',
			'Förlåtelse och tillit',
			'Ensamhet i relationer',
			'Beroende eller närhet',
			'Lämna eller stanna'
		],
		toolSlugs: ['icke-valdsam-kommunikation', 'vardekartlaggning', 'sju-fragor-vid-oro']
	},
	{
		slug: 'existentiell-oro',
		title: 'Existentiell oro och mening',
		description: 'Utforska osäkerhet, mening och identitet med lugn och riktning.',
		clusterTopics: [
			'Dödsångest och dödsmedvetenhet',
			'Livsmening och personligt varför',
			'Stora livsförändringar och identitet',
			'Tomhet efter uppnådda mål',
			'Absurditet och humor',
			'Acceptans av osäkerhet'
		],
		toolSlugs: ['vardekartlaggning', 'body-scan', 'daglig-reflektionsmall']
	}
];

export const tools: Tool[] = [
	{
		slug: 'skrivovningar-sjalvkansla',
		title: '3 skrivövningar för självkänsla',
		description: 'Skrivmallar för att bygga självtillit steg för steg.',
		purpose: 'De här tre övningarna hjälper dig att se dig själv med lite mer rättvisa och värme. Du väljer vilken du börjar med. Det finns inget rätt svar – skriv det som faktiskt dyker upp.',
		steps: [
			'Ta fram papper eller dagboken. Välj en av de tre övningarna nedan och sätt av 10 minuter utan avbrott.',
			'Övning 1 – Brevet till dig själv: Skriv ett kort brev till dig själv som om du vore en nära vän. Vad skulle du säga? Vad ser du i dig som du sällan erkänner?',
			'Övning 2 – Tre styrkor idag: Skriv tre saker du klarade av idag – hur litet det än verkar. Vad krävdes av dig för att göra dem?',
			'Övning 3 – Utmana den inre kritikern: Skriv ned en kritisk tanke du haft om dig själv. Skriv sedan tre konkreta motbevis – situationer där tanken inte stämt.',
			'Läs igenom det du skrivit utan att bedöma. Lägg märke till vad som väcker en känsla.'
		],
		reflections: [
			'Vilken övning kändes mest levande? Varför tror du det?',
			'Finns det en mening du skrivit som du vill bära med dig?',
			'Hur skulle du se på en vän som delade exakt det du skrivit?'
		],
		pillarSlug: 'sjalvkansla'
	},
	{
		slug: 'cbt-katastroftankar',
		title: 'KBT-övning för katastroftankar',
		description: 'Omvandla katastroftankar till mer balanserade perspektiv.',
		purpose: 'Katastroftankar är ofta trovärdiga men sällan faktabaserade. Den här KBT-övningen hjälper dig att undersöka om tanken verkligen stämmer – och formulera en mer rättvis version.',
		steps: [
			'Skriv ned katastroftanken ordagrant: "Det kommer att gå fel för att…" Var specifik.',
			'Skatta sannolikheten 0–100 %. Hur troligt är det egentligen att just detta händer?',
			'Skriv ned bevis FÖR tanken. Vad talar för att den stämmer?',
			'Skriv ned bevis EMOT tanken. Vilka fakta, tidigare erfarenheter eller alternativa tolkningar talar emot?',
			'Formulera en mer balanserad tanke. Inte falskt positiv – bara mer rättvis mot dig och situationen.',
			'Skatta hur stark ångesten känns nu (0–10). Jämför med hur det kändes innan du började.'
		],
		reflections: [
			'Vad märker du när du ser tanken skriven framför dig?',
			'Vilken del av övningen var svårast att göra ärligt?',
			'Är det en situation du vill ta upp i MittPsykes chatt eller dagbok?'
		],
		pillarSlug: 'angest'
	},
	{
		slug: 'daglig-reflektionsmall',
		title: 'Daglig reflektionsmall',
		description: 'Kort daglig check-in för tankar, känslor och behov.',
		purpose: 'En kort daglig incheck-in hjälper dig att märka vad du faktiskt bär på – innan det hopar sig. Övningen tar 5–10 minuter och fungerar bäst om du gör den vid ungefär samma tid varje dag.',
		steps: [
			'Avsätt 5–10 minuter, helst vid samma tid varje dag. Morgon eller kväll fungerar lika bra.',
			'Kroppen: Hur känns kroppen just nu? Spänning, trötthet, rastlöshet? Var i kroppen märks det tydligast?',
			'Känslan: Vad är den starkaste känslan du bär på just nu? Ge den ett namn – oro, lättnad, tristess, hopp.',
			'Tanken: Finns det en återkommande tanke idag? Skriv ned den utan att bedöma den.',
			'Behovet: Vad behöver du mest just nu – vila, rörelse, kontakt, struktur, ensamhet?',
			'Nästa steg: Välj ett litet, konkret steg du kan ta de närmaste timmarna utifrån det du behöver.'
		],
		reflections: [
			'Vad var svårast att sätta ord på?',
			'Märker du ett mönster i vad du behöver mest?',
			'Hur kändes det att ta en stund enbart för dig själv?'
		],
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'sju-fragor-vid-oro',
		title: '7 frågor att ställa sig vid oro',
		description: 'Struktur för att bryta oro och hitta nästa lugna steg.',
		purpose: 'Oro tenderar att snurra i samma cirklar utan att komma fram till något. De här sju frågorna ger oron en konkret riktning och hjälper dig att skilja på vad du kan påverka och vad du inte kan.',
		steps: [
			'Skriv ned oron som en konkret mening: "Jag oroar mig för att…"',
			'Fråga 1: Är det här något jag faktiskt kan påverka – helt, delvis eller inte alls?',
			'Fråga 2: Vad är det värsta som realistiskt kan hända?',
			'Fråga 3: Hur sannolikt är det värsta scenariot på en skala 0–100 %?',
			'Fråga 4: Vad kan jag göra om det ändå händer?',
			'Fråga 5: Har jag klarat liknande situationer förut? Vad hjälpte mig då?',
			'Fråga 6: Vad skulle jag säga till en nära vän som hade exakt samma oro?',
			'Fråga 7: Vad är nästa lilla konkreta steg jag kan ta just nu?'
		],
		reflections: [
			'Vilken fråga förändrade perspektivet mest för dig?',
			'Är det en handling du kan ta i dag – hur liten den än är?',
			'Var oron kopplad till ett djupare behov – trygghet, kontroll, tillhörighet?'
		],
		pillarSlug: 'overtankande'
	},
	{
		slug: 'sjalvmedkansla-ovning',
		title: 'Självmedkänsla - guidad övning',
		description: 'Varsam övning för att möta självkritik med medkänsla.',
		purpose: 'Självmedkänsla är inte att skona sig – det är att möta sig själv med samma vänlighet man skulle ge en vän. Den här övningen är inspirerad av Kristin Neffs forskning och tar ungefär 10 minuter.',
		steps: [
			'Hitta en bekväm sittande position. Ta tre långsamma andetag och tillåt dig att sakta ned.',
			'Identifiera en situation: Välj något du just nu är hård mot dig själv om. Vad händer? Vad säger din inre kritiker?',
			'Känn in: Lägg en hand mot bröstet eller magen. Märk hur det känns i kroppen just nu – inte för att förändra det, bara för att märka det.',
			'Påminn dig: "Det här är ett svårt ögonblick. Att ha det svårt hör till det mänskliga – jag är inte ensam om det."',
			'Vad skulle du säga till en vän? Skriv ned eller tänk de orden – och rikta dem sedan mot dig själv, med samma ton.',
			'Andas ut. Stanna kvar en stund utan att kräva mer av dig.'
		],
		reflections: [
			'Hur kändes det att rikta vänlighet mot dig själv?',
			'Märkte du motstånd? Vad sa motståndets röst?',
			'Vad är en liten sak du kan göra för dig själv idag med lite mer omsorg?'
		],
		pillarSlug: 'sjalvkansla'
	},
	{
		slug: 'grounding-5-4-3-2-1',
		title: 'Grounding 5-4-3-2-1',
		description: 'Snabb övning för att landa i kroppen när stressen stiger.',
		purpose: 'Den här tekniken hjälper dig att flytta fokus från ångests tankar till vad som faktiskt finns runt dig just nu. Den tar under 2 minuter och fungerar var du än befinner dig.',
		steps: [
			'Ta ett djupt andetag och tillåt dig att sakta ned. Du behöver inte förändra hur du mår – bara observera.',
			'5 saker du SER: Nämn fem saker du kan se runt dig just nu. Var specifik – färg, form, storlek.',
			'4 saker du KÄNNER fysiskt: Märk fyra förnimmelser – golvet under fötterna, tyget mot huden, temperaturen i luften, trycket av stolen mot ryggen.',
			'3 saker du HÖR: Lyssna efter tre ljud – ett nära, ett längre bort och ett i bakgrunden.',
			'2 saker du LUKTAR: Om det är svårt att hitta dofter, tänk på en doft du gillar och märk om det väcker något i kroppen.',
			'1 sak du SMAKAR: Lägg märke till smaken i munnen just nu – hur den är, inte hur den borde vara.',
			'Ta ett nytt djupt andetag. Märk hur du befinner dig här, i den här kroppen, i det här rummet, just nu.'
		],
		reflections: [
			'Hur förändrades känslan under övningens gång?',
			'Vilket sinne var lättast att fokusera på? Vilket var svårast?',
			'Kan du använda en kortversion av övningen nästa gång ångesten stiger?'
		],
		pillarSlug: 'angest'
	},
	{
		slug: 'tankefallor-kartlaggning',
		title: 'Tankefällor: identifiera mönster',
		description: 'Kartlägg vanliga tankefällor och välj nya responser.',
		purpose: 'Tankefällor är automatiska, snedvridna sätt att tolka situationer. Genom att lära känna sina egna mönster kan du börja svara på dem i stället för att styras av dem.',
		steps: [
			'Tänk på en situation nyligen som utlöste en stark negativ känsla. Beskriv den kort – vad hände, vad sa du till dig själv?',
			'Skriv ned den automatiska tanken: "Jag tänkte att…"',
			'Identifiera tankefällan. Välj den som bäst stämmer: Svartvitt tänkande · Katastrofiering · Tankeläsning ("jag vet vad de tänker") · Personalisering · Borde-tänkande · Generalisering ("det går alltid fel") · Känslomässigt resonemang ("jag känner att det är sant, alltså är det sant").',
			'Skriv en mer nyanserad version av tanken. Inte falskt positiv – bara mer rättvis mot dig och det som faktiskt hände.',
			'Skatta stämningen: Hur stark var den negativa känslan (0–10) innan du började? Hur stark är den nu?'
		],
		reflections: [
			'Vilken tankefälla dyker upp oftast för dig?',
			'Vad utlöste situationen – finns det ett återkommande mönster?',
			'Hur kan du påminna dig om den här övningen nästa gång tanken dyker upp i stunden?'
		],
		pillarSlug: 'overtankande'
	},
	{
		slug: 'icke-valdsam-kommunikation',
		title: 'Icke-valdsam kommunikation',
		description: 'Mall för tydliga och respektfulla samtal i relationer.',
		purpose: 'IVK (Nonviolent Communication) ger dig en struktur för att säga det du menar utan att gå på angrepp eller dra dig undan. Övningen hjälper dig förbereda ett svårt samtal i fyra tydliga steg.',
		steps: [
			'Välj en konkret situation i en relation som känns svår eller olöst.',
			'Observation: Beskriv vad som faktiskt hände – utan tolkning eller värdering. "När du sa/gjorde X…" (inte "du är alltid…" eller "du menade säkert…").',
			'Känsla: Skriv ned vilken känsla det väckte. Undvik tolkningar som "attackerad" eller "ignorerad" – använd grundkänslor: ledsen, rädd, ensam, irriterad, besviken.',
			'Behov: Vad behöver du? Trygghet, respekt, förståelse, uppskattning, ärlighet, närvaro?',
			'Önskemål: Formulera ett konkret, genomförbart önskemål för framtiden. "Kan du…" eller "Jag skulle uppskatta om…"',
			'Sätt ihop de fyra delarna till en mening och läs den högt för dig själv. Hör den ut. Ändra det som inte stämmer.'
		],
		reflections: [
			'Vilken av de fyra delarna var svårast att formulera?',
			'Kände du motstånd mot att uttrycka ett behov? Vad sa motståndet?',
			'Vill du använda den här mallen som förberedelse inför ett verkligt samtal?'
		],
		pillarSlug: 'relationsproblem'
	},
	{
		slug: 'vardekartlaggning',
		title: 'Värdekartläggning',
		description: 'Klargör vad som betyder mest och hur du vill leva.',
		purpose: 'Värden är inte mål – de är riktningar du vill röra dig i. Den här övningen hjälper dig att klargöra vad som verkligen är viktigt för dig och se var du lever i linje med det – och var gapet är störst.',
		steps: [
			'Ta 10–15 minuter utan avbrott. Stäng telefonen.',
			'Lista 10–15 värden: Skriv ned allt som känns viktigt – gemenskap, frihet, ärlighet, skapande, trygghet, hälsa, rättvisa, kärlek, lärande, mod, enkelhet, närvaro…',
			'Välj de fem viktigaste. Stryk igenom resten utan att ångra dig. Det är en övning i prioritering, inte uteslutning.',
			'Rangordna de fem. Vilket värde är mest grundläggande för vem du vill vara?',
			'Granska din vardag: Lever du i linje med dina tre topp-värden? Var är gapet störst – och vad håller dig där?',
			'Skriv ett litet konkret steg som för dig närmre ett av värdena den här veckan. Hur litet som helst.'
		],
		reflections: [
			'Vad överraskade dig i listan?',
			'Finns det ett värde du rangordnar lågt fast det egentligen är viktigt för dig?',
			'Vilket steg känns mest angeläget att ta den närmaste veckan?'
		],
		pillarSlug: 'existentiell-oro'
	},
	{
		slug: '4-7-8-andning',
		title: '4-7-8 andning',
		description: 'En enkel andningsteknik för att varva ned nervsystemet.',
		purpose: 'Tekniken utvecklades av läkaren Andrew Weil och aktiverar det parasympatiska nervsystemet – kroppens eget bromssystem. Den tar under 2 minuter och kan användas var som helst.',
		steps: [
			'Sätt dig bekvämt med rak rygg, eller lägg dig ned. Stäng ögonen om det känns bra.',
			'Andas ut helt genom munnen med ett tyst, mjukt pust – töm lungorna ordentligt.',
			'Stäng munnen och andas in tyst genom näsan medan du räknar till 4.',
			'Håll andan och räkna till 7. Håll det mjukt – ingen anspänning.',
			'Andas ut helt genom munnen med ett hörbart "pust" medan du räknar till 8.',
			'Det är en cykel klar. Upprepa 3–4 gånger totalt.',
			'Sitt stilla en stund efteråt. Märk hur kroppen och andetaget känns nu.'
		],
		reflections: [
			'Märkte du en förändring i kroppen under eller efter övningen?',
			'Vilken del var svårast – hålla andan, eller räkna ut andningarna?',
			'I vilket läge vill du prova den här tekniken nästa gång – insomnande, social oro eller akut stress?'
		],
		pillarSlug: 'angest'
	},
	{
		slug: 'body-scan',
		title: 'Body scan meditation',
		description: 'Stegvis kroppsskanning för närvaro och avslappning.',
		purpose: 'Body scan är en mindfulnessövning som hjälper dig att komma i kontakt med kroppen utan att kräva att den ska förändras. Den minskar spänningar och tränar närvaro. Övningen tar 10–15 minuter.',
		steps: [
			'Lägg dig ned eller sätt dig bekvämt. Stäng ögonen. Ta tre djupa andetag och tillåt kroppen att tynglas ned.',
			'Börja med fötterna: Märk förnimmelserna i fötterna och tårna – tyngd, värme, kontakt med underlaget. Andas in mot dem, andas ut.',
			'Rör dig långsamt uppåt: vader, knän, lår. Stanna 20–30 sekunder vid varje område. Om du märker spänning – andas mot den, utan att kräva att den försvinner.',
			'Magen och bröstet: Märk andetaget – hur magen stiger och sjunker. Lägg märke till om det är lätt eller svårt att andas djupt.',
			'Händer, armar, axlar: Finns det spänning? Andas in mot den – andas ut och tillåt den att mjukna, lite.',
			'Nacke, ansikte, huvud: Käkarna, tungan, pannan, ögonen. Slappna av i ansiktet – det räcker med att märka det.',
			'Avsluta med hela kroppen som en helhet. Ta ett djupt andetag och öppna ögonen varsamt.'
		],
		reflections: [
			'Var i kroppen märkte du mest spänning?',
			'Hur förändrades kontakten med kroppen under övningens gång?',
			'Kan du ta med en 2-minutersversion av det här in i vardagen – vid skrivbordet eller innan du somnar?'
		],
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'katastrofgranskning',
		title: 'Katastrofgranskning',
		description: 'Utvärdera värsta scenariot och sannolikare utfall.',
		purpose: 'Den här övningen låter dig titta rakt på det du är rädd för i stället för att undvika det. Forskning visar att vi ofta överskattar sannolikheten för det värsta – och underskattar vår förmåga att hantera det.',
		steps: [
			'Identifiera scenariot: Vad är det värsta du är rädd ska hända? Skriv ned det konkret.',
			'Skatta sannolikheten: Hur troligt är det på en skala 0–100 %? Var ärlig mot dig själv.',
			'Om det faktiskt hände – hur svårt skulle det vara omedelbart? Sätt en siffra 0–10.',
			'Om det faktiskt hände – hur svårt skulle det vara om ett år? Om fem år? Märk skillnaden.',
			'Dina resurser: Lista tre saker du kan göra om det värsta ändå sker – stöd, agerande, anpassning.',
			'Formulera det sannolika utfallet: Vad är mer realistiskt att hända, baserat på fakta och tidigare erfarenheter?',
			'Skatta den ursprungliga oron igen (0–10). Vad har förändrats?'
		],
		reflections: [
			'Hur stor var skillnaden i orons styrka innan och efter?',
			'Vilket av de sannolika utfallen är lättast att börja ta tag i?',
			'Är det något i övningen du vill fortsätta fundera på i dagboken eller chatten?'
		],
		pillarSlug: 'angest'
	},
	{
		slug: 'tacksamhetsovning',
		title: 'Tacksamhetsövning för utmattning',
		description: 'Kort daglig rutin för att uppmärksamma återhämtning.',
		purpose: 'Vid utmattning och depression är det lätt att fokus fastnar på allt som är tungt. Den här övningen tränar hjärnan att också märka det som faktiskt fungerar – utan att förneka det som är svårt.',
		steps: [
			'Välj en fast tid varje dag – helst kvällstid. Tre till fem minuter räcker.',
			'Skriv ned tre saker från dagen du är tacksam för. De behöver inte vara stora – en kopp te, ett leende från någon, att du kom upp ur sängen.',
			'Skriv ned en sak du klarade av idag. Hur liten den än är – det räknas.',
			'Skriv ned en sak du ser fram emot imorgon. Det kan vara hur litet som helst.',
			'Läs igenom det du skrivit. Stanna ett ögonblick vid varje punkt och låt det landa.'
		],
		reflections: [
			'Vad var lättast att hitta tacksamhet för?',
			'Är det svårt att erkänna att du klarat av saker? Vad berättar det?',
			'Märker du en förändring i stämningen när du gjort övningen ett par dagar i rad?'
		],
		pillarSlug: 'depression'
	},
	{
		slug: 'dagens-avslut-reflektion',
		title: 'Avslutning av dagen - reflektionsmall',
		description: 'Kvällsmall för att släppa dagen och stänga mentalt.',
		purpose: 'När dagen aldrig riktigt stängs bär hjärnan den med sig in i natten. Den här mallen hjälper dig att aktivt lägga dagen bakom dig och gå in i kvällen med lite mer lätthet.',
		steps: [
			'Välj en tid på kvällen – 10–20 minuter innan du varvar ned. Ta fram papper, dagbok eller öppna MittPsykes dagbok.',
			'Stäng dagen: Vad är det viktigaste du vill lämna kvar från idag? Skriv ned det, och lägg det sedan medvetet åt sidan.',
			'Tre ögonblick: Vilka tre stunder under dagen minns du tydligast? En som var svår, en neutral, en ljus.',
			'Energi: Vad tog mest energi av dig idag? Vad gav mest? Finns det ett mönster?',
			'Behov imorgon: Vad behöver du mer av imorgon – vila, fokus, rörelse, gemenskap, ensamhet?',
			'Avsluta med ett andetag. Säg tyst för dig själv: "Dagen är klar. Jag får vila nu."'
		],
		reflections: [
			'Vilket mönster märker du i vad som tar energi av dig?',
			'Finns det en sak från idag du kan bära med dig som styrka till imorgon?',
			'Hur kändes det att aktivt välja att stänga dagen?'
		],
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'trygghetscirkel-exponering',
		title: 'Trygghetscirkel: exponering i smågrupp',
		description: 'Social exponering i lagom steg tillsammans med andra.',
		purpose: 'Den här övningen hjälper dig att närma dig sociala situationer i små, hanterbara steg i stället för allt på en gång. Målet är att minska undvikande och bygga mer trygghet i kontakt med andra över tid. Du väljer själv tempo och nivå, så att stegen känns utmanande men fortfarande möjliga.',
		steps: [
			'Rita tre nivåer: Tryggt, Lagom utmaning och För svårt just nu.',
			'Skriv 2–3 sociala situationer i varje nivå – till exempel stå i kön, säga en mening i ett möte, eller hälsa på grannen.',
			'Välj en situation från Lagom utmaning som du kan göra inom 24 timmar.',
			'Bestäm ett tydligt mikrosteg – till exempel: säga en mening i gruppen eller ställa en kort fråga.',
			'Genomför steget och stanna kvar i situationen en kort stund i stället för att lämna direkt.',
			'Upprepa samma nivå 2–3 gånger innan du går vidare till nästa steg i cirkeln.'
		],
		reflections: [
			'Vad var lättare än du trodde?',
			'Vad kändes mest utmanande, och vad hjälpte dig att stanna kvar?',
			'Vilket nästa lilla steg vill du prova nästa gång?'
		],
		pillarSlug: 'social-angest'
	}
];

export function getPillarBySlug(slug: string): Pillar | undefined {
	return pillars.find((pillar) => pillar.slug === slug);
}

export function getToolBySlug(slug: string): Tool | undefined {
	return tools.find((tool) => tool.slug === slug);
}

export function getToolsForPillar(pillarSlug: string): Tool[] {
	return tools.filter((tool) => tool.pillarSlug === pillarSlug);
}
