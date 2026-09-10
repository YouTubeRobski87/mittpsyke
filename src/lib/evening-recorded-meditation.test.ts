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

const RECORDED_ID = 'guidad-avslappning';

describe('Den inspelade meditationen', () => {
	const recorded = getEveningMeditation(RECORDED_ID);

	it('finns som ett eget val med rätt visningsnamn', () => {
		expect(recorded).not.toBeNull();
		expect(recorded?.title).toBe('Guidad avslappning');
		expect(getEveningMeditations()[0]?.id).toBe(RECORDED_ID);
		expect(DEFAULT_EVENING_MEDITATION_ID).toBe(RECORDED_ID);
	});

	it('pekar på en ljudfil som faktiskt finns på disk', () => {
		expect(recorded?.audioSrc).toBeTruthy();
		if (!recorded?.audioSrc) return;

		// URL:en är procentkodad; filsökvägen är den avkodade formen.
		const filePath = join(process.cwd(), 'static', decodeURI(recorded.audioSrc));
		expect(existsSync(filePath), `saknar ljudfil: ${filePath}`).toBe(true);

		// Ljudfilen måste vara en riktig MP3, inte en omdöpt container.
		const header = readFileSync(filePath).subarray(0, 3).toString('latin1');
		expect(header, 'filen saknar ID3-huvud och är kanske inte en MP3').toBe('ID3');
	});

	it('använder gemener i sökvägen eftersom produktionen är skiftlägeskänslig', () => {
		expect(recorded?.audioSrc?.startsWith('/audio/meditations/')).toBe(true);
		// Versalt /Audio/ svarar 404 både i Vite och i produktion.
		expect(recorded?.audioSrc).not.toContain('/Audio/');
	});

	it('procentkodar mellanslag och å/ö så URL:en blir giltig', () => {
		expect(recorded?.audioSrc).not.toContain(' ');
		expect(recorded?.audioSrc).toContain('%20');
		// ö = C3 B6 i UTF-8, å = C3 A5.
		expect(recorded?.audioSrc).toContain('%C3%B6');
		expect(recorded?.audioSrc).toContain('%C3%A5');
	});

	it('spelas som ljud och har därför inget manus att läsa upp', () => {
		expect(recorded && isRecordedMeditation(recorded)).toBe(true);
		expect(recorded?.lines).toHaveLength(0);
		// Den finns inte i skriven form, så den har ingen /ovningar-sida.
		expect(recorded?.href).toBeNull();
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
		expect(formatMeditationLength(600)).toBe('ca 10 min');
	});

	it('visar hellre ingen längd än en gissning när filen inte kan läsas', () => {
		expect(formatMeditationLength(null)).toBeNull();
		expect(formatMeditationLength(Number.NaN)).toBeNull();
		expect(formatMeditationLength(Number.POSITIVE_INFINITY)).toBeNull();
		expect(formatMeditationLength(0)).toBeNull();
	});
});
