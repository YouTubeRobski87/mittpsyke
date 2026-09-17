import { describe, expect, it, vi, beforeEach } from 'vitest';
import { flushSync } from 'svelte';
import { createCompanionDailyQuestionState } from './companionDailyQuestionState.svelte';
import type { CompanionDailyState } from './companionDailyQuestion';

function pendingState(overrides: Partial<CompanionDailyState> = {}): CompanionDailyState {
	return {
		dateKey: '2026-01-01',
		questionId: 'daily-lighten-day',
		status: 'pending',
		answerId: null,
		answeredDayCount: 2,
		...overrides
	};
}

describe('createCompanionDailyQuestionState', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
		// Modulen körs bara i webbläsaren i produktion (samma window.setTimeout-
		// mönster som EveningCheckinFlow och gamla dashboard redan använder) - i
		// testmiljön finns inget window, så testet skjuter till globalThis i stället.
		vi.stubGlobal('window', globalThis);
	});

	it('visar frågan bara när dagens status är pending', () => {
		const shown = createCompanionDailyQuestionState(() => pendingState());
		flushSync();
		expect(shown.show).toBe(true);
		expect(shown.question?.id).toBe('daily-lighten-day');

		const answered = createCompanionDailyQuestionState(() => pendingState({ status: 'answered' }));
		flushSync();
		expect(answered.show).toBe(false);
	});

	it('sparar svaret, uppdaterar optimistiskt och utlöser worldResponseSignal när servern bekräftar', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ state: {} }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const controller = createCompanionDailyQuestionState(() => pendingState());
		flushSync();
		expect(controller.worldResponseSignal).toBe(0);

		await controller.respond('calm');
		flushSync();

		expect(fetchMock).toHaveBeenCalledWith(
			'/api/companion/daily-question',
			expect.objectContaining({
				method: 'POST',
				body: JSON.stringify({ questionId: 'daily-lighten-day', answerId: 'calm' })
			})
		);
		// Optimistisk uppdatering: frågan döljs direkt, ingen väntan på servern.
		expect(controller.show).toBe(false);
		expect(controller.reaction).toBe('Då tar vi det lugnt idag.');
		expect(controller.worldResponseSignal).toBe(1);
	});

	it('utlöser aldrig worldResponseSignal vid hoppa över', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ state: {} }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const controller = createCompanionDailyQuestionState(() => pendingState());
		flushSync();

		await controller.respond(null);
		flushSync();

		expect(controller.worldResponseSignal).toBe(0);
		expect(controller.reaction).toBeNull();
		expect(controller.show).toBe(false);
	});

	it('utlöser aldrig worldResponseSignal när servern inte bekräftar sparningen', async () => {
		const fetchMock = vi.fn(async () => new Response(null, { status: 500 }));
		vi.stubGlobal('fetch', fetchMock);

		const controller = createCompanionDailyQuestionState(() => pendingState());
		flushSync();

		await controller.respond('calm');
		flushSync();

		expect(controller.worldResponseSignal).toBe(0);
	});

	it('gör inget om dagen redan är hanterad eller ett svar redan pågår', async () => {
		const fetchMock = vi.fn(async () => new Response(JSON.stringify({ state: {} }), { status: 200 }));
		vi.stubGlobal('fetch', fetchMock);

		const controller = createCompanionDailyQuestionState(() => pendingState({ status: 'answered' }));
		flushSync();

		await controller.respond('calm');
		flushSync();

		expect(fetchMock).not.toHaveBeenCalled();
	});
});
