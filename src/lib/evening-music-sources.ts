// Musikspår för Sovläge.
//
// Skild från evening-meditation-sources.ts med flit: meditationer är guidade
// röstspår, musik är musik. De delar uppspelningsadapter men inte innehåll,
// och ett musikspår har varken manus, inledning eller övningssida.

export type EveningMusicTrack = {
	id: string;
	title: string;
	/** Kort förtydligande i valet. Beskriver, lovar ingen effekt. */
	summary: string;
	/** Publik URL till ljudfilen. Musik spelas alltid som fil, aldrig via TTS. */
	audioSrc: string;
};

/**
 * Sökvägen följer samma två regler som den inspelade meditationen:
 *
 * 1. Katalogen är gemen (`/audio/`). Både Vite och produktion är
 *    skiftlägeskänsliga, så versalt `/Audio/` skulle svara 404.
 * 2. encodeURI körs på hela sökvägen eftersom filnamnet innehåller mellanslag
 *    och ä. Filnamnet är UTF-8 på disk, så kodningen blir densamma överallt.
 */
const MUSIC_TRACK_PATH =
	'/audio/musik/Kvar i mitt huvud - Den där Robban - Den där Robban du vet.mp3';

/**
 * Spåret loopar inte som standard.
 *
 * Det är ~3 min 42 s medan stunderna är 10, 20 eller 30 minuter, så musiken
 * tar slut innan stunden gör det – samma beteende som meditationerna: spåret
 * tar slut, stunden fortsätter i tystnad. Den som hellre vill ha musik hela
 * stunden kan själv slå på upprepning i Sovläge; valet sparas lokalt.
 */
export const EVENING_MUSIC_TRACK: EveningMusicTrack = {
	id: 'lugn-musik',
	title: 'Lugn musik',
	summary: 'Ett stilla spår att vila till.',
	audioSrc: encodeURI(MUSIC_TRACK_PATH)
};

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
