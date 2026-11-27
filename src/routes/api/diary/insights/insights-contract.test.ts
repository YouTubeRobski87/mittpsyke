import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
import { buildProgressAnalysis } from '$lib/server/progress-analysis';
import { loadProgressRows } from '$lib/server/progress-rows';

function endpointSource() {
	return readFileSync(new URL('./+server.ts', import.meta.url), 'utf8');
}

/** Periodens rader hämtas i en delad modul som även AI-sammanfattningen använder. */
function rowsSource() {
	return readFileSync(new URL('../../../../lib/server/progress-rows.ts', import.meta.url), 'utf8');
}

describe('Framstegsanalysens endpointkontrakt', () => {
	it('behåller samtycke, verifierad auth och användarscope före läsningen', () => {
		const source = endpointSource();
		const consent = source.indexOf('hasSensitiveConsentHeader(request)');
		const auth = source.indexOf('supabase.auth.getUser()');
		const read = source.indexOf('loadProgressRows(supabase, user.id, period)');

		expect(consent).toBeGreaterThan(-1);
		expect(auth).toBeGreaterThan(consent);
		expect(read).toBeGreaterThan(auth);
		expect(rowsSource()).toContain(".eq('user_id', userId)");
		expect(source).not.toMatch(/service_role|SUPABASE_SERVICE|createServiceClient/i);
	});

	it('begränsar först till vald tidsperiod och markerar träffad läsgräns', () => {
		const source = rowsSource();
		const periodFilter = source.indexOf(".gte('created_at', queryStart)");
		const limit = source.indexOf('.limit(INSIGHTS_ROW_LIMIT)');

		expect(periodFilter).toBeGreaterThan(-1);
		expect(limit).toBeGreaterThan(periodFilter);
		// id behövs för att underlaget ska kunna peka på originalinlägget.
		expect(source).toContain("select('id, created_at, mood, text, tags', { count: 'exact' })");
		expect(source).toContain('truncated: (count ?? data?.length ?? 0) > INSIGHTS_ROW_LIMIT');
	});

	it('håller analysen deterministisk och utan språkmodell', () => {
		const source = endpointSource();
		expect(source).toContain('buildProgressAnalysis(rows, period');
		expect(source).toContain('buildLighterDaysView(rows, period, themeOverrides)');
		expect(source).toContain('buildSupportView(filterProgressRows(rows, period)');
		expect(source).toMatch(/return json\(\{\s*analysis,\s*lighterDays,\s*support\s*\}\);/);
		expect(source).not.toMatch(/openai|anthropic|generateAIText/i);
	});

	it('läser temakorrigeringarna ur kontot och tillämpar dem på hela återblicken', () => {
		const source = endpointSource();
		expect(source).toContain('const themeOverrides = readThemeOverrides(user);');
		expect(source).toContain('{ truncated, themeOverrides }');
		expect(source).toContain('applyThemeOverridesToSupport(');
	});
});


describe('Framstegsanalysens periodgräns i Supabase-frågan', () => {
	it.each([500, 501])('räknar bara %i registreringar inom halvåret', async (inPeriod) => {
		const now = new Date('2026-08-15T12:00:00Z');
		const start = '2026-02-16T23:00:00.000Z';
		const end = '2026-08-15T22:00:00.000Z';
		const diaryRow = (created_at: string, mood: number, user_id = 'test-user') => ({ created_at, mood, user_id });
		const outsideBefore = diaryRow('2026-02-16T22:59:59.999Z', 2);
		const outsideAfter = diaryRow(end, 8);
		const otherUser = diaryRow(start, 8, 'other-user');
		const diary = [
			outsideBefore, outsideAfter, otherUser,
			...Array.from({ length: inPeriod }, (_, index) =>
				index < 250 ? diaryRow(start, 2) : diaryRow('2026-08-15T21:59:59.999Z', 8)
			)
		];
		const supabase = createClient('https://example.invalid', 'synthetic-key', {
			auth: { autoRefreshToken: false, persistSession: false },
			global: {
				fetch: async (input, init) => {
					const params = new URL(String(input)).searchParams;
					const [gte, lt] = params.getAll('created_at');
					expect(gte).toBe('gte.' + start);
					expect(lt).toBe('lt.' + end);
					expect(params.get('user_id')).toBe('eq.test-user');
					expect(new Headers(init?.headers).get('Prefer')).toBe('count=exact');
					const matching = diary
						.filter((row) => row.user_id === params.get('user_id')?.slice(3)
							&& row.created_at >= gte.slice(4) && row.created_at < lt.slice(3))
						.sort((a, b) => b.created_at.localeCompare(a.created_at));
					const rows = matching.slice(0, Number(params.get('limit')));
					return new Response(JSON.stringify(rows), {
						headers: { 'Content-Range': `0-${rows.length - 1}/${matching.length}` }
					});
				}
			}
		});

		const { rows, truncated, error } = await loadProgressRows(supabase, 'test-user', 180, now);
		expect(error).toBeNull();
		expect(rows).toHaveLength(500);
		expect(truncated).toBe(inPeriod === 501);
		const analysis = buildProgressAnalysis(rows, 180, now, { truncated });
		expect(analysis.trend.direction).toBe(inPeriod === 501 ? 'insufficient' : 'clearly-higher');
	});
});
