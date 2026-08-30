import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { grantAiConsent, hasAiConsent, revokeAiConsent } from '$lib/server/ai-consent';
import {
	DIARY_AI_CONSENT_POLICY_VERSION,
	DIARY_AI_CONSENT_SCOPE
} from '$lib/server/diary-ai-consent';
import { WEEKLY_SUMMARY_AI_CONSENT_SCOPE } from '$lib/server/weekly-summary-ai-consent';
import {
	DAILY_QUESTION_AI_CONSENT_POLICY_VERSION,
	DAILY_QUESTION_AI_CONSENT_SCOPE,
	DAILY_QUESTION_CONSENT_COPY,
	hasDailyQuestionAiConsent
} from '$lib/server/daily-question-ai-consent';

/* Dagens fråga är en egen behandling: annan provider, annat ändamål, annat
   underlag. Testerna nedan bevisar att den har ett eget samtycke åt båda håll,
   och att ett sidbesök inte längre i sig orsakar AI-behandling. */

type Row = { scope: string; status: string; policy_version: string; revoked_at: string | null };

function clientWith(rows: Row[]) {
	return {
		from: () => ({
			select: () => ({
				eq: () => ({
					eq: (_c: string, scope: string) => ({
						maybeSingle: async () => ({
							data: rows.find((row) => row.scope === scope) ?? null,
							error: null
						})
					})
				})
			})
		})
	} as unknown as SupabaseClient;
}

const reflectionGranted: Row = {
	scope: DIARY_AI_CONSENT_SCOPE,
	status: 'granted',
	policy_version: DIARY_AI_CONSENT_POLICY_VERSION,
	revoked_at: null
};
const dailyGranted: Row = {
	scope: DAILY_QUESTION_AI_CONSENT_SCOPE,
	status: 'granted',
	policy_version: DAILY_QUESTION_AI_CONSENT_POLICY_VERSION,
	revoked_at: null
};
const weeklyGranted: Row = {
	scope: WEEKLY_SUMMARY_AI_CONSENT_SCOPE,
	status: 'granted',
	policy_version: 'diary-weekly-summary-v1',
	revoked_at: null
};

const hasReflection = (client: SupabaseClient) =>
	hasAiConsent(client, 'user-1', DIARY_AI_CONSENT_SCOPE, DIARY_AI_CONSENT_POLICY_VERSION);

const read = (relative: string) => readFileSync(join(process.cwd(), relative), 'utf8');
const dailyRoute = read('src/routes/api/daily-question/+server.ts');
const regenerateRoute = read('src/routes/api/daily-question/regenerate/+server.ts');
const page = read('src/routes/dagbok/checkin/+page.svelte');
const settings = read('src/routes/dashboard/installningar/+page.svelte');

describe('dagens fråga har ett eget samtycke', () => {
	it('använder eget scope och egen policyversion', () => {
		expect(DAILY_QUESTION_AI_CONSENT_SCOPE).toBe('diary_ai_daily_question');
		expect(DAILY_QUESTION_AI_CONSENT_POLICY_VERSION).toBe('diary-daily-question-v1');
		expect(DAILY_QUESTION_AI_CONSENT_SCOPE).not.toBe(DIARY_AI_CONSENT_SCOPE);
		expect(DAILY_QUESTION_AI_CONSENT_SCOPE).not.toBe(WEEKLY_SUMMARY_AI_CONSENT_SCOPE);
	});

	// LEGACY: kärnbeviset att gamla samtycken inte omtolkas.
	it('blockerar en användare som bara har diary_ai_reflection', async () => {
		const client = clientWith([reflectionGranted]);

		expect(await hasReflection(client)).toBe(true);
		expect(await hasDailyQuestionAiConsent(client, 'user-1')).toBe(false);
	});

	it('släpper igenom med rätt scope och policy', async () => {
		expect(await hasDailyQuestionAiConsent(clientWith([dailyGranted]), 'user-1')).toBe(true);
	});

	it('ger inte reflektionsåtkomst av ett daily-question-samtycke', async () => {
		const client = clientWith([dailyGranted]);

		expect(await hasDailyQuestionAiConsent(client, 'user-1')).toBe(true);
		expect(await hasReflection(client)).toBe(false);
	});

	it('ger inte daily-question-åtkomst av ett weekly-summary-samtycke', async () => {
		expect(await hasDailyQuestionAiConsent(clientWith([weeklyGranted]), 'user-1')).toBe(false);
	});

	it('blockerar återkallat samtycke', async () => {
		const revoked = { ...dailyGranted, status: 'revoked', revoked_at: '2026-08-30T00:00:00.000Z' };

		expect(await hasDailyQuestionAiConsent(clientWith([revoked]), 'user-1')).toBe(false);
	});

	// STALE POLICY: ingen automatisk uppgradering.
	it('blockerar en äldre policyversion', async () => {
		const stale = { ...dailyGranted, policy_version: 'diary-daily-question-v0' };

		expect(await hasDailyQuestionAiConsent(clientWith([stale]), 'user-1')).toBe(false);
	});

	it('blockerar vid saknad rad och vid databasfel', async () => {
		expect(await hasDailyQuestionAiConsent(clientWith([]), 'user-1')).toBe(false);

		const failing = {
			from: () => ({
				select: () => ({
					eq: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: { message: 'nere' } }) }) })
				})
			})
		} as unknown as SupabaseClient;
		expect(await hasDailyQuestionAiConsent(failing, 'user-1')).toBe(false);
	});
});

