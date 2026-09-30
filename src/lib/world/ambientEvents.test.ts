import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	AMBIENT_FIRST_MAJOR_MS,
	AMBIENT_MAJOR_COOLDOWN_MS,
	createAmbientDirectorState,
	getAmbientEventPlan,
	getProgressFaunaPlan,
	planNextAmbientEvent,
	startAmbientDirector,
	type AmbientDirectorEvent,
	type AmbientDirectorInput,
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

describe('ambient director', () => {
	const directorInput: AmbientDirectorInput = {
		sessionSeed: 'director-session',
		phase: 'day',
		season: 'summer',
		growthLevel: 2,
		availableKinds: ['bird', 'butterfly', 'wind', 'cloud-light', 'evening-life']
	};

	type Slot = { startMs: number; endMs: number; delayMs: number; event: AmbientDirectorEvent | null };

	/** Hela den planerade tidslinjen, utan timers. */
	function timeline(input: AmbientDirectorInput, steps = 120): Slot[] {
		let state = createAmbientDirectorState(input.sessionSeed);
		const slots: Slot[] = [];
		for (let index = 0; index < steps; index += 1) {
			const step = planNextAmbientEvent(state, input);
			if (!step) break;
			slots.push({
				startMs: state.elapsedMs + step.delayMs,
				endMs: step.nextState.elapsedMs,
				delayMs: step.delayMs,
				event: step.event
			});
			state = step.nextState;
		}
		return slots;
	}

	const seeds = Array.from({ length: 30 }, (_, index) => `director-${index}`);

	it('väntar minst två minuter innan första tydliga händelsen', () => {
		for (const sessionSeed of seeds) {
			const firstMajor = timeline({ ...directorInput, sessionSeed }).find(
				(slot) => slot.event?.tier === 'major'
			);
			expect(firstMajor).toBeDefined();
			expect(firstMajor!.startMs).toBeGreaterThanOrEqual(AMBIENT_FIRST_MAJOR_MS[0]);
		}
	});

	it('håller nedkylning på minst två minuter mellan tydliga händelser', () => {
		for (const sessionSeed of seeds) {
			const majors = timeline({ ...directorInput, sessionSeed }).filter(
				(slot) => slot.event?.tier === 'major'
			);
			expect(majors.length).toBeGreaterThan(2);
			for (let index = 1; index < majors.length; index += 1) {
				expect(majors[index].startMs - majors[index - 1].endMs).toBeGreaterThanOrEqual(
					AMBIENT_MAJOR_COOLDOWN_MS[0]
				);
			}
		}
	});

	it('låter aldrig två händelser överlappa', () => {
		for (const sessionSeed of seeds) {
			const slots = timeline({ ...directorInput, sessionSeed });
			for (let index = 1; index < slots.length; index += 1) {
				expect(slots[index].startMs).toBeGreaterThanOrEqual(slots[index - 1].endMs);
			}
		}
	});

	it('har jitter i både små tillfällen och tydliga händelser', () => {
		const slots = timeline(directorInput);
		const delays = new Set(slots.map((slot) => slot.delayMs));
		expect(delays.size).toBeGreaterThan(slots.length * 0.8);
		for (const slot of slots) {
			expect(slot.delayMs).toBeGreaterThanOrEqual(45_000);
			expect(slot.delayMs).toBeLessThanOrEqual(120_000);
		}

		const majors = slots.filter((slot) => slot.event?.tier === 'major');
		const gaps = majors.slice(1).map((slot, index) => slot.startMs - majors[index].endMs);
		expect(new Set(gaps).size).toBeGreaterThan(1);
		const firstMajors = new Set(seeds.map((seed) => createAmbientDirectorState(seed).nextMajorAtMs));
		expect(firstMajors.size).toBeGreaterThan(seeds.length / 2);
	});

	// "Något händer ibland": tydliga händelser byter ut ett faunatillfälle i
	// stället för att läggas ovanpå, så världen är stilla större delen av tiden.
	it('låter världen vara stilla större delen av tiden', () => {
		for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
			for (const phase of ['morning', 'day', 'afternoon', 'evening'] as const) {
				let activeMs = 0;
				let totalMs = 0;
				for (const sessionSeed of seeds) {
					const slots = timeline({ ...directorInput, sessionSeed, season, phase });
					activeMs += slots.reduce((sum, slot) => sum + (slot.event?.durationMs ?? 0), 0);
					totalMs += slots[slots.length - 1].endMs;
				}
				expect(activeMs / totalMs).toBeLessThan(0.25);
			}
		}
	});

	it('planerar inga händelser alls på natten', () => {
		for (const sessionSeed of seeds) {
			expect(
				planNextAmbientEvent(createAmbientDirectorState(sessionSeed), {
					...directorInput,
					sessionSeed,
					phase: 'night'
				})
			).toBeNull();
		}
	});

	it('släpper bara in fjärilar vår och sommar i dagsljus', () => {
		for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
			for (const phase of ['morning', 'day', 'afternoon', 'evening'] as const) {
				const kinds = seeds.flatMap((sessionSeed) =>
					timeline({ ...directorInput, sessionSeed, season, phase }, 40).map((slot) => slot.event?.kind)
				);
				const allowed = (season === 'spring' || season === 'summer') && phase !== 'evening';
				expect(kinds.includes('butterfly')).toBe(allowed);
			}
		}
	});

	it('ger kvällsliv bara kvällar vår/sommar, med högst tre punkter', () => {
		for (const season of ['spring', 'summer', 'autumn', 'winter'] as const) {
			for (const phase of ['morning', 'day', 'afternoon', 'evening'] as const) {
				const events = seeds.flatMap((sessionSeed) =>
					timeline({ ...directorInput, sessionSeed, season, phase }, 40)
						.map((slot) => slot.event)
						.filter((event) => event?.kind === 'evening-life')
				);
				const allowed = phase === 'evening' && (season === 'spring' || season === 'summer');
				expect(events.length > 0).toBe(allowed);
				for (const event of events) expect(event!.count).toBeLessThanOrEqual(3);
			}
		}
	});

	it('visar molnljus bara i dagsljus och vindpust med ett till tre löv', () => {
		const evening = seeds.flatMap((sessionSeed) =>
			timeline({ ...directorInput, sessionSeed, phase: 'evening' })
		);
		expect(evening.some((slot) => slot.event?.kind === 'cloud-light')).toBe(false);
		const gusts = seeds
			.flatMap((sessionSeed) => timeline({ ...directorInput, sessionSeed }))
			.filter((slot) => slot.event?.kind === 'wind');
		expect(gusts.length).toBeGreaterThan(0);
		for (const gust of gusts) {
			expect([1, 2, 3]).toContain(gust.event!.count);
			expect(gust.event!.intensity).toBeGreaterThanOrEqual(0.55);
			expect(gust.event!.intensity).toBeLessThanOrEqual(1);
		}
	});

	it('blockerar alla rörelsehändelser vid reduced motion', () => {
		expect(
			planNextAmbientEvent(createAmbientDirectorState('reduced'), { ...directorInput, reducedMotion: true })
		).toBeNull();
	});

	it('är deterministisk för samma session', () => {
		expect(timeline(directorInput)).toEqual(timeline({ ...directorInput }));
	});

	describe('startAmbientDirector', () => {
		afterEach(() => {
			vi.useRealTimers();
		});

		it('spelar en händelse i taget med en enda timer', () => {
			vi.useFakeTimers();
			let active = 0;
			let maxActive = 0;
			const played: AmbientDirectorEvent[] = [];
			const stop = startAmbientDirector({
				input: directorInput,
				onEvent: (event) => {
					active += 1;
					maxActive = Math.max(maxActive, active);
					played.push(event);
				},
				onEventEnd: () => {
					active -= 1;
				}
			});

			for (let minute = 0; minute < 30; minute += 1) {
				vi.advanceTimersByTime(60_000);
				expect(vi.getTimerCount()).toBeLessThanOrEqual(1);
			}
			expect(played.length).toBeGreaterThan(0);
			expect(maxActive).toBe(1);
			stop();
		});

		it('städar sin timer och anropar inget efter stopp', () => {
			vi.useFakeTimers();
			const onEvent = vi.fn();
			const onEventEnd = vi.fn();
			const stop = startAmbientDirector({ input: directorInput, onEvent, onEventEnd });
			expect(vi.getTimerCount()).toBe(1);

			stop();
			expect(vi.getTimerCount()).toBe(0);
			vi.advanceTimersByTime(60 * 60_000);
			expect(onEvent).not.toHaveBeenCalled();
			expect(onEventEnd).not.toHaveBeenCalled();
		});

		it('städar även mitt i en pågående händelse', () => {
			vi.useFakeTimers();
			const onEvent = vi.fn();
			const onEventEnd = vi.fn();
			const stop = startAmbientDirector({ input: directorInput, onEvent, onEventEnd });
			while (onEvent.mock.calls.length === 0) vi.advanceTimersByTime(1_000);

			stop();
			expect(vi.getTimerCount()).toBe(0);
			vi.advanceTimersByTime(60 * 60_000);
			expect(onEvent).toHaveBeenCalledTimes(1);
			expect(onEventEnd).not.toHaveBeenCalled();
		});

		it('spelar inga händelser medan dokumentet är dolt', () => {
			vi.useFakeTimers();
			const onEvent = vi.fn();
			const stop = startAmbientDirector({
				input: directorInput,
				onEvent,
				onEventEnd: vi.fn(),
				isVisible: () => false
			});
			vi.advanceTimersByTime(60 * 60_000);
			expect(onEvent).not.toHaveBeenCalled();
			stop();
		});

		it('startar ingen timer vid reduced motion', () => {
			vi.useFakeTimers();
			const stop = startAmbientDirector({
				input: { ...directorInput, reducedMotion: true },
				onEvent: vi.fn(),
				onEventEnd: vi.fn()
			});
			expect(vi.getTimerCount()).toBe(0);
			stop();
		});
	});
});
