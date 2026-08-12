import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	loadCompanionDailyState,
	recordCompanionDailyResponse
} from './companion-daily-question';
import { getCompanionDailyQuestionForDay, getStockholmDateKey } from '$lib/companionDailyQuestion';

const USER = 'a1b2c3d4-0000-4000-8000-000000000001';
const OTHER_USER = 'a1b2c3d4-0000-4000-8000-000000000002';
const TABLE = 'companion_daily_answers';
// Mitt på dagen i Stockholm, så testet aldrig hamnar i en dygnsgräns.
const NOW = new Date('2026-08-12T10:00:00Z');
const TODAY = getStockholmDateKey(NOW);

type Row = {
	user_id: string;
	answer_date: string;
	question_id: string;
	answer_id: string | null;
};

type FakeError = { code: string; message: string } | null;

/**
 * Minimal stubb av det som modulen faktiskt använder: select/eq/not/maybeSingle,
 * exact head-count och upsert med ignoreDuplicates. Stubben efterliknar också
 * databasens regler - unik rad per användare och dag, och bara innevarande dag
 * får skrivas - så testerna fångar samma sak som migrationens policy.
 */
function createFakeSupabase(initialRows: Row[] = [], options: { missingTable?: boolean } = {}) {
	const rows = [...initialRows];
	const missingTableError: FakeError = options.missingTable
		? { code: 'PGRST205', message: `Could not find the table 'public.${TABLE}' in the schema cache` }
		: null;

	function makeBuilder() {
		const predicates: ((row: Row) => boolean)[] = [];
		const matched = () => rows.filter((row) => predicates.every((predicate) => predicate(row)));

		const builder = {
			eq(column: keyof Row, value: string) {
				predicates.push((row) => row[column] === value);
				return builder;
			},
			not(column: keyof Row, operator: string, value: null) {
				if (operator !== 'is' || value !== null) throw new Error('Ostödd filterkombination.');
				predicates.push((row) => row[column] !== null);
				return builder;
			},
			maybeSingle() {
				if (missingTableError) return Promise.resolve({ data: null, error: missingTableError });
				return Promise.resolve({ data: matched()[0] ?? null, error: null });
			},
			then(onFulfilled: (value: unknown) => unknown, onRejected?: (reason: unknown) => unknown) {
				const result = missingTableError
					? { data: null, count: null, error: missingTableError }
					: { data: null, count: matched().length, error: null };
				return Promise.resolve(result).then(onFulfilled, onRejected);
			}
		};

		return builder;
	}

	const client = {
		rows,
		upsertCount: 0,
		from(table: string) {
			if (table !== TABLE) throw new Error(`Oväntad tabell: ${table}`);
			return {
				select: () => makeBuilder(),
				upsert(row: Row, upsertOptions: { onConflict: string; ignoreDuplicates: boolean }) {
					client.upsertCount += 1;
					if (missingTableError) return Promise.resolve({ error: missingTableError });
					// Motsvarar insert-policyn: bara innevarande Stockholm-dag.
					if (row.answer_date !== getStockholmDateKey(NOW)) {
						return Promise.resolve({
							error: { code: '42501', message: 'new row violates row-level security policy' }
						});
					}
					const existing = rows.find(
						(candidate) =>
							candidate.user_id === row.user_id && candidate.answer_date === row.answer_date
					);
					if (existing) {
						if (!upsertOptions.ignoreDuplicates) existing.answer_id = row.answer_id;
						return Promise.resolve({ error: null });
					}
					rows.push({ ...row });
					return Promise.resolve({ error: null });
				}
			};
		}
	};

	return client;
}

function asSupabase(client: ReturnType<typeof createFakeSupabase>) {
	return client as unknown as SupabaseClient;
}

