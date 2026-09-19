import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import {
	buildEveningPatterns,
	EVENING_EMPTY_COPY,
	MIN_EVENINGS_FOR_PATTERNS,
	type EveningPatternRow,
	type EveningPeriodDays
} from './evening-patterns';

const TODAY = '2026-09-19';

/** En rad ur evening_checkins, utan fritext - precis som laddaren hämtar den. */
function row(checkin_date: string, theme_id: string, parking_bucket = 'not_tonight'): EveningPatternRow {
	return { checkin_date, theme_id, parking_bucket };
}

function build(rows: EveningPatternRow[], period: EveningPeriodDays = 30) {
	return buildEveningPatterns(rows, { period, today: TODAY });
}

const texts = (view: ReturnType<typeof build>) => [
	view.intro,
	...view.observations.map((observation) => observation.text)
];

describe('Kvällar över tid - underlag och trösklar', () => {
	it('utan incheckningar visas ett neutralt tomläge utan observationer', () => {
		const view = build([]);

		expect(view.level).toBe('empty');
		expect(view.eveningCount).toBe(0);
		expect(view.observations).toEqual([]);
		expect(view.intro).toBe(EVENING_EMPTY_COPY);
	});

	it('en enda incheckning ger bara antalet, inget mönster', () => {
		const view = build([row('2026-09-18', 'racing_thoughts')]);

		expect(view.level).toBe('thin');
		expect(view.eveningCount).toBe(1);
		expect(view.intro).toBe('Du har checkat in 1 kväll den senaste månaden.');
		expect(view.observations).toEqual([]);
	});

	it('tre incheckningar ligger fortfarande under tröskeln för mönster', () => {
		const view = build([
			row('2026-09-16', 'racing_thoughts'),
			row('2026-09-17', 'racing_thoughts'),
			row('2026-09-18', 'racing_thoughts')
		]);

		expect(view.eveningCount).toBe(3);
		expect(view.eveningCount).toBeLessThan(MIN_EVENINGS_FOR_PATTERNS);
		expect(view.level).toBe('thin');
		expect(view.observations).toEqual([]);
	});

	it('flera sparningar samma datum räknas som en enda kväll', () => {
		const view = build([
			row('2026-09-18', 'racing_thoughts'),
			row('2026-09-18', 'racing_thoughts'),
			row('2026-09-18', 'racing_thoughts'),
			row('2026-09-18', 'racing_thoughts'),
			row('2026-09-17', 'racing_thoughts')
		]);

		// Fem rader, två datum: antalet kvällar får inte blåsas upp av omsparningar.
		expect(view.eveningCount).toBe(2);
		expect(view.level).toBe('thin');
		expect(view.observations).toEqual([]);
	});

	it('samma tema flera gånger samma kväll höjer inte temats antal', () => {
		const repeated = build([
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-16', 'racing_thoughts'),
			row('2026-09-17', 'loneliness'),
			row('2026-09-18', 'loneliness')
		]);

		// Tre teman räknade per kväll: 2 racing_thoughts, 2 loneliness -> oavgjort.
		expect(repeated.eveningCount).toBe(4);
		expect(repeated.observations[0].text).toContain('lika ofta');
	});
});

