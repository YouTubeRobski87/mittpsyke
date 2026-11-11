// Ämne för en bloggartikel, härlett ur slugen (och för lokala artiklar ur
// samlingen). Används både för "Läs vidare" i Soro-artiklarna och för att
// anpassa nästa steg efter vad läsaren just läst om.

export type ArticleTopic =
	| 'beroende'
	| 'man'
	| 'ensamhet'
	| 'dagbok'
	| 'tankar'
	| 'stress'
	| 'oro'
	| 'sorg'
	| 'relation'
	| 'samhalle'
	| 'sjalvkansla'
	| 'depression'
	| 'allmant';

// Handplockade artiklar vars ämne inte framgår av ord i slugen.
const TOPIC_BY_SLUG: Record<string, ArticleTopic> = {
	'vad-sager-man-i-sorg': 'sorg',
	'nar-en-van-mar-daligt-vad-kan-du-saga': 'relation',
	'hjalp-med-bostad-av-socialen': 'samhalle',
	'skalig-levnadsniva-i-praktiken': 'samhalle',
	'satta-granser': 'sjalvkansla',
	'svart-att-saga-nej': 'sjalvkansla',
	'overtanker-allt': 'tankar',
	hogkanslig: 'stress',
	'depression-angest': 'depression',
	'5-tecken-pa-mental-overbelastning': 'stress'
};

// Första träffen vinner, så de smalaste ämnena står först.
const TOPIC_PATTERNS: Array<{ pattern: RegExp; topic: ArticleTopic }> = [
	{ pattern: /missbruk|beroende/, topic: 'beroende' },
	// "man" är oftast det generella pronomenet ("vad gör man när …"), så
	// bara "mans" och uttryckliga formuleringar om män räknas.
	{ pattern: /(^|-)mans(-|$)|^man-star-|-for-man(-|$)|syns-inte-man-/, topic: 'man' },
	{ pattern: /ensam/, topic: 'ensamhet' },
	{
		pattern: /dagbok|skriv|journal|humor|maendelogg|reflektion|kansloverblick|kanslolagen|folja/,
		topic: 'dagbok'
	},
	{ pattern: /tank|grubbl|snurrar|rorig|kaos/, topic: 'tankar' },
	{ pattern: /stress|varva|kvall|aterhamt|overbelastning|overstimuler|hogkans/, topic: 'stress' },
	{ pattern: /oro|angest|panik/, topic: 'oro' },
	{ pattern: /sjalvkansla|sjalvbild|sjalvkritik|granser|jamfor|tillracklig|inre-kritikern/, topic: 'sjalvkansla' },
	{ pattern: /depression|nedstamd/, topic: 'depression' }
];

// Lokala artiklar utan träff på slugen faller tillbaka på sin samling.
const TOPIC_BY_COLLECTION: Record<string, ArticleTopic> = {
	'oro-och-stress': 'oro',
	'sjalvkansla-och-sjalvbild': 'sjalvkansla',
	'dagbok-och-reflektion': 'dagbok'
};

export function getArticleTopic(slug: string, collection?: string): ArticleTopic {
	return (
		TOPIC_BY_SLUG[slug] ??
		TOPIC_PATTERNS.find(({ pattern }) => pattern.test(slug))?.topic ??
		(collection ? TOPIC_BY_COLLECTION[collection] : undefined) ??
		'allmant'
	);
}
