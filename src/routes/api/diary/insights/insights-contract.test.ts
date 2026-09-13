import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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
		expect(source).toContain('return json({\n\t\t\tanalysis,\n\t\t\tlighterDays,\n\t\t\tsupport\n\t\t});');
		expect(source).not.toMatch(/openai|anthropic|generateAIText/i);
	});

	it('läser temakorrigeringarna ur kontot och tillämpar dem på hela återblicken', () => {
		const source = endpointSource();
		expect(source).toContain('const themeOverrides = readThemeOverrides(user);');
		expect(source).toContain('{ truncated, themeOverrides }');
		expect(source).toContain('applyThemeOverridesToSupport(');
	});
});
