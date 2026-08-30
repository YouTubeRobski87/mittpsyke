import type { SupabaseClient } from '@supabase/supabase-js';
import { grantAiConsent, hasAiConsent, revokeAiConsent } from '$lib/server/ai-consent';

/*
 * Veckosammanfattningen är en annan behandling än dagboksreflektionen.
 *
 * diary_ai_reflection bygger på copy som beskriver en aktivt vald reflektion på
 * EN incheckning. Weekly-summary skickar flera sparade inlägg över en period för
 * att beskriva känslotrender och övergripande mönster. Att låta det gamla scopet
 * täcka det hade breddat betydelsen av ett samtycke användare redan gett.
 *
 * Därför eget scope och egen policyversion, utan fallback: ett granted
 * diary_ai_reflection ger noll access här, och tvärtom.
 */
export const WEEKLY_SUMMARY_AI_CONSENT_SCOPE = 'diary_ai_weekly_summary';
export const WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION = 'diary-weekly-summary-v1';

/**
 * Canonical copy för veckosammanfattningens samtycke.
 *
 * Ligger här och inte i safety-copy.ts, eftersom den modulen uttryckligen säger
 * att information om databehandling hör hemma i sitt eget sammanhang. Formen
 * matchar ConsentGate:s `dataLabel`/`serviceLabel`, så den kan användas den dag
 * funktionen får ett gränssnitt - utan att någon behöver formulera om den.
 *
 * Säger medvetet ingenting om anonymisering eller att innehållet skulle vara
 * skyddat hos providern. Fulltexten för periodens inlägg skickas som den är.
 */
export const WEEKLY_SUMMARY_CONSENT_COPY = {
	title: 'Innan du skapar en sammanfattning',
	dataLabel: 'Dina sparade dagboksinlägg från den period du väljer',
	serviceLabel:
		'MittPsyke och OpenAI för att beskriva känslotrender och övergripande mönster',
	/** Visas som förtydligande: funktionen är aldrig automatisk. */
	activeChoice:
		'Sammanfattningen skapas bara när du själv väljer att göra den, och du kan återkalla samtycket när du vill.'
} as const;

/** Fail-closed. Saknad rad, revoked, fel policyversion och DB-fel ger alla false. */
export async function hasWeeklySummaryAiConsent(
	client: SupabaseClient,
	userId: string
): Promise<boolean> {
	return hasAiConsent(
		client,
		userId,
		WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
		WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION
	);
}

export async function grantWeeklySummaryAiConsent(
	client: SupabaseClient,
	userId: string
): Promise<boolean> {
	return grantAiConsent(
		client,
		userId,
		WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
		WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION
	);
}

export async function revokeWeeklySummaryAiConsent(
	client: SupabaseClient,
	userId: string
): Promise<boolean> {
	return revokeAiConsent(
		client,
		userId,
		WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
		WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION
	);
}
