export type LandingInternalLink = {
	href: string;
	label: string;
};

export type SupportLandingPageContent = {
	path: string;
	title: string;
	description: string;
	heroTitle: string;
	heroText: string;
	heroCtaLabel: string;
	heroCtaHref: string;
	infoTitle: string;
	infoText: string;
	symptoms: string[];
	supportTitle: string;
	supportItems: string[];
	ctaTitle: string;
	ctaText: string;
	ctaButtonLabel: string;
	ctaButtonHref: string;
	internalLinks: LandingInternalLink[];
	schemaConditionName: string;
};

const sharedInternalLinks: LandingInternalLink[] = [
	{ href: '/depression', label: 'Depression' },
	{ href: '/panikangest', label: 'Panikangest' },
	{ href: '/prata-med-nagon', label: 'Prata med nagon' }
];

export const supportLandingPages: Record<string, SupportLandingPageContent> = {
	angest: {
		path: '/angest',
		title: '\u00c5ngest - prata med n\u00e5gon anonymt | MittPsyke',
		description:
			'K\u00e4nner du \u00e5ngest? P\u00e5 MittPsyke kan du prata anonymt, skriva dagbok och f\u00e5 hj\u00e4lp att reda ut tankar i lugn och ro.',
		heroTitle: 'Kanns allt lite for mycket just nu?',
		heroText:
			'Angest kan kannas overv\u00e4ldigande. Pa MittPsyke kan du prata anonymt, skriva ner dina tankar och fa hjalp att reda ut kanslor i din egen takt.',
		heroCtaLabel: 'Prata med MittPsyke',
		heroCtaHref: '/chat/a',
		infoTitle: 'Vad ar angest?',
		infoText:
			'Angest ar en naturlig stressreaktion som ibland blir sa stark att den paverkar vardagen. Vanliga tecken kan vara:',
		symptoms: ['oro', 'hjartklappning', 'tankar som snurrar', 'svarighet att slappna av'],
		supportTitle: 'Saker som kan hjalpa vid angest',
		supportItems: [
			'andas lugnt och langsamt',
			'skriv ner vad du kanner',
			'prata med nagon',
			'ta en kort paus fran stress'
		],
		ctaTitle: 'Du behover inte bara allt sjalv',
		ctaText: 'Pa MittPsyke kan du prata anonymt och fa stod direkt.',
		ctaButtonLabel: 'Starta ett samtal',
		ctaButtonHref: '/chat/a',
		internalLinks: sharedInternalLinks,
		schemaConditionName: '\u00c5ngest'
	},
	depression: {
		path: '/depression',
		title: 'Depression - prata med nagon anonymt | MittPsyke',
		description:
			'Kanner du dig nedstamd eller tom? Pa MittPsyke kan du prata anonymt och fa varsamt stod i din egen takt.',
		heroTitle: 'Nar allt kanns tungt kan du borja i det lilla',
		heroText:
			'Depression kan gora att energi och hopp minskar. Har kan du prata anonymt, samla tankar och ta sma steg i lugn och ro.',
		heroCtaLabel: 'Prata med MittPsyke',
		heroCtaHref: '/chat/b',
		infoTitle: 'Vad ar depression?',
		infoText:
			'Depression handlar inte om svaghet. Det ar ett tillstand som kan paverka bade kropp, kanslor och tankar. Vanliga tecken kan vara:',
		symptoms: ['nedstamdhet', 'minskad energi', 'svart att kanna gladje', 'svarighet att fokusera'],
		supportTitle: 'Saker som kan hjalpa vid depression',
		supportItems: [
			'satt lag ribba for dagen',
			'be nagon om praktiskt stod',
			'skriv kort om hur du mar',
			'forsok halla en enkel dygnsrytm'
		],
		ctaTitle: 'Du far ta det i din takt',
		ctaText: 'Ett lugnt samtal kan vara ett forsta steg nar allt kanns tungt.',
		ctaButtonLabel: 'Starta ett samtal',
		ctaButtonHref: '/chat/b',
		internalLinks: sharedInternalLinks,
		schemaConditionName: 'Depression'
	},
	trauma: {
		path: '/trauma',
		title: 'Trauma - tryggt och anonymt samtalsstod | MittPsyke',
		description:
			'Har du varit med om nagot svart? Pa MittPsyke kan du prata anonymt och fa ett lugnt stod for tankar och kanslor.',
		heroTitle: 'Du far kanna dig fram i din egen takt',
		heroText:
			'Trauma kan paverka trygghet, somn och relationer. Har kan du prata anonymt utan press och fa stod nar minnen eller oro tar plats.',
		heroCtaLabel: 'Prata med MittPsyke',
		heroCtaHref: '/chat/e',
		infoTitle: 'Vad ar trauma?',
		infoText:
			'Trauma kan uppsta efter handelser som kanns hotfulla eller overvaldligande. Vanliga tecken kan vara:',
		symptoms: ['inre oro', 'stark vaksamhet', 'svarighet att slappna av', 'paminnelser som vacker obehag'],
		supportTitle: 'Saker som kan hjalpa vid trauma',
		supportItems: [
			'skapa en lugn plats omkring dig',
			'landa i kroppen med langsam andning',
			'skriv ner det som kommer upp',
			'prata med nagon du litar pa'
		],
		ctaTitle: 'Trygghet kan byggas steg for steg',
		ctaText: 'Du behover inte beratta allt pa en gang. Ett varsamt samtal kan borja har.',
		ctaButtonLabel: 'Starta ett samtal',
		ctaButtonHref: '/chat/e',
		internalLinks: sharedInternalLinks,
		schemaConditionName: 'Trauma och posttraumatisk stress'
	},
	'prata-med-nagon': {
		path: '/prata-med-nagon',
		title: 'Prata med nagon anonymt online | MittPsyke',
		description:
			'Behov av att prata med nagon? MittPsyke erbjuder anonymt samtalsstod dar du kan skriva av dig i lugn och ro.',
		heroTitle: 'Ibland behovs bara nagon som lyssnar',
		heroText:
			'Du kan skriva anonymt om det som tynger just nu. Samtalet far vara enkelt, lugnt och i din takt.',
		heroCtaLabel: 'Prata med MittPsyke',
		heroCtaHref: '/chat/a',
		infoTitle: 'Varfor prata med nagon?',
		infoText:
			'Att satta ord pa det som paverkar dig kan minska trycket och skapa mer klarhet. Vanliga skal kan vara:',
		symptoms: ['oro i kroppen', 'tankar som fastnar', 'kansla av ensamhet', 'svart att sortera kanslor'],
		supportTitle: 'Saker som kan hjalpa nar du vill prata',
		supportItems: [
			'borja med en enda mening',
			'beskriv hur det kanns just nu',
			'var vanlig mot dig sjalv',
			'ta en paus om du behover'
		],
		ctaTitle: 'Du far skriva precis som det ar',
		ctaText: 'MittPsyke finns har nar du vill prata anonymt och utan press.',
		ctaButtonLabel: 'Starta ett samtal',
		ctaButtonHref: '/chat/a',
		internalLinks: sharedInternalLinks,
		schemaConditionName: 'Psykisk ohalsa'
	},
	panikangest: {
		path: '/panikangest',
		title: 'Panikangest - fa lugnt stod direkt | MittPsyke',
		description:
			'Vid panikangest kan allt komma snabbt. Pa MittPsyke kan du prata anonymt och fa lugna steg for att landa.',
		heroTitle: 'Nar paniken kommer ar du inte ensam',
		heroText:
			'Panikangest kan kanslas intensivt och skrämmande. Har kan du fa ett lugnt samtal och praktiskt stod for att hitta fotfaste.',
		heroCtaLabel: 'Prata med MittPsyke',
		heroCtaHref: '/chat/a',
		infoTitle: 'Vad ar panikangest?',
		infoText:
			'Panikangest ar en stark angestreaktion som ofta kommer snabbt. Vanliga tecken kan vara:',
		symptoms: ['hjartklappning', 'yrsel eller obehag i kroppen', 'kansla av att tappa kontroll', 'stark radsla'],
		supportTitle: 'Saker som kan hjalpa vid panikangest',
		supportItems: [
			'sakta ner andningen',
			'fokusera pa en sak i taget',
			'satt ord pa vad som hander i kroppen',
			'paaminn dig att reaktionen gar over'
		],
		ctaTitle: 'Du kan fa stod i stunden',
		ctaText: 'Skriv anonymt och fa lugn vagledning nar det blir for mycket.',
		ctaButtonLabel: 'Starta ett samtal',
		ctaButtonHref: '/chat/a',
		internalLinks: sharedInternalLinks,
		schemaConditionName: 'Panikangest'
	},
	'psykisk-ohalsa': {
		path: '/psykisk-ohalsa',
		title: 'Psykisk ohalsa - stod och samtal online | MittPsyke',
		description:
			'Behov av stod vid psykisk ohalsa? Pa MittPsyke kan du prata anonymt, fa struktur och hitta nasta steg i lugn och ro.',
		heroTitle: 'Det ar okej att behover stod',
		heroText:
			'Psykisk ohalsa kan se olika ut. Har finns ett lugnt digitalt rum dar du kan skriva anonymt och reda ut tankar i din egen takt.',
		heroCtaLabel: 'Prata med MittPsyke',
		heroCtaHref: '/chat/a',
		infoTitle: 'Vad menas med psykisk ohalsa?',
		infoText:
			'Psykisk ohalsa ar ett samlingsbegrepp for besvar som paverkar hur du mar och fungerar i vardagen. Vanliga tecken kan vara:',
		symptoms: ['langvarig stress', 'oro eller nedstamdhet', 'svarighet att sova', 'kansla av att inte orka'],
		supportTitle: 'Saker som kan hjalpa vid psykisk ohalsa',
		supportItems: [
			'forsok skapa en lugn vardagsrutin',
			'be om stod i tid',
			'skriv ner tankar och behov',
			'ta sma aterhamtande pauser'
		],
		ctaTitle: 'Du maste inte hantera allt ensam',
		ctaText: 'Pa MittPsyke kan du prata anonymt och fa stod direkt nar du behover det.',
		ctaButtonLabel: 'Starta ett samtal',
		ctaButtonHref: '/chat/a',
		internalLinks: sharedInternalLinks,
		schemaConditionName: 'Psykisk ohalsa'
	}
};
