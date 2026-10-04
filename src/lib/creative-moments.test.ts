import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
	CREATIVE_MOMENT_ACTIVITY,
	getCreativeMomentCopy,
	getCreativeMomentWindowStart,
	recordCreativeMoment
} from './creative-moments';

const migration = readFileSync(
	new URL('../../supabase/migrations/20261004090000_creative_moments.sql', import.meta.url),
	'utf8'
);

function recordingClient(options: {
	user?: { id: string; is_anonymous?: boolean } | null;
	authError?: { message: string } | null;
	insertError?: { code?: string; message: string } | null;
}) {
	const insert = vi.fn(async () => ({ error: options.insertError ?? null }));
	const client = {
		auth: {
			getUser: async () => ({
				data: { user: options.user ?? null },
				error: options.authError ?? null
			})
		},
		from: (table: string) => {
			expect(table).toBe('creative_moments');
			return { insert };
		}
	} as unknown as SupabaseClient;
	return { client, insert };
}

describe('kreativa stunder', () => {
	it('sparar bara minimal sessionsdata för en verifierad användare', async () => {
		const { client, insert } = recordingClient({ user: { id: 'user-1', is_anonymous: false } });

		expect(await recordCreativeMoment(client, '11111111-1111-4111-8111-111111111111')).toEqual({ ok: true });
		expect(insert).toHaveBeenCalledWith({
			user_id: 'user-1',
			activity_type: CREATIVE_MOMENT_ACTIVITY,
			session_id: '11111111-1111-4111-8111-111111111111'
		});
	});

	it('skriver inget för utloggade eller anonyma sessioner', async () => {
		for (const user of [null, { id: 'guest-1', is_anonymous: true }]) {
			const { client, insert } = recordingClient({ user });
			expect(await recordCreativeMoment(client, '11111111-1111-4111-8111-111111111111')).toEqual({
				ok: false,
				reason: 'not_signed_in'
			});
			expect(insert).not.toHaveBeenCalled();
		}
	});

	it('behandlar en unikhetskrock för samma session som en lyckad, idempotent registrering', async () => {
		const { client } = recordingClient({
			user: { id: 'user-1' },
			insertError: { code: '23505', message: 'duplicate key' }
		});

		expect(await recordCreativeMoment(client, '11111111-1111-4111-8111-111111111111')).toEqual({ ok: true });
	});

	it('räknar ett rullande sjudagarsfönster och formulerar lugn singular, plural och tomläge', () => {
		const now = new Date('2026-10-04T12:00:00.000Z');
		expect(getCreativeMomentWindowStart(now)).toBe('2026-09-27T12:00:00.000Z');
		expect(getCreativeMomentCopy(0)).toContain('kan dina lugna kreativa stunder visas här');
		expect(getCreativeMomentCopy(1)).toContain('1 lugn kreativ stund');
		expect(getCreativeMomentCopy(3)).toContain('3 lugna kreativa stunder');
	});

	it('har användarägd RLS, minimal datamodell och ingen ändrings- eller raderingsbehörighet', () => {
		expect(migration).toContain("activity_type text not null check (activity_type = 'world_coloring')");
		expect(migration).toContain('unique (user_id, activity_type, session_id)');
		expect(migration).toContain('references auth.users (id) on delete cascade');
		expect(migration).toContain('enable row level security');
		expect(migration).toContain('grant select, insert on table public.creative_moments to authenticated');
		expect(migration).not.toMatch(/grant[^;]*(update|delete)/i);
		expect(migration.match(/\(select auth\.uid\(\)\) = user_id/g)).toHaveLength(2);
	});
});
