// Hela livscykeln för Storify-samtycket, körd mot en fejkklient som modellerar
// produktionstabellen public.user_ai_consents så som den faktiskt ser ut efter
// migrationen 20260905130000:
//
//   - scope-constraint med exakt fem tillåtna värden
//   - status-constraint ('granted' | 'revoked')
//   - status_timestamps_check (granted => revoked_at is null,
//                              revoked  => revoked_at is not null)
//   - granted_at DEFAULT now() vid INSERT
//   - upsert med onConflict (user_id, scope) som bara skriver angivna kolumner
//
// Syftet är att kunna bevisa grant → has → revoke → has utan att röra en enda
// riktig användare eller produktionsrad. Ingen testdata lämnar processen.

import { beforeEach, describe, expect, it } from 'vitest';
import { grantAiConsent } from '$lib/server/ai-consent';
import {
	createFakeConsentDb,
	type ConsentRow
} from '$lib/server/__fixtures__/fake-consent-db';
import {
	STORIFY_AI_CONSENT_POLICY_VERSION,
	STORIFY_AI_CONSENT_SCOPE,
	grantStorifyAiConsent,
	hasStorifyAiConsent,
	revokeStorifyAiConsent
} from '$lib/server/storify-ai-consent';

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER_USER = '22222222-2222-4222-8222-222222222222';

/** Rader för andra scopes som aldrig får röras av Storify-flödet. */
const untouchedSeed = (): ConsentRow[] => [
	{
		user_id: USER,
		scope: 'chat_ai_support',
		status: 'granted',
		policy_version: 'chat-ai-v1',
		granted_at: '2026-09-01T10:00:00.000Z',
		revoked_at: null,
		updated_at: '2026-09-01T10:00:00.000Z'
	},
	{
		user_id: USER,
		scope: 'diary_ai_reflection',
		status: 'granted',
		policy_version: 'diary-ai-v1',
		granted_at: '2026-09-02T10:00:00.000Z',
		revoked_at: null,
		updated_at: '2026-09-02T10:00:00.000Z'
	},
	{
		user_id: OTHER_USER,
		scope: 'diary_ai_storify',
		status: 'granted',
		policy_version: STORIFY_AI_CONSENT_POLICY_VERSION,
		granted_at: '2026-09-03T10:00:00.000Z',
		revoked_at: null,
		updated_at: '2026-09-03T10:00:00.000Z'
	}
];

describe('Storify-samtyckets livscykel', () => {
	let db: ReturnType<typeof createFakeConsentDb>;

	beforeEach(() => {
		db = createFakeConsentDb(untouchedSeed());
	});

	it('börjar utan aktivt Storify-samtycke', async () => {
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(false);
		expect(db.find(USER, STORIFY_AI_CONSENT_SCOPE)).toBeNull();
	});

	it('beviljar med rätt scope, status, policyversion och granted_at', async () => {
		const before = Date.now();
		expect(await grantStorifyAiConsent(db.client, USER)).toBe(true);

		const row = db.find(USER, 'diary_ai_storify');
		expect(row).not.toBeNull();
		expect(row?.scope).toBe('diary_ai_storify');
		expect(row?.status).toBe('granted');
		expect(row?.policy_version).toBe('diary-storify-v1');
		expect(row?.revoked_at).toBeNull();
		expect(new Date(row!.granted_at).getTime()).toBeGreaterThanOrEqual(before);
	});

	it('rapporterar true efter grant', async () => {
		await grantStorifyAiConsent(db.client, USER);
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(true);
	});

	it('sätter status revoked och revoked_at vid återkallelse', async () => {
		await grantStorifyAiConsent(db.client, USER);
		const grantedAt = db.find(USER, 'diary_ai_storify')!.granted_at;

		expect(await revokeStorifyAiConsent(db.client, USER)).toBe(true);

		const row = db.find(USER, 'diary_ai_storify')!;
		expect(row.status).toBe('revoked');
		expect(row.revoked_at).not.toBeNull();
		expect(new Date(row.revoked_at!).getTime()).toBeGreaterThanOrEqual(
			new Date(grantedAt).getTime()
		);
		// granted_at ska bevaras - den är historik, inte ett fält som ska skrivas om.
		expect(row.granted_at).toBe(grantedAt);
	});

	it('rapporterar false efter återkallelse', async () => {
		await grantStorifyAiConsent(db.client, USER);
		await revokeStorifyAiConsent(db.client, USER);
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(false);
	});

	it('kan beviljas igen efter återkallelse', async () => {
		await grantStorifyAiConsent(db.client, USER);
		await revokeStorifyAiConsent(db.client, USER);
		expect(await grantStorifyAiConsent(db.client, USER)).toBe(true);

		const row = db.find(USER, 'diary_ai_storify')!;
		expect(row.status).toBe('granted');
		expect(row.revoked_at).toBeNull();
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(true);
	});

	it('blockerar ett scope som inte finns i constraintet', async () => {
		expect(await grantAiConsent(db.client, USER, 'not_a_real_scope', 'x')).toBe(false);
		expect(db.find(USER, 'not_a_real_scope')).toBeNull();
	});

	it('lämnar övriga consent-scopes orörda genom hela livscykeln', async () => {
		const before = db.snapshotExcept('diary_ai_storify');

		await hasStorifyAiConsent(db.client, USER);
		await grantStorifyAiConsent(db.client, USER);
		await hasStorifyAiConsent(db.client, USER);
		await revokeStorifyAiConsent(db.client, USER);
		await hasStorifyAiConsent(db.client, USER);

		expect(db.snapshotExcept('diary_ai_storify')).toBe(before);
	});

	it('rör inte en annan användares Storify-rad', async () => {
		const otherBefore = { ...db.find(OTHER_USER, 'diary_ai_storify')! };

		await grantStorifyAiConsent(db.client, USER);
		await revokeStorifyAiConsent(db.client, USER);

		expect(db.find(OTHER_USER, 'diary_ai_storify')).toEqual(otherBefore);
	});
});