describe('Kvällar över tid - teman', () => {
	it('lyfter ett tema som återkommit klart oftast', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-16', 'racing_thoughts'),
			row('2026-09-17', 'racing_thoughts'),
			row('2026-09-18', 'loneliness')
		]);

		const theme = view.observations.find((observation) => observation.id === 'theme');
		expect(theme?.text).toBe('”Tankarna snurrar” är det som återkommit oftast, under 3 av dina 4 kvällar.');
	});

	it('säger inte "oftast" när marginalen bara är en kväll', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-16', 'racing_thoughts'),
			row('2026-09-17', 'loneliness'),
			row('2026-09-18', 'tomorrow')
		]);

		const theme = view.observations.find((observation) => observation.id === 'theme');
		expect(theme?.text).toBe('”Tankarna snurrar” har funnits med under 2 av dina 4 kvällar.');
		expect(theme?.text).not.toContain('oftast');
	});

	it('utser ingen vinnare vid delad förstaplats', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-16', 'racing_thoughts'),
			row('2026-09-17', 'loneliness'),
			row('2026-09-18', 'loneliness')
		]);

		const theme = view.observations.find((observation) => observation.id === 'theme');
		expect(theme?.text).toContain('lika ofta');
		expect(theme?.text).toContain('”Känner mig ensam”');
		expect(theme?.text).toContain('”Tankarna snurrar”');
		expect(theme?.text).not.toContain('oftast');
	});

	it('nämner inget tema som bara förekommit en enda kväll', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-16', 'loneliness'),
			row('2026-09-17', 'tomorrow'),
			row('2026-09-18', 'body_anxiety')
		]);

		expect(view.observations.find((observation) => observation.id === 'theme')).toBeUndefined();
	});
});

