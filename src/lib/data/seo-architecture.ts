export type Pillar = {
	slug: string;
	title: string;
	description: string;
	clusterTopics: string[];
	toolSlugs: string[];
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
		toolSlugs: ['grounding-5-4-3-2-1', '4-7-8-andning', 'cbt-katastroftankar']
	},
	{
		slug: 'stress-utmattning',
		title: 'Stress och utmattning',
		description: 'Lugn, tydlig vägledning för återhämtning, gränssättning och hållbar energi.',
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
		toolSlugs: ['dagens-avslut-reflektion', 'tacksamhetsovning', 'daglig-reflektionsmall']
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
		toolSlugs: ['skrivovningar-sjalvkansla', 'sjalvmedkansla-ovning', 'vardekartlaggning']
	},
	{
		slug: 'depression',
		title: 'Nedstämdhet och depression',
		description: 'Förstå symtom och hitta varsamma strategier för ork, struktur och hopp.',
		clusterTopics: [
			'Symtom på depression',
			'Depression och energi',
			'Negativa tankar och depression',
			'Små steg när allt känns tungt',
			'Träning och rörelse',
			'Isolering och vägen tillbaka',
			'Hopp och återhämtning'
		],
		toolSlugs: ['daglig-reflektionsmall', 'tacksamhetsovning', 'body-scan']
	},
	{
		slug: 'overtankande',
		title: 'Övertänkande och grubblande',
		description: 'Bryt tankeloopar med tydliga metoder för närvaro och mental flexibilitet.',
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
