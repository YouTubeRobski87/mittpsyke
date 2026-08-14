import { describe, expect, it } from 'vitest';
import { getAmbientEventPlan, type AmbientEventPlanInput } from './ambientEvents';

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
});
