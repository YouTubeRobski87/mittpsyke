import { describe, expect, it } from 'vitest';
import {
	EMPTY_SUPPORT_VIEW,
	SUPPORT_PREFERENCES_STORAGE_KEY,
	buildSupportCopy,
	getExampleTopics,
	getExamplesForTopic,
	getSupportVisibleLimit,
	readSupportPreferences,
	recordSupportResponse,
	selectVisibleSuggestions,
	type SupportStorageLike,
	type SupportSuggestion,
	type SupportView
} from './progress-support';

function createStorage(initial: Record<string, string> = {}): SupportStorageLike & { data: Record<string, string> } {
	const data = { ...initial };
	return {
		data,
		getItem: (key: string) => data[key] ?? null,
		setItem: (key: string, value: string) => {
			data[key] = value;
		}
	};
}

function suggestion(kind: SupportSuggestion['kind'], id = kind): SupportSuggestion {
	const copy = buildSupportCopy(kind, 'everyday');
	return { id, kind, tone: 'everyday', title: copy.title, body: copy.body, evidence: 'Underlag.', topicLabel: null };
}

function view(overrides: Partial<SupportView> = {}): SupportView {
	return {
		learning: false,
		withheldForSafety: false,
		heavyPeriod: false,
		suggestions: [suggestion('walk'), suggestion('contact'), suggestion('rest')],
		breathingRoom: [],
		examples: [],
		...overrides
	};
}

describe('copyn för förslagen', () => {
	it('påstår aldrig att något gör att användaren mår bättre', () => {
		const kinds = ['walk', 'contact', 'rest', 'creative', 'write', 'smaller-day'] as const;
		const forbidden = [/gör att du mår/i, /kommer att hjälpa/i, /du bör/i, /du ska/i, /jag rekommenderar/i, /leder till/i];

		for (const kind of kinds) {
			for (const tone of ['everyday', 'gentle'] as const) {
				const copy = buildSupportCopy(kind, tone);
				for (const pattern of forbidden) {
					expect(copy.title, `${kind}/${tone}`).not.toMatch(pattern);
					expect(copy.body, `${kind}/${tone}`).not.toMatch(pattern);
				}
			}
		}
	});

	it('gör förslaget mindre i den varsamma tonen', () => {
		expect(buildSupportCopy('walk', 'gentle').body).toContain('några minuter');
		expect(buildSupportCopy('smaller-day', 'gentle').title).toBe('Gör dagen mindre');
	});
});

describe('urvalet av synliga förslag', () => {
	it('visar högst två förslag, och bara ett under en tyngre period', () => {
		expect(selectVisibleSuggestions(view(), {})).toHaveLength(2);
		expect(selectVisibleSuggestions(view({ heavyPeriod: true }), {})).toHaveLength(1);
		expect(getSupportVisibleLimit(view({ heavyPeriod: true }))).toBe(1);
	});

	it('visar ingenting när säkerhetslogiken stoppat sektionen', () => {
		expect(selectVisibleSuggestions(view({ withheldForSafety: true }), {})).toEqual([]);
		expect(selectVisibleSuggestions(view({ ...EMPTY_SUPPORT_VIEW }), {})).toEqual([]);
	});

	it('låter avböjda förslag vila resten av dagen', () => {
		const now = new Date('2026-08-21T10:00:00');
		const preferences = { walk: { accepted: 0, declined: 1, lastDeclinedDate: '2026-08-21' } };
		const visible = selectVisibleSuggestions(view(), preferences, { now });

		expect(visible.map((item) => item.kind)).toEqual(['contact', 'rest']);
	});

	it('tar tillbaka förslaget nästa dag, men längst bak i ordningen', () => {
		const preferences = { walk: { accepted: 0, declined: 1, lastDeclinedDate: '2026-08-21' } };
		const nextDay = new Date('2026-08-22T10:00:00');

		expect(selectVisibleSuggestions(view(), preferences, { now: nextDay }).map((item) => item.kind)).toEqual([
			'contact',
			'rest'
		]);
		expect(
			selectVisibleSuggestions(view({ suggestions: [suggestion('walk')] }), preferences, { now: nextDay })
		).toHaveLength(1);
	});

	it('lyfter fram den typ användaren själv markerat som relevant', () => {
		const preferences = { rest: { accepted: 3, declined: 0, lastDeclinedDate: null } };
		const visible = selectVisibleSuggestions(view(), preferences, { now: new Date('2026-08-21T10:00:00') });

		expect(visible[0].kind).toBe('rest');
	});

	it('stegar vidare i poolen vid "Visa något annat" utan att räknas som avböjande', () => {
		const now = new Date('2026-08-21T10:00:00');
		const first = selectVisibleSuggestions(view(), {}, { now, rotation: 0 });
		const second = selectVisibleSuggestions(view(), {}, { now, rotation: 1 });

		expect(first.map((item) => item.kind)).toEqual(['walk', 'contact']);
		expect(second.map((item) => item.kind)).toEqual(['contact', 'rest']);
	});
});