describe('grant och revoke rör bara sitt eget scope', () => {
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

	it('skriver daily-question-scopet vid grant', async () => {
		const { client, written } = recordingClient();

		await grantAiConsent(
			client,
			'user-1',
			DAILY_QUESTION_AI_CONSENT_SCOPE,
			DAILY_QUESTION_AI_CONSENT_POLICY_VERSION
		);

		expect(written[0]).toMatchObject({
			scope: 'diary_ai_daily_question',
			status: 'granted',
			policy_version: 'diary-daily-question-v1'
		});
	});

	it('rör inga andra scopes vid revoke', async () => {
		const { client, written } = recordingClient();

		await revokeAiConsent(
			client,
			'user-1',
			DAILY_QUESTION_AI_CONSENT_SCOPE,
			DAILY_QUESTION_AI_CONSENT_POLICY_VERSION
		);

		expect(written).toHaveLength(1);
		expect(written[0].scope).toBe('diary_ai_daily_question');
		for (const other of [DIARY_AI_CONSENT_SCOPE, WEEKLY_SUMMARY_AI_CONSENT_SCOPE, 'chat_ai_support']) {
			expect(written.some((row) => row.scope === other)).toBe(false);
		}
	});
});

describe('routerna grindas av rätt samtycke', () => {
	it('daily-question använder daily-question-helpern, inte reflektionens', () => {
		expect(dailyRoute).toContain('hasDailyQuestionAiConsent(serviceClient, user.id)');
		expect(dailyRoute).not.toContain('hasDiaryAiConsent');
	});

	it('regenerate använder samma scope, inte ett eget', () => {
		expect(regenerateRoute).toContain('hasDailyQuestionAiConsent(serviceClient, user.id)');
		expect(regenerateRoute).not.toContain('hasDiaryAiConsent');
	});

	it('kontrollerar samtycket före all dagboks- och providerkontakt', () => {
		const consent = dailyRoute.indexOf('hasDailyQuestionAiConsent(serviceClient');
		const cacheRead = dailyRoute.indexOf('readTodaysDailyQuestion(');
		const generation = dailyRoute.indexOf('getOrCreateDailyQuestion(');

		expect(consent).toBeGreaterThan(-1);
		expect(consent).toBeLessThan(cacheRead);
		expect(consent).toBeLessThan(generation);
	});

	it('reflection-routerna behåller sitt eget scope', () => {
		for (const relative of [
			'src/routes/api/diary/reflect/+server.ts',
			'src/routes/api/diary/checkin-reflection/+server.ts'
		]) {
			const source = read(relative);

			expect(source, relative).toContain('hasDiaryAiConsent');
			expect(source, relative).not.toContain('hasDailyQuestionAiConsent');
		}
	});

	it('endpointen använder serverkonstanter och läser aldrig request body', () => {
		const endpoint = read('src/routes/api/consent/diary-daily-question/+server.ts');

		expect(endpoint).toContain('DAILY_QUESTION_AI_CONSENT_POLICY_VERSION');
		expect(endpoint).toContain('hasDailyQuestionAiConsent');
		expect(endpoint).toContain('grantDailyQuestionAiConsent');
		expect(endpoint).toContain('revokeDailyQuestionAiConsent');
		expect(endpoint).toContain('createServiceClient()');
		expect(endpoint).not.toContain('request.json()');
		expect(endpoint).not.toContain('diary_ai_reflection');
	});
});