describe('Kvällar över tid - kvällsval', () => {
	it('visar det kvällsval som återkommit mest', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts', 'not_tonight'),
			row('2026-09-16', 'loneliness', 'not_tonight'),
			row('2026-09-17', 'tomorrow', 'not_tonight'),
			row('2026-09-18', 'body_anxiety', 'small_step')
		]);

		const bucket = view.observations.find((observation) => observation.id === 'bucket');
		expect(bucket?.text).toBe('Du har oftast valt ”Inte lösa det ikväll”.');
	});

	it('visar inget kvällsval alls när två val är lika vanliga', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts', 'not_tonight'),
			row('2026-09-16', 'loneliness', 'not_tonight'),
			row('2026-09-17', 'tomorrow', 'small_step'),
			row('2026-09-18', 'body_anxiety', 'small_step')
		]);

		expect(view.observations.find((observation) => observation.id === 'bucket')).toBeUndefined();
	});

	it('kan läsa den lugna vägens egna kvällsval', () => {
		const view = build([
			row('2026-09-15', 'feeling_okay', 'take_it_easy'),
			row('2026-09-16', 'feeling_okay', 'take_it_easy'),
			row('2026-09-17', 'feeling_okay', 'take_it_easy'),
			row('2026-09-18', 'loneliness', 'not_tonight')
		]);

		const bucket = view.observations.find((observation) => observation.id === 'bucket');
		expect(bucket?.text).toBe('Du har oftast valt ”Bara ta det lugnt”.');
	});

	it('visar kombinationen tema och kvällsval först vid större underlag', () => {
		const rows = [
			row('2026-09-14', 'tomorrow', 'not_tonight'),
			row('2026-09-15', 'tomorrow', 'not_tonight'),
			row('2026-09-16', 'tomorrow', 'not_tonight'),
			row('2026-09-17', 'loneliness', 'small_step'),
			row('2026-09-18', 'body_anxiety', 'tomorrow')
		];

		// Fem kvällar: under tröskeln för kombinationen.
		expect(build(rows).observations.find((o) => o.id === 'combination')).toBeUndefined();

		// Sex kvällar: kombinationen får visas.
		const combination = build([...rows, row('2026-09-13', 'racing_thoughts', 'small_step')]).observations.find(
			(o) => o.id === 'combination'
		);
		expect(combination?.text).toBe(
			'De kvällar du valt ”Orolig inför imorgon” har du oftast valt ”Inte lösa det ikväll”.'
		);
	});

	it('utelämnar kombinationen när den pekar ut samma val som kvällsvalsraden', () => {
		const view = build([
			row('2026-09-14', 'tomorrow', 'not_tonight'),
			row('2026-09-15', 'tomorrow', 'not_tonight'),
			row('2026-09-16', 'tomorrow', 'not_tonight'),
			row('2026-09-17', 'loneliness', 'not_tonight'),
			row('2026-09-18', 'racing_thoughts', 'small_step'),
			row('2026-09-19', 'body_anxiety', 'tomorrow')
		]);

		// Kvällsvalsraden visas och pekar ut "Inte lösa det ikväll". Kombinationen
		// skulle peka ut samma val och säger därför inget nytt.
		const bucket = view.observations.find((observation) => observation.id === 'bucket');
		expect(bucket?.text).toBe('Du har oftast valt ”Inte lösa det ikväll”.');
		expect(view.observations.find((observation) => observation.id === 'combination')).toBeUndefined();

		// Och de övriga raderna påverkas inte av att kombinationen faller bort.
		expect(view.observations.map((observation) => observation.id)).toEqual(['theme', 'bucket']);
		expect(view.observations[0].text).toBe(
			'”Orolig inför imorgon” är det som återkommit oftast, under 3 av dina 6 kvällar.'
		);
	});

	it('visar kombinationen när den pekar ut ett annat val än kvällsvalsraden', () => {
		const view = build([
			row('2026-09-10', 'tomorrow', 'small_step'),
			row('2026-09-11', 'tomorrow', 'small_step'),
			row('2026-09-12', 'tomorrow', 'small_step'),
			row('2026-09-13', 'tomorrow', 'small_step'),
			row('2026-09-14', 'racing_thoughts', 'not_tonight'),
			row('2026-09-15', 'racing_thoughts', 'not_tonight'),
			row('2026-09-16', 'body_anxiety', 'not_tonight'),
			row('2026-09-17', 'loneliness', 'not_tonight'),
			row('2026-09-18', 'other', 'not_tonight'),
			row('2026-09-19', 'tomorrow', 'not_tonight')
		]);

		// Vanligaste valet överlag är "Inte lösa det ikväll", men de kvällar temat
		// var "Orolig inför imorgon" valdes oftast något annat. Det är ny information.
		const bucket = view.observations.find((observation) => observation.id === 'bucket');
		expect(bucket?.text).toBe('Du har oftast valt ”Inte lösa det ikväll”.');

		const combination = view.observations.find((observation) => observation.id === 'combination');
		expect(combination?.text).toBe(
			'De kvällar du valt ”Orolig inför imorgon” har du oftast valt ”Ta ett litet steg”.'
		);
	});

	it('visar kombinationen när ingen kvällsvalsrad finns att upprepa', () => {
		const view = build([
			row('2026-09-14', 'tomorrow', 'not_tonight'),
			row('2026-09-15', 'tomorrow', 'not_tonight'),
			row('2026-09-16', 'tomorrow', 'not_tonight'),
			row('2026-09-17', 'loneliness', 'small_step'),
			row('2026-09-18', 'racing_thoughts', 'small_step'),
			row('2026-09-19', 'body_anxiety', 'tomorrow')
		]);

		// 3 mot 2: för liten marginal för en kvällsvalsrad. Då upprepar
		// kombinationen ingenting och får stå kvar.
		expect(view.observations.find((observation) => observation.id === 'bucket')).toBeUndefined();
		expect(view.observations.find((observation) => observation.id === 'combination')?.text).toBe(
			'De kvällar du valt ”Orolig inför imorgon” har du oftast valt ”Inte lösa det ikväll”.'
		);
	});
});

