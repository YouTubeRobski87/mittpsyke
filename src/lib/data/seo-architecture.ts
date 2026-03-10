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
			{ title: 'Panikattack eller ångest – vad är skillnaden?', href: '/guider/panikattack-eller-angest' },
			{ title: 'Ångest på kvällen – varför det ofta blir värre', href: '/guider/angest-pa-kvallen' },
			{ title: 'Undvikande och hur det håller ångesten vid liv', href: '/guider/undvikande-och-angest' },
			{ title: 'Kroppen vid ångest – symtom du kan lära dig förstå', href: '/guider/kroppen-vid-angest' }
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
			{ title: 'Skillnaden mellan stress och utmattning', href: '/guider/stress-vs-utmattning' },
			{ title: 'Gränssättning – varför det är svårt och hur du börjar', href: '/guider/granssattning' },
			{ title: 'Återhämtning tar tid – tecken på att du är på rätt väg', href: '/guider/aterhamtning-fran-stress' },
			{ title: 'Kropp och stress – vad som händer när systemet är överbelastat', href: '/guider/kropp-och-stress' }
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
			{ title: 'Den inre kritikern – vad den säger och hur du svarar', href: '/guider/den-inre-kritikern' },
			{ title: 'Självmedkänsla som verktyg – inte bara ett buzzword', href: '/guider/sjalvmedkansla-i-praktiken' },
			{ title: 'Jämförelse och sociala medier – varför det sår tvivel', href: '/guider/jamforelse-sociala-medier' },
			{ title: 'Skam och skuld – att bära mindre och leva mer', href: '/guider/skam-och-skuld' }
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
			{ title: 'Stress och sömn – när kroppen inte kan varva ner', href: '/guider/stress-och-somn' },
			{ title: 'Ältande på kvällen – varför tankarna blir starkare i sängen', href: '/guider/altande-pa-kvallen' },
			{ title: 'Trött men uppvarvad – när kroppen vill sova men hjärnan inte släpper taget', href: '/guider/trott-men-uppvarvad' },
			{ title: 'När sömnbrist påverkar måendet – oro, irritation och nedstämdhet', href: '/guider/somnbrist-och-maendet' }
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
			{ title: 'Energi och depression – varför det känns omöjligt att göra saker', href: '/guider/energi-och-depression' },
			{ title: 'Negativa tankar – hur de håller nedstämdhet vid liv', href: '/guider/negativa-tankar-och-depression' },
			{ title: 'Söka hjälp vid depression – när är det dags?', href: '/guider/soka-hjalp-vid-depression' },
			{ title: 'Aktivering – rörelse och rutiner som faktiskt hjälper', href: '/guider/aktivering-vid-depression' }
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
		pillarSlug: 'sjalvkansla'
	},
	{
		slug: 'cbt-katastroftankar',
		title: 'KBT-övning för katastroftankar',
		description: 'Omvandla katastroftankar till mer balanserade perspektiv.',
		pillarSlug: 'angest'
	},
	{
		slug: 'daglig-reflektionsmall',
		title: 'Daglig reflektionsmall',
		description: 'Kort daglig check-in för tankar, känslor och behov.',
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'sju-fragor-vid-oro',
		title: '7 frågor att ställa sig vid oro',
		description: 'Struktur för att bryta oro och hitta nästa lugna steg.',
		pillarSlug: 'overtankande'
	},
	{
		slug: 'sjalvmedkansla-ovning',
		title: 'Självmedkänsla - guidad övning',
		description: 'Varsam övning för att möta självkritik med medkänsla.',
		pillarSlug: 'sjalvkansla'
	},
	{
		slug: 'grounding-5-4-3-2-1',
		title: 'Grounding 5-4-3-2-1',
		description: 'Snabb övning för att landa i kroppen när stressen stiger.',
		pillarSlug: 'angest'
	},
	{
		slug: 'tankefallor-kartlaggning',
		title: 'Tankefällor: identifiera mönster',
		description: 'Kartlägg vanliga tankefällor och välj nya responser.',
		pillarSlug: 'overtankande'
	},
	{
		slug: 'icke-valdsam-kommunikation',
		title: 'Icke-valdsam kommunikation',
		description: 'Mall för tydliga och respektfulla samtal i relationer.',
		pillarSlug: 'relationsproblem'
	},
	{
		slug: 'vardekartlaggning',
		title: 'Värdekartläggning',
		description: 'Klargör vad som betyder mest och hur du vill leva.',
		pillarSlug: 'existentiell-oro'
	},
	{
		slug: '4-7-8-andning',
		title: '4-7-8 andning',
		description: 'En enkel andningsteknik för att varva ned nervsystemet.',
		pillarSlug: 'angest'
	},
	{
		slug: 'body-scan',
		title: 'Body scan meditation',
		description: 'Stegvis kroppsskanning för närvaro och avslappning.',
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'katastrofgranskning',
		title: 'Katastrofgranskning',
		description: 'Utvärdera värsta scenariot och sannolikare utfall.',
		pillarSlug: 'angest'
	},
	{
		slug: 'tacksamhetsovning',
		title: 'Tacksamhetsövning för utmattning',
		description: 'Kort daglig rutin för att uppmärksamma återhämtning.',
		pillarSlug: 'depression'
	},
	{
		slug: 'dagens-avslut-reflektion',
		title: 'Avslutning av dagen - reflektionsmall',
		description: 'Kvällsmall för att släppa dagen och stänga mentalt.',
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'trygghetscirkel-exponering',
		title: 'Trygghetscirkel: exponering i smågrupp',
		description: 'Social exponering i lagom steg tillsammans med andra.',
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
