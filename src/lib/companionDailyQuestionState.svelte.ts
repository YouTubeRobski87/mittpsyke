// Delad hook för följeslagarens dagliga fråga: optimistisk uppdatering,
// sparning mot /api/companion/daily-question och signalen som utlöser
// världens korta kosmetiska svar. Samma regler som Mitt Hem redan följer
// (se $lib/companionDailyQuestion och $lib/world/worldResponse) - flyttad hit
// så att Kvällstugan kan återanvända exakt samma logik utan att kopiera den.
//
// Måste anropas synkront i toppen av en komponents <script>, precis som
// $state/$derived, eftersom den skapar reaktiva runes internt.
import {
	COMPANION_DAILY_REACTION_DURATION_MS,
	getCompanionDailyQuestionById,
	getCompanionDailyReaction,
	shouldShowCompanionDailyQuestion,
	type CompanionDailyQuestion,
	type CompanionDailyState
} from '$lib/companionDailyQuestion';
import { shouldTriggerWorldResponse } from '$lib/world/worldResponse';

/**
 * `getInitial` läser den senaste servervärdet (t.ex. `data.companionDaily`)
 * och anropas reaktivt av $derived, så en ny sidladdning eller navigation ger
 * korrekt starttillstånd utan att anroparen behöver synka något manuellt.
 */
export function createCompanionDailyQuestionState(getInitial: () => CompanionDailyState | null) {
	let override = $state<CompanionDailyState | null>(null);
	let busy = $state(false);
	let reaction = $state<string | null>(null);
	let reactionTimer: number | null = null;
	let worldResponseSignal = $state(0);

	const current = $derived<CompanionDailyState | null>(override ?? getInitial() ?? null);
	const question = $derived<CompanionDailyQuestion | null>(
		current ? getCompanionDailyQuestionById(current.questionId) : null
	);
	// Kvällstugans egen server-load (+page.server.ts) redirectar redan bort
	// utloggade och anonyma besökare innan sidan renderas, så frågan behöver
	// aldrig gömmas av en egen isAnonymous-kontroll här.
	const show = $derived(Boolean(question) && shouldShowCompanionDailyQuestion({ isAnonymous: false, state: current }));

	async function respond(answerId: string | null) {
		const state = current;
		if (!state || busy || state.status !== 'pending') return;

		busy = true;
		override = {
			...state,
			status: answerId ? 'answered' : 'skipped',
			answerId,
			// Bandet och trädgården växer bara av ett faktiskt svar.
			answeredDayCount: state.answeredDayCount + (answerId ? 1 : 0)
		};

		if (answerId) {
			reaction = getCompanionDailyReaction(state.questionId, answerId);
			if (reactionTimer !== null) window.clearTimeout(reactionTimer);
			reactionTimer = window.setTimeout(() => {
				reaction = null;
				reactionTimer = null;
			}, COMPANION_DAILY_REACTION_DURATION_MS);
		}

		try {
			const response = await fetch('/api/companion/daily-question', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ questionId: state.questionId, answerId })
			});

			if (
				shouldTriggerWorldResponse({
					isAnonymous: false,
					previousStatus: state.status,
					answerId,
					requestOk: response.ok
				})
			) {
				worldResponseSignal += 1;
			}
		} catch {
			// Dagens fråga är frivillig och får aldrig störa besöket.
		} finally {
			busy = false;
		}
	}

	return {
		get question() {
			return question;
		},
		get show() {
			return show;
		},
		get busy() {
			return busy;
		},
		get reaction() {
			return reaction;
		},
		get worldResponseSignal() {
			return worldResponseSignal;
		},
		respond
	};
}
