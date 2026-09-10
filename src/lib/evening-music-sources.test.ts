import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EVENING_MUSIC_TRACK } from './evening-music-sources';

describe('Musikspåret i Sovläge', () => {
	it('heter Lugn musik och spelas som ljudfil', () => {
		expect(EVENING_MUSIC_TRACK.title).toBe('Lugn musik');
		expect(EVENING_MUSIC_TRACK.audioSrc).toBeTruthy();
	});

	it('pekar på en fil som faktiskt finns och är en riktig MP3', () => {
		const filePath = join(process.cwd(), 'static', decodeURI(EVENING_MUSIC_TRACK.audioSrc));
		expect(existsSync(filePath), `saknar ljudfil: ${filePath}`).toBe(true);

		// Tidigare låg här en omdöpt MP4 med videospår. Testet fångar det.
		const header = readFileSync(filePath).subarray(0, 3).toString('latin1');
		expect(header, 'filen saknar ID3-huvud och är kanske inte en MP3').toBe('ID3');
	});

	it('använder gemener i sökvägen eftersom produktionen är skiftlägeskänslig', () => {
		expect(EVENING_MUSIC_TRACK.audioSrc.startsWith('/audio/musik/')).toBe(true);
		expect(EVENING_MUSIC_TRACK.audioSrc).not.toContain('/Audio/');
	});

	it('procentkodar mellanslag och ä så URL:en blir giltig', () => {
		expect(EVENING_MUSIC_TRACK.audioSrc).not.toContain(' ');
		expect(EVENING_MUSIC_TRACK.audioSrc).toContain('%20');
		// ä = C3 A4 i UTF-8.
		expect(EVENING_MUSIC_TRACK.audioSrc).toContain('%C3%A4');
	});

	it('ligger i musikmappen och inte bland de guidade röstspåren', () => {
		expect(EVENING_MUSIC_TRACK.audioSrc).not.toContain('/meditations/');
	});
});
