import { readFileSync } from 'node:fs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import {
	DIARY_AI_CONSENT_POLICY_VERSION,
	DIARY_AI_CONSENT_SCOPE,
	grantDiaryAiConsent,
	hasDiaryAiConsent,
	revokeDiaryAiConsent
} from './diary-ai-consent';

function readClient(row: unknown) {
	const maybeSingle = vi.fn().mockResolvedValue({ data: row, error: null });
	const scopeFilter = { maybeSingle };
	const userFilter = { eq: vi.fn().mockReturnValue(scopeFilter) };
	const query = { eq: vi.fn().mockReturnValue(userFilter) };
	const select = vi.fn().mockReturnValue(query);
	const from = vi.fn().mockReturnValue({ select });

	return { client: { from } as unknown as SupabaseClient };
}

function writeClient() {
	const upsert = vi.fn().mockResolvedValue({ error: null });
	const from = vi.fn().mockReturnValue({ upsert });
	return { client: { from } as unknown as SupabaseClient, upsert };
}

describe('diary AI consent helper', () => {
	it('accepts only a current, non-revoked server-owned grant', async () => {
		const { client } = readClient({
			status: 'granted',
			policy_version: DIARY_AI_CONSENT_POLICY_VERSION,
			revoked_at: null
		});

		expect(await hasDiaryAiConsent(client, 'user-1')).toBe(true);
	});

	it('fails closed for a missing, revoked, or stale consent row', async () => {
		for (const row of [
			null,
			{ status: 'revoked', policy_version: DIARY_AI_CONSENT_POLICY_VERSION, revoked_at: '2026-08-15T10:00:00.000Z' },
			{ status: 'granted', policy_version: 'diary-ai-v0', revoked_at: null }
		]) {
			const { client } = readClient(row);
			expect(await hasDiaryAiConsent(client, 'user-1')).toBe(false);
		}
	});

	it('writes an explicit grant with the canonical scope and policy version', async () => {
		const { client, upsert } = writeClient();

		expect(await grantDiaryAiConsent(client, 'user-1')).toBe(true);
		expect(upsert).toHaveBeenCalledWith(
			expect.objectContaining({
				user_id: 'user-1',
				scope: DIARY_AI_CONSENT_SCOPE,
				status: 'granted',
				policy_version: DIARY_AI_CONSENT_POLICY_VERSION,
				revoked_at: null
			}),
			{ onConflict: 'user_id,scope' }
		);
	});

	it('records revocation and permits a later re-grant', async () => {
		const revoked = writeClient();
		expect(await revokeDiaryAiConsent(revoked.client, 'user-1')).toBe(true);
		expect(revoked.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'revoked', revoked_at: expect.any(String) }),
			{ onConflict: 'user_id,scope' }
		);

		const regranted = writeClient();
		expect(await grantDiaryAiConsent(regranted.client, 'user-1')).toBe(true);
		expect(regranted.upsert).toHaveBeenCalledWith(
			expect.objectContaining({ status: 'granted', revoked_at: null }),
			{ onConflict: 'user_id,scope' }
		);
	});

	it('migration keeps the table server-only and tied to account deletion', () => {
		const migration = readFileSync(
			new URL('../../../supabase/migrations/20260815021302_add_diary_ai_consent.sql', import.meta.url),
			'utf8'
		);

		expect(migration).toContain('references auth.users (id) on delete cascade');
		expect(migration).toContain('enable row level security');
		expect(migration).toContain('revoke all on table public.user_ai_consents from anon, authenticated');
	});
});
