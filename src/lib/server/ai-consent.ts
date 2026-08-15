import type { SupabaseClient } from '@supabase/supabase-js';

// Gemensam kärna för serverägt AI-samtycke. Diary och chat har olika scope och
// egen policyversion, men delar tabell, fail-closed-logik och skrivvägar.
//
// Modulen är avsiktligt liten: den känner inte till några scope-namn, den tar
// dem som argument. Scope-värdena bor hos respektive funktion (diary-ai-consent,
// chat-ai-consent) så att ett scope aldrig kan råka läcka in i fel flöde.

export const AI_CONSENT_TABLE = 'user_ai_consents';

type AiConsentRow = {
	status: string;
	policy_version: string;
	revoked_at: string | null;
};

function isCurrentConsent(row: AiConsentRow | null, policyVersion: string): boolean {
	return Boolean(
		row &&
		row.status === 'granted' &&
		row.policy_version === policyVersion &&
		row.revoked_at === null
	);
}

/**
 * Fail-closed kontroll. Saknad rad, revoked, fel policyversion och DB-fel ger
 * alla false. Läser aldrig localStorage, request headers eller user_metadata.
 */
export async function hasAiConsent(
	client: SupabaseClient,
	userId: string,
	scope: string,
	policyVersion: string
): Promise<boolean> {
	const { data, error } = await client
		.from(AI_CONSENT_TABLE)
		.select('status, policy_version, revoked_at')
		.eq('user_id', userId)
		.eq('scope', scope)
		.maybeSingle();

	if (error) return false;

	return isCurrentConsent(data as AiConsentRow | null, policyVersion);
}

export async function grantAiConsent(
	client: SupabaseClient,
	userId: string,
	scope: string,
	policyVersion: string
): Promise<boolean> {
	const now = new Date().toISOString();
	const { error } = await client.from(AI_CONSENT_TABLE).upsert(
		{
			user_id: userId,
			scope,
			status: 'granted',
			policy_version: policyVersion,
			granted_at: now,
			revoked_at: null,
			updated_at: now
		},
		{ onConflict: 'user_id,scope' }
	);

	return !error;
}

export async function revokeAiConsent(
	client: SupabaseClient,
	userId: string,
	scope: string,
	policyVersion: string
): Promise<boolean> {
	const now = new Date().toISOString();
	const { error } = await client.from(AI_CONSENT_TABLE).upsert(
		{
			user_id: userId,
			scope,
			status: 'revoked',
			policy_version: policyVersion,
			revoked_at: now,
			updated_at: now
		},
		{ onConflict: 'user_id,scope' }
	);

	return !error;
}