describe('användarens svar', () => {
	it('lagras separat från dagboken och räknas aldrig som en skattning', () => {
		const storage = createStorage();
		recordSupportResponse(storage, 'walk', 'fits', new Date('2026-08-21T10:00:00'));
		const stored = JSON.parse(storage.data[SUPPORT_PREFERENCES_STORAGE_KEY]) as Record<string, unknown>;

		expect(Object.keys(storage.data)).toEqual([SUPPORT_PREFERENCES_STORAGE_KEY]);
		expect(stored).toEqual({ walk: { accepted: 1, declined: 0, lastDeclinedDate: null } });
		expect(JSON.stringify(stored)).not.toMatch(/mood|humör/i);
	});

	it('summerar upprepade svar per förslagstyp', () => {
		const storage = createStorage();
		recordSupportResponse(storage, 'rest', 'fits', new Date('2026-08-20T10:00:00'));
		recordSupportResponse(storage, 'rest', 'fits', new Date('2026-08-21T10:00:00'));
		const preferences = recordSupportResponse(storage, 'walk', 'not-today', new Date('2026-08-21T10:00:00'));

		expect(preferences.rest).toEqual({ accepted: 2, declined: 0, lastDeclinedDate: null });
		expect(preferences.walk).toEqual({ accepted: 0, declined: 1, lastDeclinedDate: '2026-08-21' });
	});

	it('faller tillbaka på tomma preferenser när lagringen är trasig eller saknas', () => {
		expect(readSupportPreferences(null)).toEqual({});
		expect(readSupportPreferences(createStorage({ [SUPPORT_PREFERENCES_STORAGE_KEY]: '{trasig' }))).toEqual({});
		expect(readSupportPreferences(createStorage({ [SUPPORT_PREFERENCES_STORAGE_KEY]: '"text"' }))).toEqual({});
		expect(
			readSupportPreferences(createStorage({ [SUPPORT_PREFERENCES_STORAGE_KEY]: '{"walk":{"accepted":"x"}}' }))
		).toEqual({ walk: { accepted: 0, declined: 0, lastDeclinedDate: null } });
	});
});

describe('exempel ur den egna historiken', () => {
	const withExamples = view({
		examples: [
			{ topicLabel: 'Motion', date: '3 aug 2026', quote: 'Efter promenaden kändes det lite lättare.', summary: 'Neutral rad.' },
			{ topicLabel: 'Motion', date: '5 aug 2026', quote: null, summary: 'Neutral rad två.' },
			{ topicLabel: 'Natur', date: '7 aug 2026', quote: null, summary: 'Neutral rad tre.' }
		]
	});

	it('visar bara exempel för det valda temat', () => {
		expect(getExamplesForTopic(withExamples, 'Natur')).toHaveLength(1);
		expect(getExamplesForTopic(withExamples, 'Motion')).toHaveLength(2);
	});

	it('faller tillbaka på första temat utan val', () => {
		expect(getExamplesForTopic(withExamples, null)[0].topicLabel).toBe('Motion');
		expect(getExampleTopics(withExamples)).toEqual(['Motion', 'Natur']);
	});

	it('ger inga exempel när historiken saknar dem', () => {
		expect(getExamplesForTopic(view(), null)).toEqual([]);
	});
});
