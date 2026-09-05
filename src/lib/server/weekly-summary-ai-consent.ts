import type { SupabaseClient } from '@supabase/supabase-js';
import { hasAiConsent } from '$lib/server/ai-consent';

export const WEEKLY_SUMMARY_AI_CONSENT_SCOPE = 'diary_ai_weekly_summary';
export const WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION = 'weekly-summary-v1';

/** Fail closed: no row, revoked/stale consent, or a DB error all deny access. */
export function hasWeeklySummaryAiConsent(client: SupabaseClient, userId: string) {
	return hasAiConsent(
		client,
		userId,
		WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
		WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION
	);
}
