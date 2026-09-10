import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	CALM_MUSIC_TRACKS,
	DEFAULT_CALM_MUSIC_PREFERENCES,
	clampVolume,
	describePlaybackTime,
	formatPlaybackTime,
	getNextTrackId,
	getPreviousTrackId,
	isLastTrack,
	parseCalmMusicPreferences
} from './calm-music';

const root = process.cwd();

describe('spårlistan för Lugn musik', () => {
	it('innehåller de tre spåren i rätt ordning med rätt sökvägar', () => {
		expect(CALM_MUSIC_TRACKS.map((track) => [track.title, track.src])).toEqual([
			['Stilla sjö', '/audio/musik/stilla_sjo.mp3'],
			['Mjuka andetag', '/audio/musik/mjuka_andetag.mp3'],
			['Trygg natt', '/audio/musik/trygg_natt.mp3']
		]);
	});

	it.each(CALM_MUSIC_TRACKS)('$title pekar på en riktig MP3 i static', (track) => {
		const filePath = join(root, 'static', track.src);
		expect(existsSync(filePath), `saknar ljudfil: ${filePath}`).toBe(true);
		const header = readFileSync(filePath).subarray(0, 3);
		// ID3-tagg eller direkt en MPEG-ram (0xFFEx/0xFFFx).
		const isId3 = header.toString('latin1') === 'ID3';
		const isFrameSync = header[0] === 0xff && (header[1] & 0xe0) === 0xe0;
		expect(isId3 || isFrameSync, `${track.src} ser inte ut som en MP3`).toBe(true);
	});

	it('har unika id:n och beskrivningar utan effektlöften', () => {
		const ids = new Set(CALM_MUSIC_TRACKS.map((track) => track.id));
		expect(ids.size).toBe(CALM_MUSIC_TRACKS.length);
		for (const track of CALM_MUSIC_TRACKS) {
			expect(track.summary).not.toMatch(/bot|läk|hjälper mot|minskar|behandl/i);
		}
	});
});

describe('byte av spår', () => {
	it('går framåt och bakåt med omslag', () => {
		expect(getNextTrackId('stilla-sjo')).toBe('mjuka-andetag');
		expect(getNextTrackId('trygg-natt')).toBe('stilla-sjo');
		expect(getPreviousTrackId('stilla-sjo')).toBe('trygg-natt');
		expect(getPreviousTrackId('mjuka-andetag')).toBe('stilla-sjo');
	});

	it('vet vilket spår som är sist', () => {
		expect(isLastTrack('trygg-natt')).toBe(true);
		expect(isLastTrack('stilla-sjo')).toBe(false);
	});
});

describe('tidsformat', () => {
	it('visar m:ss och streck för okänd längd', () => {
		expect(formatPlaybackTime(0)).toBe('0:00');
		expect(formatPlaybackTime(65.9)).toBe('1:05');
		expect(formatPlaybackTime(Number.NaN)).toBe('–:––');
		expect(formatPlaybackTime(Number.POSITIVE_INFINITY)).toBe('–:––');
	});

	it('beskriver tiden i ord för skärmläsare', () => {
		expect(describePlaybackTime(5)).toBe('5 sekunder');
		expect(describePlaybackTime(61)).toBe('1 minut 1 sekund');
		expect(describePlaybackTime(180)).toBe('3 minuter');
		expect(describePlaybackTime(Number.NaN)).toBe('okänd tid');
	});
});

describe('sparade inställningar', () => {
	it('faller tillbaka på standard för tomt eller trasigt innehåll', () => {
		expect(parseCalmMusicPreferences(null)).toEqual(DEFAULT_CALM_MUSIC_PREFERENCES);
		expect(parseCalmMusicPreferences('{inte json')).toEqual(DEFAULT_CALM_MUSIC_PREFERENCES);
		expect(parseCalmMusicPreferences('"text"')).toEqual(DEFAULT_CALM_MUSIC_PREFERENCES);
	});

	it('läser giltiga värden och begränsar volymen', () => {
		expect(
			parseCalmMusicPreferences(JSON.stringify({ trackId: 'trygg-natt', volume: 3, repeat: true }))
		).toEqual({ trackId: 'trygg-natt', volume: 1, repeat: true });
	});

	it('ignorerar okänt spår och sparar aldrig uppspelningsstatus', () => {
		const prefs = parseCalmMusicPreferences(
			JSON.stringify({ trackId: 'finns-inte', playing: true })
		);
		expect(prefs.trackId).toBe(DEFAULT_CALM_MUSIC_PREFERENCES.trackId);
		expect(Object.keys(prefs).sort()).toEqual(['repeat', 'trackId', 'volume']);
	});

	it('begränsar volym till 0–1', () => {
		expect(clampVolume(-1)).toBe(0);
		expect(clampVolume(0.4)).toBe(0.4);
		expect(clampVolume(Number.NaN)).toBe(DEFAULT_CALM_MUSIC_PREFERENCES.volume);
	});
});

describe('spelaren startar aldrig av sig själv', () => {
	const player = readFileSync(join(root, 'src/lib/calm-music-player.svelte.ts'), 'utf8');

	it('använder preload="metadata" och ingen autoplay', () => {
		expect(player).toContain("audio.preload = 'metadata'");
		expect(player).not.toMatch(/autoplay/i);
	});

	it('skapar exakt ett Audio-objekt', () => {
		expect(player.match(/new Audio\(/g)?.length).toBe(1);
	});

	it('anropar bara play() från play-metoden', () => {
		expect(player.match(/audio\.play\(\)/g)?.length).toBe(1);
		expect(player).toContain('audio.play().catch');
	});

	it('städar sina lyssnare', () => {
		expect(player).toContain('removeEventListener');
	});
});
