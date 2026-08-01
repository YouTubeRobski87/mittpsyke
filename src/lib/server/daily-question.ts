import type { SupabaseClient, User } from '@supabase/supabase-js';
import { callClaude } from './ai/anthropic';

type MoodTrend = 'stabil' | 'stigande' | 'fallande' | 'svängig' | null;

export type DailyQuestionContext = {
	tid_på_dygnet: 'morgon' | 'förmiddag' | 'eftermiddag' | 'kväll' | 'natt';
	veckodag: string;
	dagar_sen_senaste_inlägg: number | null;
	senaste_inlägg_utdrag: string | null;
	senaste_humör: number | null;
	humörtrend_7d: MoodTrend;
	totalt_antal_inlägg: number;
	nyligen_använda_ord?: string[];
	bytt_fråga_idag: number;
};

export type DailyQuestionRecord = {
	id: string;
	user_id: string;
	date: string;
	question_text: string;
	context_snapshot: DailyQuestionContext;
	regenerations: number;
	created_at: string;
};

type DiaryRow = {
	text: string | null;
	mood: string | null;
	created_at: string | null;
};

const STOCKHOLM_TIME_ZONE = 'Europe/Stockholm';
const MAX_REGENERATIONS = 2;
const AI_TIMEOUT_MS = 15000;
// Taket täcker thinking och svarstext tillsammans. Frågan i sig är kort —
// SYSTEM_PROMPT begränsar den till ~15 ord — men thinking behöver utrymme.
const AI_MAX_TOKENS = 2000;

const stockholmDateFormatter = new Intl.DateTimeFormat('sv-CA', {
	timeZone: STOCKHOLM_TIME_ZONE,
	year: 'numeric',
	month: '2-digit',
	day: '2-digit'
});

const stockholmHourFormatter = new Intl.DateTimeFormat('sv-SE', {
	timeZone: STOCKHOLM_TIME_ZONE,
	hour: '2-digit',
	hour12: false
});

const stockholmWeekdayFormatter = new Intl.DateTimeFormat('sv-SE', {
	timeZone: STOCKHOLM_TIME_ZONE,
	weekday: 'long'
});

const FALLBACK_QUESTIONS = [
	'Vad behöver få lite mer plats hos dig idag?',
	'Vad vill du lägga märke till i dig själv just nu?',
	'Vad känns viktigast att få ur huvudet idag?',
	'Vad har följt med dig genom dagen?',
	'Vad skulle vara skönt att skriva ner just nu?',
	'Vad behöver du inte bära helt ensam idag?',
	'Vad vill du förstå lite bättre i dig själv?',
	'Vad känns sant för dig just nu?',
	'Vad skulle ge dig lite mer andrum idag?',
	'Vad vill du komma ihåg från den här stunden?'
];

const SYSTEM_PROMPT = `Du skriver Dagens fråga för MittPsyke - en svensk app för anonymt textstöd och reflektion. Frågan visas på användarens portal när de loggar in och inbjuder dem att skriva i dagboken.

TON
- Lugn, varsam, vuxen. Inte terapeut, inte coach, inte vän - någonstans mittemellan, som en omtänksam person som inte tar för mycket plats.
- Aldrig peppig. Aldrig "du klarar det här". Aldrig utropstecken.
- Aldrig diagnostiserande eller tolkande. Du speglar, du frågar.
- Direkt men mjuk. Hellre kort än utförlig.

FORMAT
- En enda fråga. Max 15 ord. Svenska, du-form.
- Inga emojis, inga citattecken, inga inledningar som "Idag undrar jag...".
- Bara frågan, ingenting annat.

INNEHÅLL
- Frågan ska kännas träffsäker utan att avslöja att du vet något om användaren. Använd kontexten för att forma TONEN och TIMINGEN, inte för att citera fakta - utom när det är uttryckligen rimligt.
- Morgon: framåtblickande, praktisk, mjuk.
- Kväll: reflekterande över dagen.
- Natt efter 22: kortare, mjukare, om vila och släppa.
- Söndag: kan vara veckoavslutande eller framåt mot nya veckan.
- Måndag morgon: erkänn att veckan börjar utan pep talk.
- Vid 7+ dagar sen senaste inlägg: välkomna mjukt, inga frågor om varför.
- Vid tungt senaste humör 1-4: omsorgsfull, fråga om utrymme, vila, vad som behövs. Inte om glädje. Inte uppmuntrande.
- Vid stigande trend: referera den ALDRIG.
- Vid svängig trend: neutral fråga, inga kommentarer om svängen.

UNDVIK
- Frågor som börjar med "Hur mår du?"
- "Vad är du tacksam för?"
- Frågor med "borde", "måste", "ska"
- Frågor som antar något om användaren

Du får kontexten som JSON. Svara med endast frågan, ingenting annat.`;

