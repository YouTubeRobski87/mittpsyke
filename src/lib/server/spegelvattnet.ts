import type { SupabaseClient } from '@supabase/supabase-js';
import { hasWeeklySummaryAiConsent } from '$lib/server/weekly-summary-ai-consent';
import { callClaude as callClaudeShared } from './ai/anthropic';

type WeeklyReflectionStatus = 'ready' | 'paused' | 'opened' | 'expired';

type DiaryPost = {
	id: string;
	text: string | null;
	mood: string | null;
	created_at: string | null;
};

export type WeeklyReflectionRecord = {
	id: string;
	user_id: string;
	week_start: string;
	words: string[];
	quoted_sentence: string | null;
	quoted_sentence_post_id: string | null;
	movement: string | null;
	open_question: string | null;
	status: WeeklyReflectionStatus;
	paused_reason: string | null;
	context_snapshot: Record<string, unknown>;
	created_at: string;
	opened_at: string | null;
};

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const AI_TIMEOUT_MS = 15000;
// Taket täcker thinking och svarstext tillsammans. Systemprompterna begränsar
// själva svaret (JSON på några rader), men thinking behöver eget utrymme.
const AI_MAX_TOKENS = 2000;
const CRISIS_KEYWORDS = [
	'ta livet av mig',
	'döda mig',
	'självmord',
	'ingen mening att leva',
	'skada mig själv',
	'skär mig',
	'vill inte finnas'
];

const QUESTION_FALLBACKS = [
	'Vad vill du ta med dig från veckan som varit?',
	'Vad behöver du av nästa vecka?',
	'Vad är ett ord du vill släppa?',
	'Vad satt kvar mest från den här veckan?'
];

const SWEDISH_STOP_WORDS = new Set([
	'alla',
	'allt',
	'alltid',
	'andra',
	'att',
	'av',
	'bara',
	'blev',
	'bli',
	'blir',
	'bra',
	'den',
	'det',
	'detta',
	'dig',
	'din',
	'dina',
	'dom',
	'du',
	'där',
	'efter',
	'eller',
	'en',
	'ett',
	'fast',
	'för',
	'från',
	'få',
	'får',
	'fått',
	'ganska',
	'gör',
	'göra',
	'ha',
	'hade',
	'han',
	'har',
	'hon',
	'hos',
	'hur',
	'här',
	'igen',
	'in',
	'ingen',
	'inget',
	'inte',
	'jag',
	'ju',
	'kan',
	'kanske',
	'kom',
	'kommer',
	'kunde',
	'lite',
	'man',
	'med',
	'men',
	'mer',
	'mig',
	'min',
	'mina',
	'mitt',
	'mot',
	'mycket',
	'nog',
	'när',
	'något',
	'någon',
	'och',
	'om',
	'också',
	'på',
	'sa',
	'samma',
	'se',
	'sen',
	'ska',
	'skulle',
	'som',
	'så',
	'tar',
	'till',
	'tror',
	'under',
	'upp',
	'utan',
	'vad',
	'var',
	'vara',
	'varit',
	'vecka',
	'vid',
	'vill',
	'väl',
	'över'
]);

const stockholmDateFormatter = new Intl.DateTimeFormat('sv-CA', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

const stockholmPartsFormatter = new Intl.DateTimeFormat('sv-SE', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: 'numeric',
	day: 'numeric',
	weekday: 'short',
	hour: 'numeric',
	hour12: false
});

export function getStockholmDateKey(date = new Date()) {
	return stockholmDateFormatter.format(date);
}

function dateKeyToUtcMs(dateKey: string) {
	const [year, month, day] = dateKey.split('-').map(Number);
	return Date.UTC(year, month - 1, day);
}

function addDays(dateKey: string, days: number) {
	const date = new Date(dateKeyToUtcMs(dateKey));
	date.setUTCDate(date.getUTCDate() + days);
	return date.toISOString().slice(0, 10);
}

function broadUtcStart(dateKey: string) {
	return `${addDays(dateKey, -1)}T00:00:00.000Z`;
}

function broadUtcEnd(dateKey: string) {
	return `${addDays(dateKey, 1)}T00:00:00.000Z`;
}

function isWithinStockholmDateRange(value: string | null | undefined, start: string, endExclusive: string) {
	if (!value) return false;
	const key = getStockholmDateKey(new Date(value));
	return key >= start && key < endExclusive;
}

