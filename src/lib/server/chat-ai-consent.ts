import type { SupabaseClient } from '@supabase/supabase-js';
import { grantAiConsent, hasAiConsent, revokeAiConsent } from '$lib/server/ai-consent';

// Eget scope, inte diary_ai_reflection. Chatten behandlar andra uppgifter
// (meddelanden användaren skriver här och nu) för ett annat ändamål
// (samtalsstöd). Ett samtycke till dagboksreflektion får därför aldrig
// auktorisera chatten, och tvärtom.
export const CHAT_AI_CONSENT_SCOPE = 'chat_ai_support';
export const CHAT_AI_CONSENT_POLICY_VERSION = 'chat-ai-v1';

/**
 * Fail-closed kontroll för AI-chatten. Läser aldrig localStorage, request
 * headers eller user_metadata - bara den serverägda raden.
 */
export async function hasChatAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return hasAiConsent(client, userId, CHAT_AI_CONSENT_SCOPE, CHAT_AI_CONSENT_POLICY_VERSION);
}

export async function grantChatAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return grantAiConsent(client, userId, CHAT_AI_CONSENT_SCOPE, CHAT_AI_CONSENT_POLICY_VERSION);
}

export async function revokeChatAiConsent(client: SupabaseClient, userId: string): Promise<boolean> {
	return revokeAiConsent(client, userId, CHAT_AI_CONSENT_SCOPE, CHAT_AI_CONSENT_POLICY_VERSION);
}
