import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_EVENING_MUSIC_ID,
	EVENING_MUSIC_TRACKS,
	getEveningMusicTrack,
	parseEveningMusicLoop,
	serializeEveningMusicLoop
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
});

describe('upprepningsvalet för musiken i Sovläge', () => {
	it('är av som standard och för okända värden', () => {
		expect(parseEveningMusicLoop(null)).toBe(false);
		expect(parseEveningMusicLoop('')).toBe(false);
		expect(parseEveningMusicLoop('true')).toBe(false);
		expect(parseEveningMusicLoop('off')).toBe(false);
	});

	it('sparas och läses tillbaka oförändrat', () => {
		expect(parseEveningMusicLoop(serializeEveningMusicLoop(true))).toBe(true);
		expect(parseEveningMusicLoop(serializeEveningMusicLoop(false))).toBe(false);
	});
});
