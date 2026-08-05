export type ReassurancePatternResult = {
	detected: boolean;
	confidence: 'low' | 'medium' | 'high';
	reason?: string;
};

type ConversationMessage = {
	role: 'user' | 'assistant';
	content: string;
};

const STOP_WORDS = new Set([
	'och', 'att', 'det', 'den', 'detta', 'har', 'har', 'som', 'jag', 'mig', 'min', 'mitt',
	'mina', 'du', 'kan', 'ska', 'inte', 'ar', 'var', 'vara', 'pa', 'om', 'med', 'for', 'till',
	'nu', 'igen', 'bara', 'val', 'sa', 'en', 'ett', 'denna', 'de', 'vi'
]);

const REASSURANCE_PATTERNS = [
	/\bar\s+(du|jag|det|allt)\s+(verkligen\s+)?(saker|tryggt|trygg)\b/i,
	/\b(kan|vill)\s+du\s+(lova|garantera|forsakra)\b/i,
	/\bkan\s+du\s+saga\s+att\b/i,
	/\bsag\s+(att\s+)?(det\s+)?(kommer\s+)?ga\s+bra\b/i,
	/\bbehover\s+(veta|fa veta)\s+att\b/i,
	/\bar\s+.{0,30}\b(farlig|farligt)\b/i,
	/\bkan\s+du\s+vara\s+saker\b/i
];

const EXPLANATION_PATTERNS = [
	/\b(varfor|hur fungerar|forklara|beratta mer)\b/i,
	/\b(skillnaden|jamfora|alternativ)\b/i,
	/\b(jag menar|rattelse|missforstod)\b/i
];

const NEW_INFORMATION_PATTERNS = [
	/\b(nu har|i dag|idag|i gar|igar|sedan dess|dessutom|nyss|just nu hande)\b/i,
	/\b(fick|hande|borjade|tillkom|forandrades)\b/i
];

function normalize(text: string) {
	return text
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function meaningfulTokens(text: string) {
	return new Set(
		normalize(text)
			.split(' ')
			.filter((token) => token.length >= 4 && !STOP_WORDS.has(token))
	);
}

function tokenOverlap(left: string, right: string) {
	const leftTokens = meaningfulTokens(left);
	const rightTokens = meaningfulTokens(right);
	if (leftTokens.size === 0 || rightTokens.size === 0) return 0;

	let shared = 0;
	for (const token of leftTokens) {
		if (rightTokens.has(token)) shared += 1;
	}
	return shared / Math.min(leftTokens.size, rightTokens.size);
}

function hasPattern(text: string, patterns: RegExp[]) {
	return patterns.some((pattern) => pattern.test(normalize(text)));
}

/**
 * Identifierar en snäv samtalsloop, inte ett hälsotillstånd. Den kräver både
 * upprepade explicita bekräftelsefrågor och ett gemensamt sakområde.
 */
export function detectReassurancePattern(
	message: string,
	history: readonly ConversationMessage[]
): ReassurancePatternResult {
	const current = message.trim();
	if (!current || history.filter((item) => item.role === 'user').length < 2) {
		return { detected: false, confidence: 'low' };
	}

	if (
		hasPattern(current, EXPLANATION_PATTERNS) ||
		hasPattern(current, NEW_INFORMATION_PATTERNS) ||
		!hasPattern(current, REASSURANCE_PATTERNS)
	) {
		return { detected: false, confidence: 'low' };
	}

	const priorReassuranceQuestions = history
		.filter((item) => item.role === 'user')
		.map((item) => item.content.trim())
		.filter((content) => content && hasPattern(content, REASSURANCE_PATTERNS));

	if (priorReassuranceQuestions.length < 2) {
		return { detected: false, confidence: 'low' };
	}

	const similarQuestions = priorReassuranceQuestions.filter(
		(content) => tokenOverlap(current, content) >= 0.4
	);
	if (similarQuestions.length >= 2) {
		return {
			detected: true,
			confidence: 'high',
			reason: 'upprepad bekräftelsefråga utan nytt sakunderlag'
		};
	}

	const currentTokens = meaningfulTokens(current);
	const sharedAnchors = new Set<string>();
	for (const priorQuestion of priorReassuranceQuestions) {
		for (const token of meaningfulTokens(priorQuestion)) {
			if (currentTokens.has(token)) sharedAnchors.add(token);
		}
	}

	if (sharedAnchors.size > 0) {
		return {
			detected: true,
			confidence: 'medium',
			reason: 'upprepad bekräftelsefråga om samma sakområde'
		};
	}

	return { detected: false, confidence: 'low' };
}

export function buildReassurancePatternInstruction(result: ReassurancePatternResult) {
	if (!result.detected) return '';

	return `Samtalsmönster: användaren återkommer till samma osäkerhet och söker en ny försäkran utan att ha lagt till väsentligt ny information.
Bekräfta inte samma garanti eller lugnande besked igen. Var varm och icke-dömande: sammanfatta kort vad som redan verkar känt, skilj varsamt mellan det som är känt och oron, och erbjud högst ett litet nästa steg eller en reflekterande fråga. Säg inte att användaren "fastnat" och använd inte diagnosspråk. Om användaren tillför nya fakta eller ber om en förklaring ska du i stället svara på det.`;
}
