import { describe, expect, it } from 'vitest';
import { buildDailyBrief, type DailyBriefFindingInput } from './daily-brief';

const baseFinding: DailyBriefFindingInput = {
	id: 'finding-1',
	title: 'Uppdatering',
	url: 'https://example.test/finding',
	summary: 'En ändring i ett bevakat område.',
	why_it_matters: 'Berör MittPsyke och Stödlinjer.',
	project_use: 'Kontrollera påverkan.',
	recommended_action: 'bevaka',
	relevance_score: 70,
	confidence_score: 80,
	source_is_official: true,
	category: 'AI',
	ageDays: 1
};

describe('buildDailyBrief', () => {
	it('väljer ett välunderbyggt akut fynd som dagens viktigaste', () => {
		const brief = buildDailyBrief([
			{ ...baseFinding, id: 'watch', recommended_action: 'bevaka' },
			{ ...baseFinding, id: 'urgent', recommended_action: 'agera_nu', relevance_score: 88 }
		], 47);

		expect(brief.mostImportant).toMatchObject({ id: 'urgent', priority: 'Gör idag', effort: 'Medel', project: 'Båda' });
		expect(brief.summary).toBe('Radar granskade 47 fynd. 2 bedömdes relevanta. 1 motiverar handling idag.');
	});

	it('gör inte ett osäkert eller sekundärt akut fynd brådskande', () => {
		const brief = buildDailyBrief([
			{
				...baseFinding,
				recommended_action: 'agera_nu',
				source_is_official: false,
				confidence_score: 45,
				relevance_score: 90
			}
		], 1);

		expect(brief.mostImportant).toBeNull();
		expect(brief.mainFindings[0]).toMatchObject({ priority: 'Planera' });
		expect(brief.mainFindings[0]?.uncertaintyNote).toContain('osäkert');
		expect(brief.noActionToday).toBe(true);
	});

	it('filtrerar rutinuppdateringar, gamla fynd och begränsar huvudfynd till tre', () => {
		const findings = Array.from({ length: 4 }, (_, index) => ({
			...baseFinding,
			id: `planned-${index}`,
			recommended_action: 'testa_i_sandbox' as const,
			relevance_score: 65 + index
		}));
		const brief = buildDailyBrief([
			...findings,
			{ ...baseFinding, id: 'old', recommended_action: 'agera_nu', ageDays: 15 },
			{ ...baseFinding, id: 'routine', recommended_action: 'ignorera', relevance_score: 18 }
		], 6);

		expect(brief.mainFindings).toHaveLength(3);
		expect(brief.worthKnowing).toEqual([]);
		expect(brief.noActionToday).toBe(true);
	});
});
