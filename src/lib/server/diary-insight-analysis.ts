import {
	createAITextGenerator,
	type AIMessage,
	type AITextProvider
} from '$lib/server/ai/text-generation';
import { buildWeeklySummarySafetyInstructions } from '$lib/server/ai/safety-instructions';

export type DiaryInsightRow = {
	created_at: string | null;
	mood: string | number | null;
	text: string | null;
	tags?: string[] | null;
};

export type InsightEvidenceLevel = 'none' | 'emerging' | 'ready' | 'deep' | 'longitudinal';

export type EvidenceClaim = {
	title: string;
	description: string;
	evidence: string;
};

export type ThemeInsight = {
	label: string;
	count: number;
	weight: number;
	tone: 'soft' | 'steady' | 'warm';
	evidence: string;
};

export type TimelineSegment = {
	label: string;
	range: string;
	entryCount: number;
	summary: string;
};

export type DiaryInsightDataBasis = {
	moodEntryCount: number;
	textEntryCount: number;
	firstDate: string | null;
	latestDate: string | null;
};

export type DiaryNarrativeInsight = {
	entryCount: number;
	dataBasis: DiaryInsightDataBasis;
	firstEntryDate: string | null;
	latestEntryDate: string | null;
	evidenceLevel: InsightEvidenceLevel;
	readinessMessage: string;
	overviewIntro: string;
	overview: EvidenceClaim[];
	patterns: EvidenceClaim[];
	themes: ThemeInsight[];
	timeline: {
		title: string;
		summary: string;
		segments: TimelineSegment[];
		observations: EvidenceClaim[];
	};
	strengths: EvidenceClaim[];
	challenges: EvidenceClaim[];
	storyParagraphs: string[];
	generatedWithAi: boolean;
};

export type PreparedEntry = {
	date: Date;
	dateKey: string;
	weekday: number;
	mood: number | null;
	text: string;
	wordCount: number;
	topicHits: Map<string, number>;
};

type TopicDefinition = {
	label: string;
	keywords: string[];
};

const MIN_OVERVIEW_ENTRIES = 8;
const MIN_PATTERN_ENTRIES = 12;
const MIN_TIMELINE_ENTRIES = 18;
const DEEP_ANALYSIS_ENTRIES = 100;
const LONGITUDINAL_ENTRIES = 250;
const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_ASSOCIATION_ENTRIES = 3;
const MIN_ASSOCIATION_COMPARISON_ENTRIES = 3;
const MOOD_ASSOCIATION_THRESHOLD = 0.75;

export const TOPICS: TopicDefinition[] = [
	{ label: 'Barnen', keywords: ['barn', 'son', 'dotter', 'familj', 'förälder', 'föräldra'] },
	{ label: 'Stress', keywords: ['stress', 'stressad', 'press', 'mycket', 'överväldig', 'hinner', 'måste'] },
	{ label: 'Sömn', keywords: ['sömn', 'sover', 'sova', 'trött', 'vaken', 'natt', 'somna'] },
	{ label: 'Arbete', keywords: ['jobb', 'jobbet', 'arbete', 'kollega', 'möte', 'chef'] },
	{ label: 'Motion', keywords: ['motion', 'träning', 'promenad', 'spring', 'gym', 'rörelse'] },
	{ label: 'Relationer', keywords: ['relation', 'partner', 'vän', 'vänner', 'mamma', 'pappa', 'sambo'] },
	{ label: 'Framtiden', keywords: ['framtid', 'senare', 'projekt', 'plan', 'hoppas', 'vill', 'dröm'] },
	{ label: 'Oro', keywords: ['oro', 'orolig', 'ångest', 'rädd', 'nervös', 'grubblar'] },
	{ label: 'Återhämtning', keywords: ['vila', 'återhämt', 'paus', 'lugn', 'andas', 'landat'] },
	{ label: 'Självmedkänsla', keywords: ['snäll mot mig', 'okej', 'räcker', 'förlåta', 'mildare'] },
	{ label: 'Tacksamhet', keywords: ['tacksam', 'glad för', 'fint', 'värme', 'lättnad'] },
	{ label: 'Ekonomi', keywords: ['ekonomi', 'pengar', 'räkning', 'räkningar', 'skuld', 'lön'] },
	{ label: 'Ensamhet', keywords: ['ensam', 'ensamhet', 'isolerad', 'isolation'] },
	{ label: 'Konflikter', keywords: ['bråk', 'konflikt', 'gräl', 'osams', 'tjafs'] },
	{ label: 'Natur', keywords: ['natur', 'skog', 'sjö', 'ute', 'utomhus', 'park'] },
	{ label: 'Struktur', keywords: ['rutin', 'rutiner', 'struktur', 'planering', 'planerat'] },
	{ label: 'Social kontakt', keywords: ['umgås', 'umgänge', 'träffa', 'sällskap', 'prata med'] },
	{ label: 'Kreativitet', keywords: ['kreativ', 'skapande', 'måla', 'målar', 'målade', 'musik', 'sjunga', 'pyssel', 'fotografera'] },
	{ label: 'MittPsyke', keywords: ['mittpsyke', 'dagbok', 'skriva', 'reflektion'] }
];

