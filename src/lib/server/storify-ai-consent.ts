import type { SupabaseClient } from '@supabase/supabase-js';
import { grantAiConsent, hasAiConsent, revokeAiConsent } from '$lib/server/ai-consent';

export const STORIFY_AI_CONSENT_SCOPE = 'diary_ai_storify';
export const STORIFY_AI_CONSENT_POLICY_VERSION = 'diary-storify-v1';

/** Fail closed: missing, revoked, stale, or unreadable consent always denies access. */
export async function hasStorifyAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return hasAiConsent(client, userId, STORIFY_AI_CONSENT_SCOPE, STORIFY_AI_CONSENT_POLICY_VERSION);
}

export async function grantStorifyAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return grantAiConsent(client, userId, STORIFY_AI_CONSENT_SCOPE, STORIFY_AI_CONSENT_POLICY_VERSION);
}

export async function revokeStorifyAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return revokeAiConsent(client, userId, STORIFY_AI_CONSENT_SCOPE, STORIFY_AI_CONSENT_POLICY_VERSION);
}
