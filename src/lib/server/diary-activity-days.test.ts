import { describe, expect, it } from 'vitest';
import { countDiaryActivityDays, loadDiaryActivityDays } from './diary-activity-days';

describe('countDiaryActivityDays', () => {
	it('ger ett tomt underlag utan inlägg', () => {
		expect(countDiaryActivityDays([])).toEqual({});
	});

	it('samlar flera inlägg samma dag under ett datum', () => {
		expect(
			countDiaryActivityDays([
				{ created_at: '2026-09-01T07:00:00.000Z' },
				{ created_at: '2026-09-01T18:30:00.000Z' },
				{ created_at: '2026-09-03T10:00:00.000Z' }
			])
		).toEqual({ '2026-09-01': 2, '2026-09-03': 1 });
	});

	it('räknar dagen i svensk tid, inte UTC', () => {
		// 23:30 UTC den 1 september är redan den 2 september i Stockholm (UTC+2).
		expect(countDiaryActivityDays([{ created_at: '2026-09-01T23:30:00.000Z' }])).toEqual({
			'2026-09-02': 1
		});
	});

	it('hoppar över saknade och trasiga tidsstämplar', () => {
		expect(
			countDiaryActivityDays([{ created_at: null }, { created_at: 'trasigt' }, { created_at: undefined }])
		).toEqual({});
	});
});

describe('loadDiaryActivityDays', () => {
	function fakeSupabase(result: { data: unknown; error: unknown }) {
		const calls: { select?: string; eq?: [string, string]; limit?: number } = {};
		const query = {
			select(columns: string) {
				calls.select = columns;
				return query;
			},
			eq(column: string, value: string) {
				calls.eq = [column, value];
				return query;
			},
			order() {
				return query;
			},
			limit(value: number) {
				calls.limit = value;
				return Promise.resolve(result);
			}
		};
		return { client: { from: () => query } as never, calls };
	}

	it('läser bara tidsstämpeln för den inloggade användaren', async () => {
		const { client, calls } = fakeSupabase({
			data: [{ created_at: '2026-09-01T10:00:00.000Z' }],
			error: null
		});

		expect(await loadDiaryActivityDays(client, 'user-1')).toEqual({ '2026-09-01': 1 });
		// Aldrig text eller humör - bara när något sparades.
		expect(calls.select).toBe('created_at');
		expect(calls.eq).toEqual(['user_id', 'user-1']);
	});

	it('ger ett tomt underlag vid fel i stället för att välta sidan', async () => {
		const { client } = fakeSupabase({ data: null, error: { message: 'nere' } });
		const errorSpy = console.error;
		console.error = () => {};
		try {
			expect(await loadDiaryActivityDays(client, 'user-1')).toEqual({});
		} finally {
			console.error = errorSpy;
		}
	});
});