describe('ett sidbesök orsakar ingen ny AI-behandling', () => {
	it('genererar bara när anropet uttryckligen ber om det', () => {
		// Utan ?generate=true läses enbart den redan sparade raden.
		expect(dailyRoute).toContain("url.searchParams.get('generate') !== 'true'");
		expect(dailyRoute).toContain('readTodaysDailyQuestion(locals.supabase, user.id)');
	});

	it('läser dagens sparade fråga utan att röra dagboken eller providern', () => {
		const helper = read('src/lib/server/daily-question.ts');
		const start = helper.indexOf('export async function readTodaysDailyQuestion');
		const body = helper.slice(start, helper.indexOf('export async function getOrCreateDailyQuestion'));

		expect(body).toContain("from('daily_questions')");
		expect(body).not.toContain("from('diary')");
		expect(body).not.toContain('callClaude');
		expect(body).not.toContain('buildDailyQuestionContext');
	});

	it('hämtar inte frågan automatiskt vid sidladdning', () => {
		// onMount anropar utan generate. Knappen går via requestDailyQuestion, som
		// kontrollerar samtycket innan den ber om generering.
		expect(page).toContain('void loadDailyQuestion();');
		expect(page).toContain('onclick={requestDailyQuestion}');
		expect(page).toContain("'/api/daily-question?generate=true'");
	});

	it('visar ett aktivt val när ingen sparad fråga finns', () => {
		expect(page).toContain('dailyQuestionNeedsGeneration');
		expect(page).toContain('Hämta dagens fråga');
	});
});

describe('canonical consent-copy', () => {
	const copy = DAILY_QUESTION_CONSENT_COPY;
	const all = [copy.title, copy.dataLabel, copy.serviceLabel, copy.activeChoice].join(' ');

	it('namnger den provider som faktiskt används', () => {
		expect(copy.serviceLabel).toContain('Anthropic');
		expect(copy.serviceLabel).not.toContain('OpenAI');
	});

	it('beskriver den faktiska dataminimeringen', () => {
		expect(copy.dataLabel).toMatch(/kort utdrag/i);
		expect(copy.dataLabel).toMatch(/humörvärden|trend|återkommande ord/i);
		// Lovar inte att hela dagboken skickas, och inte heller motsatsen.
		expect(copy.dataLabel.toLowerCase()).not.toContain('hela din dagbok');
	});

	it('beskriver ändamålet som en reflektionsfråga', () => {
		expect(copy.serviceLabel).toMatch(/fråga att reflektera/i);
	});

	it('säger att användaren väljer aktivt och kan återkalla', () => {
		expect(copy.activeChoice).toMatch(/själv väljer/i);
		expect(copy.activeChoice).toMatch(/återkalla/i);
	});

	it('lovar ingenting koden inte håller', () => {
		for (const forbidden of ['anonymis', 'diagnos', 'medicinsk', 'behandling', 'kryptera', 'säkert hos']) {
			expect(all.toLowerCase(), forbidden).not.toContain(forbidden);
		}
	});
});

/* JUST-IN-TIME CONSENT
   Grinden ska visas när användaren ber om frågan och saknar samtycke - inte
   vid sidladdning, och aldrig efter att dagbokskontext redan skickats. */
