import { describe, expect, it } from 'vitest';
import {
	EVENING_CALM_PARKING_BUCKETS,
	EVENING_CHECKIN_FLOW_VERSION,
	EVENING_PARKING_BUCKETS,
	EVENING_THEMES,
	MAX_EVENING_THOUGHT_LENGTH,
	canAdvanceEveningFlow,
	getEveningParkingBuckets,
	getEveningParkingPrompt,
	validateEveningCheckinInput
} from './evening-checkin';

const validInput = {
	themeId: 'racing_thoughts',
	thought: 'Jag tänker mycket på imorgon.',
	parkingBucket: 'tomorrow',
	flowVersion: EVENING_CHECKIN_FLOW_VERSION
};

describe('Kvällslugns datakontrakt', () => {
	it('har de avsedda, kontrollerade tema- och parkeringsvärdena', () => {
		expect(EVENING_THEMES.map((theme) => theme.id)).toEqual([
			'racing_thoughts',
			'body_anxiety',
			'loneliness',
			'tomorrow',
			'feeling_okay',
			'other'
		]);
		expect(EVENING_PARKING_BUCKETS.map((bucket) => bucket.id)).toEqual([
			'tomorrow',
			'small_step',
			'not_tonight'
		]);
	});

	it('godkänner ett tema, frivillig tanke och ett parkeringsval', () => {
		expect(validateEveningCheckinInput(validInput)).toEqual({ ok: true, data: validInput });
	});

	it('normaliserar tom frivillig tanke till null', () => {
		const result = validateEveningCheckinInput({ ...validInput, thought: '   ' });
		expect(result).toEqual({ ok: true, data: { ...validInput, thought: null } });
	});

	it('avvisar okända enumvärden och fel flödesversion', () => {
		expect(validateEveningCheckinInput({ ...validInput, themeId: 'stress' }).ok).toBe(false);
		expect(validateEveningCheckinInput({ ...validInput, parkingBucket: 'solve_all' }).ok).toBe(false);
		expect(validateEveningCheckinInput({ ...validInput, flowVersion: 'v0' }).ok).toBe(false);
	});

	it('avvisar icke-text och fritext över längdgränsen', () => {
		expect(validateEveningCheckinInput({ ...validInput, thought: ['inte text'] }).ok).toBe(false);
		expect(
			validateEveningCheckinInput({ ...validInput, thought: 'a'.repeat(MAX_EVENING_THOUGHT_LENGTH + 1) }).ok
		).toBe(false);
	});

	it('håller flödet till en fråga i taget och gör fritexten frivillig', () => {
		const empty = { themeId: null, parkingBucket: null };
		expect(canAdvanceEveningFlow(1, empty)).toBe(false);
		expect(canAdvanceEveningFlow(1, { ...empty, themeId: 'other' })).toBe(true);
		expect(canAdvanceEveningFlow(2, empty)).toBe(true);
		expect(canAdvanceEveningFlow(3, empty)).toBe(false);
		expect(canAdvanceEveningFlow(3, { ...empty, parkingBucket: 'not_tonight' })).toBe(true);
		expect(canAdvanceEveningFlow(4, { themeId: 'other', parkingBucket: 'not_tonight' })).toBe(false);
	});
});

/* Kvällsstugan ska rymma en helt okej kväll, inte bara en svår. Testerna nedan
   skyddar både att valet finns och att det inte behandlas som ett problem. */
describe('Det neutrala kvällsvalet', () => {
	it('erbjuder sex alternativ med det neutrala näst sist', () => {
		expect(EVENING_THEMES).toHaveLength(6);
		expect(EVENING_THEMES.at(-2)?.id).toBe('feeling_okay');
		expect(EVENING_THEMES.at(-2)?.label).toBe('Det är ändå okej');
		// "Något annat" är fortsatt sista utvägen.
		expect(EVENING_THEMES.at(-1)?.id).toBe('other');
	});

	it('behåller de fyra ursprungliga alternativen oförändrade', () => {
		expect(EVENING_THEMES.slice(0, 4)).toEqual([
			{ id: 'racing_thoughts', label: 'Tankarna snurrar' },
			{ id: 'body_anxiety', label: 'Oro i kroppen' },
			{ id: 'loneliness', label: 'Känner mig ensam' },
			{ id: 'tomorrow', label: 'Orolig inför imorgon' }
		]);
	});

	it('går genom samma validering och sparas som de övriga', () => {
		// Steg tre erbjuder den lugna uppsättningen för det här temat, så det är
		// den kombinationen som faktiskt kan sparas.
		const result = validateEveningCheckinInput({
			...validInput,
			themeId: 'feeling_okay',
			parkingBucket: 'let_it_be'
		});

		expect(result.ok).toBe(true);
		expect(result.ok && result.data.themeId).toBe('feeling_okay');
		expect(result.ok && result.data.parkingBucket).toBe('let_it_be');
	});

	it('låter tidigare sparade kvällar fortsätta validera', () => {
		// Bakåtkompatibilitet: inga id:n har bytt värde eller betydelse.
		for (const themeId of ['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other']) {
			const result = validateEveningCheckinInput({ ...validInput, themeId });
			expect(result.ok, themeId).toBe(true);
		}
	});
});

