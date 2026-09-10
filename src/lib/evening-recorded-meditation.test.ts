import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	DEFAULT_EVENING_MEDITATION_ID,
	formatMeditationLength,
	getEveningMeditation,
	getEveningMeditations,
	isRecordedMeditation
} from './evening-meditation-sources';

const recorded = getEveningMeditations().filter(isRecordedMeditation);

describe('De inspelade meditationerna', () => {
	it('finns som egna val med begripliga namn', () => {
		expect(recorded.map((meditation) => meditation.id)).toEqual([
			'andrum',
			'mindfulness-medkansla',
			'guidad-avslappning',
			'sittande-meditation',
			'kroppsscanning',
			'kroppsscanning-lang',
			'sittande-meditation-lang'
		]);

		for (const meditation of recorded) {
			expect(meditation.title.length, `${meditation.id} saknar titel`).toBeGreaterThan(0);
			expect(meditation.summary.length, `${meditation.id} saknar beskrivning`).toBeGreaterThan(0);
		}
	});

	it('standardvalet är ett av dem', () => {
		const fallback = getEveningMeditation(DEFAULT_EVENING_MEDITATION_ID);
		expect(fallback).not.toBeNull();
		expect(fallback && isRecordedMeditation(fallback)).toBe(true);
	});

	// Kör per spår, så ett saknat eller omdöpt filnamn pekas ut direkt.
	it.each(recorded.map((meditation) => [meditation.id, meditation] as const))(
		'%s pekar på en riktig MP3 som finns på disk',
		(id, meditation) => {
			expect(meditation.audioSrc).toBeTruthy();
			if (!meditation.audioSrc) return;

			// URL:en är procentkodad; filsökvägen är den avkodade formen.
			const filePath = join(process.cwd(), 'static', decodeURI(meditation.audioSrc));
			expect(existsSync(filePath), `saknar ljudfil: ${filePath}`).toBe(true);

			// Fångar en omdöpt container - musikmappen har haft en MP4 med
			// videospår som låg under .mp3-namn.
			const header = readFileSync(filePath).subarray(0, 3).toString('latin1');
			expect(header, `${id} saknar ID3-huvud och är kanske inte en MP3`).toBe('ID3');
		}
	);

	it('använder gemener och procentkodning i alla sökvägar', () => {
		for (const meditation of recorded) {
			expect(meditation.audioSrc?.startsWith('/audio/meditations/'), meditation.id).toBe(true);
			// Versalt /Audio/ svarar 404 både i Vite och i produktion.
			expect(meditation.audioSrc, meditation.id).not.toContain('/Audio/');
			expect(meditation.audioSrc, meditation.id).not.toContain(' ');
		}
	});

	it('spelas som ljud och har därför varken manus eller övningssida', () => {
		for (const meditation of recorded) {
			expect(meditation.lines, meditation.id).toHaveLength(0);
			expect(meditation.href, meditation.id).toBeNull();
		}
	});

	it('skriver aldrig in speltiden för hand', () => {
		// Flera filnamn anger en annan längd än filen faktiskt har, så längden
		// måste läsas ur filen vid visning i stället.
		for (const meditation of recorded) {
			expect(meditation.summary, meditation.id).not.toMatch(/\d+\s*min/);
		}
	});
});

describe('Textövningarna påverkas inte', () => {
	it('fortsätter använda TTS och har varken ljudfil eller tomt manus', () => {
		const spoken = getEveningMeditations().filter((option) => !isRecordedMeditation(option));

		expect(spoken.map((option) => option.id)).toEqual([
			'body-scan',
			'4-7-8-andning',
			'grounding-5-4-3-2-1'
		]);

		for (const option of spoken) {
			expect(option.audioSrc, `${option.id} ska inte ha ljudfil`).toBeNull();
			expect(option.lines.length, `${option.id} saknar manus`).toBeGreaterThan(0);
			expect(option.href).toBe(`/ovningar/${option.id}`);
		}
	});
});

describe('Längdvisning', () => {
	it('avrundar till närmaste minut', () => {
		expect(formatMeditationLength(947)).toBe('ca 16 min');
		expect(formatMeditationLength(316)).toBe('ca 5 min');
		expect(formatMeditationLength(2282)).toBe('ca 38 min');
	});

	it('visar hellre ingen längd än en gissning när filen inte kan läsas', () => {
		expect(formatMeditationLength(null)).toBeNull();
		expect(formatMeditationLength(Number.NaN)).toBeNull();
		expect(formatMeditationLength(Number.POSITIVE_INFINITY)).toBeNull();
		expect(formatMeditationLength(0)).toBeNull();
	});
});