const SUPPORT_QUESTION = 'Vad behöver få vara varsamt hos dig just nu?';
const CRISIS_KEYWORDS = [
	'ta livet av mig',
	'döda mig',
	'självmord',
	'ingen mening att leva',
	'skada mig själv',
	'skär mig',
	'vill inte finnas'
];

const STOP_WORDS = new Set([
	'och',
	'att',
	'det',
	'som',
	'jag',
	'har',
	'var',
	'för',
	'med',
	'men',
	'den',
	'här',
	'ett',
	'min',
	'mig',
	'dig',
	'du',
	'till',
	'inte',
	'bara',
	'kan',
	'från',
	'över',
	'idag',
	'känns',
	'kände',
	'känna',
	'vara',
	'blev',
	'när'
]);

export function getStockholmDateKey(date = new Date()) {
	return stockholmDateFormatter.format(date);
}

function getTimeOfDay(date = new Date()): DailyQuestionContext['tid_på_dygnet'] {
	const hour = Number(stockholmHourFormatter.format(date));
	if (hour >= 5 && hour < 9) return 'morgon';
	if (hour >= 9 && hour < 12) return 'förmiddag';
	if (hour >= 12 && hour < 17) return 'eftermiddag';
	if (hour >= 17 && hour < 22) return 'kväll';
	return 'natt';
}

function toSnippet(value: string | null | undefined, maxLength = 150) {
	if (!value) return null;
	const normalized = value.replace(/\s+/g, ' ').trim();
	if (!normalized) return null;
	if (normalized.length <= maxLength) return normalized;
	return normalized.slice(0, maxLength).trimEnd();
}

function parseMood(value: string | null | undefined): number | null {
	if (!value) return null;
	const numeric = Number(value);
	if (!Number.isFinite(numeric) || numeric < 1 || numeric > 10) return null;
	return Math.round(numeric);
}

function dateKeyToUtcMs(dateKey: string) {
	const [year, month, day] = dateKey.split('-').map(Number);
	return Date.UTC(year, month - 1, day);
}

function daysSince(dateValue: string | null | undefined) {
	if (!dateValue) return null;
	const created = new Date(dateValue);
	if (Number.isNaN(created.getTime())) return null;
	const today = dateKeyToUtcMs(getStockholmDateKey());
	const entryDay = dateKeyToUtcMs(getStockholmDateKey(created));
	return Math.max(0, Math.round((today - entryDay) / 86400000));
}

function buildMoodTrend(moods: number[]): MoodTrend {
	if (moods.length < 3) return null;
	const chronological = [...moods].reverse();
	const first = chronological[0];
	const last = chronological[chronological.length - 1];
	let directionChanges = 0;
	let previousDirection = 0;

	for (let index = 1; index < chronological.length; index += 1) {
		const diff = chronological[index] - chronological[index - 1];
		const direction = Math.abs(diff) < 1 ? 0 : Math.sign(diff);
		if (direction !== 0 && previousDirection !== 0 && direction !== previousDirection) {
			directionChanges += 1;
		}
		if (direction !== 0) previousDirection = direction;
	}

	const spread = Math.max(...chronological) - Math.min(...chronological);
	if (directionChanges >= 2 || spread >= 4) return 'svängig';
	if (last >= first + 2) return 'stigande';
	if (last <= first - 2) return 'fallande';
	return 'stabil';
}

function extractWords(texts: Array<string | null | undefined>) {
	const counts = new Map<string, number>();
	for (const text of texts) {
		const words = (text ?? '').toLowerCase().match(/[\p{L}]{4,}/gu) ?? [];
		for (const word of words) {
			if (STOP_WORDS.has(word)) continue;
			counts.set(word, (counts.get(word) ?? 0) + 1);
		}
	}

	return [...counts.entries()]
		.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'sv-SE'))
		.slice(0, 5)
		.map(([word]) => word);
}

