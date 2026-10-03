import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_EVENING_MUSIC_ID,
	EVENING_MUSIC_CONTINUATIONS,
	EVENING_MUSIC_TRACKS,
	getEveningMusicTrack,
	getNextEveningMusicTrack,
	parseEveningMusicContinuation
} from './evening-music-sources';

describe('Musikspåren i Sovläge', () => {
	it('erbjuder Stilla sjö, Mjuka andetag, Trygg natt och Kvar i mitt huvud', () => {
		expect(EVENING_MUSIC_TRACKS.map((track) => track.title)).toEqual([
			'Stilla sjö',
			'Mjuka andetag',
			'Trygg natt',
			'Kvar i mitt huvud'
		]);
		expect(EVENING_MUSIC_TRACKS.slice(0, 3).map((track) => track.audioSrc)).toEqual([
			'/audio/musik/stilla_sjo.mp3',
			'/audio/musik/mjuka_andetag.mp3',
			'/audio/musik/trygg_natt.mp3'
		]);
	});

	it('har neutrala beskrivningar som inte lovar någon effekt', () => {
		expect(getEveningMusicTrack('stilla-sjo')?.summary).toBe('Varm och meditativ.');
		expect(getEveningMusicTrack('mjuka-andetag')?.summary).toBe('Luftig med mjuka klocktoner.');
		expect(getEveningMusicTrack('trygg-natt')?.summary).toBe('Mörkare och ombonad.');
		for (const track of EVENING_MUSIC_TRACKS) {
			expect(track.summary).not.toMatch(/somna|sömn|bot|läk|hjälper mot|minskar|behandl/i);
		}
	});

	it('har unika id:n och ett standardval som finns i listan', () => {
		const ids = EVENING_MUSIC_TRACKS.map((track) => track.id);
		expect(new Set(ids).size).toBe(ids.length);
		expect(getEveningMusicTrack(DEFAULT_EVENING_MUSIC_ID)).not.toBeNull();
		expect(getEveningMusicTrack('finns-inte')).toBeNull();
	});

	it.each(EVENING_MUSIC_TRACKS)('$title pekar på en fil som finns och är en riktig MP3', (track) => {
		const filePath = join(process.cwd(), 'static', decodeURI(track.audioSrc));
		expect(existsSync(filePath), `saknar ljudfil: ${filePath}`).toBe(true);

		// Tidigare låg här en omdöpt MP4 med videospår. Testet fångar det.
		const header = readFileSync(filePath).subarray(0, 3);
		const isId3 = header.toString('latin1') === 'ID3';
		const isFrameSync = header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
		expect(isId3 || isFrameSync, `${track.audioSrc} ser inte ut som en MP3`).toBe(true);
	});

	it('använder gemener i sökvägen eftersom produktionen är skiftlägeskänslig', () => {
		for (const track of EVENING_MUSIC_TRACKS) {
			expect(track.audioSrc.startsWith('/audio/musik/')).toBe(true);
			expect(track.audioSrc).not.toContain('/Audio/');
		}
	});

	it('visar Kvar i mitt huvud under sitt riktiga namn, inte som källans namn', () => {
		// Spåret hette tidigare "Lugn musik", precis som själva källan i första
		// steget, så det gick inte att se vilken låt det var.
		expect(getEveningMusicTrack('lugn-musik')).toBeNull();
		expect(EVENING_MUSIC_TRACKS.map((track) => track.title)).not.toContain('Lugn musik');
		expect(getEveningMusicTrack('kvar-i-mitt-huvud')?.title).toBe('Kvar i mitt huvud');
	});

	it('procentkodar mellanslag och ä i Kvar i mitt huvud så URL:en blir giltig', () => {
		const src = getEveningMusicTrack('kvar-i-mitt-huvud')?.audioSrc ?? '';
		expect(decodeURI(src)).toBe(
			'/audio/musik/Kvar i mitt huvud - Den där Robban - Den där Robban du vet.mp3'
		);
		expect(src).toContain('%20');
		// ä = C3 A4 i UTF-8.
		expect(src).toContain('%C3%A4');
	});

	it('ger giltiga URL:er utan mellanslag', () => {
		for (const track of EVENING_MUSIC_TRACKS) {
			expect(track.audioSrc).not.toContain(' ');
		}
	});

	it('ligger i musikmappen och inte bland de guidade röstspåren', () => {
		for (const track of EVENING_MUSIC_TRACKS) {
			expect(track.audioSrc).not.toContain('/meditations/');
		}
	});

	it('återanvänder spårens ordning när nästa låt ska starta', () => {
		expect(getNextEveningMusicTrack('stilla-sjo')?.id).toBe('mjuka-andetag');
		expect(getNextEveningMusicTrack('kvar-i-mitt-huvud')?.id).toBe('stilla-sjo');
		expect(getNextEveningMusicTrack('finns-inte')).toBeNull();
	});
});

describe('fortsättningsvalet för musiken i Sovläge', () => {
	it('erbjuder exakt de tre användarnära valen', () => {
		expect(EVENING_MUSIC_CONTINUATIONS.map((option) => option.label)).toEqual([
			'Upprepa låten',
			'Spela nästa automatiskt',
			'Stäng av efter den här låten'
		]);
	});

	it('stänger av efter låten som standard och migrerar det gamla upprepningsvalet', () => {
		expect(parseEveningMusicContinuation(null)).toBe('stop');
		expect(parseEveningMusicContinuation('')).toBe('stop');
		expect(parseEveningMusicContinuation('off')).toBe('stop');
		expect(parseEveningMusicContinuation('on')).toBe('repeat');
		expect(parseEveningMusicContinuation('repeat')).toBe('repeat');
		expect(parseEveningMusicContinuation('next')).toBe('next');
	});
});
