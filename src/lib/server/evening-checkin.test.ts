import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { EVENING_CHECKIN_FLOW_VERSION, type EveningCheckinInput } from '$lib/evening-checkin';
import { getEveningCheckinDate, saveEveningCheckin } from './evening-checkin';

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
});
