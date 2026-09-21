import { describe, expect, it } from 'vitest';
import {
	getAmbientEventPlan,
	getProgressFaunaPlan,
	type AmbientEventPlanInput,
	type ProgressFaunaPlanInput
} from './ambientEvents';
import { getReturnContext } from '$lib/returnContext';

const baseInput: AmbientEventPlanInput = {
	sessionSeed: 'session-42',
	dateKey: '2026-08-14',
	localTimeMinutes: 13 * 60,
	timeOfDay: 'day',
	season: 'summer',
	growthLevel: 2,
	context: 'dashboard',
	availableKinds: ['water', 'wind', 'bird', 'butterfly']
};

function plansFor(growthLevel: AmbientEventPlanInput['growthLevel']) {
	return Array.from({ length: 160 }, (_, index) =>
		getAmbientEventPlan({ ...baseInput, sessionSeed: `session-${index}`, growthLevel })
	);
}

describe('getAmbientEventPlan', () => {
	it('allows an intentionally empty ambient window', () => {
		expect(plansFor(2).some((plan) => plan === null)).toBe(true);
	});

	it('is stable for the same session and local time bucket', () => {
		const first = getAmbientEventPlan(baseInput);
		const rerender = getAmbientEventPlan({ ...baseInput, localTimeMinutes: baseInput.localTimeMinutes + 12 });
		expect(rerender).toEqual(first);
	});

	it('never plans butterflies at night', () => {
		for (let index = 0; index < 80; index += 1) {
			const plan = getAmbientEventPlan({
				...baseInput,
				sessionSeed: `night-${index}`,
				timeOfDay: 'night',
				availableKinds: ['butterfly']
			});
			expect(plan).toBeNull();
		}
	});

	it('blocks all new ambient events with reduced motion', () => {
		expect(getAmbientEventPlan({ ...baseInput, reducedMotion: true })).toBeNull();
	});

	it('returns at most one distinct event for a window', () => {
		const plan = getAmbientEventPlan(baseInput);
		expect(plan === null || ['water', 'wind', 'bird', 'butterfly'].includes(plan.kind)).toBe(true);
	});

	it('lets garden state affect likelihood without making events guaranteed', () => {
		const low = plansFor(0);
		const high = plansFor(4);
		expect(low.some((plan) => plan === null)).toBe(true);
		expect(high.some((plan) => plan === null)).toBe(true);
		expect(high.filter(Boolean).length).toBeGreaterThan(low.filter(Boolean).length);
	});

	it('keeps the cabin calm and rejects butterflies and wind', () => {
		for (let index = 0; index < 160; index += 1) {
			const plan = getAmbientEventPlan({
				...baseInput,
				sessionSeed: `cabin-${index}`,
				context: 'cabin'
			});
			if (plan) expect(['water', 'bird']).toContain(plan.kind);
		}
	});

	it('does not re-roll while a companion or visitor causes a rerender', () => {
		const before = getAmbientEventPlan(baseInput);
		const after = getAmbientEventPlan({ ...baseInput });
		expect(after).toEqual(before);
	});

	it('does not turn a longer return into a guaranteed ambient event', () => {
		expect(
			getReturnContext({
				now: new Date('2026-08-14T12:00:00Z'),
				lastSeenAt: new Date('2026-08-01T12:00:00Z'),
				hasSeenInSession: false
			})
		).toBe('longer_return');
		expect(plansFor(2).some((plan) => plan === null)).toBe(true);
	});
});

describe('getProgressFaunaPlan', () => {
	const faunaInput: ProgressFaunaPlanInput = {
		sessionSeed: 'fauna-session',
		sequence: 0,
		phase: 'day',
		season: 'summer',
		growthLevel: 2,
		availableKinds: ['bird', 'butterfly']
	};

	it('lägger dagsfauna 45-120 sekunder bort och håller passagen lugn', () => {
		for (let sequence = 0; sequence < 40; sequence += 1) {
			const plan = getProgressFaunaPlan({ ...faunaInput, sequence });
			expect(plan).not.toBeNull();
			expect(plan!.delayMs).toBeGreaterThanOrEqual(45_000);
			expect(plan!.delayMs).toBeLessThanOrEqual(120_000);
			expect(plan!.durationMs).toBeGreaterThanOrEqual(plan!.kind === 'bird' ? 15_000 : 8_000);
			expect(plan!.durationMs).toBeLessThanOrEqual(plan!.kind === 'bird' ? 22_000 : 12_000);
		}
	});

	it('tillåter bara fåglar under höst och aldrig fauna på natten', () => {
		for (let sequence = 0; sequence < 24; sequence += 1) {
			expect(getProgressFaunaPlan({ ...faunaInput, sequence, season: 'autumn' })?.kind).toBe('bird');
			expect(getProgressFaunaPlan({ ...faunaInput, sequence, phase: 'night' })).toBeNull();
		}
	});

	it('stänger av all återkommande fauna vid reduced motion', () => {
		expect(getProgressFaunaPlan({ ...faunaInput, reducedMotion: true })).toBeNull();
	});

	it('gör kväll och vinter mycket glesa utan fjärilar', () => {
		const evening = Array.from({ length: 80 }, (_, sequence) =>
			getProgressFaunaPlan({ ...faunaInput, sequence, phase: 'evening' })
		);
		const winter = Array.from({ length: 80 }, (_, sequence) =>
			getProgressFaunaPlan({ ...faunaInput, sequence, season: 'winter' })
		);
		for (const plans of [evening, winter]) {
			expect(plans.filter((plan) => plan?.durationMs === 0).length).toBeGreaterThan(50);
			expect(plans.filter((plan) => (plan?.durationMs ?? 0) > 0).every((plan) => plan?.kind === 'bird')).toBe(true);
		}
	});

	it('ger en till tre fåglar och högst en faunatyp per tillfälle', () => {
		const birds = Array.from({ length: 50 }, (_, sequence) =>
			getProgressFaunaPlan({
				...faunaInput,
				sequence,
				season: 'autumn',
				availableKinds: ['bird']
			})
		);
		expect(new Set(birds.map((plan) => plan?.flockSize))).toEqual(new Set([1, 2, 3]));
		expect(birds.every((plan) => plan?.kind === 'bird')).toBe(true);
	});
});
