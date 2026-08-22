import { describe, expect, it } from 'vitest';
import { buildProgressAnalysis } from './progress-analysis';
import type { DiaryInsightRow } from './diary-insight-analysis';

const NOW = new Date('2026-08-15T12:00:00.000Z');

function row(date: string, mood: number | null, text = ''): DiaryInsightRow {
	return { created_at: `${date}T12:00:00.000Z`, mood, text };
}

function days(start: string, values: number[], textForIndex: (index: number) => string = () => ''): DiaryInsightRow[] {
	const startDate = new Date(`${start}T12:00:00.000Z`);
	return values.map((mood, index) => {
		const date = new Date(startDate);
		date.setUTCDate(date.getUTCDate() + index * 3);
		return row(date.toISOString().slice(0, 10), mood, textForIndex(index));
	});
}

describe('Framstegsanalysens skala och riktning', () => {
	it('tolkar högre värde som högre registrerat mående', () => {
		const analysis = buildProgressAnalysis(days('2026-02-20', [2, 3, 3, 4, 2, 3, 4, 3, 7, 8, 8, 9, 7, 8, 9, 8]), 180, NOW);
		expect(analysis.trend.direction).toBe('clearly-higher');
		expect(analysis.insights.some((item) => item.title.includes('högre'))).toBe(true);
	});

	it('identifierar en tydlig lägre riktning', () => {
		const analysis = buildProgressAnalysis(days('2026-02-20', [9, 8, 8, 7, 9, 8, 7, 8, 4, 3, 3, 2, 4, 3, 2, 3]), 180, NOW);
		expect(analysis.trend.direction).toBe('clearly-lower');
	});

	it('säger ungefär oförändrat när värden varierar runt samma nivå', () => {
		const analysis = buildProgressAnalysis(days('2026-02-20', [5, 6, 5, 6, 6, 5, 6, 5, 5, 6, 5, 6, 6, 5, 6, 5]), 180, NOW);
		expect(analysis.trend.direction).toBe('unchanged');
		expect(analysis.insights[0]?.title).toBe('Ingen tydlig långsiktig riktning');
	});

	it('skiljer ökad variation från en försämring', () => {
		const analysis = buildProgressAnalysis(days('2026-02-20', [6, 6, 6, 6, 6, 6, 6, 6, 3, 9, 3, 9, 3, 9, 3, 9]), 180, NOW);
		expect(analysis.variability.direction).toBe('more-varied');
		expect(analysis.insights.some((item) => item.id === 'variability')).toBe(true);
	});
});

describe('Framstegsanalysens temaunderlag', () => {
	it('identifierar en robust tema × mående-association utan kausal formulering', () => {
		const rows: DiaryInsightRow[] = [
			...days('2026-07-18', [3, 3, 3, 3, 3, 3], () => 'Stress och press tar mycket plats i dag.'),
			...days('2026-08-05', [8, 8, 8, 8, 8, 8], () => 'En lugn promenad i naturen i dag.')
		];
		const analysis = buildProgressAnalysis(rows, 90, new Date('2026-08-22T12:00:00.000Z'));
		const stress = analysis.themeMoodAssociations.find((item) => item.theme === 'Stress');
		expect(stress).toMatchObject({ direction: 'lower' });
		expect(analysis.insights.find((item) => item.id === 'association:Stress')?.evidence).toContain('samband, inte vad som orsakar');
	});

	it('filtrerar bort en falsk association med bara två temadagar', () => {
		const rows: DiaryInsightRow[] = [
			row('2026-07-20', 2, 'Stress i dag.'), row('2026-07-22', 2, 'Stress igen.'),
			...days('2026-07-24', [7, 7, 7, 7, 7, 7], () => 'Jag skrev några rader.')
		];
		const analysis = buildProgressAnalysis(rows, 30, NOW);
		expect(analysis.themeMoodAssociations.find((item) => item.theme === 'Stress')).toBeUndefined();
	});
});

describe('Framstegsanalysens täckning', () => {
	it('hanterar tomt och mycket litet underlag utan NaN eller påhittad trend', () => {
		for (const rows of [[], [row('2026-08-14', 6)]]) {
			const analysis = buildProgressAnalysis(rows, 30, NOW);
			expect(analysis.trend.direction).toBe('insufficient');
			expect(JSON.stringify(analysis)).not.toContain('NaN');
			expect(JSON.stringify(analysis)).not.toContain('Infinity');
		}
	});

	it('räknar flera registreringar samma dag men bara en aktiv måendedag', () => {
		const analysis = buildProgressAnalysis([
			row('2026-08-10', 4), row('2026-08-10', 8), row('2026-08-11', 6)
		], 30, NOW);
		expect(analysis.moodSummary.entryCount).toBe(3);
		expect(analysis.moodSummary.activeDays).toBe(2);
	});

	it('utelämnar månader med för glest underlag', () => {
		const rows = [
			...days('2026-03-01', [4, 4, 4, 4]),
			row('2026-04-10', 10),
			...days('2026-05-01', [8, 8, 8, 8])
		];
		const analysis = buildProgressAnalysis(rows, 180, NOW);
		expect(analysis.monthly.map((month) => month.month)).not.toContain('2026-04');
	});

	it('bygger en sexmånaderssammanfattning men inte samma djup för 30 dagar', () => {
		const rows = days('2026-02-20', [3, 3, 4, 4, 7, 7, 8, 8], () => 'Stress och sömn återkommer.');
		expect(buildProgressAnalysis(rows, 180, NOW).halfYearSummary.length).toBeGreaterThan(0);
		expect(buildProgressAnalysis(rows, 30, NOW).halfYearSummary).toEqual([]);
	});

	it('hanterar en stor dagbok och luckor utan att göra råtext till klientdata', () => {
		const start = new Date('2026-02-17T12:00:00.000Z');
		const rows = Array.from({ length: 288 }, (_, index) => {
			const date = new Date(start);
			date.setUTCDate(date.getUTCDate() + Math.floor(index / 3) * 2);
			return row(date.toISOString().slice(0, 10), index % 5 === 0 ? 4 : 7, index % 4 === 0 ? 'Stress kring jobbet.' : 'En vanlig reflektion.');
		});
		const analysis = buildProgressAnalysis(rows, 180, NOW);
		expect(analysis.coverage.textEntryCount).toBeGreaterThan(100);
		expect(analysis.insights.length).toBeLessThanOrEqual(5);
		expect(JSON.stringify(analysis)).not.toContain('En vanlig reflektion');
	});

	it('håller konstant mående neutralt och klarar period över årsskifte', () => {
		const rows = days('2025-12-20', Array.from({ length: 18 }, () => 6));
		const analysis = buildProgressAnalysis(rows, 180, new Date('2026-02-10T12:00:00.000Z'));
		expect(analysis.trend.direction).toBe('unchanged');
		expect(analysis.moodSummary.standardDeviation).toBe(0);
	});

	it('skiljer texter utan mående från mående utan text', () => {
		const analysis = buildProgressAnalysis([
			row('2026-08-02', null, 'En text utan mående.'),
			row('2026-08-03', 6),
			row('2026-08-04', 7)
		], 30, NOW);
		expect(analysis.coverage.textEntryCount).toBe(1);
		expect(analysis.moodSummary.entryCount).toBe(2);
		expect(analysis.coverage.activeDays).toBe(3);
	});
});
