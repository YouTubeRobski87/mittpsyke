import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { EVENING_CHECKIN_FLOW_VERSION, type EveningCheckinInput } from '$lib/evening-checkin';
import {
	getEveningCheckinDate,
	hasSavedEveningCheckin,
	loadEveningInteriorMemory,
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
			hasBlanket: false
		});
		expect(await loadEveningInteriorMemory(failedClient, 'user-1')).toEqual({
			hasBook: false,
			hasRug: false,
			hasBlanket: false
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
			hasBlanket: false
		});
	});
});
