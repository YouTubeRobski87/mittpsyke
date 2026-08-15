import type { SupabaseClient } from '@supabase/supabase-js';
import { grantAiConsent, hasAiConsent, revokeAiConsent } from '$lib/server/ai-consent';

export const DIARY_AI_CONSENT_SCOPE = 'diary_ai_reflection';
export const DIARY_AI_CONSENT_POLICY_VERSION = 'diary-ai-v1';

/**
 * Canonical, fail-closed authorization check for diary AI. This deliberately
 * does not inspect client localStorage, request headers, or user_metadata.
 *
 * Logiken ligger i $lib/server/ai-consent, som chatten delar. Scope och
 * policyversion bestäms här, så dagbokens grind aldrig kan råka svara på ett
 * samtycke som getts för ett annat ändamål.
 */
export async function hasDiaryAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return hasAiConsent(client, userId, DIARY_AI_CONSENT_SCOPE, DIARY_AI_CONSENT_POLICY_VERSION);
}

export async function grantDiaryAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return grantAiConsent(client, userId, DIARY_AI_CONSENT_SCOPE, DIARY_AI_CONSENT_POLICY_VERSION);
}

export async function revokeDiaryAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return revokeAiConsent(client, userId, DIARY_AI_CONSENT_SCOPE, DIARY_AI_CONSENT_POLICY_VERSION);
}