function hasCrisisSignal(text: string | null | undefined) {
	const normalized = (text ?? '').toLowerCase();
	return CRISIS_KEYWORDS.some((keyword) => {
		const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`, 'iu').test(normalized);
	});
}

function fallbackQuestion(context: DailyQuestionContext) {
	const seed = `${getStockholmDateKey()}:${context.totalt_antal_inlägg}:${context.bytt_fråga_idag}`;
	const index =
		[...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % FALLBACK_QUESTIONS.length;
	return FALLBACK_QUESTIONS[index];
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
	return question.length > 0 && question.length <= 200 && !question.includes('!') && words.length <= 15;
}

async function generateQuestionWithClaude(context: DailyQuestionContext) {
	// Två försök: modellen kan svara med en fråga som inte klarar isValidQuestion
	// (för lång, utropstecken, för många ord). Ett tekniskt fel ger däremot null
	// och då är ett omtag meningslöst — då går vi direkt på reservfrågan.
	for (let attempt = 0; attempt < 2; attempt += 1) {
		const text = await callClaude({
			label: 'daily-question',
			system: SYSTEM_PROMPT,
			prompt: JSON.stringify(context),
			maxTokens: AI_MAX_TOKENS,
			timeoutMs: AI_TIMEOUT_MS
		});

		if (!text) break;

		const question = cleanQuestion(text);
		if (isValidQuestion(question)) return question;
	}

	return fallbackQuestion(context);
}

export async function buildDailyQuestionContext(
	supabase: SupabaseClient,
	userId: string,
	regenerations: number
): Promise<{ context: DailyQuestionContext; crisis: boolean }> {
	const [entriesResult, totalResult] = await Promise.all([
		supabase
			.from('diary')
			.select('text, mood, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(20),
		supabase.from('diary').select('id', { count: 'exact', head: true }).eq('user_id', userId)
	]);

	if (entriesResult.error) {
		console.error('Daily question diary context load error:', entriesResult.error);
	}
	if (totalResult.error) {
		console.error('Daily question diary count error:', totalResult.error);
	}

	const entries = ((entriesResult.data ?? []) as DiaryRow[]).filter((entry) => entry.created_at);
	const latest = entries[0] ?? null;
	const latestMood = parseMood(latest?.mood);
	const recentMoods = entries.map((entry) => parseMood(entry.mood)).filter((mood): mood is number => mood !== null);
	const context: DailyQuestionContext = {
		tid_på_dygnet: getTimeOfDay(),
		veckodag: stockholmWeekdayFormatter.format(new Date()),
		dagar_sen_senaste_inlägg: daysSince(latest?.created_at),
		senaste_inlägg_utdrag: toSnippet(latest?.text),
		senaste_humör: latestMood,
		humörtrend_7d: buildMoodTrend(recentMoods.slice(0, 7)),
		totalt_antal_inlägg: totalResult.count ?? entries.length,
		bytt_fråga_idag: regenerations
	};

	const words = extractWords(entries.slice(0, 5).map((entry) => entry.text));
	if (words.length > 0) context.nyligen_använda_ord = words;

	return {
		context,
		crisis: hasCrisisSignal(latest?.text)
	};
}

export async function getOrCreateDailyQuestion(supabase: SupabaseClient, user: User) {
	const today = getStockholmDateKey();
	const existing = await supabase
		.from('daily_questions')
		.select('id, user_id, date, question_text, context_snapshot, regenerations, created_at')
		.eq('user_id', user.id)
		.eq('date', today)
		.maybeSingle<DailyQuestionRecord>();

	if (existing.error) {
		console.error('Daily question load error:', existing.error);
	}
	if (existing.data) return { question: existing.data, safety: false };

	const { context, crisis } = await buildDailyQuestionContext(supabase, user.id, 0);
	if (crisis) {
		return {
			question: {
				id: '',
				user_id: user.id,
				date: today,
				question_text: SUPPORT_QUESTION,
				context_snapshot: context,
				regenerations: 0,
				created_at: new Date().toISOString()
			},
			safety: true
		};
	}

	const questionText = await generateQuestionWithClaude(context);
	const inserted = await supabase
		.from('daily_questions')
		.insert({
			user_id: user.id,
			date: today,
			question_text: questionText,
			context_snapshot: context
		})
		.select('id, user_id, date, question_text, context_snapshot, regenerations, created_at')
		.single<DailyQuestionRecord>();

	if (inserted.error || !inserted.data) {
		console.error('Daily question insert error:', inserted.error);
		return {
			question: {
				id: '',
				user_id: user.id,
				date: today,
				question_text: questionText,
				context_snapshot: context,
				regenerations: 0,
				created_at: new Date().toISOString()
			},
			safety: false
		};
	}

	return { question: inserted.data, safety: false };
}

export async function regenerateDailyQuestion(supabase: SupabaseClient, user: User) {
	const today = getStockholmDateKey();
	const current = await getOrCreateDailyQuestion(supabase, user);

	if (current.safety) return current;
	if (current.question.regenerations >= MAX_REGENERATIONS) {
		return { limitReached: true as const, question: current.question };
	}

	const nextRegenerations = current.question.regenerations + 1;
	const { context, crisis } = await buildDailyQuestionContext(supabase, user.id, nextRegenerations);
	if (crisis) {
		return {
			question: {
				...current.question,
				question_text: SUPPORT_QUESTION,
				context_snapshot: context,
				regenerations: current.question.regenerations
			},
			safety: true
		};
	}

	const questionText = await generateQuestionWithClaude(context);
	const updated = await supabase
		.from('daily_questions')
		.update({
			question_text: questionText,
			context_snapshot: context,
			regenerations: nextRegenerations
		})
		.eq('user_id', user.id)
		.eq('date', today)
		.select('id, user_id, date, question_text, context_snapshot, regenerations, created_at')
		.single<DailyQuestionRecord>();

	if (updated.error || !updated.data) {
		console.error('Daily question update error:', updated.error);
		return {
			question: {
				...current.question,
				question_text: questionText,
				context_snapshot: context,
				regenerations: nextRegenerations
			},
			safety: false
		};
	}

	return { question: updated.data, safety: false };
}
