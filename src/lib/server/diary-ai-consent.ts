import type { SupabaseClient } from '@supabase/supabase-js';

export const DIARY_AI_CONSENT_SCOPE = 'diary_ai_reflection';
export const DIARY_AI_CONSENT_POLICY_VERSION = 'diary-ai-v1';

const DIARY_AI_CONSENT_TABLE = 'user_ai_consents';

type DiaryAiConsentRow = {
	status: string;
	policy_version: string;
	revoked_at: string | null;
};

function isCurrentDiaryAiConsent(row: DiaryAiConsentRow | null): boolean {
	return Boolean(
		row &&
		row.status === 'granted' &&
		row.policy_version === DIARY_AI_CONSENT_POLICY_VERSION &&
		row.revoked_at === null
	);
}

/**
 * Canonical, fail-closed authorization check for diary AI. This deliberately
 * does not inspect client localStorage, request headers, or user_metadata.
 */
export async function hasDiaryAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	const { data, error } = await client
		.from(DIARY_AI_CONSENT_TABLE)
		.select('status, policy_version, revoked_at')
		.eq('user_id', userId)
		.eq('scope', DIARY_AI_CONSENT_SCOPE)
		.maybeSingle();

	if (error) return false;

	return isCurrentDiaryAiConsent(data as DiaryAiConsentRow | null);
}

export async function grantDiaryAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	const now = new Date().toISOString();
	const { error } = await client.from(DIARY_AI_CONSENT_TABLE).upsert(
		{
			user_id: userId,
			scope: DIARY_AI_CONSENT_SCOPE,
			status: 'granted',
			policy_version: DIARY_AI_CONSENT_POLICY_VERSION,
			granted_at: now,
			revoked_at: null,
			updated_at: now
		},
		{ onConflict: 'user_id,scope' }
	);

	return !error;
}

export async function revokeDiaryAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	const now = new Date().toISOString();
	const { error } = await client.from(DIARY_AI_CONSENT_TABLE).upsert(
		{
			user_id: userId,
			scope: DIARY_AI_CONSENT_SCOPE,
			status: 'revoked',
			policy_version: DIARY_AI_CONSENT_POLICY_VERSION,
			revoked_at: now,
			updated_at: now
		},
		{ onConflict: 'user_id,scope' }
	);

	return !error;
}
