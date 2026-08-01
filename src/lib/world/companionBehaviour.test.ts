import { describe, expect, it } from 'vitest';
import {
	COMPANION_BEHAVIOURS,
	COMPANION_BEHAVIOUR_MAX_REST_MS,
	COMPANION_BEHAVIOUR_MIN_REST_MS,
	getCompanionBehaviourRestMs,
	getMotionDutyCycle,
	isQuietPose,
	pickCompanionBehaviour
} from './companionBehaviour';

describe('pickCompanionBehaviour', () => {
	it('never repeats the previous behaviour back to back', () => {
		for (const behaviour of COMPANION_BEHAVIOURS) {
			// Testa hela slumpspannet så inget värde kan råka välja samma igen.
			for (const roll of [0, 0.25, 0.5, 0.75, 0.999]) {
				const next = pickCompanionBehaviour(behaviour.id, () => roll);
				expect(next.id).not.toBe(behaviour.id);
			}
		}
	});

	it('can pick any behaviour when there is no previous one', () => {
		const first = pickCompanionBehaviour(null, () => 0);
		const last = pickCompanionBehaviour(null, () => 0.999);
		expect(first.id).toBe(COMPANION_BEHAVIOURS[0].id);
		expect(last.id).toBe(COMPANION_BEHAVIOURS[COMPANION_BEHAVIOURS.length - 1].id);
	});

	it('keeps every behaviour short enough to stay unobtrusive', () => {
		for (const behaviour of COMPANION_BEHAVIOURS) {
			expect(behaviour.durationMs).toBeLessThanOrEqual(3000);
		}
	});
});

describe('getCompanionBehaviourRestMs', () => {
	it('rests within the configured window', () => {
		expect(getCompanionBehaviourRestMs(false, () => 0)).toBe(COMPANION_BEHAVIOUR_MIN_REST_MS);
		expect(getCompanionBehaviourRestMs(false, () => 1)).toBe(COMPANION_BEHAVIOUR_MAX_REST_MS);
	});

	it('uses a shorter window for the very first gesture', () => {
		const firstMidpoint = getCompanionBehaviourRestMs(true, () => 0.5);
		const regularMidpoint = getCompanionBehaviourRestMs(false, () => 0.5);
		expect(firstMidpoint).toBeLessThan(regularMidpoint);
	});

	it('keeps the companion still at least 95% of the time on average', () => {
		expect(getMotionDutyCycle()).toBeLessThanOrEqual(0.05);
	});

	it('stays under 95% stillness even in the worst case (longest gesture, shortest rest)', () => {
		const longestGesture = Math.max(...COMPANION_BEHAVIOURS.map((b) => b.durationMs));
		expect(longestGesture / (longestGesture + COMPANION_BEHAVIOUR_MIN_REST_MS)).toBeLessThan(0.08);
	});

	it('keeps the fidgety gestures rare next to the constant water and leaf motion', () => {
		const totalWeight = COMPANION_BEHAVIOURS.reduce((sum, b) => sum + b.weight, 0);
		const fidgetyWeight = COMPANION_BEHAVIOURS.filter((b) =>
			b.id === 'ear-twitch' || b.id === 'sniff'
		).reduce((sum, b) => sum + b.weight, 0);
		expect(fidgetyWeight / totalWeight).toBeLessThan(0.2);
	});
});

describe('isQuietPose', () => {
	it('skips gestures for poses that already move or should stay still', () => {
		expect(isQuietPose('sleep-curled')).toBe(true);
		expect(isQuietPose('bear-sleeping')).toBe(true);
		expect(isQuietPose('walk')).toBe(true);
		expect(isQuietPose('rest')).toBe(true);
	});

	it('allows gestures for calm standing and sitting poses', () => {
		expect(isQuietPose('idle')).toBe(false);
		expect(isQuietPose('sit')).toBe(false);
		expect(isQuietPose('wolf-standing')).toBe(false);
		expect(isQuietPose(null)).toBe(false);
	});
});