describe('samtycket ges just-in-time i UI:t', () => {
	it('läser samtyckesstatus via endpointen, aldrig direkt mot Supabase', () => {
		expect(page).toContain("fetch('/api/consent/diary-daily-question')");
		expect(page).toContain('dailyQuestionConsent');
	});

	it('gör ingen consent-POST och ingen generering vid sidladdning', () => {
		const call = page.indexOf('void loadDailyQuestion();');
		const mount = page.slice(call - 600, call + 60);

		// Anropet saknar generate-flagga: servern läser bara cachen.
		expect(mount).toContain('void loadDailyQuestion();');
		expect(mount).not.toContain('loadDailyQuestion(true)');
		expect(mount).not.toContain('generate=true');
		expect(mount).not.toContain("method: 'POST'");
		expect(mount).not.toContain('requestDailyQuestion');
	});

	it('visar grinden i stället för att generera när samtycke saknas', () => {
		const request = page.slice(page.indexOf('async function requestDailyQuestion'), page.indexOf('async function loadDailyQuestion(generate'));

		expect(request).toContain('showDailyQuestionConsentGate = true;');
		expect(request).toContain('return;');
		// Genereringen ligger efter kontrollen, inte före.
		expect(request.indexOf('showDailyQuestionConsentGate = true;')).toBeLessThan(
			request.indexOf('loadDailyQuestion(true)')
		);
	});

	it('hämtar frågan direkt efter godkännande, utan extra klick', () => {
		const accept = page.slice(page.indexOf('async function acceptDailyQuestionConsent'), page.indexOf('async function requestDailyQuestion'));

		expect(accept).toContain("fetch('/api/consent/diary-daily-question', { method: 'POST' })");
		expect(accept).toContain('await loadDailyQuestion(true);');
	});

	it('genererar ingenting om användaren avbryter', () => {
		// "Inte nu" stänger bara grinden.
		expect(page).toContain('Inte nu');
		expect(page).toContain('onclick={() => (showDailyQuestionConsentGate = false)}');
	});

	it('går direkt på generering när samtycket redan är giltigt', () => {
		const request = page.slice(page.indexOf('async function requestDailyQuestion'), page.indexOf('async function loadDailyQuestion(generate'));

		expect(request).toContain('if (!dailyQuestionConsent) {');
		expect(request).toContain('await loadDailyQuestion(true);');
	});

	it('behandlar 403 som ett samtyckesläge, inte som ett fel', () => {
		const load = page.slice(page.indexOf('async function loadDailyQuestion(generate'), page.indexOf('async function answerDailyQuestion'));

		expect(load).toContain('if (response.status === 403)');
		expect(load).toContain('dailyQuestionConsent = false;');
		expect(load).toContain('dailyQuestionNeedsGeneration = true;');
		// Ingen felcopy för saknat samtycke.
		const forbidden = load.indexOf('if (response.status === 403)');
		const errorLine = load.indexOf("dailyQuestionError = payload.error");
		expect(forbidden).toBeLessThan(errorLine);
	});

	it('skiljer serverfel från saknat samtycke', () => {
		const load = page.slice(page.indexOf('async function loadDailyQuestion(generate'), page.indexOf('async function answerDailyQuestion'));

		expect(load).toContain('if (!response.ok) {');
		expect(load).toContain('Kunde inte hämta dagens fråga just nu.');
	});

	it('märker reservfrågan så den inte ser ut som dagens genererade fråga', () => {
		expect(page).toContain('Det här är en allmän fråga. Dagens egna fråga hämtas när du väljer det.');
	});

	it('använder den delade copyn i stället för en egen kopia', () => {
		expect(page).toContain("import { DAILY_QUESTION_CONSENT_COPY } from '$lib/daily-question-consent-copy'");
		expect(page).toContain('DAILY_QUESTION_CONSENT_COPY.dataLabel');
		expect(page).toContain('DAILY_QUESTION_CONSENT_COPY.serviceLabel');
		// Ingen manuellt dubblerad text.
		expect(page).not.toContain('MittPsyke och Anthropic för att skapa');
	});
});

describe('återkallelse i inställningar', () => {
	it('använder daily-questionens egen endpoint', () => {
		const withdraw = settings.slice(settings.indexOf('async function withdrawDailyQuestionConsent'), settings.indexOf('async function loadDiaryAiConsent'));

		expect(withdraw).toContain("fetch('/api/consent/diary-daily-question', {");
		expect(withdraw).toContain("method: 'DELETE'");
		expect(withdraw).not.toContain("'/api/consent/diary-ai'");
	});

	it('skiljer copyn från AI-reflektionernas samtycke', () => {
		expect(settings).toContain('Samtycke för dagens reflektionsfråga');
		expect(settings).toContain('Återkalla samtycke för dagens fråga');
		// Reflektionernas egen sektion är oförändrad.
		expect(settings).toContain('Samtycke för AI-reflektioner i dagboken');
		expect(settings).toContain('Återkalla samtycke för AI-reflektioner');
	});

	it('rör inte övriga scopes', () => {
		const withdraw = settings.slice(settings.indexOf('async function withdrawDailyQuestionConsent'), settings.indexOf('async function loadDiaryAiConsent'));

		for (const other of ['diary-weekly-summary', 'chat-ai']) {
			expect(withdraw, other).not.toContain(other);
		}
	});
});
