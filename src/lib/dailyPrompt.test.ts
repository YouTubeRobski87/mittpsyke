import { describe, it, expect, vi, afterEach } from 'vitest';
import { getDailyPrompt, DAILY_PROMPTS } from './dailyPrompt';

describe('getDailyPrompt', () => {
	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns a string', () => {
		expect(typeof getDailyPrompt()).toBe('string');
	});

	it('returns a prompt that is in DAILY_PROMPTS', () => {
		const prompt = getDailyPrompt();
		expect(DAILY_PROMPTS).toContain(prompt);
	});

	it('returns the same prompt for the same date', () => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-03-15'));

		const prompt1 = getDailyPrompt();
		const prompt2 = getDailyPrompt();
		expect(prompt1).toBe(prompt2);
	});

	it('returns different prompts for different dates', () => {
		// Run through every date in a month and collect unique prompts
		const seen = new Set<string>();
		const startMs = new Date('2026-01-01').getTime();

		vi.useFakeTimers();
		for (let i = 0; i < 31; i++) {
			vi.setSystemTime(new Date(startMs + i * 86_400_000));
			seen.add(getDailyPrompt());
		}

		// Over 31 days we should see more than one unique prompt
		expect(seen.size).toBeGreaterThan(1);
	});

	it('index is always within bounds of DAILY_PROMPTS', () => {
		// Spot-check 100 different dates
		const startMs = new Date('2025-01-01').getTime();

		vi.useFakeTimers();
		for (let i = 0; i < 100; i++) {
			vi.setSystemTime(new Date(startMs + i * 86_400_000));
			const prompt = getDailyPrompt();
			expect(DAILY_PROMPTS).toContain(prompt);
		}
	});
});
