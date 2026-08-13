export type RadarRecommendedAction = 'agera_nu' | 'testa_i_sandbox' | 'bevaka' | 'ignorera';
export type DailyBriefPriority = 'Gör idag' | 'Planera' | 'Bevaka' | 'Ingen åtgärd';
export type DailyBriefEffort = 'Liten' | 'Medel' | 'Stor';
export type DailyBriefProject = 'MittPsyke' | 'Stödlinjer' | 'Båda';

export type DailyBriefFindingInput = {
	id: string;
	title: string;
	url: string | null;
	summary: string | null;
	why_it_matters: string | null;
	project_use: string | null;
	recommended_action: RadarRecommendedAction;
	relevance_score: number | null;
	confidence_score: number | null;
	source_is_official: boolean | null;
	category: string | null;
	ageDays: number | null;
};

export type DailyBriefFinding = DailyBriefFindingInput & {
	priority: DailyBriefPriority;
	effort: DailyBriefEffort;
	project: DailyBriefProject;
	recommendedAction: string;
	uncertaintyNote: string | null;
};

const MIN_RELEVANCE = 55;
const MAIN_RELEVANCE = 60;
const ACTION_TODAY_RELEVANCE = 70;

function priorityFor(finding: DailyBriefFindingInput): DailyBriefPriority {
	if (finding.recommended_action === 'agera_nu') {
		// A weak or unverified signal is never turned into false urgency.
		if (
			(finding.relevance_score ?? 0) >= ACTION_TODAY_RELEVANCE &&
			(finding.source_is_official || (finding.confidence_score ?? 0) >= 75)
		) {
			return 'Gör idag';
		}
		return 'Planera';
	}
	if (finding.recommended_action === 'testa_i_sandbox') return 'Planera';
	if (finding.recommended_action === 'bevaka') return 'Bevaka';
	return 'Ingen åtgärd';
}

function effortFor(finding: DailyBriefFindingInput, priority: DailyBriefPriority): DailyBriefEffort {
	const text = `${finding.title} ${finding.summary ?? ''} ${finding.why_it_matters ?? ''}`.toLowerCase();
	if (priority === 'Gör idag' && /breaking|migration|api removal|deprecat|bakå?tkompatibilitet/.test(text)) return 'Stor';
	if (priority === 'Gör idag') return 'Medel';
	return 'Liten';
}

function projectFor(finding: DailyBriefFindingInput): DailyBriefProject {
	const text = `${finding.why_it_matters ?? ''} ${finding.project_use ?? ''} ${finding.category ?? ''}`.toLowerCase();
	const mittpsyke = text.includes('mittpsyke');
	const stodlinjer = text.includes('stödlinjer') || text.includes('stodlinjer');
	if (mittpsyke && !stodlinjer) return 'MittPsyke';
	if (!mittpsyke && stodlinjer) return 'Stödlinjer';
	return 'Båda';
}

function uncertaintyNoteFor(finding: DailyBriefFindingInput) {
	if (finding.confidence_score !== null && finding.confidence_score < 60) {
		return 'Underlaget är osäkert och bör verifieras i primärkällan innan ni agerar.';
	}
	if (!finding.source_is_official) {
		return 'Källan är inte markerad som officiell. Kontrollera primärkällan före beslut.';
	}
	return null;
}

function recommendedActionFor(priority: DailyBriefPriority) {
	if (priority === 'Gör idag') return 'Kontrollera påverkan i den aktiva lösningen och besluta om nödvändigt skydd före nästa driftsättning.';
	if (priority === 'Planera') return 'Planera en avgränsad kontroll eller ett test i testmiljö; ändra inte produktion utifrån fyndet ensamt.';
	if (priority === 'Bevaka') return 'Följ upp vid nästa relevanta planering.';
	return 'Ingen åtgärd rekommenderas.';
}

function scoreForBrief(finding: DailyBriefFinding) {
	const priorityScore: Record<DailyBriefPriority, number> = {
		'Gör idag': 400,
		Planera: 300,
		Bevaka: 200,
		'Ingen åtgärd': 100
	};
	const confidence = finding.confidence_score ?? 50;
	const sourceWeight = finding.source_is_official ? 12 : 0;
	const agePenalty = finding.ageDays === null ? 0 : Math.min(finding.ageDays, 30);
	return priorityScore[finding.priority] + (finding.relevance_score ?? 0) + confidence / 10 + sourceWeight - agePenalty;
}

export function buildDailyBrief(findings: DailyBriefFindingInput[], reviewedCount: number | null) {
	const briefFindings = findings
		.filter((finding) => finding.ageDays === null || finding.ageDays <= 14)
		.map((finding) => {
			const priority = priorityFor(finding);
			return {
				...finding,
				priority,
				effort: effortFor(finding, priority),
				project: projectFor(finding),
				recommendedAction: recommendedActionFor(priority),
				uncertaintyNote: uncertaintyNoteFor(finding)
			};
		})
		.filter((finding) => (finding.relevance_score ?? 0) >= MIN_RELEVANCE)
		.sort((left, right) => scoreForBrief(right) - scoreForBrief(left));

	const mainFindings = briefFindings
		.filter(
			(finding) =>
				(finding.priority === 'Gör idag' || finding.priority === 'Planera') &&
				(finding.relevance_score ?? 0) >= MAIN_RELEVANCE
		)
		.slice(0, 3);
	const mainIds = new Set(mainFindings.map((finding) => finding.id));
	const worthKnowing = briefFindings
		.filter((finding) => !mainIds.has(finding.id) && (finding.priority === 'Bevaka' || finding.priority === 'Ingen åtgärd'))
		.slice(0, 3);
	const mostImportant = mainFindings.find((finding) => finding.priority === 'Gör idag') ?? null;
	const relevantCount = briefFindings.length;
	const todayCount = briefFindings.filter((finding) => finding.priority === 'Gör idag').length;
	const reviewed = reviewedCount ?? findings.length;

	return {
		mostImportant,
		mainFindings: mainFindings.filter((finding) => finding.id !== mostImportant?.id),
		worthKnowing,
		noActionToday: mostImportant === null,
		summary: `Radar granskade ${reviewed} fynd. ${relevantCount} bedömdes relevanta. ${todayCount} motiverar handling idag.`
	};
}
