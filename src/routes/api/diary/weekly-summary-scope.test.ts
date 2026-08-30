import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
	AI_CONSENT_TABLE,
	grantAiConsent,
	hasAiConsent,
	revokeAiConsent
} from '$lib/server/ai-consent';
import {
	DIARY_AI_CONSENT_POLICY_VERSION,
	DIARY_AI_CONSENT_SCOPE
} from '$lib/server/diary-ai-consent';
import {
	WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION,
	WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
	WEEKLY_SUMMARY_CONSENT_COPY,
	hasWeeklySummaryAiConsent
} from '$lib/server/weekly-summary-ai-consent';
import type { SupabaseClient } from '@supabase/supabase-js';

/* SCOPE-OBEROENDE
 *
 * Det som ska bevisas är inte att grinden fungerar - det finns redan tester på.
 * Det är att weekly-summary och dagboksreflektionen är TVÅ samtycken, åt båda
 * håll. Ett granted diary_ai_reflection får inte öppna veckosammanfattningen,
 * och tvärtom. Utan de här testerna kan ett scope-namn ändras på ett ställe och
 * tyst omtolka ett samtycke användare redan gett.
 */

type Row = { scope: string; status: string; policy_version: string; revoked_at: string | null };

/** Minimal klient som svarar med de rader testet definierat, per scope. */
function clientWith(rows: Row[]) {
	return {
		from(table: string) {
			expect(table).toBe(AI_CONSENT_TABLE);
			return {
				select: () => ({
					eq: (_c1: string, _userId: string) => ({
						eq: (_c2: string, scope: string) => ({
							maybeSingle: async () => ({
								data: rows.find((row) => row.scope === scope) ?? null,
								error: null
							})
						})
					})
				})
			};
		}
	} as unknown as SupabaseClient;
}

const reflectionGranted: Row = {
	scope: DIARY_AI_CONSENT_SCOPE,
	status: 'granted',
	policy_version: DIARY_AI_CONSENT_POLICY_VERSION,
	revoked_at: null
};
const weeklyGranted: Row = {
	scope: WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
	status: 'granted',
	policy_version: WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION,
	revoked_at: null
};

const hasReflection = (client: SupabaseClient) =>
	hasAiConsent(client, 'user-1', DIARY_AI_CONSENT_SCOPE, DIARY_AI_CONSENT_POLICY_VERSION);

describe('weekly-summary har ett eget samtycke', () => {
	it('använder ett annat scope och en annan policyversion än reflektionen', () => {
		expect(WEEKLY_SUMMARY_AI_CONSENT_SCOPE).toBe('diary_ai_weekly_summary');
		expect(WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION).toBe('diary-weekly-summary-v1');
		expect(WEEKLY_SUMMARY_AI_CONSENT_SCOPE).not.toBe(DIARY_AI_CONSENT_SCOPE);
		expect(WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION).not.toBe(DIARY_AI_CONSENT_POLICY_VERSION);
	});

	// H + LEGACY: kärnbeviset. En användare som redan gett reflektionssamtycke
	// ska inte tyst anses ha godkänt veckosammanfattningen.
	it('blockerar en användare som bara har diary_ai_reflection', async () => {
		const client = clientWith([reflectionGranted]);

		expect(await hasReflection(client)).toBe(true);
		expect(await hasWeeklySummaryAiConsent(client, 'user-1')).toBe(false);
	});

	it('släpper igenom när weekly-summary är granted med rätt policy', async () => {
		expect(await hasWeeklySummaryAiConsent(clientWith([weeklyGranted]), 'user-1')).toBe(true);
	});

	// G: åt andra hållet.
	it('ger inte reflektionsåtkomst av ett weekly-summary-samtycke', async () => {
		const client = clientWith([weeklyGranted]);

		expect(await hasWeeklySummaryAiConsent(client, 'user-1')).toBe(true);
		expect(await hasReflection(client)).toBe(false);
	});

	it('blockerar när weekly-summary är återkallat', async () => {
		const revoked = { ...weeklyGranted, status: 'revoked', revoked_at: '2026-08-30T00:00:00.000Z' };

		expect(await hasWeeklySummaryAiConsent(clientWith([revoked]), 'user-1')).toBe(false);
	});

	// STALE POLICY: ingen fallback, ingen automatisk uppgradering.
	it('blockerar när policyversionen är en annan', async () => {
		const stale = { ...weeklyGranted, policy_version: 'diary-weekly-summary-v0' };

		expect(await hasWeeklySummaryAiConsent(clientWith([stale]), 'user-1')).toBe(false);
	});

	it('blockerar när ingen rad alls finns', async () => {
		expect(await hasWeeklySummaryAiConsent(clientWith([]), 'user-1')).toBe(false);
	});

	it('blockerar vid databasfel', async () => {
		const failing = {
			from: () => ({
				select: () => ({
					eq: () => ({
						eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'nere' } }) })
					})
				})
			})
		} as unknown as SupabaseClient;

		expect(await hasWeeklySummaryAiConsent(failing, 'user-1')).toBe(false);
	});
});