describe('Kvällar över tid - jämförelse mellan perioder', () => {
	/** Fyra kvällar i vald period, med valfritt antal i föregående period. */
	function acrossPeriods(previousDates: string[]) {
		return build(
			[
				row('2026-09-16', 'loneliness'),
				row('2026-09-17', 'loneliness'),
				row('2026-09-18', 'loneliness'),
				row('2026-09-19', 'racing_thoughts'),
				...previousDates.map((date) => row(date, 'loneliness'))
			],
			7
		);
	}

	it('jämför inte när föregående period är tom', () => {
		const view = acrossPeriods([]);

		expect(view.previousEveningCount).toBe(0);
		expect(view.observations.find((observation) => observation.id === 'change')).toBeUndefined();
	});

	it('jämför inte när föregående period har för tunt underlag', () => {
		const view = acrossPeriods(['2026-09-10', '2026-09-11', '2026-09-12']);

		expect(view.previousEveningCount).toBe(3);
		expect(view.observations.find((observation) => observation.id === 'change')).toBeUndefined();
	});

	it('beskriver en minskning när båda perioderna har underlag', () => {
		// Föregående period: 4 kvällar, alla med loneliness. Vald period: 3.
		const view = acrossPeriods(['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12']);

		expect(view.previousEveningCount).toBe(5);
		const change = view.observations.find((observation) => observation.id === 'change');
		expect(change?.text).toBe('Det har funnits med mer sällan än under perioden innan.');
	});

	it('beskriver en ökning utan procenttal', () => {
		const view = buildEveningPatterns(
			[
				row('2026-09-14', 'tomorrow'),
				row('2026-09-15', 'tomorrow'),
				row('2026-09-16', 'tomorrow'),
				row('2026-09-17', 'tomorrow'),
				row('2026-09-18', 'tomorrow'),
				// Föregående period: fyra kvällar, bara en med samma tema.
				row('2026-09-09', 'tomorrow'),
				row('2026-09-10', 'loneliness'),
				row('2026-09-11', 'loneliness'),
				row('2026-09-12', 'racing_thoughts')
			],
			{ period: 7, today: TODAY }
		);

		const change = view.observations.find((observation) => observation.id === 'change');
		expect(change?.text).toBe('Det har funnits med oftare än under perioden innan.');
		expect(change?.text).not.toMatch(/%|procent/);
	});

	it('nämner ingen förändring när skillnaden bara är en kväll', () => {
		const view = acrossPeriods(['2026-09-08', '2026-09-09', '2026-09-11', '2026-09-12']);

		// 4 kvällar med loneliness innan, 3 nu: en kvälls skillnad räcker inte.
		expect(view.previousEveningCount).toBe(4);
		expect(view.observations.find((observation) => observation.id === 'change')).toBeUndefined();
	});
});

describe('Kvällar över tid - periodgränser och datum', () => {
	it('tar med kvällar på periodens första och sista dag, men inte utanför', () => {
		const view = build(
			[
				row('2026-09-12', 'racing_thoughts'), // dagen före perioden
				row('2026-09-13', 'racing_thoughts'), // första dagen i perioden
				row('2026-09-19', 'racing_thoughts') // dagens datum
			],
			7
		);

		// 7-dagarsfönstret är 2026-09-13 till 2026-09-19, inklusive båda ändar.
		expect(view.eveningCount).toBe(2);
		expect(view.previousEveningCount).toBe(1);
	});

	it('låter perioderna gränsa till varandra utan överlapp', () => {
		const view = build(
			[
				row('2026-09-13', 'loneliness'),
				row('2026-09-12', 'loneliness'),
				row('2026-09-06', 'loneliness'),
				row('2026-09-05', 'loneliness') // utanför båda perioderna
			],
			7
		);

		expect(view.eveningCount).toBe(1);
		expect(view.previousEveningCount).toBe(2);
	});

	it('håller ihop dygnen över sommartidsomställningen', () => {
		// Sommartiden slutar i Sverige 2026-10-25. Perioden räknas på rena
		// kalenderdatum, så inget dygn får tappas eller dubbleras däromkring.
		const view = buildEveningPatterns(
			[
				row('2026-10-24', 'racing_thoughts'),
				row('2026-10-25', 'racing_thoughts'),
				row('2026-10-26', 'racing_thoughts'),
				row('2026-10-19', 'loneliness')
			],
			{ period: 7, today: '2026-10-26' }
		);

		// 7-dagarsfönstret är 2026-10-20 till 2026-10-26.
		expect(view.eveningCount).toBe(3);
		expect(view.previousEveningCount).toBe(1);
	});

	it('hoppar över rader med trasigt datum i stället för att välta', () => {
		const view = build([
			{ checkin_date: 'igår', theme_id: 'racing_thoughts', parking_bucket: 'not_tonight' },
			{ checkin_date: null, theme_id: 'racing_thoughts', parking_bucket: 'not_tonight' },
			row('2026-09-18', 'racing_thoughts')
		]);

		expect(view.eveningCount).toBe(1);
	});

	it('täcker alla fyra periodval', () => {
		for (const period of [7, 30, 90, 180] as EveningPeriodDays[]) {
			const view = build([row('2026-09-18', 'racing_thoughts')], period);
			expect(view.eveningCount, String(period)).toBe(1);
			expect(view.intro, String(period)).toContain('Du har checkat in 1 kväll');
		}
	});
});

