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
 * Spåret loopar inte.
 *
 * Det är ~3 min 42 s medan stunderna är 10, 20 eller 30 minuter, så musiken
 * tar slut innan stunden gör det. Det är samma beteende som meditationerna
 * redan har: spåret tar slut, stunden fortsätter i tystnad. En loop hade
 * spelat samma låt upp till åtta gånger om.
 */
export const EVENING_MUSIC_TRACK: EveningMusicTrack = {
	id: 'lugn-musik',
	title: 'Lugn musik',
	summary: 'Ett stilla spår att vila till.',
	audioSrc: encodeURI(MUSIC_TRACK_PATH)
};
