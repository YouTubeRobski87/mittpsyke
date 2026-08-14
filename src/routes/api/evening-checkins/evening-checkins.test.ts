import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import { EVENING_CHECKIN_FLOW_VERSION } from '$lib/evening-checkin';
import { POST } from './+server';

function request(body: unknown, withConsent = true) {
	return new Request('http://localhost/api/evening-checkins', {
		method: 'POST',
		headers: {
			'content-type': 'application/json',
			...(withConsent ? { [SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION } : {})
		},
		body: JSON.stringify(body)
	});
}

function eventFor(user: { id: string; is_anonymous?: boolean } | null, client?: SupabaseClient) {
	const supabase =
		client ??
		({
			auth: { getUser: async () => ({ data: { user }, error: null }) }
		} as unknown as SupabaseClient);
	return { locals: { supabase } };
}

const validBody = {
	themeId: 'racing_thoughts',
	thought: 'Det är mycket inför i morgon.',
	parkingBucket: 'tomorrow',
	flowVersion: EVENING_CHECKIN_FLOW_VERSION
};

describe('POST /api/evening-checkins', () => {
	it('avvisar sparande utan samtyckesheader innan autentisering eller dataåtkomst', async () => {
		const response = await POST({
			request: request(validBody, false),
			...eventFor(null)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(403);
	});

	it('kräver en inloggad, icke-anonym användare', async () => {
		const response = await POST({
			request: request(validBody),
			...eventFor(null)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(401);
	});

	it('validerar underlaget innan någon rad skrivs', async () => {
		let wrote = false;
		const client = {
			auth: { getUser: async () => ({ data: { user: { id: 'user-1', is_anonymous: false } }, error: null }) },
			from: () => {
				wrote = true;
				throw new Error('Ska inte skriva ogiltig data');
			}
		} as unknown as SupabaseClient;
		const response = await POST({
			request: request({ ...validBody, parkingBucket: 'allting' }),
			...eventFor({ id: 'user-1' }, client)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(400);
		expect(wrote).toBe(false);
	});

	it('sparar det validerade underlaget för den autentiserade användaren', async () => {
		let inserted: Record<string, unknown> | null = null;
		const client = {
			auth: { getUser: async () => ({ data: { user: { id: 'user-1', is_anonymous: false } }, error: null }) },
			from: () => ({
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
				},
				select: (columns: string) => {
					expect(columns).toBe('checkin_date');
					return {
						eq: async () => ({ data: [{ checkin_date: '2026-08-12' }], error: null })
					};
				}
			})
		} as unknown as SupabaseClient;

		const response = await POST({
			request: request(validBody),
			...eventFor({ id: 'user-1' }, client)
		} as Parameters<typeof POST>[0]);

		expect(response.status).toBe(201);
		expect(inserted).toMatchObject({
			user_id: 'user-1',
			theme_id: 'racing_thoughts',
			thought: 'Det är mycket inför i morgon.',
			parking_bucket: 'tomorrow',
			flow_version: EVENING_CHECKIN_FLOW_VERSION
		});
		expect(await response.json()).toMatchObject({
			interiorMemory: { hasBook: true, hasRug: false }
		});
	});
});