describe('Kvällar över tid - integritet och språk', () => {
	it('läser aldrig fritexten, ens när den finns på raden', () => {
		const stripped = [
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-16', 'racing_thoughts'),
			row('2026-09-17', 'racing_thoughts'),
			row('2026-09-18', 'loneliness')
		];
		const withThought = stripped.map((entry) => ({ ...entry, thought: 'hemlig kvällstanke' }));

		const view = buildEveningPatterns(withThought, { period: 30, today: TODAY });
		for (const text of texts(view)) expect(text).not.toContain('hemlig kvällstanke');

		// Och exakt samma resultat utan fritexten: den påverkar ingenting.
		expect(view).toEqual(build(stripped));
	});

	it('hämtar inte kolumnen thought i serverfrågan', () => {
		const source = readFileSync(join(process.cwd(), 'src/lib/server/evening-checkin.ts'), 'utf8');
		const select = source.match(/\.select\('theme_id, parking_bucket, checkin_date'\)/);

		expect(select).not.toBeNull();
		// Mönsterläsningen får bara ha de tre strukturfälten i sin kolumnlista.
		const patternFunction = source.slice(source.indexOf('export async function loadEveningPatternRows'));
		expect(patternFunction.slice(0, patternFunction.indexOf('}'))).not.toContain('thought');
	});

	it('använder varken diagnosspråk, bedömning eller orsak', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts', 'not_tonight'),
			row('2026-09-16', 'racing_thoughts', 'not_tonight'),
			row('2026-09-17', 'racing_thoughts', 'not_tonight'),
			row('2026-09-18', 'loneliness', 'small_step')
		]);

		const forbidden =
			/diagnos|symtom|behandl|terapi|du mår|mår bättre|mår sämre|beror på|orsakar|eftersom du|ångestsyndrom|depression/i;
		for (const text of texts(view)) expect(text, text).not.toMatch(forbidden);
	});

	it('innehåller ingen poäng, nivå eller streak', () => {
		const view = build([
			row('2026-09-15', 'racing_thoughts'),
			row('2026-09-16', 'racing_thoughts'),
			row('2026-09-17', 'racing_thoughts'),
			row('2026-09-18', 'loneliness')
		]);

		const gamification = /poäng|nivå|streak|i rad|rekord|mål uppnått|bra jobbat/i;
		for (const text of texts(view)) expect(text, text).not.toMatch(gamification);
	});

	it('är helt deterministisk och anropar ingen AI', () => {
		const rows = [
			row('2026-09-15', 'racing_thoughts', 'not_tonight'),
			row('2026-09-16', 'racing_thoughts', 'not_tonight'),
			row('2026-09-17', 'loneliness', 'small_step'),
			row('2026-09-18', 'loneliness', 'small_step')
		];

		const fetchSpy = vi.spyOn(globalThis, 'fetch');
		const first = build(rows);
		const second = build([...rows].reverse());

		// Samma kvällar i omvänd ordning ger exakt samma text.
		expect(first).toEqual(second);
		expect(fetchSpy).not.toHaveBeenCalled();
		fetchSpy.mockRestore();

		const source = readFileSync(join(process.cwd(), 'src/lib/evening-patterns.ts'), 'utf8');
		expect(source).not.toMatch(/openai|anthropic|\bfetch\(|generateText/i);
	});
});
