// "Läs vidare" för de Soro-hämtade artiklarna under /blogg/[slug].
//
// Soro-innehållet saknar egna relaterade länkar, så en läsare som kommer från
// sök (oftast på mobil) fick tidigare scrolla genom hela artikeln utan en enda
// väg vidare till en guide eller övning. Här väljs tre lugna, ämnesnära länkar
// per artikel. Alla mål är lokala sidor i repot, så testerna kan verifiera att
// de finns; Soro-artiklar länkas inte, eftersom de kan försvinna utan att
// bygget märker det.

export type RelatedReadingLink = {
	title: string;
	url: string;
};

const MAX_LINKS = 3;

const LINKS = {
	sorgOchDepression: {
		title: 'Skillnaden mellan sorg och depression',
		url: '/guider/depression/sorg-och-depression'
	},
	ickeValdsamKommunikation: {
		title: 'Övning: Icke-våldsam kommunikation',
		url: '/ovningar/icke-valdsam-kommunikation'
	},
	kannerMigEnsam: {
		title: 'Känner mig ensam – när ensamheten gör ont',
		url: '/guider/ensamhet/kanner-mig-ensam'
	},
	tomhetskansla: {
		title: 'Tomhetskänsla – när inget riktigt känns',
		url: '/guider/ensamhet/tomhetskansla'
	},
	rattigheterSocialtjansten: {
		title: 'Dina rättigheter hos socialtjänsten',
		url: '/blogg/amne/relationer-och-samhalle/dina-rattigheter-hos-socialtjansten'
	},
	familjenIKris: {
		title: 'När familjen är i kris men du själv hamnar utanför',
		url: '/nar-familjen-ar-i-kris'
	},
	overvaldigad: {
		title: 'Känner mig överväldigad – när allt är för mycket',
		url: '/guider/stress/kanner-mig-overvaldigad'
	},
	stressadHelaTiden: {
		title: 'Stressad hela tiden – om kronisk stress',
		url: '/guider/stress/stressad-hela-tiden'
	},
	granserUtanSamvete: {
		title: 'Så sätter du gränser utan dåligt samvete',
		url: '/blogg/amne/oro-och-stress/satta-granser-utan-daligt-samvete'
	},
	granserOchSjalvkansla: {
		title: 'Att sätta gränser när självkänslan är låg',
		url: '/guider/sjalvkansla/gransen-och-sjalvkansla'
	},
	hjarnanILoopar: {
		title: 'Varför hjärnan fastnar i loopar',
		url: '/guider/overtankande/varfor-hjarnan-fastnar-i-loopar'
	},
	overtankaPaKvallen: {
		title: 'Sluta övertänka på kvällen',
		url: '/guider/overtankande/sluta-overtanka-pa-kvallen'
	},
	kanInteSlutaTanka: {
		title: 'Kan inte sluta tänka – när tankarna bara snurrar',
		url: '/guider/angest/kan-inte-sluta-tanka'
	},
	tankefallor: {
		title: 'Övning: Tankefällor – identifiera mönster',
		url: '/ovningar/tankefallor-kartlaggning'
	},
	dagligReflektion: {
		title: 'Övning: Daglig reflektionsmall',
		url: '/ovningar/daglig-reflektionsmall'
	},
	dagensAvslut: {
		title: 'Övning: Avslutning av dagen',
		url: '/ovningar/dagens-avslut-reflektion'
	},
	digitalDagbok: {
		title: 'Digital dagbok för ditt mående',
		url: '/digital-dagbok-for-maende'
	},
	orostankar: {
		title: 'Orostankar som snurrar',
		url: '/guider/angest/orostankar'
	},
	sjuFragorVidOro: {
		title: 'Övning: 7 frågor att ställa sig vid oro',
		url: '/ovningar/sju-fragor-vid-oro'
	},
	angestIKroppen: {
		title: 'Ångest i kroppen – vad som händer och vad som hjälper',
		url: '/guider/angest/angest-i-kroppen'
	},
	grounding: {
		title: 'Övning: Grounding 5-4-3-2-1',
		url: '/ovningar/grounding-5-4-3-2-1'
	},
	nedstamdhetOchRelationer: {
		title: 'Hur nedstämdhet påverkar relationer',
		url: '/guider/depression/nedstamdhet-och-relationer'
	},
	smaStegVidNedstamdhet: {
		title: 'Små steg när energin tryter',
		url: '/guider/depression/sma-steg-vid-nedstamdhet'
	},
	hogkanslig: {
		title: 'Är du högkänslig?',
		url: '/blogg/amne/oro-och-stress/ar-du-hogkanslig'
	},
	overstimulerad: {
		title: 'Överstimulerad – vad betyder det?',
		url: '/blogg/amne/oro-och-stress/varfor-blir-man-overstimulerad'
	},
	aterhamtningIntryck: {
		title: 'Återhämtning när hjärnan fått för många intryck',
		url: '/blogg/amne/oro-och-stress/aterhamtning-efter-manga-intryck'
	},
	mentalOverbelastning: {
		title: 'Tecken på mental överbelastning',
		url: '/guider/stress/tecken-pa-mental-overbelastning'
	},
	utmattadMentalt: {
		title: 'Utmattad mentalt – när hjärnan inte orkar mer',
		url: '/guider/stress/utmattad-mentalt'
	},
	aterhamtaMentalt: {
		title: 'Hur återhämtar man sig mentalt?',
		url: '/guider/stress/hur-aterhamtar-man-sig-mentalt'
	},
	kanInteVarvaNer: {
		title: 'Kan inte varva ner – stress som sitter kvar i kroppen',
		url: '/guider/stress/kan-inte-varva-ner'
	},
	bodyScan: {
		title: 'Övning: Body scan',
		url: '/ovningar/body-scan'
	},
	forstaStegBeroende: {
		title: 'Första steg när man vet att något inte är bra',
		url: '/guider/beroende/forsta-steg-nar-man-vet-att-nagot-inte-ar-bra'
	},
	viljaSluta: {
		title: 'Att vilja sluta och inte vilja samtidigt',
		url: '/guider/beroende/att-vilja-sluta-och-inte-vilja-samtidigt'
	},
	brukForAttStaUt: {
		title: 'När bruk blir ett sätt att stå ut',
		url: '/guider/beroende/nar-bruk-blir-ett-satt-att-sta-ut'
	},
	mansEnsamhet: {
		title: 'Mäns ensamhet – den tysta känslan',
		url: '/blogg/amne/relationer-och-samhalle/mans-ensamhet-den-tysta-kanslan-som-fa-vagar-prata-om'
	},
	manOchKvinnor: {
		title: 'Män och kvinnor i dagens samhälle – olika krav, gemensam press',
		url: '/blogg/amne/relationer-och-samhalle/man-och-kvinnor-i-dagens-samhalle-olika-krav-gemensam-press'
	}
} satisfies Record<string, RelatedReadingLink>;

