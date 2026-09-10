// Meditationsinnehåll för Sovläge.
//
// Ingenting nytt skrivs här. Övningarna finns redan under /ovningar och är
// samma texter som evening-next-steps.ts redan pekar på efter incheckningen –
// det här lagret plockar bara ut dem i en form som en playback-adapter kan
// läsa upp.
//
// Källan är alltså innehåll, inte uppspelning. Byter vi senare från TTS till
// inspelade filer är det den här modulen som får ett `audioSrc`-fält, medan
// panelen och tillståndslogiken lämnas orörda.

import { tools, type Tool } from '$lib/data/seo-architecture';

export type EveningMeditation = {
	id: string;
	title: string;
	/** Kort beskrivning i valet. Kommer från övningens egen description. */
	summary: string;
	/** Inledande stycke som läses upp först, om övningen har ett. */
	intro: string | null;
	/** Stegen som läses upp i ordning. Tom för inspelade meditationer. */
	lines: readonly string[];
	/** Länk till hela övningen. Null när meditationen bara finns som inspelning. */
	href: string | null;
	/**
	 * Publik URL till en färdiginspelad ljudfil. Är den satt spelas filen, och
	 * talsyntesen rörs aldrig för det spåret. Är den null läses `lines` upp av
	 * TTS som förut.
	 */
	audioSrc: string | null;
};

/**
 * Filnamnen står ordagrant som de ligger i static/audio/meditations/.
 *
 * Två saker om sökvägarna är avsiktliga och får inte "städas":
 *
 * 1. Katalogen är gemen: `/audio/`. Både Vites statiska server och produktion
 *    är skiftlägeskänsliga, så versalt `/Audio/` skulle svara 404.
 * 2. encodeURI körs på hela sökvägen eftersom filnamnen innehåller mellanslag,
 *    parenteser och å/ä/ö. Namnen är UTF-8 på disk, så procentkodningen blir
 *    densamma på alla plattformar.
 *
 * Ingen speltid skrivs in här. Längden läses ur filen vid visning, så den inte
 * kan bli fel om en fil byts ut – flera av filnamnen anger dessutom en annan
 * längd än filen faktiskt har.
 */
const recordedMeditation = (
	id: string,
	title: string,
	summary: string,
	fileName: string
): EveningMeditation => ({
	id,
	title,
	summary,
	intro: null,
	lines: [],
	href: null,
	audioSrc: encodeURI(`/audio/meditations/${fileName}`)
});

/**
 * De inspelade meditationerna, ordnade från kortast till längst så listan går
 * att skumma. De har varken manus eller /ovningar-sida – ljudfilen är hela
 * innehållet, och talsyntesen rörs aldrig för dem.
 */
const RECORDED_MEDITATIONS: readonly EveningMeditation[] = [
	recordedMeditation(
		'andrum',
		'Andrum',
		'En kort paus att hämta andan i.',
		'andrum_s.mp3'
	),
	recordedMeditation(
		'mindfulness-medkansla',
		'Mindfulness och medkänsla',
		'Närvaro med lite mer värme mot dig själv.',
		'Mindfulness_compassion_s.mp3'
	),
	recordedMeditation(
		'guidad-avslappning',
		'Guidad avslappning',
		'En inspelad svensk röst som följer dig hela vägen ned i vila.',
		'Guidad meditation för att slappna av på svenska 15 min (endast röst_ej musik) - Midsommarregn.mp3'
	),
	recordedMeditation(
		'sittande-meditation',
		'Sittande meditation',
		'Stilla sittande med andetaget som ankare.',
		'sittande_meditation_20_min_s.mp3'
	),
	recordedMeditation(
		'kroppsscanning',
		'Kroppsscanning',
		'Uppmärksamheten vandrar lugnt genom kroppen.',
		'kroppsscanning_s.mp3'
	),
	recordedMeditation(
		'kroppsscanning-lang',
		'Kroppsscanning, längre',
		'Samma vandring genom kroppen, i lugnare takt.',
		'kroppsscanning_37_min_s.mp3'
	),
	recordedMeditation(
		'sittande-meditation-lang',
		'Sittande meditation, längre',
		'En längre stund i stillhet.',
		'sittande_meditation_38_min_s.mp3'
	)
];

/**
 * Textövningarna. De har inget inspelat ljud utan läses upp av talsyntes, och
 * ligger därför efter de inspelade spåren i listan. Body scan står först som
 * längsta textövning, de två korta sist.
 */
export const EVENING_MEDITATION_IDS = [
	'body-scan',
	'4-7-8-andning',
	'grounding-5-4-3-2-1'
] as const;

/** Standardvalet är den kortaste inspelningen – lägsta tröskeln att börja i. */
export const DEFAULT_EVENING_MEDITATION_ID = RECORDED_MEDITATIONS[0].id;

/** Sant för meditationer som spelas som ljudfil i stället för att läsas upp. */
export function isRecordedMeditation(meditation: EveningMeditation): boolean {
	return meditation.audioSrc !== null;
}

/**
 * Ungefärlig speltid i ord.
 *
 * Längden mäts på filen själv vid uppspelning i stället för att skrivas in för
 * hand, så den aldrig kan bli fel om ljudfilen byts ut. Går den inte att läsa
 * returneras null, och då visas ingen längd alls hellre än en gissning.
 */
export function formatMeditationLength(seconds: number | null): string | null {
	if (seconds === null || !Number.isFinite(seconds) || seconds <= 0) return null;
	return `ca ${Math.round(seconds / 60)} min`;
}

function toMeditation(tool: Tool): EveningMeditation | null {
	// Steps är valfritt i Tool-typen. En övning utan steg har ingenting att
	// läsa upp, och då är det bättre att den inte erbjuds alls än att Sovläge
	// startar och är tyst.
	if (!tool.steps || tool.steps.length === 0) return null;

	return {
		id: tool.slug,
		title: tool.title,
		summary: tool.description,
		intro: tool.purpose ?? null,
		lines: tool.steps,
		href: `/ovningar/${tool.slug}`,
		audioSrc: null
	};
}

export function getEveningMeditations(): EveningMeditation[] {
	const spoken = EVENING_MEDITATION_IDS.map((id) => {
		const tool = tools.find((candidate) => candidate.slug === id);
		return tool ? toMeditation(tool) : null;
	}).filter((meditation): meditation is EveningMeditation => meditation !== null);

	return [...RECORDED_MEDITATIONS, ...spoken];
}

export function getEveningMeditation(id: string | null): EveningMeditation | null {
	if (!id) return null;
	return getEveningMeditations().find((meditation) => meditation.id === id) ?? null;
}

/**
 * Raderna som faktiskt spelas upp: inledningen först om den finns, sedan
 * stegen. Hålls skild från `lines` så att en framtida ljudfil kan ersätta hela
 * sekvensen utan att texten behöver ändras.
 */
export function getEveningMeditationScript(meditation: EveningMeditation): string[] {
	return meditation.intro ? [meditation.intro, ...meditation.lines] : [...meditation.lines];
}
