import { describe, expect, it } from 'vitest';
import {
	COMPANION_GREETING_COOLDOWN_MS,
	canTriggerCompanionGreeting,
	getCompanionGreeting
} from './companionGreeting';

describe('getCompanionGreeting', () => {
	it('uses the available display name without naming a companion', () => {
		expect(getCompanionGreeting('Robban Andersson', 0)).toBe('Hej, Robban.');
	});

	it('uses a small fixed local phrase when no display name is available', () => {
		expect(getCompanionGreeting(null, 0)).toBe('Fint att se dig.');
		expect(getCompanionGreeting('', 1)).toBe('Jag är här.');
	});
});

describe('canTriggerCompanionGreeting', () => {
	it('allows the first click and blocks clicks inside the cooldown', () => {
		const firstClickAt = 10_000;
		expect(canTriggerCompanionGreeting(0, firstClickAt)).toBe(true);
		expect(canTriggerCompanionGreeting(firstClickAt, firstClickAt + 1)).toBe(false);
	});

	it('allows a new reaction once the cooldown has elapsed', () => {
		const firstClickAt = 10_000;
		expect(
			canTriggerCompanionGreeting(firstClickAt, firstClickAt + COMPANION_GREETING_COOLDOWN_MS)
		).toBe(true);
	});
});
