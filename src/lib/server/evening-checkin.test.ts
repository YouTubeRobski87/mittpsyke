import { afterEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { EVENING_CHECKIN_FLOW_VERSION, type EveningCheckinInput } from '$lib/evening-checkin';
import {
	EVENING_PATTERN_ROW_LIMIT,
	getEveningCheckinDate,
	hasSavedEveningCheckin,
	loadEveningInteriorMemory,
	loadEveningPatternRows,
	saveEveningCheckin
} from './evening-checkin';

const input = {
	themeId: 'tomorrow' as const,
	thought: 'Mötet i morgon.',
	parkingBucket: 'small_step' as const,
	flowVersion: EVENING_CHECKIN_FLOW_VERSION
} satisfies EveningCheckinInput;

describe('saveEveningCheckin', () => {
	it('använder svensk kalenderdag och sparar bara det avsedda kontraktet', async () => {
		let inserted: Record<string, unknown> | null = null;
		const client = {
			from: (table: string) => {
				expect(table).toBe('evening_checkins');
				return {
					insert: (row: Record<string, unknown>) => {
						inserted = row;
						return {
							select: () => ({
								single: async () => ({
									data: { id: 'checkin-1', created_at: '2026-08-12T20:00:00.000Z', checkin_date: '2026-08-12' },
									error: null
								})
							})
						};
					}
				};
			}
		} as unknown as SupabaseClient;

		const result = await saveEveningCheckin(client, 'user-1', input, new Date('2026-08-12T20:00:00.000Z'));

		expect(result).toEqual({
			ok: true,
			checkin: { id: 'checkin-1', created_at: '2026-08-12T20:00:00.000Z', checkin_date: '2026-08-12' }
		});
		expect(inserted).toEqual({
			user_id: 'user-1',
			theme_id: 'tomorrow',
			thought: 'Mötet i morgon.',
			parking_bucket: 'small_step',
			checkin_date: '2026-08-12',
			flow_version: EVENING_CHECKIN_FLOW_VERSION
		});
	});

	it('räknar datum i Stockholm, inte UTC', () => {
		expect(getEveningCheckinDate(new Date('2026-07-14T22:30:00.000Z'))).toBe('2026-07-15');
	});

	it('läser enbart svenska checkin-datum för bok och matta, och faller tillbaka säkert vid fel', async () => {
		const hasCheckinClient = {
			from: (table: string) => {
				expect(table).toBe('evening_checkins');
				return {
					select: (columns: string) => {
						expect(columns).toBe('checkin_date');
						return {
							eq: async (column: string, userId: string) => {
								expect(column).toBe('user_id');
								expect(userId).toBe('user-1');
								return {
									data: [
										{ checkin_date: '2026-08-10' },
										{ checkin_date: '2026-08-10' },
										{ checkin_date: '2026-08-11' }
									],
									error: null
								};
							}
						};
					}
				};
			}
		} as unknown as SupabaseClient;
		const failedClient = {
			from: () => ({ select: () => ({ eq: async () => ({ data: null, error: new Error('databasfel') }) }) })
		} as unknown as SupabaseClient;

		expect(await hasSavedEveningCheckin(hasCheckinClient, 'user-1')).toBe(true);
		expect(await loadEveningInteriorMemory(hasCheckinClient, 'user-1')).toEqual({
			hasBook: true,
			hasRug: false,
			hasBlanket: false,
			hasVeranda: false
		});
		expect(await loadEveningInteriorMemory(failedClient, 'user-1')).toEqual({
			hasBook: false,
			hasRug: false,
			hasBlanket: false,
			hasVeranda: false
		});
		expect(await hasSavedEveningCheckin(failedClient, 'user-1')).toBe(false);
		expect(await hasSavedEveningCheckin(hasCheckinClient, null)).toBe(false);
	});

	it('gör mattan eligible först när tre separata checkin-datum finns', async () => {
		const client = {
			from: () => ({
				select: () => ({
					eq: async () => ({
						data: [
							{ checkin_date: '2026-08-10' },
							{ checkin_date: '2026-08-11' },
							{ checkin_date: '2026-08-12' }
						],
						error: null
					})
				})
			})
		} as unknown as SupabaseClient;

		expect(await loadEveningInteriorMemory(client, 'user-1')).toEqual({
			hasBook: true,
			hasRug: true,
			hasBlanket: false,
			hasVeranda: false
		});
	});
});

/* Ett schemafel gav tidigare ett anonymt 500 utan spår i loggen - rotorsaken
   till att en trasig CHECK-constraint kunde ligga live. Felet ska synas, men
   kvällens text får aldrig hamna i loggen. */
describe('saveEveningCheckin loggar databasfel utan att läcka innehåll', () => {
	afterEach(() => vi.restoreAllMocks());

	function failingClient(error: Record<string, unknown>) {
		return {
			from: () => ({
				insert: () => ({
					select: () => ({ single: async () => ({ data: null, error }) })
				})
			})
		} as unknown as SupabaseClient;
	}

	const dbError = {
		code: '23514',
		message: 'new row for relation "evening_checkins" violates check constraint',
		hint: null,
		details: 'Failing row contains (…, Mötet i morgon., …)'
	};

	it('loggar Postgres felkod och meddelande', async () => {
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

		const result = await saveEveningCheckin(failingClient(dbError), 'user-1', input);

		expect(result).toEqual({ ok: false });
		expect(logged).toHaveBeenCalledOnce();
		const [prefix, payload] = logged.mock.calls[0];
		expect(prefix).toBe('[evening-checkin] insert misslyckades');
		expect(payload).toMatchObject({ code: '23514' });
	});

	it('loggar varken fritexten eller Postgres details-fält', async () => {
		const logged = vi.spyOn(console, 'error').mockImplementation(() => {});

		await saveEveningCheckin(failingClient(dbError), 'user-1', input);

		const serialised = JSON.stringify(logged.mock.calls);
		expect(serialised).not.toContain(input.thought);
		expect(serialised).not.toContain('Failing row contains');
		expect(serialised).not.toContain('details');
	});
});

describe('loadEveningPatternRows', () => {
	/** Fångar exakt vad frågan begär, så kolumnlistan och fönstret går att granska. */
	function fakeClient(result: { data?: unknown; error?: { message: string } | null } = {}) {
		const query: Record<string, unknown> = {};
		const builder = {
			select: (columns: string) => {
				query.columns = columns;
				return builder;
			},
			eq: (column: string, value: unknown) => {
				query[column] = value;
				return builder;
			},
			gte: (column: string, value: unknown) => {
				query.gteColumn = column;
				query.gteValue = value;
				return builder;
			},
			order: () => builder,
			limit: (value: number) => {
				query.limit = value;
				return Promise.resolve({ data: result.data ?? [], error: result.error ?? null });
			}
		};
		const client = {
			from: (table: string) => {
				query.table = table;
				return builder;
			}
		} as unknown as SupabaseClient;
		return { client, query };
	}

	it('hämtar bara de tre strukturfälten, aldrig fritexten', async () => {
		const { client, query } = fakeClient();

		await loadEveningPatternRows(client, 'user-1', new Date('2026-09-19T20:00:00.000Z'));

		expect(query.table).toBe('evening_checkins');
		expect(query.columns).toBe('theme_id, parking_bucket, checkin_date');
		expect(String(query.columns)).not.toContain('thought');
		expect(query.user_id).toBe('user-1');
	});

	it('begränsar läsningen till det fönster sektionen kan använda', async () => {
		const { client, query } = fakeClient();

		await loadEveningPatternRows(client, 'user-1', new Date('2026-09-19T20:00:00.000Z'));

		// Svensk kalenderdag minus EVENING_PATTERN_WINDOW_DAYS.
		expect(query.gteColumn).toBe('checkin_date');
		expect(query.gteValue).toBe('2025-09-19');
		expect(query.limit).toBe(EVENING_PATTERN_ROW_LIMIT);
	});

	it('ger en tom lista utan användare, utan att fråga databasen', async () => {
		const { client, query } = fakeClient();

		expect(await loadEveningPatternRows(client, null)).toEqual([]);
		expect(query.table).toBeUndefined();
	});

	it('ger en tom lista i stället för att välta när läsningen misslyckas', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const { client } = fakeClient({ data: null, error: { message: 'nere' } });

		expect(await loadEveningPatternRows(client, 'user-1')).toEqual([]);
	});
});
