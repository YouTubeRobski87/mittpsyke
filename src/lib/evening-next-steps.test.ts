import { describe, expect, it } from 'vitest';
import { EVENING_THEMES, type EveningThemeId } from './evening-checkin';
import {
	EVENING_STAY_STEP,
	getEveningNextStepPrompt,
	getEveningNextSteps
} from './evening-next-steps';

const ALL_THEMES = EVENING_THEMES.map((theme) => theme.id);

describe('alternativen', () => {
	it.each(ALL_THEMES)('ger frivilliga steg för temat %s', (themeId) => {
		const steps = getEveningNextSteps(themeId);

		expect(steps.length).toBeGreaterThanOrEqual(2);
		expect(steps.map((step) => step.id)).toContain('write');
		expect(steps.map((step) => step.id)).toContain('stay');
	});

	it('har alltid ett neutralt alternativ sist', () => {
		for (const themeId of ALL_THEMES) {
			const steps = getEveningNextSteps(themeId);

			expect(steps.at(-1)).toEqual(EVENING_STAY_STEP);
			expect(steps.at(-1)?.href).toBeNull();
		}
	});

	it('markerar inget alternativ som rekommenderat', () => {
		for (const themeId of ALL_THEMES) {
			for (const step of getEveningNextSteps(themeId)) {
				expect(step).not.toHaveProperty('recommended');
				expect(step).not.toHaveProperty('primary');
				expect(step.label).not.toMatch(/rekommender|bör|borde|måste|viktigt att/i);
			}
		}
	});
});

describe('återanvänder befintliga funktioner', () => {
	it('pekar bara på routes som redan finns', () => {
		const allowed = [
			'/dagbok?action=new',
			'/ovningar/grounding-5-4-3-2-1',
			'/ovningar/4-7-8-andning',
			'/ovningar/sjalvmedkansla-ovning',
			'/ovningar/dagens-avslut-reflektion',
			'/ovningar/body-scan'
		];

		for (const themeId of ALL_THEMES) {
			for (const step of getEveningNextSteps(themeId)) {
				if (step.href === null) continue;
				expect(allowed, `${themeId} -> ${step.href}`).toContain(step.href);
			}
		}
	});

	it('skickar skrivvägen till dagbokens befintliga snabbinmatning', () => {
		const write = getEveningNextSteps('racing_thoughts').find((step) => step.id === 'write');

		expect(write?.href).toBe('/dagbok?action=new');
	});
});

describe('okända värden', () => {
	it.each([null, undefined, 'inte_ett_tema', '', 42])(
		'faller tillbaka på neutrala alternativ för %p',
		(value) => {
			const steps = getEveningNextSteps(value as EveningThemeId | null | undefined);

			expect(steps.map((step) => step.id)).toEqual(['write', 'stay']);
			expect(steps.at(-1)?.href).toBeNull();
		}
	);

	it('tolkar inte ett okänt värde i texten', () => {
		expect(getEveningNextStepPrompt('nonsens' as EveningThemeId)).toBe('Vad skulle kännas bäst nu?');
	});
});

describe('språket', () => {
	it('speglar användarens eget val utan att tolka det', () => {
		expect(getEveningNextStepPrompt('racing_thoughts')).toBe(
			'Du valde "tankarna snurrar". Vad skulle kännas bäst nu?'
		);
	});

	it('ställer alltid en fråga i stället för att ge en instruktion', () => {
		for (const themeId of [...ALL_THEMES, null]) {
			expect(getEveningNextStepPrompt(themeId)).toMatch(/\?$/);
		}
	});

	it('diagnostiserar aldrig och drar aldrig en kausal slutsats', () => {
		const forbidden =
			/därför|beror på|orsakar|eftersom du|du har (ångest|depression|utmattning)|du lider|betyder att du|du mår (dåligt|sämre) (på grund|för att)/i;

		for (const themeId of [...ALL_THEMES, null]) {
			const prompt = getEveningNextStepPrompt(themeId);
			expect(prompt, prompt).not.toMatch(forbidden);

			for (const step of getEveningNextSteps(themeId)) {
				expect(step.label, step.label).not.toMatch(forbidden);
			}
		}
	});

	it('lovar aldrig en effekt av att välja ett steg', () => {
		for (const themeId of ALL_THEMES) {
			for (const step of getEveningNextSteps(themeId)) {
				expect(step.label).not.toMatch(/hjälper|botar|lindrar|gör dig|blir bättre|löser/i);
			}
		}
	});
});

describe('det neutrala temat behandlas inte som ett problem', () => {
	it('erbjuder ingen övning för "det är ändå okej"', () => {
		const steps = getEveningNextSteps('feeling_okay');

		// Skriva eller stanna kvar - ingenting som antyder att kvällen borde
		// bli bättre än den redan är.
		expect(steps.map((step) => step.id)).toEqual(['write', 'stay']);
		expect(steps.some((step) => step.id === 'exercise')).toBe(false);
	});

	it('speglar valet utan att fråga vad som är jobbigt', () => {
		const prompt = getEveningNextStepPrompt('feeling_okay');

		expect(prompt).toContain('det är ändå okej');
		expect(prompt).not.toMatch(/jobbig|oroa|svår|bättre|problem|besvär/i);
	});

	it('rör inte övningarna för de teman som redan hade en', () => {
		for (const themeId of ['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other'] as const) {
			expect(
				getEveningNextSteps(themeId).some((step) => step.id === 'exercise'),
				themeId
			).toBe(true);
		}
	});
});
