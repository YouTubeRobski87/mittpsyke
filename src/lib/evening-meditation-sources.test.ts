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

	it('sätter body scan först och som standardval', () => {
		expect(DEFAULT_EVENING_MEDITATION_ID).toBe('body-scan');
		expect(getEveningMeditations()[0]?.id).toBe('body-scan');
		expect(getEveningMeditation(DEFAULT_EVENING_MEDITATION_ID)).not.toBeNull();
	});

	it('länkar tillbaka till hela övningen för den som hellre läser', () => {
		for (const meditation of getEveningMeditations()) {
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