describe('grant och revoke rör bara sitt eget scope', () => {
	/** Fångar raden som skrivs, utan att röra någon databas. */
	function recordingClient() {
		const written: Record<string, unknown>[] = [];
		const client = {
			from: () => ({
				upsert: async (row: Record<string, unknown>) => {
					written.push(row);
					return { error: null };
				}
			})
		} as unknown as SupabaseClient;
		return { client, written };
	}

	it('skriver weekly-summary-scopet vid grant', async () => {
		const { client, written } = recordingClient();

		await grantAiConsent(
			client,
			'user-1',
			WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
			WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION
		);

		expect(written).toHaveLength(1);
		expect(written[0]).toMatchObject({
			scope: 'diary_ai_weekly_summary',
			status: 'granted',
			policy_version: 'diary-weekly-summary-v1'
		});
	});

	it('rör inte reflektionens eller chattens rad vid revoke', async () => {
		const { client, written } = recordingClient();

		await revokeAiConsent(
			client,
			'user-1',
			WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
			WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION
		);

		expect(written).toHaveLength(1);
		expect(written[0].scope).toBe('diary_ai_weekly_summary');
		// Primärnyckeln är (user_id, scope), så en upsert kan bara träffa sin egen rad.
		expect(written.some((row) => row.scope === DIARY_AI_CONSENT_SCOPE)).toBe(false);
		expect(written.some((row) => row.scope === 'chat_ai_support')).toBe(false);
	});
});

describe('routen och endpointen använder rätt scope', () => {
	const read = (relative: string) => readFileSync(join(process.cwd(), relative), 'utf8');

	it('weekly-summary-routen grindas av weekly-summary-samtycket', () => {
		const route = read('src/routes/api/diary/weekly-summary/+server.ts');

		expect(route).toContain('hasWeeklySummaryAiConsent(serviceClient, user.id)');
		expect(route).not.toContain('hasDiaryAiConsent');
	});

	// E + F: ordningen är det starkare kravet. Utan samtycke ska varken
	// dagboksinnehåll läsas eller providern anropas.
	it('kontrollerar samtycket före dagboksdata och före providern', () => {
		const route = read('src/routes/api/diary/weekly-summary/+server.ts');
		const consent = route.indexOf('hasWeeklySummaryAiConsent(serviceClient');
		const diaryRead = route.indexOf(".from('diary')");
		const provider = route.indexOf('generateAIText(');

		expect(consent).toBeGreaterThan(-1);
		expect(consent).toBeLessThan(diaryRead);
		expect(consent).toBeLessThan(provider);
	});

	it('reflection-routerna behåller sitt eget scope', () => {
		for (const relative of [
			'src/routes/api/diary/reflect/+server.ts',
			'src/routes/api/diary/checkin-reflection/+server.ts'
		]) {
			const source = read(relative);

			expect(source, relative).toContain('hasDiaryAiConsent');
			expect(source, relative).not.toContain('hasWeeklySummaryAiConsent');
		}
	});

	// J: klienten får aldrig bestämma scope eller policy.
	it('endpointen använder serverkonstanter, aldrig klientinput', () => {
		const endpoint = read('src/routes/api/consent/diary-weekly-summary/+server.ts');

		expect(endpoint).toContain('WEEKLY_SUMMARY_AI_CONSENT_POLICY_VERSION');
		expect(endpoint).toContain('hasWeeklySummaryAiConsent');
		expect(endpoint).toContain('grantWeeklySummaryAiConsent');
		expect(endpoint).toContain('revokeWeeklySummaryAiConsent');
		// Inget scope eller policyvärde läses ur request body.
		expect(endpoint).not.toContain('request.json()');
		expect(endpoint).not.toContain('diary_ai_reflection');
		// Skrivning sker med service-role, aldrig med användarens egen klient.
		expect(endpoint).toContain('createServiceClient()');
	});
});

describe('canonical consent-copy', () => {
	const copy = WEEKLY_SUMMARY_CONSENT_COPY;
	const all = [copy.title, copy.dataLabel, copy.serviceLabel, copy.activeChoice].join(' ');

	it('beskriver flera sparade inlägg från en vald period', () => {
		expect(copy.dataLabel).toContain('dagboksinlägg');
		expect(copy.dataLabel).toMatch(/period/i);
	});

	it('namnger både MittPsyke och OpenAI', () => {
		expect(copy.serviceLabel).toContain('MittPsyke');
		expect(copy.serviceLabel).toContain('OpenAI');
	});

	it('beskriver ändamålet som trender och mönster', () => {
		expect(copy.serviceLabel).toMatch(/känslotrender/i);
		expect(copy.serviceLabel).toMatch(/mönster/i);
	});

	it('säger att användaren väljer funktionen aktivt', () => {
		expect(copy.activeChoice).toMatch(/själv väljer/i);
	});

	it('lovar ingenting koden inte håller', () => {
		for (const forbidden of ['anonymis', 'säkert hos', 'privat från', 'medicinsk', 'kryptera']) {
			expect(all.toLowerCase(), forbidden).not.toContain(forbidden);
		}
	});
});