describe('Storify-samtycket failar stängt', () => {
	let db: ReturnType<typeof createFakeConsentDb>;

	beforeEach(() => {
		db = createFakeConsentDb(untouchedSeed());
	});

	it('nekar när läsningen mot databasen misslyckas', async () => {
		await grantStorifyAiConsent(db.client, USER);
		db.failRead();
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(false);
	});

	it('rapporterar misslyckad skrivning i stället för att påstå att den lyckades', async () => {
		db.failWrite();
		expect(await grantStorifyAiConsent(db.client, USER)).toBe(false);
	});

	it('nekar när raden har en äldre policyversion', async () => {
		await grantAiConsent(db.client, USER, STORIFY_AI_CONSENT_SCOPE, 'diary-storify-v0');
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(false);
	});

	it('nekar när ett annat scope är beviljat', async () => {
		// chat_ai_support är beviljat i seeden. Det får aldrig auktorisera Storify.
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(false);
	});

	it('nekar när raden tillhör en annan användare', async () => {
		// OTHER_USER har ett giltigt Storify-samtycke i seeden.
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(false);
		expect(await hasStorifyAiConsent(db.client, OTHER_USER)).toBe(true);
	});
});

// Regression: revokeAiConsent upsertade tidigare, vilket skapade en rad även
// när användaren aldrig lämnat samtycket. Eftersom granted_at inte skickas med
// fyllde kolumnens DEFAULT now() i en tidpunkt, och consent-loggen påstod att
// samtycke gavs i samma ögonblick som det återkallades.
describe('återkallelse utan föregående beviljande', () => {
	it('skapar ingen samtyckesrad alls', async () => {
		const db = createFakeConsentDb();

		expect(await revokeStorifyAiConsent(db.client, USER)).toBe(true);
		expect(db.find(USER, 'diary_ai_storify')).toBeNull();
		expect(db.rows).toHaveLength(0);
	});

	it('är fail-closed: utan rad finns inget samtycke', async () => {
		const db = createFakeConsentDb();
		await revokeStorifyAiConsent(db.client, USER);
		expect(await hasStorifyAiConsent(db.client, USER)).toBe(false);
	});

	it('skriver aldrig ett granted_at för ett samtycke som inte lämnats', async () => {
		const db = createFakeConsentDb();
		await revokeStorifyAiConsent(db.client, USER);
		expect(db.rows.some((row) => row.scope === 'diary_ai_storify')).toBe(false);
	});
});