describe('loadCompanionDailyState', () => {
	it('ger dagens fråga som obesvarad när användaren inte svarat idag', async () => {
		const client = createFakeSupabase();
		const state = await loadCompanionDailyState(asSupabase(client), USER, NOW);

		expect(state).not.toBeNull();
		expect(state?.status).toBe('pending');
		expect(state?.dateKey).toBe(TODAY);
		expect(state?.questionId).toBe(getCompanionDailyQuestionForDay(TODAY, USER).id);
		expect(state?.answeredDayCount).toBe(0);
	});

	it('ger samma fråga vid upprepade laddningar - refresh byter aldrig fråga', async () => {
		const client = createFakeSupabase();
		const first = await loadCompanionDailyState(asSupabase(client), USER, NOW);
		const second = await loadCompanionDailyState(asSupabase(client), USER, new Date('2026-08-12T19:45:00Z'));

		expect(second?.questionId).toBe(first?.questionId);
	});

	it('markerar dagen som hanterad efter ett svar och behåller den sparade frågan', async () => {
		const client = createFakeSupabase([
			{ user_id: USER, answer_date: TODAY, question_id: 'daily-focus', answer_id: 'rest' }
		]);
		const state = await loadCompanionDailyState(asSupabase(client), USER, NOW);

		expect(state?.status).toBe('answered');
		expect(state?.questionId).toBe('daily-focus');
		expect(state?.answerId).toBe('rest');
		expect(state?.answeredDayCount).toBe(1);
	});

	it('markerar dagen som hanterad även när användaren hoppat över', async () => {
		const client = createFakeSupabase([
			{ user_id: USER, answer_date: TODAY, question_id: 'daily-focus', answer_id: null }
		]);
		const state = await loadCompanionDailyState(asSupabase(client), USER, NOW);

		expect(state?.status).toBe('skipped');
		expect(state?.answerId).toBeNull();
		// Överhoppade dagar räknas aldrig in i bandet eller trädgården.
		expect(state?.answeredDayCount).toBe(0);
	});

	it('räknar bara egna besvarade dagar', async () => {
		const client = createFakeSupabase([
			{ user_id: USER, answer_date: '2026-08-10', question_id: 'daily-focus', answer_id: 'rest' },
			{ user_id: USER, answer_date: '2026-08-11', question_id: 'daily-energy', answer_id: null },
			{ user_id: OTHER_USER, answer_date: '2026-08-11', question_id: 'daily-energy', answer_id: 'enough' }
		]);
		const state = await loadCompanionDailyState(asSupabase(client), USER, NOW);

		expect(state?.answeredDayCount).toBe(1);
		expect(state?.status).toBe('pending');
	});

	it('behåller tidigare svarsdagar efter ett uppehåll - frånvaro sänker aldrig något', async () => {
		const client = createFakeSupabase([
			{ user_id: USER, answer_date: '2026-01-04', question_id: 'daily-focus', answer_id: 'rest' },
			{ user_id: USER, answer_date: '2026-01-05', question_id: 'daily-energy', answer_id: 'enough' },
			{ user_id: USER, answer_date: '2026-03-19', question_id: 'daily-company', answer_id: 'space' }
		]);
		const state = await loadCompanionDailyState(asSupabase(client), USER, NOW);

		expect(state?.answeredDayCount).toBe(3);
		expect(state?.status).toBe('pending');
	});

	it('returnerar null i stället för att fela när tabellen saknas', async () => {
		const client = createFakeSupabase([], { missingTable: true });
		expect(await loadCompanionDailyState(asSupabase(client), USER, NOW)).toBeNull();
	});
});

describe('recordCompanionDailyResponse', () => {
	it('sparar svaret och räknar upp antalet besvarade dagar', async () => {
		const client = createFakeSupabase();
		const questionId = getCompanionDailyQuestionForDay(TODAY, USER).id;

		const result = await recordCompanionDailyResponse(
			asSupabase(client),
			USER,
			{ questionId, answerId: 'unsure' },
			NOW
		);

		expect(result.ok).toBe(true);
		expect(client.rows).toEqual([
			{ user_id: USER, answer_date: TODAY, question_id: questionId, answer_id: 'unsure' }
		]);
		expect(result.ok && result.state.status).toBe('answered');
		expect(result.ok && result.state.answeredDayCount).toBe(1);
	});

	it('sparar hoppa över som hanterad dag utan progression', async () => {
		const client = createFakeSupabase();
		const result = await recordCompanionDailyResponse(
			asSupabase(client),
			USER,
			{ questionId: 'daily-focus', answerId: null },
			NOW
		);

		expect(result.ok).toBe(true);
		expect(client.rows[0].answer_id).toBeNull();
		expect(result.ok && result.state.status).toBe('skipped');
		expect(result.ok && result.state.answeredDayCount).toBe(0);
	});

	it('dubbelräknar inte om samma dag skickas två gånger', async () => {
		const client = createFakeSupabase();
		await recordCompanionDailyResponse(
			asSupabase(client),
			USER,
			{ questionId: 'daily-focus', answerId: 'rest' },
			NOW
		);
		const second = await recordCompanionDailyResponse(
			asSupabase(client),
			USER,
			{ questionId: 'daily-focus', answerId: 'task' },
			NOW
		);

		expect(client.rows).toHaveLength(1);
		// Det första svaret står kvar; en dag kan inte skrivas om.
		expect(client.rows[0].answer_id).toBe('rest');
		expect(second.ok && second.state.answeredDayCount).toBe(1);
	});

	it('avvisar okända frågor och svar utan att röra databasen', async () => {
		const client = createFakeSupabase();

		expect(
			await recordCompanionDailyResponse(
				asSupabase(client),
				USER,
				{ questionId: 'inte-en-fraga', answerId: 'calm' },
				NOW
			)
		).toEqual({ ok: false, reason: 'invalid' });

		expect(
			await recordCompanionDailyResponse(
				asSupabase(client),
				USER,
				{ questionId: 'daily-focus', answerId: 'inte-ett-svar' },
				NOW
			)
		).toEqual({ ok: false, reason: 'invalid' });

		expect(client.upsertCount).toBe(0);
		expect(client.rows).toHaveLength(0);
	});

	it('rapporterar unavailable när tabellen saknas', async () => {
		const client = createFakeSupabase([], { missingTable: true });
		const result = await recordCompanionDailyResponse(
			asSupabase(client),
			USER,
			{ questionId: 'daily-focus', answerId: 'rest' },
			NOW
		);

		expect(result).toEqual({ ok: false, reason: 'unavailable' });
	});
});