function getStockholmParts(date = new Date()) {
	const parts = stockholmPartsFormatter.formatToParts(date);
	const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
	return {
		weekday: get('weekday').toLowerCase(),
		hour: Number(get('hour'))
	};
}

export function shouldRunSpegelvattnetCron(date = new Date()) {
	const parts = getStockholmParts(date);
	return parts.weekday.startsWith('sön') && parts.hour === 6;
}

export function currentStockholmWeekStart(date = new Date()) {
	const today = getStockholmDateKey(date);
	const weekday = new Intl.DateTimeFormat('sv-SE', {
		timeZone: STOCKHOLM_TIME_ZONE,
		weekday: 'short'
	}).format(date).toLowerCase();
	const offset = weekday.startsWith('mån')
		? 0
		: weekday.startsWith('tis')
			? -1
			: weekday.startsWith('ons')
				? -2
				: weekday.startsWith('tor')
					? -3
					: weekday.startsWith('fre')
						? -4
						: weekday.startsWith('lör')
							? -5
							: -6;
	return addDays(today, offset);
}

function hasCrisisSignal(text: string | null | undefined) {
	const normalized = (text ?? '').toLowerCase();
	return CRISIS_KEYWORDS.some((keyword) => {
		const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'iu').test(normalized);
	});
}

function parseMood(value: string | null | undefined) {
	if (!value) return null;
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric < 1 || numeric > 10) return null;
	return Math.round(numeric);
}

function normalizeWord(word: string) {
	return word.toLowerCase().replace(/^[^\p{L}]+|[^\p{L}]+$/gu, '');
}

function countWords(posts: DiaryPost[]) {
	const counts = new Map<string, number>();
	for (const post of posts) {
		const words = (post.text ?? '').match(/[\p{L}]{3,}/gu) ?? [];
		for (const raw of words) {
			const word = normalizeWord(raw);
			if (word.length < 3 || SWEDISH_STOP_WORDS.has(word)) continue;
			counts.set(word, (counts.get(word) ?? 0) + 1);
		}
	}
	return counts;
}

function topRecurringWords(posts: DiaryPost[]) {
	return [...countWords(posts).entries()]
		.filter(([, count]) => count >= 2)
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'sv-SE'))
		.slice(0, 5)
		.map(([word]) => word);
}

function buildMovement(currentWords: string[], previousWords: string[]) {
	if (previousWords.length > 0) {
		const disappeared = previousWords.find((word) => !currentWords.includes(word));
		if (disappeared) return `Ordet "${disappeared}" förekommer mindre den här veckan.`;
	}
	const newWord = currentWords.find((word) => !previousWords.includes(word));
	if (newWord) return `Ordet "${newWord}" är nytt den här veckan.`;
	return null;
}

function cleanQuestion(value: string) {
	return value
		.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}

function isValidQuestion(value: string) {
	const question = cleanQuestion(value);
	const words = question.match(/[\p{L}\p{N}]+/gu) ?? [];
	return question.length > 0 && question.length <= 240 && !question.includes('!') && words.length <= 20;
}

function callClaude(system: string, userContent: string, maxTokens = AI_MAX_TOKENS) {
	return callClaudeShared({
		label: 'spegelvattnet',
		system,
		prompt: userContent,
		maxTokens,
		timeoutMs: AI_TIMEOUT_MS
	});
}

async function selectQuotedSentence(posts: DiaryPost[]) {
	const system = `Du hjälper en svensk reflektionsapp att välja EN mening från användarens egna dagboksinlägg som fångar veckans tyngdpunkt.

REGLER
- Välj en mening som ANVÄNDAREN HAR SKRIVIT, ordagrant. Hitta inte på.
- Välj en mening som har emotionell vikt eller speglar en kärna i veckan.
- Undvik triviala meningar.
- Undvik meningar som handlar om akuta tankar på självskada eller suicidalitet. Om sådana meningar dominerar veckan, returnera null.
- Max 200 tecken. Om den valda meningen är längre, returnera null hellre än att klippa.

OUTPUT
Svara med JSON:
{ "sentence": "...", "post_id": "..." }
eller
{ "sentence": null, "post_id": null }
Inget annat.`;
	const payload = {
		posts: posts.map((post) => ({
			id: post.id,
			date: post.created_at ? getStockholmDateKey(new Date(post.created_at)) : null,
			text: post.text ?? ''
		}))
	};
	const raw = await callClaude(system, JSON.stringify(payload));
	if (!raw) return { sentence: null, post_id: null };

	try {
		const parsed = JSON.parse(raw) as { sentence?: unknown; post_id?: unknown };
		const sentence = typeof parsed.sentence === 'string' ? parsed.sentence.trim() : null;
		const postId = typeof parsed.post_id === 'string' ? parsed.post_id.trim() : null;
		const source = posts.find((post) => post.id === postId);
		if (!sentence || !postId || sentence.length > 200 || !source?.text?.includes(sentence)) {
			return { sentence: null, post_id: null };
		}
		if (hasCrisisSignal(sentence)) return { sentence: null, post_id: null };
		return { sentence, post_id: postId };
	} catch {
		return { sentence: null, post_id: null };
	}
}

