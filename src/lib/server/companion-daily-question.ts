import type { SupabaseClient } from '@supabase/supabase-js';
import {
	getCompanionDailyAnswer,
	getCompanionDailyQuestionById,
	getCompanionDailyQuestionForDay,
	getStockholmDateKey,
	type CompanionDailyState
} from '$lib/companionDailyQuestion';

const TABLE = 'companion_daily_answers';

type CompanionDailyRow = {
	question_id: string | null;
	answer_id: string | null;
};

type PostgrestErrorLike = { code?: string | null; message?: string | null } | null;

/**
 * Tabellen kan saknas tills migrationen körts. Då ska Mitt Hem ladda precis som
 * förut, bara utan dagens fråga - aldrig ett fel för användaren.
 */
function isMissingTableError(error: PostgrestErrorLike): boolean {
	if (!error) return false;
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${TABLE}'`)
	);
}

/**
 * Dagens läge för en inloggad användare. Finns redan en rad för kalenderdagen
 * är dagen hanterad - oavsett om användaren svarade eller hoppade över - och
 * frågan visas inte igen. Frågan för dagen läses i så fall ur den sparade
 * raden, så en refresh aldrig kan byta fråga.
 *
 * Returnerar null när frågan inte kan visas alls (t.ex. innan migrationen är
 * körd, eller om läsningen misslyckas). Anropare visar då ingenting.
 */
export async function loadCompanionDailyState(
	supabase: SupabaseClient,
	userId: string,
	now: Date = new Date()
): Promise<CompanionDailyState | null> {
	const dateKey = getStockholmDateKey(now);

	const [todayResult, answeredCountResult] = await Promise.all([
		supabase
			.from(TABLE)
			.select('question_id, answer_id')
			.eq('user_id', userId)
			.eq('answer_date', dateKey)
			.maybeSingle<CompanionDailyRow>(),
		supabase
			.from(TABLE)
			.select('user_id', { count: 'exact', head: true })
			.eq('user_id', userId)
			.not('answer_id', 'is', null)
	]);

	if (todayResult.error) {
		if (!isMissingTableError(todayResult.error)) {
			console.error('Companion daily question load error:', todayResult.error);
		}
		return null;
	}

	if (answeredCountResult.error && !isMissingTableError(answeredCountResult.error)) {
		console.error('Companion daily answer count error:', answeredCountResult.error);
	}

	const answeredDayCount = answeredCountResult.count ?? 0;
	const todayRow = todayResult.data ?? null;

	if (todayRow) {
		// Okänt fråge-id kan bara uppstå om en fråga tagits bort ur banken efter
		// att svaret sparades. Dagen är hanterad ändå - vi visar aldrig en ny
		// fråga i efterhand samma dag.
		const storedQuestion = getCompanionDailyQuestionById(todayRow.question_id);
		return {
			dateKey,
			questionId: storedQuestion?.id ?? todayRow.question_id ?? '',
			status: todayRow.answer_id ? 'answered' : 'skipped',
			answerId: todayRow.answer_id,
			answeredDayCount
		};
	}

	return {
		dateKey,
		questionId: getCompanionDailyQuestionForDay(dateKey, userId).id,
		status: 'pending',
		answerId: null,
		answeredDayCount
	};
}

export type RecordCompanionDailyResult =
	| { ok: true; state: CompanionDailyState }
	| { ok: false; reason: 'invalid' | 'unavailable' };

/**
 * Sparar dagens svar. answerId = null betyder att användaren hoppade över:
 * dagen markeras som hanterad, men ger varken bond eller trädgårdstillväxt.
 *
 * Datumet sätts alltid här, aldrig av klienten, och en befintlig rad för dagen
 * lämnas orörd (ignoreDuplicates). Ett svar kan därför varken skrivas om,
 * dubbelräknas eller efterhandsdateras.
 */
export async function recordCompanionDailyResponse(
	supabase: SupabaseClient,
	userId: string,
	input: { questionId: string; answerId: string | null },
	now: Date = new Date()
): Promise<RecordCompanionDailyResult> {
	const question = getCompanionDailyQuestionById(input.questionId);
	if (!question) return { ok: false, reason: 'invalid' };
	if (input.answerId !== null && !getCompanionDailyAnswer(question.id, input.answerId)) {
		return { ok: false, reason: 'invalid' };
	}

	const dateKey = getStockholmDateKey(now);
	const { error } = await supabase.from(TABLE).upsert(
		{
			user_id: userId,
			answer_date: dateKey,
			question_id: question.id,
			answer_id: input.answerId
		},
		{ onConflict: 'user_id,answer_date', ignoreDuplicates: true }
	);

	if (error) {
		if (!isMissingTableError(error)) {
			console.error('Companion daily answer save error:', error);
		}
		return { ok: false, reason: 'unavailable' };
	}

	const state = await loadCompanionDailyState(supabase, userId, now);
	if (!state) return { ok: false, reason: 'unavailable' };
	return { ok: true, state };
}
