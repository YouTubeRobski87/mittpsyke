import { describe, expect, it } from 'vitest';
import { tools } from './data/seo-architecture';
import {
	DEFAULT_EVENING_MEDITATION_ID,
	EVENING_MEDITATION_IDS,
	getEveningMeditation,
	getEveningMeditationScript,
	getEveningMeditations
} from './evening-meditation-sources';

describe('Sovlägets meditationer', () => {
	it('återanvänder befintliga övningar i stället för nytt innehåll', () => {
		for (const id of EVENING_MEDITATION_IDS) {
			const tool = tools.find((candidate) => candidate.slug === id);
			expect(tool, `övningen ${id} finns inte under /ovningar`).toBeDefined();
			expect(tool?.steps?.length ?? 0).toBeGreaterThan(0);
		}
	});

	it('sätter den inspelade avslappningen först och som standardval', () => {
		// Den inspelade meditationen är en riktig röst rakt igenom och står
		// därför före textövningarna, som läses upp av talsyntes.
		expect(DEFAULT_EVENING_MEDITATION_ID).toBe('guidad-avslappning');
		expect(getEveningMeditations()[0]?.id).toBe('guidad-avslappning');
		expect(getEveningMeditation(DEFAULT_EVENING_MEDITATION_ID)).not.toBeNull();
	});

	it('behåller body scan som första textövning', () => {
		const spoken = getEveningMeditations().filter((meditation) => !meditation.audioSrc);
		expect(spoken[0]?.id).toBe('body-scan');
	});

	it('länkar tillbaka till hela övningen för den som hellre läser', () => {
		// Bara textövningarna finns i skriven form. Den inspelade meditationen
		// har ingen /ovningar-sida och därför medvetet ingen länk.
		for (const meditation of getEveningMeditations()) {
			if (meditation.audioSrc) {
				expect(meditation.href).toBeNull();
				continue;
			}
			expect(meditation.href).toBe(`/ovningar/${meditation.id}`);
		}
	});

	it('lägger inledningen först i manuset när övningen har en', () => {
		const bodyScan = getEveningMeditation('body-scan');
		expect(bodyScan).not.toBeNull();
		if (!bodyScan) return;

		const script = getEveningMeditationScript(bodyScan);
		expect(script[0]).toBe(bodyScan.intro);
		expect(script).toHaveLength(bodyScan.lines.length + 1);
		expect(script.every((line) => line.trim().length > 0)).toBe(true);
	});

	it('returnerar null för okänt id i stället för att falla tillbaka tyst', () => {
		expect(getEveningMeditation('finns-inte')).toBeNull();
		expect(getEveningMeditation(null)).toBeNull();
	});
});