async function generateOpenQuestion(summary: Record<string, unknown>) {
	const system = `Du skriver en reflektionsfråga för MittPsyke - en svensk app för textbaserat självreflektionsstöd. Frågan visas i slutet av en veckospegling.

TON
- Lugn, varsam, vuxen. Spegelvattnets ton.
- Inte coach, inte terapeut. Bara en mjuk fråga att ta med sig.
- Aldrig peppig. Aldrig "vad är du tacksam för".
- Aldrig diagnostiserande.

FORMAT
- En enda fråga. Max 20 ord. Svenska, du-form.
- Inga emojis, citattecken, inga inledningar.

INNEHÅLL
- Fråga ska kännas öppen, inte styrande.
- Får anspela på veckans teman men inte tolka dem.
- Om veckan haft tunga inslag (humör 1-4): mjuk fråga om utrymme eller vila, inte om glädje.

Du får veckans data som JSON. Svara med endast frågan.`;
	const raw = await callClaude(system, JSON.stringify(summary));
	if (raw && isValidQuestion(raw)) return cleanQuestion(raw);
	const seed = JSON.stringify(summary);
	const index = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % QUESTION_FALLBACKS.length;
	return QUESTION_FALLBACKS[index];
}

function buildSummary(posts: DiaryPost[], words: string[]) {
	const moods = posts.map((post) => parseMood(post.mood)).filter((mood): mood is number => mood !== null);
	return {
		antal_inlägg: posts.length,
		humörsnitt:
			moods.length > 0 ? Math.round((moods.reduce((sum, mood) => sum + mood, 0) / moods.length) * 10) / 10 : null,
		humörspann: moods.length > 0 ? [Math.min(...moods), Math.max(...moods)] : null,
		återkommande_ord: words
	};
}

function buildContextSnapshot(args: {
	weekStart: string;
	weekEnd: string;
	posts: DiaryPost[];
	words: string[];
	previousWords: string[];
	summary: Record<string, unknown>;
	quotedSentencePostId: string | null;
}) {
	return {
		week_start: args.weekStart,
		week_end_exclusive: args.weekEnd,
		post_count: args.posts.length,
		post_dates: args.posts.map((post) => (post.created_at ? getStockholmDateKey(new Date(post.created_at)) : null)),
		moods: args.posts.map((post) => parseMood(post.mood)).filter((mood): mood is number => mood !== null),
		words: args.words,
		previous_words: args.previousWords,
		open_question_input: args.summary,
		quoted_sentence_post_id: args.quotedSentencePostId
	};
}

async function loadPosts(supabase: SupabaseClient, userId: string, weekStart: string) {
	const weekEnd = addDays(weekStart, 7);
	const { data, error } = await supabase
		.from('diary')
		.select('id, text, mood, created_at')
		.eq('user_id', userId)
		.gte('created_at', broadUtcStart(weekStart))
		.lt('created_at', broadUtcEnd(weekEnd))
		.order('created_at', { ascending: true });

	if (error) {
		console.error('Spegelvattnet diary load error:', error);
		return { posts: [], weekEnd };
	}
	return {
		posts: ((data ?? []) as DiaryPost[]).filter((post) =>
			isWithinStockholmDateRange(post.created_at, weekStart, weekEnd)
		),
		weekEnd
	};
}