const POSITIVE_WORDS = ['hopp', 'hoppas', 'glad', 'tacksam', 'lugn', 'stolt', 'lättnad', 'bra', 'trygg', 'ork'];
const CHALLENGE_WORDS = ['svårt', 'stress', 'oro', 'orolig', 'ångest', 'trött', 'tungt', 'rädd', 'ensam', 'press'];

function parseMood(value: unknown): number | null {
	if (typeof value === 'number' && Number.isFinite(value)) return value;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value.replace(',', '.'));
		return Number.isFinite(parsed) ? parsed : null;
	}
	return null;
}

function dateKey(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function formatDate(date: Date | null) {
	if (!date) return null;
	return new Intl.DateTimeFormat('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
}

function includesAny(text: string, words: string[]) {
	return words.some((word) => text.includes(word));
}

function countTopicHits(text: string) {
	const hits = new Map<string, number>();
	for (const topic of TOPICS) {
		const count = topic.keywords.reduce((sum, keyword) => sum + (text.includes(keyword) ? 1 : 0), 0);
		if (count > 0) hits.set(topic.label, count);
	}
	return hits;
}

export function prepareEntries(rows: DiaryInsightRow[]): PreparedEntry[] {
	return rows
		.map((row) => {
			const date = row.created_at ? new Date(row.created_at) : null;
			const text = typeof row.text === 'string' ? row.text.trim() : '';
			if (!date || Number.isNaN(date.getTime()) || !text) return null;
			return {
				date,
				dateKey: dateKey(date),
				weekday: date.getDay(),
				mood: parseMood(row.mood),
				text,
				wordCount: text.split(/\s+/).filter(Boolean).length,
				topicHits: countTopicHits(text.toLowerCase())
			};
		})
		.filter((entry): entry is PreparedEntry => entry !== null)
		.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function buildDataBasis(rows: DiaryInsightRow[]): DiaryInsightDataBasis {
	const datedRows = rows
		.map((row) => (row.created_at ? new Date(row.created_at) : null))
		.filter((date): date is Date => date !== null && !Number.isNaN(date.getTime()))
		.sort((a, b) => a.getTime() - b.getTime());

	return {
		moodEntryCount: rows.filter((row) => parseMood(row.mood) !== null).length,
		textEntryCount: rows.filter((row) => typeof row.text === 'string' && row.text.trim().length > 0).length,
		firstDate: formatDate(datedRows[0] ?? null),
		latestDate: formatDate(datedRows.at(-1) ?? null)
	};
}

function average(values: number[]) {
	if (values.length === 0) return null;
	return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function topicCount(entries: PreparedEntry[], label: string) {
	return entries.filter((entry) => entry.topicHits.has(label)).length;
}

function topicRatio(entries: PreparedEntry[], label: string) {
	if (entries.length === 0) return 0;
	return topicCount(entries, label) / entries.length;
}

function topicAverageMood(entries: PreparedEntry[], label: string) {
	const moods = entries
		.filter((entry) => entry.topicHits.has(label) && entry.mood !== null)
		.map((entry) => entry.mood as number);
	return average(moods);
}

function splitEarlyLate(entries: PreparedEntry[]) {
	const sliceSize = Math.max(4, Math.min(30, Math.floor(entries.length * 0.28)));
	return {
		early: entries.slice(0, sliceSize),
		late: entries.slice(-sliceSize)
	};
}

function getEvidenceLevel(entryCount: number, spanDays: number): InsightEvidenceLevel {
	if (entryCount < MIN_OVERVIEW_ENTRIES) return 'none';
	if (entryCount < MIN_PATTERN_ENTRIES) return 'emerging';
	if (entryCount >= LONGITUDINAL_ENTRIES && spanDays >= 150) return 'longitudinal';
	if (entryCount >= DEEP_ANALYSIS_ENTRIES) return 'deep';
	return 'ready';
}

function buildThemes(entries: PreparedEntry[]): ThemeInsight[] {
	const counts = TOPICS.map((topic) => ({ label: topic.label, count: topicCount(entries, topic.label) }))
		.filter((topic) => topic.count >= 2)
		.sort((a, b) => b.count - a.count)
		.slice(0, 8);
	const max = Math.max(...counts.map((topic) => topic.count), 1);
	return counts.map((topic, index) => ({
		label: topic.label,
		count: topic.count,
		weight: Math.max(0.45, topic.count / max),
		tone: index % 3 === 0 ? 'warm' : index % 3 === 1 ? 'steady' : 'soft',
		evidence: `${topic.count} av ${entries.length} reflektioner nämner ord kopplade till ${topic.label.toLowerCase()}.`
	}));
}

function buildOverview(entries: PreparedEntry[]): EvidenceClaim[] {
	const { early, late } = splitEarlyLate(entries);
	const claims: EvidenceClaim[] = [];
	const moods = entries.filter((entry) => entry.mood !== null).map((entry) => entry.mood as number);
	const earlyMood = average(early.filter((entry) => entry.mood !== null).map((entry) => entry.mood as number));
	const lateMood = average(late.filter((entry) => entry.mood !== null).map((entry) => entry.mood as number));

	for (const topic of TOPICS) {
		const earlyCount = topicCount(early, topic.label);
		const lateCount = topicCount(late, topic.label);
		const earlyRatio = topicRatio(early, topic.label);
		const lateRatio = topicRatio(late, topic.label);
		if (lateCount >= 2 && lateRatio - earlyRatio >= 0.16) {
			claims.push({
				title: `${topic.label} tar mer plats nu`,
				description: `Du skriver oftare om ${topic.label.toLowerCase()} i de senaste reflektionerna än i början av underlaget.`,
				evidence: `${lateCount} av de senaste ${late.length} reflektionerna nämner ${topic.label.toLowerCase()}, jämfört med ${earlyCount} av de första ${early.length}.`
			});
		}
	}

	if (earlyMood !== null && lateMood !== null && Math.abs(lateMood - earlyMood) >= 0.7) {
		claims.push({
			title: lateMood > earlyMood ? 'Måendet ser ljusare ut i slutet av perioden' : 'Slutet av perioden verkar tyngre',
			description:
				lateMood > earlyMood
					? 'De senaste humörvärdena ligger tydligt högre än i början av underlaget.'
					: 'De senaste humörvärdena ligger lägre än i början, vilket kan vara värt att möta varsamt.',
			evidence: `Snittet går från ${earlyMood.toFixed(1)} till ${lateMood.toFixed(1)} i jämförbara delar av dagboken.`
		});
	}

	const futureLate = topicCount(late, 'Framtiden');
	const hopeLate = late.filter((entry) => includesAny(entry.text.toLowerCase(), ['hopp', 'hoppas', 'vill', 'plan'])).length;
	if (futureLate >= 2 || hopeLate >= 2) {
		claims.push({
			title: 'Framtiden syns i dina senare texter',
			description: 'I de senaste reflektionerna finns fler ord som handlar om planer, vilja eller sådant som ligger framför dig.',
			evidence: `${Math.max(futureLate, hopeLate)} av de senaste ${late.length} reflektionerna innehåller framtids- eller hoppmarkörer.`
		});
	}

	const positiveWithChildren = entries.filter(
		(entry) => entry.topicHits.has('Barnen') && (entry.mood === null || entry.mood >= 6 || includesAny(entry.text.toLowerCase(), POSITIVE_WORDS))
	).length;
	if (positiveWithChildren >= 3) {
		claims.push({
			title: 'Barnen återkommer ofta i ljusare sammanhang',
			description: 'När barnen nämns finns det flera reflektioner där tonen eller humörvärdet samtidigt är mjukare.',
			evidence: `${positiveWithChildren} reflektioner nämner barnen tillsammans med positiv ton eller humör från 6 och uppåt.`
		});
	}

	if (moods.length >= 8) {
		const lowDays = entries.filter((entry) => entry.mood !== null && entry.mood <= 4).length;
		const highDays = entries.filter((entry) => entry.mood !== null && entry.mood >= 7).length;
		if (lowDays > 0 && highDays > 0) {
			claims.push({
				title: 'Dagboken rymmer både tyngd och lättare dagar',
				description: 'Underlaget visar inte en enda riktning, utan flera skiftningar mellan svårare och ljusare perioder.',
				evidence: `${lowDays} reflektioner har humör 4 eller lägre och ${highDays} har humör 7 eller högre.`
			});
		}
	}

	return claims.slice(0, 6);
}

type MoodAssociationGroups = {
	helpful: EvidenceClaim[];
	challenging: EvidenceClaim[];
	combinations: EvidenceClaim[];
	neutral: EvidenceClaim[];
};

function formatMood(value: number) {
	return value.toFixed(1).replace('.', ',');
}

/**
 * Hittar endast samband som har en jämförelsegrupp. Det här är medvetet en
 * snävare analys än en ordmolnslista: ett tema behöver förekomma minst tre
 * gånger med humörvärde och skilja sig tydligt från övriga humörvärden.
 */
function buildMoodAssociationGroups(entries: PreparedEntry[]): MoodAssociationGroups {
	const helpful: Array<EvidenceClaim & { difference: number }> = [];
	const challenging: Array<EvidenceClaim & { difference: number }> = [];
	const combinations: Array<EvidenceClaim & { difference: number }> = [];
	const neutral: Array<EvidenceClaim & { count: number }> = [];
	const topics = TOPICS.filter((topic) => topic.label !== 'MittPsyke');

	for (const topic of topics) {
		const matching = entries.filter((entry) => entry.topicHits.has(topic.label) && entry.mood !== null);
		const other = entries.filter((entry) => !entry.topicHits.has(topic.label) && entry.mood !== null);
		if (matching.length < MIN_ASSOCIATION_ENTRIES || other.length < MIN_ASSOCIATION_COMPARISON_ENTRIES) continue;

		const matchingAverage = average(matching.map((entry) => entry.mood as number));
		const otherAverage = average(other.map((entry) => entry.mood as number));
		if (matchingAverage === null || otherAverage === null) continue;

		const difference = matchingAverage - otherAverage;
		const evidence = `${matching.length} av ${entries.length} texter nämner ${topic.label.toLowerCase()}, med humörsnitt ${formatMood(matchingAverage)} jämfört med ${formatMood(otherAverage)} i ${other.length} övriga texter.`;
		if (difference >= MOOD_ASSOCIATION_THRESHOLD) {
			helpful.push({
				title: `${topic.label} förekommer oftare under ljusare dagar`,
				description: `När ${topic.label.toLowerCase()} nämns ligger humörvärdet oftare högre än i dina övriga texter. Det visar ett samband i underlaget, inte vad som orsakar det.`,
				evidence,
				difference
			});
		}
		if (difference <= -MOOD_ASSOCIATION_THRESHOLD) {
			challenging.push({
				title: `${topic.label} sammanfaller oftare med tyngre dagar`,
				description: `När ${topic.label.toLowerCase()} nämns ligger humörvärdet oftare lägre än i dina övriga texter. Det visar ett samband i underlaget, inte vad som orsakar det.`,
				evidence,
				difference: Math.abs(difference)
			});
		}
		if (matching.length >= 4 && Math.abs(difference) < 0.4) {
			neutral.push({
				title: `${topic.label} återkommer i både lättare och tyngre perioder`,
				description: `När ${topic.label.toLowerCase()} nämns ligger humörvärdet ungefär på samma nivå som i dina övriga texter. Det går därför inte att se ett enkelt samband här.`,
				evidence,
				count: matching.length
			});
		}
	}

	for (let index = 0; index < topics.length; index += 1) {
		for (let compareIndex = index + 1; compareIndex < topics.length; compareIndex += 1) {
			const first = topics[index];
			const second = topics[compareIndex];
			const matching = entries.filter(
				(entry) => entry.topicHits.has(first.label) && entry.topicHits.has(second.label) && entry.mood !== null
			);
			const other = entries.filter(
				(entry) => !(entry.topicHits.has(first.label) && entry.topicHits.has(second.label)) && entry.mood !== null
			);
			if (matching.length < MIN_ASSOCIATION_ENTRIES || other.length < MIN_ASSOCIATION_COMPARISON_ENTRIES) continue;

			const matchingAverage = average(matching.map((entry) => entry.mood as number));
			const otherAverage = average(other.map((entry) => entry.mood as number));
			if (matchingAverage === null || otherAverage === null) continue;

			const difference = matchingAverage - otherAverage;
			if (Math.abs(difference) < MOOD_ASSOCIATION_THRESHOLD) continue;
			const direction = difference > 0 ? 'ljusare' : 'tyngre';
			combinations.push({
				title: `${first.label} och ${second.label} återkommer tillsammans`,
				description: `När båda nämns samtidigt ligger humörvärdet oftare på en ${direction} nivå än i övriga texter.`,
				evidence: `${matching.length} texter nämner både ${first.label.toLowerCase()} och ${second.label.toLowerCase()}, med humörsnitt ${formatMood(matchingAverage)} jämfört med ${formatMood(otherAverage)} i ${other.length} övriga texter.`,
				difference: Math.abs(difference)
			});
		}
	}

	const byStrength = (a: { difference: number }, b: { difference: number }) => b.difference - a.difference;
	return {
		helpful: helpful.sort(byStrength).slice(0, 3),
		challenging: challenging.sort(byStrength).slice(0, 3),
		combinations: combinations.sort(byStrength).slice(0, 2),
		neutral: neutral.sort((a, b) => b.count - a.count).slice(0, 1)
	};
}

function buildPatterns(entries: PreparedEntry[]): EvidenceClaim[] {
	const claims: EvidenceClaim[] = [];
	const moods = entries.filter((entry) => entry.mood !== null);

	if (moods.length >= 8) {
		const sleepMood = topicAverageMood(entries, 'Sömn');
		const otherMood = average(entries.filter((entry) => !entry.topicHits.has('Sömn') && entry.mood !== null).map((entry) => entry.mood as number));
		if (sleepMood !== null && otherMood !== null && topicCount(entries, 'Sömn') >= 3 && otherMood - sleepMood >= 0.6) {
			claims.push({
				title: 'Sömn verkar hänga ihop med tyngre dagar',
				description: 'När sömn nämns ligger humörvärdena ofta lite lägre än i övriga reflektioner.',
				evidence: `Snittet vid sömntexter är ${sleepMood.toFixed(1)}, jämfört med ${otherMood.toFixed(1)} i övriga texter.`
			});
		}

		const weekend = moods.filter((entry) => entry.weekday === 0 || entry.weekday === 6).map((entry) => entry.mood as number);
		const weekday = moods.filter((entry) => entry.weekday !== 0 && entry.weekday !== 6).map((entry) => entry.mood as number);
		const weekendAvg = average(weekend);
		const weekdayAvg = average(weekday);
		if (weekend.length >= 3 && weekday.length >= 3 && weekendAvg !== null && weekdayAvg !== null && weekendAvg - weekdayAvg >= 0.6) {
			claims.push({
				title: 'Helgerna verkar ge lite mer lugn',
				description: 'Humörvärdena ligger högre på helger än på vardagar i det här underlaget.',
				evidence: `Helgsnitt ${formatMood(weekendAvg)} i ${weekend.length} registreringar jämfört med vardagssnitt ${formatMood(weekdayAvg)} i ${weekday.length} registreringar.`
			});
		}
	}

	const medianLength = [...entries].sort((a, b) => a.wordCount - b.wordCount)[Math.floor(entries.length / 2)]?.wordCount ?? 0;
	let shortThenLong = 0;
	for (let i = 0; i < entries.length - 1; i++) {
		if (entries[i].wordCount <= medianLength * 0.65 && entries[i + 1].wordCount >= medianLength * 1.35) {
			shortThenLong++;
		}
	}
	if (shortThenLong >= 2) {
		claims.push({
			title: 'Korta avtryck följs ibland av längre reflektioner',
			description: 'Det finns flera tillfällen där en kort text kommer före en mer utforskande text.',
			evidence: `${shortThenLong} sekvenser visar kortare text följd av tydligt längre reflektion.`
		});
	}

	let recoveryMoments = 0;
	for (let i = 0; i < entries.length - 1; i++) {
		const current = entries[i];
		const next = entries[i + 1];
		if (current.mood !== null && next.mood !== null && current.mood <= 4 && next.mood - current.mood >= 2) {
			recoveryMoments++;
		}
	}
	if (recoveryMoments >= 2) {
		claims.push({
			title: 'Du verkar kunna röra dig vidare efter tunga dagar',
			description: 'Efter flera lägre humörvärden följer senare reflektioner med tydligt högre värden.',
			evidence: `${recoveryMoments} tillfällen visar en ökning på minst två steg efter ett lågt humörvärde.`
		});
	}

	const stressWeekdays = entries.filter((entry) => entry.topicHits.has('Stress') && entry.weekday !== 0 && entry.weekday !== 6).length;
	const stressWeekend = entries.filter((entry) => entry.topicHits.has('Stress') && (entry.weekday === 0 || entry.weekday === 6)).length;
	if (stressWeekdays >= 3 && stressWeekdays >= stressWeekend * 2) {
		claims.push({
			title: 'Stress återkommer främst under vardagar',
			description: 'Stressorden syns oftare i vardagstexterna än i helgtexterna.',
			evidence: `${stressWeekdays} vardagsreflektioner nämner stress, jämfört med ${stressWeekend} under helger.`
		});
	}

	const associations = buildMoodAssociationGroups(entries);
	claims.push(...associations.combinations, ...associations.neutral);

	return claims.slice(0, 5);
}

function buildStrengths(entries: PreparedEntry[]): EvidenceClaim[] {
	return buildMoodAssociationGroups(entries).helpful;
}

function buildMultipleThemeChallenge(entries: PreparedEntry[]): EvidenceClaim | null {
	const moodEntries = entries.filter((entry) => entry.mood !== null);
	const matching = moodEntries.filter((entry) => entry.topicHits.size >= 3);
	const other = moodEntries.filter((entry) => entry.topicHits.size < 3);
	if (matching.length < MIN_ASSOCIATION_ENTRIES || other.length < MIN_ASSOCIATION_COMPARISON_ENTRIES) {
		return null;
	}

	const matchingAverage = average(matching.map((entry) => entry.mood as number));
	const otherAverage = average(other.map((entry) => entry.mood as number));
	if (matchingAverage === null || otherAverage === null || otherAverage - matchingAverage < MOOD_ASSOCIATION_THRESHOLD) {
		return null;
	}

	const themeCounts = new Map<string, number>();
	for (const entry of matching) {
		for (const label of entry.topicHits.keys()) {
			themeCounts.set(label, (themeCounts.get(label) ?? 0) + 1);
		}
	}
	const themes = [...themeCounts.entries()]
		.sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
		.slice(0, 3)
		.map(([label]) => label.toLowerCase());
	const themeList = themes.length > 0 ? `, bland annat ${themes.join(', ')}` : '';

	return {
		title: 'Flera teman samtidigt sammanfaller oftare med tyngre dagar',
		description: `I de här registreringarna återkommer flera teman samtidigt${themeList}. Det visar ett mönster i underlaget, inte vad som ligger bakom det.`,
		evidence: `${matching.length} registreringar med minst tre teman har humörsnitt ${formatMood(matchingAverage)}, jämfört med ${formatMood(otherAverage)} i ${other.length} övriga registreringar.`
	};
}

function buildChallenges(entries: PreparedEntry[]): EvidenceClaim[] {
	const multipleThemeChallenge = buildMultipleThemeChallenge(entries);
	return [
		...(multipleThemeChallenge ? [multipleThemeChallenge] : []),
		...buildMoodAssociationGroups(entries).challenging
	].slice(0, 3);
}

function summarizeSegment(entries: PreparedEntry[]) {
	if (entries.length === 0) return 'Det finns för lite underlag i den här delen för att säga något tydligt.';
	const topTheme = buildThemes(entries)[0];
	const moods = entries.filter((entry) => entry.mood !== null).map((entry) => entry.mood as number);
	const moodAvg = average(moods);
	if (topTheme && moodAvg !== null) {
		return `Här återkommer ${topTheme.label.toLowerCase()} mest, och humörsnittet ligger runt ${moodAvg.toFixed(1)}.`;
	}
	if (topTheme) return `Här återkommer ${topTheme.label.toLowerCase()} mest i texterna.`;
	if (moodAvg !== null) return `Humörsnittet ligger runt ${moodAvg.toFixed(1)}, men teman är ännu svåra att urskilja.`;
	return 'Texterna finns här, men underlaget är fortfarande ganska stilla och blandat.';
}

function meanAbsoluteDeviation(values: number[]) {
	if (values.length < 2) return null;
	const mean = average(values);
	if (mean === null) return null;
	return values.reduce((sum, value) => sum + Math.abs(value - mean), 0) / values.length;
}

function buildTimelineObservations(entries: PreparedEntry[]): EvidenceClaim[] {
	const observations: EvidenceClaim[] = [];
	const moodEntries = entries.filter((entry) => entry.mood !== null);
	const { early, late } = splitEarlyLate(moodEntries);
	const earlyValues = early.map((entry) => entry.mood as number);
	const lateValues = late.map((entry) => entry.mood as number);
	const earlyAverage = average(earlyValues);
	const lateAverage = average(lateValues);

	if (earlyValues.length >= 4 && lateValues.length >= 4 && earlyAverage !== null && lateAverage !== null) {
		const difference = lateAverage - earlyAverage;
		if (Math.abs(difference) >= MOOD_ASSOCIATION_THRESHOLD) {
			observations.push({
				title: difference > 0 ? 'Den senare perioden ligger ljusare' : 'Den senare perioden ligger tyngre',
				description: difference > 0
					? 'De senare humörvärdena ligger tydligt högre än i början av underlaget.'
					: 'De senare humörvärdena ligger tydligt lägre än i början av underlaget.',
				evidence: `Humörsnittet är ${formatMood(earlyAverage)} i de första ${earlyValues.length} registreringarna och ${formatMood(lateAverage)} i de senaste ${lateValues.length}.`
			});
		}

		const earlyVariation = meanAbsoluteDeviation(earlyValues);
		const lateVariation = meanAbsoluteDeviation(lateValues);
		if (earlyVariation !== null && lateVariation !== null && Math.abs(lateVariation - earlyVariation) >= 0.6) {
			observations.push({
				title: lateVariation < earlyVariation ? 'Måendet har blivit jämnare' : 'Måendet har blivit mer växlande',
				description: lateVariation < earlyVariation
					? 'De senare registreringarna ligger närmare varandra än i början av underlaget.'
					: 'De senare registreringarna ligger längre ifrån varandra än i början av underlaget.',
				evidence: `Den genomsnittliga avvikelsen från snittet är ${formatMood(earlyVariation)} i början och ${formatMood(lateVariation)} i slutet, beräknat på ${earlyValues.length} respektive ${lateValues.length} registreringar.`
			});
		}
	}

	const recoveries: number[] = [];
	let lowRegistrations = 0;
	for (let index = 0; index < moodEntries.length - 1; index += 1) {
		const current = moodEntries[index];
		if ((current.mood as number) > 4) continue;
		lowRegistrations += 1;
		for (let nextIndex = index + 1; nextIndex < moodEntries.length; nextIndex += 1) {
			const next = moodEntries[nextIndex];
			const daysUntilNext = Math.round((next.date.getTime() - current.date.getTime()) / DAY_MS);
			if (daysUntilNext > 14) break;
			if ((next.mood as number) - (current.mood as number) >= 2) {
				recoveries.push(daysUntilNext);
				break;
			}
		}
	}
	if (recoveries.length >= 3 && lowRegistrations >= 3) {
		const sortedDays = [...recoveries].sort((a, b) => a - b);
		const medianDays = sortedDays[Math.floor(sortedDays.length / 2)];
		observations.push({
			title: 'Det finns flera återhämtningsskiften',
			description: 'Efter några lägre registreringar följer en senare registrering som ligger minst två steg högre. Det visar ett återkommande förlopp, inte vad som ligger bakom det.',
			evidence: `${recoveries.length} av ${lowRegistrations} registreringar på 4 eller lägre följdes inom 14 dagar av en registrering minst två steg högre. Medianen till nästa högre registrering är ${medianDays} ${medianDays === 1 ? 'dag' : 'dagar'}.`
		});
	}

	return observations.slice(0, 3);
}

function buildTimeline(entries: PreparedEntry[]) {
	const first = entries[0]?.date ?? null;
	const latest = entries.at(-1)?.date ?? null;
	const spanDays = first && latest ? Math.max(0, Math.round((latest.getTime() - first.getTime()) / DAY_MS)) : 0;
	const { early, late } = splitEarlyLate(entries);
	const segments: TimelineSegment[] = [];

	segments.push({
		label: 'I början',
		range: `${formatDate(early[0]?.date ?? null) ?? ''} - ${formatDate(early.at(-1)?.date ?? null) ?? ''}`,
		entryCount: early.length,
		summary: summarizeSegment(early)
	});

	const addWindow = (label: string, daysAgo: number) => {
		if (!latest || spanDays < daysAgo - 20) return;
		const center = latest.getTime() - daysAgo * DAY_MS;
		const window = entries.filter((entry) => Math.abs(entry.date.getTime() - center) <= 45 * DAY_MS).slice(0, 24);
		if (window.length < 3) return;
		segments.push({
			label,
			range: `${formatDate(window[0].date)} - ${formatDate(window.at(-1)?.date ?? null)}`,
			entryCount: window.length,
			summary: summarizeSegment(window)
		});
	};

	addWindow('För ungefär sex månader sedan', 180);
	addWindow('För ungefär tre månader sedan', 90);

	segments.push({
		label: 'Nu',
		range: `${formatDate(late[0]?.date ?? null) ?? ''} - ${formatDate(late.at(-1)?.date ?? null) ?? ''}`,
		entryCount: late.length,
		summary: summarizeSegment(late)
	});

	const earlyTop = buildThemes(early)[0]?.label.toLowerCase();
	const lateTop = buildThemes(late)[0]?.label.toLowerCase();
	const summary =
		earlyTop && lateTop && earlyTop !== lateTop
			? `I början syntes ${earlyTop} mest. Nu tar ${lateTop} mer plats i texterna.`
			: lateTop
				? `Det som syns tydligast just nu är ${lateTop}, med små skiftningar över tid.`
				: 'Resan går att följa i flera steg, men teman behöver mer underlag för att bli tydliga.';

	return {
		title: 'Så har din resa förändrats',
		summary,
		segments,
		observations: buildTimelineObservations(entries)
	};
}

function buildStory(insight: Omit<DiaryNarrativeInsight, 'storyParagraphs' | 'generatedWithAi'>): string[] {
	if (insight.evidenceLevel === 'none') return [];
	const paragraphs = [
		`Det här bygger på ${insight.entryCount} reflektioner i din dagbok. Jag håller mig till sådant som återkommer i orden, datumen och humörvärdena.`,
		insight.overview[0]?.description ?? 'Det finns början till mönster, men de behöver fortfarande lite mer tid för att bli tydliga.',
		insight.timeline.summary
	];

	if (insight.patterns[0]) paragraphs.push(insight.patterns[0].description);
	if (insight.strengths.length > 0) {
		paragraphs.push(`Det som verkar ha blivit starkare är framför allt ${insight.strengths.map((item) => item.title.toLowerCase()).join(', ')}.`);
	}
	if (insight.challenges.length > 0) {
		paragraphs.push(`Samtidigt finns sådant som återkommer ibland, särskilt ${insight.challenges.map((item) => item.title.toLowerCase()).join(', ')}. Det står här som ett mönster att lägga märke till, inte som en dom.`);
	}
	if (insight.evidenceLevel === 'deep' || insight.evidenceLevel === 'longitudinal') {
		paragraphs.push('Eftersom dagboken innehåller många inlägg går det att se mer än enstaka dagar. Det blir möjligt att jämföra återkommande teman med hur de förändras över tid.');
	}
	paragraphs.push('Det viktigaste är kanske inte att allt går åt ett håll, utan att det finns spår av hur du återvänder, formulerar dig och fortsätter följa det som händer.');

	return paragraphs.slice(0, insight.evidenceLevel === 'emerging' ? 5 : 10);
}

type NarrativeProviderInput = {
	response_format: { type: 'json_object' };
	temperature: number;
	max_tokens: number;
	messages: AIMessage[];
};

/** Keeps the diary analysis on the shared provider contract and makes it injectable in tests. */
async function generateDiaryNarrativeCompletion(
	provider: AITextProvider | undefined,
	request: NarrativeProviderInput
) {
	const systemInstructions = request.messages
		.filter((message) => message.role === 'system')
		.map((message) => message.content);
	const messages = request.messages.filter((message) => message.role !== 'system');
	const result = await createAITextGenerator(provider)({
		purpose: 'diary-narrative',
		systemInstructions: [...buildWeeklySummarySafetyInstructions(), ...systemInstructions],
		messages,
		temperature: request.temperature,
		outputFormat: 'json_object'
	});
	return { choices: [{ message: { content: result.text } }] };
}

async function rewriteStoryWithAi(provider: AITextProvider | undefined, insight: DiaryNarrativeInsight) {
	if (insight.storyParagraphs.length === 0) return insight;

	const evidence = [
		...insight.overview,
		...insight.patterns,
		...insight.strengths,
		...insight.challenges
	].map((claim) => `- ${claim.title}: ${claim.evidence}`);

	try {
		const completion = await generateDiaryNarrativeCompletion(provider, {
			response_format: { type: 'json_object' },
			temperature: 0.25,
			max_tokens: 900,
			messages: [
				{
					role: 'system',
					content:
						'Du skriver varm, lågmäld svensk produktcopy för en privat dagboksanalys. Du får aldrig lägga till något som inte stöds av evidensen. Ingen diagnos, inga råd, ingen terapi, inga stora ord.'
				},
				{
					role: 'user',
					content: `Skriv om berättelsen till 5-10 korta stycken. Returnera endast JSON: {"storyParagraphs":["..."]}.

Evidens:
${evidence.join('\n')}

Nuvarande berättelse:
${insight.storyParagraphs.map((text) => `- ${text}`).join('\n')}`
				}
			]
		});
		const raw = completion.choices[0]?.message?.content;
		const parsed = raw ? JSON.parse(raw) as { storyParagraphs?: unknown } : null;
		const storyParagraphs = Array.isArray(parsed?.storyParagraphs)
			? parsed.storyParagraphs.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).slice(0, 10)
			: [];
		if (storyParagraphs.length >= 3) {
			return { ...insight, storyParagraphs, generatedWithAi: true };
		}
	} catch {
		// Fallbacken är avsiktligt deterministisk och evidensbaserad.
	}

	return insight;
}

export async function buildDiaryNarrativeInsight(
	rows: DiaryInsightRow[],
	options: { provider?: AITextProvider; generateWithAi?: boolean } = {}
): Promise<DiaryNarrativeInsight> {
	const entries = prepareEntries(rows);
	const dataBasis = buildDataBasis(rows);
	const first = entries[0]?.date ?? null;
	const latest = entries.at(-1)?.date ?? null;
	const spanDays = first && latest ? Math.max(0, Math.round((latest.getTime() - first.getTime()) / DAY_MS)) : 0;
	const evidenceLevel = getEvidenceLevel(entries.length, spanDays);
	const base = {
		entryCount: entries.length,
		dataBasis,
		firstEntryDate: formatDate(first),
		latestEntryDate: formatDate(latest),
		evidenceLevel,
		readinessMessage:
			evidenceLevel === 'none'
				? 'Jag behöver lite fler reflektioner innan jag kan se tydliga mönster.'
				: evidenceLevel === 'emerging'
					? 'Jag ser några tidiga spår, men tolkar dem försiktigt eftersom underlaget fortfarande är litet.'
					: evidenceLevel === 'deep' || evidenceLevel === 'longitudinal'
						? 'Det finns tillräckligt många reflektioner för att se tydligare förändringar över tid.'
						: 'Det finns tillräckligt mycket dagboksdata för att visa varsamma mönster.',
		overviewIntro: 'Det här är vad jag har lagt märke till i dina reflektioner.',
		overview: evidenceLevel === 'none' ? [] : buildOverview(entries),
		patterns: entries.length < MIN_PATTERN_ENTRIES ? [] : buildPatterns(entries),
		themes: entries.length < MIN_PATTERN_ENTRIES ? [] : buildThemes(entries),
		timeline:
			entries.length < MIN_TIMELINE_ENTRIES
				? { title: 'Så har din resa förändrats', summary: '', segments: [], observations: [] }
				: buildTimeline(entries),
		strengths: entries.length < MIN_PATTERN_ENTRIES ? [] : buildStrengths(entries),
		challenges: entries.length < MIN_PATTERN_ENTRIES ? [] : buildChallenges(entries)
	};

	const insight: DiaryNarrativeInsight = {
		...base,
		storyParagraphs: buildStory(base),
		generatedWithAi: false
	};

	if (entries.length < MIN_PATTERN_ENTRIES || options.generateWithAi === false) return insight;
	return rewriteStoryWithAi(options.provider, insight);
}
