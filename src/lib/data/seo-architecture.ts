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
		title: 'Angest',
		description: 'Forsta symptom, orsaker och verktyg som kan minska oro i vardagen.',
		clusterTopics: [
			'Vad hander i kroppen vid angest?',
			'Ar angest farligt?',
			'5 andningsovningar mot angest',
			'Skillnaden mellan oro och angest',
			'Hur slutar man undvika saker?',
			'Angest pa kvallen',
			'Angest och fysisk aktivitet',
			'Acceptans och att leva med angest'
		],
		toolSlugs: ['grounding-5-4-3-2-1', '4-7-8-andning', 'cbt-katastroftankar']
	},
	{
		slug: 'stress-utmattning',
		title: 'Stress och utmattning',
		description: 'Lugn, tydlig vagledning for aterhamtning, granssattning och hallbar energi.',
		clusterTopics: [
			'Stresshormon och din kropp',
			'Burnout-test',
			'Aterhamta dig fran utmattning',
			'Granssattning och nej utan skuld',
			'Work-life utan prestationsmyter',
			'Mini-pauser som aterstaller',
			'Stress och somnproblem',
			'Nar soka professionell hjalp'
		],
		toolSlugs: ['dagens-avslut-reflektion', 'tacksamhetsovning', 'daglig-reflektionsmall']
	},
	{
		slug: 'sjalvkansla',
		title: 'Sjalvkansla och sjalvtillit',
		description: 'Bygg en stabil sjalvkansla med praktiska steg och vardagliga ovningar.',
		clusterTopics: [
			'Den inre kritikern',
			'Perfektionism och sjalvkritik',
			'Jamforelse i sociala medier',
			'Sjalvmedkansla i praktiken',
			'Aterhamtning fran skam och skuld',
			'Imposter-syndrom',
			'Bekraftelser som fungerar'
		],
		toolSlugs: ['skrivovningar-sjalvkansla', 'sjalvmedkansla-ovning', 'vardekartlaggning']
	},
	{
		slug: 'depression',
		title: 'Nedstamdhet och depression',
		description: 'Forsta symtom och hitta varsamma strategier for ork, struktur och hopp.',
		clusterTopics: [
			'Symptom pa depression',
			'Depression och energi',
			'Negativa tankar och depression',
			'Sma steg nar allt ar tungt',
			'Traning och rorelse',
			'Isolering och vagen tillbaka',
			'Hopp och aterhamtning'
		],
		toolSlugs: ['daglig-reflektionsmall', 'tacksamhetsovning', 'body-scan']
	},
	{
		slug: 'overtankande',
		title: 'Overtankande och grubblande',
		description: 'Bryt tankeloopar med tydliga metoder for narvaro och mental flexibilitet.',
		clusterTopics: [
			'Varfor grubblande inte loser problem',
			'Mental rumination',
			'Radsla for egna tankar',
			'Slappa tanken med ACT',
			'Mindfulness for overaktivt sinne',
			'Nattligt overtankande',
			'Fokusera pa nuet'
		],
		toolSlugs: ['tankefallor-kartlaggning', 'cbt-katastroftankar', 'body-scan']
	},
	{
		slug: 'social-angest',
		title: 'Social angest',
		description: 'Stegvis stod for social trygghet, exponering och sociala fardigheter.',
		clusterTopics: [
			'Fysiska symptom pa social angest',
			'Rodnad, darrningar och kroppens reaktioner',
			'Exponering for social angest',
			'Sociala fardigheter i praktiken',
			'Introvert eller social angest?',
			'Att overvinna gruppangest'
		],
		toolSlugs: ['trygghetscirkel-exponering', 'grounding-5-4-3-2-1', '4-7-8-andning']
	},
	{
		slug: 'relationsproblem',
		title: 'Relationsproblem och kommunikation',
		description: 'Verktyg for tydligare samtal, granssattning och tryggare relationer.',
		clusterTopics: [
			'Kommunikationsmonster som skadar',
			'Hur man tar svara samtal',
			'Granssattning i relationer',
			'Anknytningsmonster',
			'Forlatelse och tillit',
			'Ensamhet i relationer',
			'Beroende eller narhet',
			'Lamna eller stanna'
		],
		toolSlugs: ['icke-valdsam-kommunikation', 'vardekartlaggning', 'sju-fragor-vid-oro']
	},
	{
		slug: 'existentiell-oro',
		title: 'Existentiell oro och mening',
		description: 'Utforska osakerhet, mening och identitet med lugn och riktning.',
		clusterTopics: [
			'Dodsangest och dodsmedvetenhet',
			'Livsmening och personligt varfor',
			'Stora livsforandringar och identitet',
			'Tomhet efter uppnadda mal',
			'Absurditet och humor',
			'Acceptans av osakerhet'
		],
		toolSlugs: ['vardekartlaggning', 'body-scan', 'daglig-reflektionsmall']
	}
];

