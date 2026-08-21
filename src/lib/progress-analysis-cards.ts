// Kondenserar den befintliga analysen till fyra skannbara kort.
//
// Modulen räknar ingenting nytt. Den tar det som redan är framräknat i
// diary-insight-analysis och progress-reflection och bestämmer bara vad som
// hör hemma i huvudvyn och vad som hör hemma bakom "Visa mer".
//
// Prioritetsordningen är slutsats, kort förklaring, datapunkt, detalj. Långa
// stycken hör aldrig hemma i huvudvyn: de flyttas till detaljerna, ordagrant,
// så inget underlag går förlorat.

export type AnalysisCardId = 'recent' | 'recurring' | 'helping' | 'change';

export interface EvidenceClaimLike {
	title: string;
	description: string;
	evidence: string;
	topic?: string;
}

export interface ThemeLike {
	label: string;
	count: number;
}

export interface AnalysisCardItem {
	label: string;
	note: string;
}

export interface AnalysisCardDetail {
	label: string;
	value: string;
}

export interface AnalysisCard {
	id: AnalysisCardId;
	title: string;
	/** Undertext under rubriken, t.ex. vilket fönster jämförelsen gäller. */
	caption: string | null;
	/** Slutsatsen. Alltid satt, alltid kort. */
	conclusion: string;
	/** En enda kort förklaring, eller null när slutsatsen räcker. */
	explanation: string | null;
	/** Liten siffra som visar hur brett underlaget är. */
	dataPoint: string | null;
	/** Teman som chips. Endast kortet "Det som återkommer" använder dem. */
	chips: string[];
	/** Korta rader med etikett. Endast kortet "Det som verkar hjälpa". */
	items: AnalysisCardItem[];
	/** Fördjupningen bakom "Visa mer". Tom lista döljer knappen. */
	details: AnalysisCardDetail[];
	/** Sant när det inte finns något mönster att visa. */
	empty: boolean;
}

/** Slutsatser hålls korta nog att läsas i ett svep. */
export const MAX_CONCLUSION_LENGTH = 72;
/** Förklaringen får vara en mening, aldrig ett stycke. */
export const MAX_EXPLANATION_LENGTH = 120;

export const NO_PATTERN_COPY = 'Inget tydligt mönster ännu.';

const MAX_CHIPS = 4;
const MAX_ITEMS = 3;
const MIN_THEME_COUNT = 2;