/* Steg tre är det enda steget som följer temat. En lugn kväll ska inte mötas av
   frågan vad som ska lösas - men de fem övriga temana ska se exakt likadana ut
   som innan. */
describe('Steg tre följer temat', () => {
	const PROBLEM_LANGUAGE = /lösa|åtgärda|fixa|bättre|problem|jobbig|oro|besvär|ta itu/i;

	it('ger "det är ändå okej" en neutral rubrik', () => {
		expect(getEveningParkingPrompt('feeling_okay')).toBe('Vad känns rätt för resten av kvällen?');
		expect(getEveningParkingPrompt('feeling_okay')).not.toMatch(PROBLEM_LANGUAGE);
	});

	it('ger dess val inget problemlösningsspråk', () => {
		const buckets = getEveningParkingBuckets('feeling_okay');

		expect(buckets).toEqual(EVENING_CALM_PARKING_BUCKETS);
		for (const bucket of buckets) {
			expect(bucket.label, bucket.id).not.toMatch(PROBLEM_LANGUAGE);
		}
	});

	it('lämnar de fem andra temana exakt som förut', () => {
		for (const themeId of ['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other'] as const) {
			expect(getEveningParkingPrompt(themeId), themeId).toBe('Vad vill du göra med det för ikväll?');
			expect(getEveningParkingBuckets(themeId), themeId).toEqual(EVENING_PARKING_BUCKETS);
		}
		expect(getEveningParkingPrompt(null)).toBe('Vad vill du göra med det för ikväll?');
		expect(getEveningParkingBuckets(null)).toEqual(EVENING_PARKING_BUCKETS);
	});

	it('sparar den lugna vägen genom samma ordinarie validering', () => {
		for (const bucket of EVENING_CALM_PARKING_BUCKETS) {
			const result = validateEveningCheckinInput({
				...validInput,
				themeId: 'feeling_okay',
				parkingBucket: bucket.id
			});

			expect(result.ok, bucket.id).toBe(true);
			expect(result.ok && result.data.parkingBucket).toBe(bucket.id);
			expect(result.ok && result.data.flowVersion).toBe(EVENING_CHECKIN_FLOW_VERSION);
		}
	});

	it('håller de två uppsättningarna åtskilda så sparade värden behåller sin betydelse', () => {
		const original = EVENING_PARKING_BUCKETS.map((bucket) => bucket.id as string);
		const calm = EVENING_CALM_PARKING_BUCKETS.map((bucket) => bucket.id as string);

		expect(original).toEqual(['tomorrow', 'small_step', 'not_tonight']);
		expect(calm).toEqual(['let_it_be', 'carry_it', 'take_it_easy']);
		expect(original.some((id) => calm.includes(id))).toBe(false);
	});
});

/* Kombinationen tema + parkering låses i valideringen, inte bara i UI:t. Ett
   sparat värde ska aldrig kunna beskriva ett steg användaren inte blev erbjuden. */
describe('Tema och parkeringsval hör ihop', () => {
	const check = (themeId: string, parkingBucket: string) =>
		validateEveningCheckinInput({ ...validInput, themeId, parkingBucket });

	it('godkänner den lugna vägen med lugna värden', () => {
		expect(check('feeling_okay', 'let_it_be').ok).toBe(true);
		expect(check('feeling_okay', 'carry_it').ok).toBe(true);
		expect(check('feeling_okay', 'take_it_easy').ok).toBe(true);
	});

	it('avvisar den lugna vägen med ordinarie värden', () => {
		for (const bucket of ['tomorrow', 'small_step', 'not_tonight']) {
			const result = check('feeling_okay', bucket);

			expect(result.ok, bucket).toBe(false);
			expect(!result.ok && result.error).toBe('Valet hör inte till hur du beskrev kvällen.');
		}
	});

	it('godkänner de ordinarie temana med ordinarie värden', () => {
		for (const themeId of ['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other']) {
			for (const bucket of ['tomorrow', 'small_step', 'not_tonight']) {
				expect(check(themeId, bucket).ok, `${themeId} + ${bucket}`).toBe(true);
			}
		}
	});

	it('avvisar de ordinarie temana med lugna värden', () => {
		for (const themeId of ['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other']) {
			for (const bucket of ['let_it_be', 'carry_it', 'take_it_easy']) {
				expect(check(themeId, bucket).ok, `${themeId} + ${bucket}`).toBe(false);
			}
		}
	});

	it('låter alla tidigare sparade kombinationer fortsätta validera', () => {
		// Innan feeling_okay fanns kunde bara de fem ursprungliga temana kombineras
		// med de tre ursprungliga värdena - alla giltiga även efter låsningen.
		for (const themeId of ['racing_thoughts', 'body_anxiety', 'loneliness', 'tomorrow', 'other']) {
			for (const bucket of ['tomorrow', 'small_step', 'not_tonight']) {
				expect(check(themeId, bucket).ok, `${themeId} + ${bucket}`).toBe(true);
			}
		}
	});
});
