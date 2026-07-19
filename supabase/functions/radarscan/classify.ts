import { isBareVersion, normalizedTitle, summarizeSourceText, toPlainText } from './normalize.ts';

export type RadarAction = 'agera_nu' | 'testa_i_sandbox' | 'bevaka' | 'ignorera';

export type RadarClassificationInput = {
	title?: unknown;
	provider?: unknown;
	description?: unknown;
	published_at?: string | null;
	category?: unknown;
};

export type RadarClassification = {
	title: string;
	summary: string;
	why_it_matters: string;
	project_use: string;
	recommended_action: RadarAction;
	relevance_score: number;
};

function ageInDays(publishedAt?: string | null) {
	if (!publishedAt) return null;
	const time = new Date(publishedAt).getTime();
	return Number.isNaN(time) ? null : Math.max(0, Math.floor((Date.now() - time) / 86_400_000));
}

function hasUrgentSignal(text: string) {
	return /\b(security|säkerhet|cve|vulnerability|sårbarhet|critical|incident|breaking change|bakåtkompatibilitet|migration|required action|api removal|deprecat)/i.test(text);
}

function isRoutineSdkRelease(title: string, text: string) {
	return (isBareVersion(title.replace(/^.*?\s(v?\d)/i, '$1')) || /\bv?\d+\.\d+(?:\.\d+)?\b/i.test(title))
		&& /\b(sdk|node|npm|package|client library)\b/i.test(`${title} ${text}`);
}

export function classifyFinding(input: RadarClassificationInput): RadarClassification {
	const title = normalizedTitle(input.title, input.provider);
	const sourceText = summarizeSourceText(input.description) ?? '';
	const provider = toPlainText(input.provider, 80) ?? 'Källan';
	const combined = `${title} ${sourceText}`;
	const routineSdk = isRoutineSdkRelease(title, combined);
	const urgent = hasUrgentSignal(combined);
	const age = ageInDays(input.published_at);

	let recommended_action: RadarAction = 'bevaka';
	let relevance_score = 45;
	if (urgent) {
		recommended_action = 'agera_nu';
		relevance_score = 88;
	} else if (routineSdk) {
		recommended_action = 'ignorera';
		relevance_score = 18;
	} else if (/\b(model|api|pricing|rate limit|tool calling|function calling)\b/i.test(combined)) {
		recommended_action = 'testa_i_sandbox';
		relevance_score = 65;
	}
	if (age !== null && age > 14 && !urgent) {
		recommended_action = routineSdk ? 'ignorera' : 'bevaka';
		relevance_score = Math.min(relevance_score, 35);
	}
	if (age !== null && age > 60 && !urgent) {
		recommended_action = 'ignorera';
		relevance_score = Math.min(relevance_score, 15);
	}

	const summary = routineSdk
		? `${provider} har publicerat en vanlig SDK-uppdatering. Läs versionsanteckningarna vid nästa planerade underhåll, om något berör er.`
		: urgent
			? `${provider} beskriver en säkerhets- eller kompatibilitetsfråga som bör kontrolleras före nästa driftsättning.`
			: recommended_action === 'testa_i_sandbox'
				? `${provider} har publicerat en ändring kring modeller eller API som kan vara värd att prova avskilt.`
				: `${provider} har publicerat en uppdatering inom ett bevakat område. Spara den till nästa relevanta genomgång.`;
	const why_it_matters = routineSdk
		? 'Det här är en vanlig patch- eller mindre versionsuppdatering. Den kräver normalt ingen åtgärd för MittPsyke, Stödlinjer eller övriga projekt.'
		: 'Bedöm om ändringen påverkar MittPsykes samtalsstöd, Stödlinjer eller ett annat projekt innan ni lägger tid på den.';
	const project_use = recommended_action === 'testa_i_sandbox'
		? 'Prova först i en avskild testmiljö och jämför med nuvarande flöde.'
		: 'Spara som underlag för nästa relevanta genomgång.';

	return { title, summary, why_it_matters, project_use, recommended_action, relevance_score };
}
