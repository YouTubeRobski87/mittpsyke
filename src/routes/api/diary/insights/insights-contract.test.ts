import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function endpointSource() {
	return readFileSync(new URL('./+server.ts', import.meta.url), 'utf8');
}

describe('Framstegsanalysens endpointkontrakt', () => {
	it('behåller samtycke, verifierad auth och användarscope före läsningen', () => {
		const source = endpointSource();
		const consent = source.indexOf('hasSensitiveConsentHeader(request)');
		const auth = source.indexOf('supabase.auth.getUser()');
		const diary = source.indexOf("from('diary')");

		expect(consent).toBeGreaterThan(-1);
		expect(auth).toBeGreaterThan(consent);
		expect(diary).toBeGreaterThan(auth);
		expect(source).toContain(".eq('user_id', user.id)");
		expect(source).not.toMatch(/service_role|SUPABASE_SERVICE/i);
	});

	it('begränsar först till vald tidsperiod och markerar träffad läsgräns', () => {
		const source = endpointSource();
		const periodFilter = source.indexOf(".gte('created_at', queryStart)");
		const limit = source.indexOf('.limit(INSIGHTS_ROW_LIMIT)');

		expect(periodFilter).toBeGreaterThan(-1);
		expect(limit).toBeGreaterThan(periodFilter);
		expect(source).toContain("select('created_at, mood, text, tags', { count: 'exact' })");
		expect(source).toContain('truncated: (count ?? entries?.length ?? 0) > INSIGHTS_ROW_LIMIT');
	});

	it('håller analysen deterministisk och begränsar eventuella citat till det uttryckliga supportfältet', () => {
		const source = endpointSource();
		expect(source).toContain('buildProgressAnalysis(rows, period');
		expect(source).toContain('buildSupportView(filterProgressRows(rows, period))');
		expect(source).toContain('return json({\n\t\t\tanalysis,\n\t\t\tsupport\n\t\t});');
		expect(source).not.toMatch(/openai|anthropic|generateAIText/i);
	});
});
