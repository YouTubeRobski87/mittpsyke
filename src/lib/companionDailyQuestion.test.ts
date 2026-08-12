import { describe, expect, it } from 'vitest';
import {
	COMPANION_DAILY_QUESTIONS,
	MAX_COMPANION_DAILY_ANSWERS,
	MAX_COMPANION_DAILY_ANSWER_LABEL_LENGTH,
	MAX_COMPANION_DAILY_QUESTION_TEXT_LENGTH,
	getCompanionDailyAnswer,
	getCompanionDailyQuestionById,
	getCompanionDailyQuestionForDay,
	getCompanionDailyReaction,
	getStockholmDateKey,
	shouldShowCompanionDailyQuestion,
	type CompanionDailyState
} from './companionDailyQuestion';

const USER = 'a1b2c3d4-0000-4000-8000-000000000001';

function pendingState(overrides: Partial<CompanionDailyState> = {}): CompanionDailyState {
	return {
		dateKey: '2026-08-12',
		questionId: 'daily-lighten-day',
		status: 'pending',
		answerId: null,
		answeredDayCount: 0,
		...overrides
	};
}

describe('frågebanken', () => {
	it('har flera frågor med unika id:n', () => {
		expect(COMPANION_DAILY_QUESTIONS.length).toBeGreaterThanOrEqual(5);
		const ids = COMPANION_DAILY_QUESTIONS.map((question) => question.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('håller sig inom layoutkontraktet så mobilen inte kan spräckas', () => {
		for (const question of COMPANION_DAILY_QUESTIONS) {
			expect(question.text.length).toBeLessThanOrEqual(MAX_COMPANION_DAILY_QUESTION_TEXT_LENGTH);
			expect(question.answers.length).toBeGreaterThanOrEqual(2);
			expect(question.answers.length).toBeLessThanOrEqual(MAX_COMPANION_DAILY_ANSWERS);

			const answerIds = question.answers.map((answer) => answer.id);
			expect(new Set(answerIds).size).toBe(answerIds.length);

			for (const answer of question.answers) {
				expect(answer.label.length).toBeLessThanOrEqual(MAX_COMPANION_DAILY_ANSWER_LABEL_LENGTH);
				// Ett enskilt ord som inte kan brytas är det enda som kan tvinga
				// fram horisontell overflow i chipraden.
				for (const word of answer.label.split(/\s+/)) {
					expect(word.length).toBeLessThanOrEqual(MAX_COMPANION_DAILY_ANSWER_LABEL_LENGTH);
				}
			}
		}
	});

	it('ger varje svar en egen kort reaktion', () => {
		for (const question of COMPANION_DAILY_QUESTIONS) {
			for (const answer of question.answers) {
				expect(answer.reaction.trim().length).toBeGreaterThan(0);
				expect(answer.reaction.length).toBeLessThanOrEqual(60);
			}
		}
	});

	it('saknar skuldbeläggande och beroendeframkallande copy', () => {
		const forbidden = [
			/saknat dig/i,
			/var har du varit/i,
			/glömde mig/i,
			/du missade/i,
			/blir ledsen/i,
			/måste du/i,
			/varje dag/i,
			/streak/i
		];

		const allCopy = COMPANION_DAILY_QUESTIONS.flatMap((question) => [
			question.text,
			...question.answers.map((answer) => answer.reaction)
		]);

		for (const copy of allCopy) {
			for (const pattern of forbidden) {
				expect(copy).not.toMatch(pattern);
			}
		}
	});

	it('erbjuder alltid ett svar för den som inte vet', () => {
		for (const question of COMPANION_DAILY_QUESTIONS) {
			expect(question.answers.some((answer) => answer.id === 'unsure')).toBe(true);
		}
	});
});

describe('getCompanionDailyQuestionForDay', () => {
	it('ger samma fråga vid upprepade anrop samma dag - refresh byter aldrig fråga', () => {
		const first = getCompanionDailyQuestionForDay('2026-08-12', USER);
		for (let attempt = 0; attempt < 25; attempt += 1) {
			expect(getCompanionDailyQuestionForDay('2026-08-12', USER).id).toBe(first.id);
		}
	});

	it('byter fråga mellan två dagar i rad', () => {
		const days = ['2026-08-12', '2026-08-13', '2026-08-14', '2026-12-31', '2027-01-01'];
		for (let index = 1; index < days.length; index += 1) {
			expect(getCompanionDailyQuestionForDay(days[index], USER).id).not.toBe(
				getCompanionDailyQuestionForDay(days[index - 1], USER).id
			);
		}
	});

	it('går igenom hela banken över tid', () => {
		const seen = new Set<string>();
		const start = Date.UTC(2026, 7, 12);
		for (let offset = 0; offset < COMPANION_DAILY_QUESTIONS.length; offset += 1) {
			const dateKey = new Date(start + offset * 86_400_000).toISOString().slice(0, 10);
			seen.add(getCompanionDailyQuestionForDay(dateKey, USER).id);
		}
		expect(seen.size).toBe(COMPANION_DAILY_QUESTIONS.length);
	});

	it('returnerar alltid en fråga ur banken, även utan användarnyckel', () => {
		const question = getCompanionDailyQuestionForDay('2026-08-12');
		expect(COMPANION_DAILY_QUESTIONS).toContain(question);
	});
});

describe('uppslag av fråga och svar', () => {
	it('hittar fråga, svar och reaktion via id', () => {
		expect(getCompanionDailyQuestionById('daily-lighten-day')?.text).toBe(
			'Vad skulle göra idag lite lättare?'
		);
		expect(getCompanionDailyAnswer('daily-lighten-day', 'calm')?.label).toBe('Få lite lugn');
		expect(getCompanionDailyReaction('daily-lighten-day', 'calm')).toBe('Då tar vi det lugnt idag.');
	});

	it('returnerar null för okända id:n och för överhoppade dagar', () => {
		expect(getCompanionDailyQuestionById('nope')).toBeNull();
		expect(getCompanionDailyQuestionById(null)).toBeNull();
		expect(getCompanionDailyAnswer('daily-lighten-day', 'nope')).toBeNull();
		expect(getCompanionDailyReaction('daily-lighten-day', null)).toBeNull();
	});
});

describe('getStockholmDateKey', () => {
	it('använder svensk kalenderdag, inte UTC-dygnet', () => {
		// 22:30 UTC i juli är redan nästa dag i Stockholm (UTC+2).
		expect(getStockholmDateKey(new Date('2026-07-14T22:30:00Z'))).toBe('2026-07-15');
		// 22:30 UTC i januari är också nästa dag (UTC+1).
		expect(getStockholmDateKey(new Date('2026-01-14T23:30:00Z'))).toBe('2026-01-15');
		// Strax före svensk midnatt hör dagen fortfarande till den 14:e.
		expect(getStockholmDateKey(new Date('2026-07-14T21:30:00Z'))).toBe('2026-07-14');
	});
});

describe('shouldShowCompanionDailyQuestion', () => {
	it('visar frågan för en inloggad användare med obesvarad dag', () => {
		expect(shouldShowCompanionDailyQuestion({ isAnonymous: false, state: pendingState() })).toBe(
			true
		);
	});

	it('visar aldrig frågan för anonyma besökare', () => {
		expect(shouldShowCompanionDailyQuestion({ isAnonymous: true, state: pendingState() })).toBe(
			false
		);
		expect(shouldShowCompanionDailyQuestion({ isAnonymous: true, state: null })).toBe(false);
	});

	it('visar inte frågan igen samma dag - varken efter svar eller efter hoppa över', () => {
		expect(
			shouldShowCompanionDailyQuestion({
				isAnonymous: false,
				state: pendingState({ status: 'answered', answerId: 'calm', answeredDayCount: 1 })
			})
		).toBe(false);
		expect(
			shouldShowCompanionDailyQuestion({
				isAnonymous: false,
				state: pendingState({ status: 'skipped' })
			})
		).toBe(false);
	});

	it('visar ingenting när dagens läge saknas', () => {
		expect(shouldShowCompanionDailyQuestion({ isAnonymous: false, state: null })).toBe(false);
	});
});