export async function generateWeeklyReflection(
	supabase: SupabaseClient,
	userId: string,
	weekStart: string
) {
	// Veckospeglingen läser flera sparade dagbokstexter och skickar delar av
	// dem till en AI-leverantör. Ett annat diary-/chattsamtycke får aldrig
	// breddas till detta syfte. Grinden ligger före varje läsning av innehåll.
	if (!(await hasWeeklySummaryAiConsent(supabase, userId))) {
		return { skipped: true, reason: 'consent_required' };
	}

	const existing = await supabase
		.from('weekly_reflections')
		.select('id')
		.eq('user_id', userId)
		.eq('week_start', weekStart)
		.maybeSingle();
	if (existing.data) return { skipped: true, reason: 'already_exists' };

	const { posts, weekEnd } = await loadPosts(supabase, userId, weekStart);
	if (posts.length < 2) return { skipped: true, reason: 'too_few_posts' };

	if (posts.some((post) => hasCrisisSignal(post.text))) {
		const { error } = await supabase.from('weekly_reflections').insert({
			user_id: userId,
			week_start: weekStart,
			words: [],
			status: 'paused',
			paused_reason: 'acute_signal',
			context_snapshot: {
				week_start: weekStart,
				week_end_exclusive: weekEnd,
				post_count: posts.length,
				paused_reason: 'acute_signal'
			}
		});
		if (error) console.error('Spegelvattnet paused insert error:', error);
		return { skipped: false, status: 'paused' };
	}

	const words = topRecurringWords(posts);
	const displayWords = words.length >= 3 ? words : [];
	const previous = await loadPosts(supabase, userId, addDays(weekStart, -7));
	const previousWordsRaw = topRecurringWords(previous.posts);
	const previousWords = previousWordsRaw.length >= 3 ? previousWordsRaw : [];
	const quoted = await selectQuotedSentence(posts);
	const summary = buildSummary(posts, displayWords);
	const openQuestion = await generateOpenQuestion(summary);
	const movement = buildMovement(displayWords, previousWords);

	const { error } = await supabase.from('weekly_reflections').insert({
		user_id: userId,
		week_start: weekStart,
		words: displayWords,
		quoted_sentence: quoted.sentence,
		quoted_sentence_post_id: quoted.post_id,
		movement,
		open_question: openQuestion,
		status: 'ready',
		context_snapshot: buildContextSnapshot({
			weekStart,
			weekEnd,
			posts,
			words: displayWords,
			previousWords,
			summary,
			quotedSentencePostId: quoted.post_id
		})
	});

	if (error) {
		console.error('Spegelvattnet ready insert error:', error);
		return { skipped: true, reason: 'insert_failed' };
	}

	return { skipped: false, status: 'ready' };
}

export async function generateWeeklyReflectionsForWeek(supabase: SupabaseClient, weekStart: string) {
	const weekEnd = addDays(weekStart, 7);
	const { data, error } = await supabase
		.from('diary')
		.select('user_id, created_at')
		.gte('created_at', broadUtcStart(weekStart))
		.lt('created_at', broadUtcEnd(weekEnd));

	if (error) {
		console.error('Spegelvattnet user discovery error:', error);
		return { generated: 0, skipped: 0, errors: 1 };
	}

	const counts = new Map<string, number>();
	for (const row of data ?? []) {
		const userId = typeof row.user_id === 'string' ? row.user_id : '';
		if (!userId || !isWithinStockholmDateRange(row.created_at, weekStart, weekEnd)) continue;
		counts.set(userId, (counts.get(userId) ?? 0) + 1);
	}

	let generated = 0;
	let skipped = 0;
	let errors = 0;
	for (const [userId, count] of counts) {
		if (count < 2) {
			skipped += 1;
			continue;
		}
		const result = await generateWeeklyReflection(supabase, userId, weekStart);
		if ('reason' in result && result.reason === 'insert_failed') errors += 1;
		else if (result.skipped) skipped += 1;
		else generated += 1;
	}

	return { generated, skipped, errors };
}

export function isReflectionVisibleByAge(weekStart: string, date = new Date()) {
	const ageDays = Math.floor((dateKeyToUtcMs(getStockholmDateKey(date)) - dateKeyToUtcMs(weekStart)) / 86400000);
	return ageDays <= 7;
}

export function isSundayOrMonday(date = new Date()) {
	const weekday = new Intl.DateTimeFormat('sv-SE', {
		timeZone: STOCKHOLM_TIME_ZONE,
		weekday: 'short'
	}).format(date).toLowerCase();
	return weekday.startsWith('sön') || weekday.startsWith('mån');
}