export const tools: Tool[] = [
	{
		slug: 'skrivovningar-sjalvkansla',
		title: '3 skrivovningar for sjalvkansla',
		description: 'Skrivmallar for att bygga sjalvtillit steg for steg.',
		pillarSlug: 'sjalvkansla'
	},
	{
		slug: 'cbt-katastroftankar',
		title: 'CBT-ovning for katastroftankar',
		description: 'Omvandla katastroftankar till mer balanserade perspektiv.',
		pillarSlug: 'angest'
	},
	{
		slug: 'daglig-reflektionsmall',
		title: 'Daglig reflektionsmall',
		description: 'Kort daglig check-in for tankar, kanslor och behov.',
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'sju-fragor-vid-oro',
		title: '7 fragor att stalla sig vid oro',
		description: 'Struktur for att bryta oro och hitta nasta lugna steg.',
		pillarSlug: 'overtankande'
	},
	{
		slug: 'sjalvmedkansla-ovning',
		title: 'Sjalvmedkansla - guidad ovning',
		description: 'Varsam ovning for att mota sjalvkritik med medkansla.',
		pillarSlug: 'sjalvkansla'
	},
	{
		slug: 'grounding-5-4-3-2-1',
		title: 'Grounding 5-4-3-2-1',
		description: 'Snabb ovning for att landa i kroppen nar stressen stiger.',
		pillarSlug: 'angest'
	},
	{
		slug: 'tankefallor-kartlaggning',
		title: 'Tankefallor: identifiera monster',
		description: 'Kartlagg vanliga tankefallor och valj nya responser.',
		pillarSlug: 'overtankande'
	},
	{
		slug: 'icke-valdsam-kommunikation',
		title: 'Icke-valdsam kommunikation',
		description: 'Mall for tydliga och respektfulla samtal i relationer.',
		pillarSlug: 'relationsproblem'
	},
	{
		slug: 'vardekartlaggning',
		title: 'Vardekartlaggning',
		description: 'Klargor vad som betyder mest och hur du vill leva.',
		pillarSlug: 'existentiell-oro'
	},
	{
		slug: '4-7-8-andning',
		title: '4-7-8 andning',
		description: 'En enkel andningsteknik for att varva ned nervsystemet.',
		pillarSlug: 'angest'
	},
	{
		slug: 'body-scan',
		title: 'Body scan meditation',
		description: 'Stegvis kroppsskanning for narvaro och avspanning.',
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'katastrofgranskning',
		title: 'Katastrofgranskning',
		description: 'Utvardera varsta scenariot och sannolikare utfall.',
		pillarSlug: 'angest'
	},
	{
		slug: 'tacksamhetsovning',
		title: 'Tacksamhetsovning for utmattning',
		description: 'Kort daglig rutin for att uppmarkksamma aterhamtning.',
		pillarSlug: 'depression'
	},
	{
		slug: 'dagens-avslut-reflektion',
		title: 'Avslutning av dagen - reflektionsmall',
		description: 'Kvallsmall for att slappa dagen och stanga mentalt.',
		pillarSlug: 'stress-utmattning'
	},
	{
		slug: 'trygghetscirkel-exponering',
		title: 'Trygghetscirkel: exponering i smagrupp',
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