// Handplockade länkar för de artiklar som får mest söktrafik.
const BY_SLUG: Record<string, RelatedReadingLink[]> = {
	'vad-sager-man-i-sorg': [LINKS.sorgOchDepression, LINKS.ickeValdsamKommunikation, LINKS.kannerMigEnsam],
	'nar-en-van-mar-daligt-vad-kan-du-saga': [
		LINKS.nedstamdhetOchRelationer,
		LINKS.ickeValdsamKommunikation,
		LINKS.kannerMigEnsam
	],
	'hjalp-med-bostad-av-socialen': [LINKS.rattigheterSocialtjansten, LINKS.familjenIKris, LINKS.overvaldigad],
	'skalig-levnadsniva-i-praktiken': [LINKS.rattigheterSocialtjansten, LINKS.familjenIKris, LINKS.stressadHelaTiden],
	'satta-granser': [LINKS.granserUtanSamvete, LINKS.granserOchSjalvkansla, LINKS.ickeValdsamKommunikation],
	'svart-att-saga-nej': [LINKS.granserUtanSamvete, LINKS.granserOchSjalvkansla, LINKS.ickeValdsamKommunikation],
	'overtanker-allt': [LINKS.hjarnanILoopar, LINKS.overtankaPaKvallen, LINKS.tankefallor],
	'dagbok-mot-angest': [LINKS.dagligReflektion, LINKS.orostankar, LINKS.sjuFragorVidOro],
	hogkanslig: [LINKS.hogkanslig, LINKS.overstimulerad, LINKS.aterhamtningIntryck],
	'depression-angest': [LINKS.smaStegVidNedstamdhet, LINKS.angestIKroppen, LINKS.grounding],
	'5-tecken-pa-mental-overbelastning': [
		LINKS.mentalOverbelastning,
		LINKS.utmattadMentalt,
		LINKS.aterhamtaMentalt
	]
};

// Övriga artiklar matchas på ord i slugen. Första träffen vinner, så de
// smalaste ämnena står först.
const BY_TOPIC: Array<{ pattern: RegExp; links: RelatedReadingLink[] }> = [
	{
		pattern: /missbruk|beroende/,
		links: [LINKS.forstaStegBeroende, LINKS.viljaSluta, LINKS.brukForAttStaUt]
	},
	{
		// "man"/"mans" som eget ord, så att t.ex. "maende" inte räknas.
		pattern: /(^|-)mans?(-|$)/,
		links: [LINKS.mansEnsamhet, LINKS.manOchKvinnor, LINKS.kannerMigEnsam]
	},
	{
		pattern: /ensam/,
		links: [LINKS.kannerMigEnsam, LINKS.tomhetskansla, LINKS.mansEnsamhet]
	},
	{
		pattern: /dagbok|skriv|journal|humor|maendelogg|reflektion|kansloverblick|kanslolagen|folja/,
		links: [LINKS.dagligReflektion, LINKS.dagensAvslut, LINKS.digitalDagbok]
	},
	{
		pattern: /tank|grubbl|snurrar|rorig|kaos/,
		links: [LINKS.hjarnanILoopar, LINKS.kanInteSlutaTanka, LINKS.tankefallor]
	},
	{
		pattern: /stress|varva|kvall|aterhamt|overbelastning/,
		links: [LINKS.kanInteVarvaNer, LINKS.aterhamtaMentalt, LINKS.bodyScan]
	},
	{
		pattern: /oro|angest/,
		links: [LINKS.orostankar, LINKS.angestIKroppen, LINKS.grounding]
	}
];

const DEFAULT_LINKS: RelatedReadingLink[] = [LINKS.orostankar, LINKS.overvaldigad, LINKS.grounding];

// Akutsidan ska bara peka mot hjälp nu, inte mot vidare läsning.
const WITHOUT_RELATED_READING = new Set(['vid-akut-kris-ring-nu']);

export function getSoroRelatedReading(slug: string): RelatedReadingLink[] {
	if (WITHOUT_RELATED_READING.has(slug)) return [];

	const links =
		BY_SLUG[slug] ?? BY_TOPIC.find(({ pattern }) => pattern.test(slug))?.links ?? DEFAULT_LINKS;

	return links.slice(0, MAX_LINKS);
}

// Alla länkmål, för testernas kontroll av att sidorna finns.
export const allSoroRelatedReadingLinks: RelatedReadingLink[] = Object.values(LINKS);
