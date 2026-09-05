import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getAnalyticsPageFields } from './analytics';
import { consumeDiaryCheckinPrefill, writeDiaryCheckinPrefill } from './diary-draft';

const projectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

function memoryStorage() {
	const values = new Map<string, string>();
	return {
		getItem: (key: string) => values.get(key) ?? null,
		setItem: (key: string, value: string) => values.set(key, value),
		removeItem: (key: string) => values.delete(key)
	};
}

describe('privacy-safe navigation and analytics', () => {
	it('hands diary prefill over once without a URL', () => {
		const storage = memoryStorage();
		writeDiaryCheckinPrefill('  Ofarlig testtext  ', storage);
		expect(consumeDiaryCheckinPrefill(storage)).toBe('Ofarlig testtext');
		expect(consumeDiaryCheckinPrefill(storage)).toBe('');
	});

	it('strips query strings and fragments from GA page fields', () => {
		const fields = getAnalyticsPageFields(
			new URL('https://mittpsyke.se/dagbok/checkin?prefill=privat#skriv-sjalv')
		);
		expect(fields).toEqual({
			page_path: '/dagbok/checkin',
			page_location: 'https://mittpsyke.se/dagbok/checkin'
		});
		expect(JSON.stringify(fields)).not.toContain('privat');
	});

	it('keeps search text out of active URLs, caches, and analytics payloads', () => {
		const page = projectFile('../routes/sok/+page.svelte');
		const endpoint = projectFile('../routes/api/search/+server.ts');
		expect(page).toContain("fetch('/api/search', {");
		expect(page).not.toContain('/api/search?q=');
		expect(page).not.toMatch(/trackEvent\([\s\S]{0,160}query:\s*normalizedQuery/);
		expect(endpoint).not.toContain('TtlCache');
		expect(endpoint).toContain("'cache-control': 'no-store'");
	});

	it('does not build sensitive prefill query strings in active routes', () => {
		for (const path of [
			'../routes/checkin/+page.svelte',
			'../routes/dagars-avtryck/checkin/+page.svelte',
			'../routes/spegelvattnet/+page.svelte'
		]) {
			expect(projectFile(path)).not.toMatch(/checkin\?prefill=/);
		}
	});

	it('loads Ahrefs through the consent-gated analytics initializer', () => {
		expect(projectFile('../app.html')).not.toContain('analytics.ahrefs.com/analytics.js');
		const analytics = projectFile('./analytics.ts');
		expect(analytics).toContain('Promise.all([loadGtagScript(), loadAhrefsScript()])');
		expect(analytics).toContain('!hasAnalyticsConsent()');
	});
});

describe('server-owned AI consent boundaries', () => {
	it('gates both Storify provider routes before Anthropic', () => {
		for (const path of [
			'../routes/api/storify/chat/+server.ts',
			'../routes/api/storify/generate/+server.ts'
		]) {
			const source = projectFile(path);
			const consent = source.indexOf('hasStorifyAiConsent(serviceClient, user.id)');
			const provider = source.indexOf("fetch('https://api.anthropic.com/v1/messages'");
			expect(consent).toBeGreaterThan(-1);
			expect(provider).toBeGreaterThan(consent);
			expect(source).not.toMatch(/console\.error\([^\n]*await anthropicResponse\.text\(\)/);
		}
	});

	it('keeps Storify consent separate from diary reflection consent', () => {
		const helper = projectFile('./server/storify-ai-consent.ts');
		const migration = projectFile('../../supabase/migrations/20260905130000_add_storify_ai_consent_scope.sql');
		expect(helper).toContain("STORIFY_AI_CONSENT_SCOPE = 'diary_ai_storify'");
		expect(helper).not.toContain('diary_ai_reflection');
		expect(migration).toContain("'diary_ai_storify'");
	});

	it('gates Spegelvattnet before diary content is loaded', () => {
		const source = projectFile('./server/spegelvattnet.ts');
		const consent = source.indexOf('hasWeeklySummaryAiConsent(supabase, userId)');
		const diaryRead = source.indexOf('await loadPosts(supabase, userId, weekStart)');
		expect(consent).toBeGreaterThan(-1);
		expect(diaryRead).toBeGreaterThan(consent);
	});

	it('does not accept privileged cron secrets from query strings', () => {
		for (const path of [
			'../routes/api/cron/guest-cleanup/+server.ts',
			'../routes/api/cron/reindex-search/+server.ts',
			'../routes/api/cron/spegelvattnet/+server.ts'
		]) {
			expect(projectFile(path)).not.toContain("searchParams.get('secret')");
		}
	});
});