function clip(text: string, max: number): string {
	const trimmed = text.trim();
	if (trimmed.length <= max) return trimmed;
	const cut = trimmed.slice(0, max - 1);
	const lastSpace = cut.lastIndexOf(' ');
	return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

/** Första meningen ur ett längre stycke, kapad så den ryms på en rad. */
function firstSentence(text: string | undefined, max: number): string | null {
	if (!text) return null;
	const match = text.trim().match(/^[^.!?]+[.!?]/);
	const sentence = (match ? match[0] : text).trim();
	if (!sentence) return null;
	return clip(sentence, max);
}

function countLabel(count: number, singular: string, plural: string): string {
	return `${count} ${count === 1 ? singular : plural}`;
}

function detail(label: string, value: string | null | undefined): AnalysisCardDetail | null {
	if (!value || !value.trim()) return null;
	return { label, value: value.trim() };
}

function claimDetails(claims: readonly EvidenceClaimLike[], limit: number): AnalysisCardDetail[] {
	return claims.slice(0, limit).map((claim) => ({
		label: claim.title,
		// Hela det ursprungliga underlaget, oavkortat. Det är hit långa
		// formuleringar hör, inte till huvudvyn.
		value: `${claim.description} ${claim.evidence}`.trim()
	}));
}

function emptyCard(id: AnalysisCardId, title: string, caption: string | null): AnalysisCard {
	return {
		id,
		title,
		caption,
		conclusion: NO_PATTERN_COPY,
		explanation: null,
		dataPoint: null,
		chips: [],
		items: [],
		details: [],
		empty: true
	};
}

export interface AnalysisCardsInput {
	recentComparison?: { title: string; description: string; evidence: string } | null;
	patterns?: readonly EvidenceClaimLike[] | null;
	strengths?: readonly EvidenceClaimLike[] | null;
	challenges?: readonly EvidenceClaimLike[] | null;
	timelineObservations?: readonly EvidenceClaimLike[] | null;
	themes?: readonly ThemeLike[] | null;
	dataBasis?: { moodEntryCount?: number; textEntryCount?: number } | null;
}

function buildRecentCard(input: AnalysisCardsInput): AnalysisCard {
	const caption = 'Senaste 14 dagarna jämfört med tidigare period';
	const comparison = input.recentComparison;
	if (!comparison) return emptyCard('recent', 'Senaste tiden', caption);

	const moodEntryCount = input.dataBasis?.moodEntryCount ?? 0;
	return {
		id: 'recent',
		title: 'Senaste tiden',
		caption,
		conclusion: clip(comparison.title, MAX_CONCLUSION_LENGTH),
		explanation: firstSentence(comparison.description, MAX_EXPLANATION_LENGTH),
		dataPoint: moodEntryCount > 0 ? countLabel(moodEntryCount, 'registrering', 'registreringar') : null,
		chips: [],
		items: [],
		details: [detail('Så är jämförelsen räknad', comparison.evidence)].filter(
			(item): item is AnalysisCardDetail => item !== null
		),
		empty: false
	};
}

/**
 * Meningen under temachipsen. Ett samband mellan två teman säger mer än en
 * uppräkning, så en kombination går före ett enskilt tema.
 */
function buildRecurringSentence(input: AnalysisCardsInput, topTheme: ThemeLike | null): string | null {
	const combination = (input.patterns ?? []).find((claim) => claim.title.includes(' och '));
	if (combination) return clip(combination.title, MAX_EXPLANATION_LENGTH);

	const challenge = (input.challenges ?? [])[0];
	if (challenge) return clip(challenge.title, MAX_EXPLANATION_LENGTH);

	const pattern = (input.patterns ?? [])[0];
	if (pattern) return clip(pattern.title, MAX_EXPLANATION_LENGTH);

	if (topTheme) {
		return clip(
			`${topTheme.label} återkommer oftast i dina texter.`,
			MAX_EXPLANATION_LENGTH
		);
	}
	return null;
}

function buildRecurringCard(input: AnalysisCardsInput): AnalysisCard {
	const themes = [...(input.themes ?? [])]
		.filter((theme) => typeof theme?.label === 'string' && theme.label.trim().length > 0)
		.filter((theme) => Number.isFinite(theme?.count) && theme.count >= MIN_THEME_COUNT)
		.sort((first, second) => second.count - first.count);
	const chips = themes.slice(0, MAX_CHIPS).map((theme) => theme.label.trim());
	if (chips.length === 0) return emptyCard('recurring', 'Det som återkommer', null);

	const topTheme = themes[0] ?? null;
	return {
		id: 'recurring',
		title: 'Det som återkommer',
		caption: null,
		conclusion: buildRecurringSentence(input, topTheme) ?? NO_PATTERN_COPY,
		explanation: null,
		dataPoint: topTheme
			? `${topTheme.label} i ${countLabel(topTheme.count, 'text', 'texter')}`
			: null,
		chips,
		items: [],
		details: [
			...themes.slice(MAX_CHIPS).map((theme) => ({
				label: theme.label,
				value: `Nämns i ${countLabel(theme.count, 'reflektion', 'reflektioner')}.`
			})),
			...claimDetails(input.patterns ?? [], 3),
			...claimDetails(input.challenges ?? [], 2)
		],
		empty: false
	};
}

/**
 * Noterna är korta och beskriver samvariation. Ingen av dem får antyda att
 * temat orsakar något — samma språkregel som i resten av analysen.
 */
/** Små tal skrivs ut. "Ett tema" läser lugnare än "1 tema". */
const SPELLED_COUNTS: Record<number, string> = { 1: 'Ett', 2: 'Två', 3: 'Tre' };

const HELPING_NOTES = [
	'Förekommer oftare under dina ljusare dagar.',
	'Återkommer i flera av dina stabilare perioder.',
	'Syns oftare när registreringarna ligger högre.'
];

function toItemLabel(claim: EvidenceClaimLike): string {
	if (claim.topic && claim.topic.trim()) return claim.topic.trim();
	// Rubrikerna är formade som "<Tema> förekommer oftare ...". Utan topic tas
	// ledet före verbet, hellre det än en hel mening som etikett.
	const [head] = claim.title.split(/\s+(?:förekommer|återkommer|sammanfaller|verkar)\b/);
	return clip(head || claim.title, 32);
}

function buildHelpingCard(input: AnalysisCardsInput): AnalysisCard {
	const strengths = (input.strengths ?? []).slice(0, MAX_ITEMS);
	if (strengths.length === 0) return emptyCard('helping', 'Det som verkar hjälpa', null);

	return {
		id: 'helping',
		title: 'Det som verkar hjälpa',
		caption: null,
		// Slutsatsen räknar, den upprepar inte första raden. Annars står samma
		// tema två gånger i samma kort.
		conclusion: clip(
			`${SPELLED_COUNTS[strengths.length] ?? strengths.length} ${
				strengths.length === 1 ? 'tema återkommer' : 'teman återkommer'
			} i dina lättare perioder.`,
			MAX_CONCLUSION_LENGTH
		),
		explanation: null,
		dataPoint: null,
		chips: [],
		items: strengths.map((claim, index) => ({
			label: toItemLabel(claim),
			note: HELPING_NOTES[index] ?? HELPING_NOTES[HELPING_NOTES.length - 1]
		})),
		details: claimDetails(strengths, MAX_ITEMS),
		empty: false
	};
}

function buildChangeCard(input: AnalysisCardsInput): AnalysisCard {
	const observations = input.timelineObservations ?? [];
	const [first, ...rest] = observations;
	if (!first) {
		const card = emptyCard('change', 'Förändring över tid', null);
		return {
			...card,
			conclusion: 'Ingen tydlig långsiktig trend ännu.',
			explanation: 'Underlaget räcker inte för att jämföra längre perioder.'
		};
	}

	return {
		id: 'change',
		title: 'Förändring över tid',
		caption: null,
		conclusion: clip(first.title, MAX_CONCLUSION_LENGTH),
		explanation: firstSentence(first.description, MAX_EXPLANATION_LENGTH),
		dataPoint: null,
		chips: [],
		items: [],
		details: [
			...claimDetails([first], 1),
			...claimDetails(rest, 2)
		],
		empty: false
	};
}

/**
 * Alltid exakt fyra kort, alltid i samma ordning. Ett kort utan mönster tas
 * inte bort — det säger att mönstret saknas, vilket är en riktigare bild än en
 * vy som byter form varje gång underlaget ändras.
 */
export function buildAnalysisCards(input: AnalysisCardsInput): AnalysisCard[] {
	return [
		buildRecentCard(input),
		buildRecurringCard(input),
		buildHelpingCard(input),
		buildChangeCard(input)
	];
}
