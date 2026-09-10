// Musikspår för Sovläge.
//
// Skild från evening-meditation-sources.ts med flit: meditationer är guidade
// röstspår, musik är musik. De delar uppspelningsadapter men inte innehåll,
// och ett musikspår har varken manus, inledning eller övningssida.

export type EveningMusicTrack = {
	id: string;
	title: string;
	/** Kort förtydligande i valet. Beskriver klangen, lovar ingen effekt. */
	summary: string;
	/** Publik URL till ljudfilen. Musik spelas alltid som fil, aldrig via TTS. */
	audioSrc: string;
};

/**
 * Sökvägarna följer samma två regler som de inspelade meditationerna:
 *
 * 1. Katalogen är gemen (`/audio/`). Både Vite och produktion är
 *    skiftlägeskänsliga, så versalt `/Audio/` skulle svara 404.
 * 2. encodeURI körs på hela sökvägen, så ett framtida filnamn med mellanslag
 *    eller å/ä/ö blir en giltig URL utan att någon behöver komma ihåg det.
 */
const MUSIC_DIRECTORY = '/audio/musik/';

function musicPath(fileName: string): string {
	return encodeURI(`${MUSIC_DIRECTORY}${fileName}`);
}

/**
 * Spåren i den ordning de visas i Sovläge.
 *
 * Inget spår loopar som standard. Spåren är några minuter långa medan
 * stunderna är 10, 20 eller 30 minuter, så musiken tar slut innan stunden gör
 * det – samma beteende som meditationerna: spåret tar slut, stunden fortsätter
 * i tystnad. Den som hellre vill ha musik hela stunden kan själv slå på
 * upprepning i Sovläge; valet sparas lokalt.
 */
export const EVENING_MUSIC_TRACKS: readonly EveningMusicTrack[] = [
	{
		id: 'stilla-sjo',
		title: 'Stilla sjö',
		summary: 'Varm och meditativ.',
		audioSrc: musicPath('stilla_sjo.mp3')
	},
	{
		id: 'mjuka-andetag',
		title: 'Mjuka andetag',
		summary: 'Luftig med mjuka klocktoner.',
		audioSrc: musicPath('mjuka_andetag.mp3')
	},
	{
		id: 'trygg-natt',
		title: 'Trygg natt',
		summary: 'Mörkare och ombonad.',
		audioSrc: musicPath('trygg_natt.mp3')
	}
];

export const DEFAULT_EVENING_MUSIC_ID = EVENING_MUSIC_TRACKS[0].id;

export function getEveningMusicTrack(id: string): EveningMusicTrack | null {
	return EVENING_MUSIC_TRACKS.find((track) => track.id === id) ?? null;
}

/** localStorage-nyckel för upprepningsvalet. Sparar bara valet, aldrig uppspelning. */
export const EVENING_MUSIC_LOOP_STORAGE_KEY = 'mittpsyke:sleep-music-loop';

/** Allt utom ett uttryckligt "on" betyder av, även trasiga eller gamla värden. */
export function parseEveningMusicLoop(raw: string | null): boolean {
	return raw === 'on';
}

export function serializeEveningMusicLoop(loop: boolean): string {
	return loop ? 'on' : 'off';
}

/** Läser valet i webbläsaren. Blockerad lagring eller SSR ger av. */
export function readEveningMusicLoop(): boolean {
	try {
		return parseEveningMusicLoop(localStorage.getItem(EVENING_MUSIC_LOOP_STORAGE_KEY));
	} catch {
		return false;
	}
}

/** Sparar valet. Blockerad lagring gör att valet bara gäller besöket. */
export function writeEveningMusicLoop(loop: boolean): void {
	try {
		localStorage.setItem(EVENING_MUSIC_LOOP_STORAGE_KEY, serializeEveningMusicLoop(loop));
	} catch {
		// Privat läge eller full lagring – inget att göra.
	}
}
