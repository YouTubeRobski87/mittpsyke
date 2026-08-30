import type { SupabaseClient } from '@supabase/supabase-js';
import { grantAiConsent, hasAiConsent, revokeAiConsent } from '$lib/server/ai-consent';

// Copyn bor klient-säkert så att checkin-sidan kan visa den. Återexporteras här
// för att hålla samman scope, policy och den text användaren faktiskt godkänner.
export { DAILY_QUESTION_CONSENT_COPY } from '$lib/daily-question-consent-copy';

/*
 * Dagens fråga är en annan behandling än dagboksreflektionen, av tre skäl som
 * var för sig hade räckt:
 *
 *   * providern är Anthropic, medan diary_ai_reflection-copyn namnger OpenAI
 *   * ändamålet är att skapa en NY fråga ur historisk dagbokskontext, inte att
 *     spegla tillbaka en text användaren just skrev
 *   * underlaget är härlett ur tidigare inlägg, inte den aktuella incheckningen
 *
 * Eget scope och egen policyversion, utan fallback: ett granted
 * diary_ai_reflection ger noll access här, och tvärtom.
 */
export const DAILY_QUESTION_AI_CONSENT_SCOPE = 'diary_ai_daily_question';
export const DAILY_QUESTION_AI_CONSENT_POLICY_VERSION = 'diary-daily-question-v1';


/** Fail-closed. Saknad rad, revoked, fel policyversion och DB-fel ger alla false. */
export async function hasDailyQuestionAiConsent(
	client: SupabaseClient,
	userId: string
): Promise<boolean> {
	return hasAiConsent(
		client,
		userId,
		DAILY_QUESTION_AI_CONSENT_SCOPE,
		DAILY_QUESTION_AI_CONSENT_POLICY_VERSION
	);
}

export async function grantDailyQuestionAiConsent(
	client: SupabaseClient,
	userId: string
): Promise<boolean> {
	return grantAiConsent(
		client,
		userId,
		DAILY_QUESTION_AI_CONSENT_SCOPE,
		DAILY_QUESTION_AI_CONSENT_POLICY_VERSION
	);
}

export async function revokeDailyQuestionAiConsent(
	client: SupabaseClient,
	userId: string
): Promise<boolean> {
	return revokeAiConsent(
		client,
		userId,
		DAILY_QUESTION_AI_CONSENT_SCOPE,
		DAILY_QUESTION_AI_CONSENT_POLICY_VERSION
	);
}
