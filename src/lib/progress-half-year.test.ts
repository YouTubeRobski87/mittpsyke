import { describe, expect, it } from 'vitest';
import {
	buildHalfYearView,
	EDGE_DIFFERENCE_THRESHOLD,
	MIN_MONTHS_FOR_DIRECTION,
	MONTH_RELATIVE_THRESHOLD,
	NO_CLEAR_CHANGE_COPY,
	UNEVEN_COVERAGE_COPY,
	type HalfYearMonthInput
} from './progress-half-year';

const MONTH_LABELS = [
	['2026-03', 'mars 2026'],
	['2026-04', 'april 2026'],
	['2026-05', 'maj 2026'],
	['2026-06', 'juni 2026'],
	['2026-07', 'juli 2026'],
	['2026-08', 'augusti 2026']
] as const;

/** En månad med tillräckligt underlag, i samma form som servern skickar. */
function month(
	index: number,
	mean: number,
	options: { standardDeviation?: number; entryCount?: number } = {}
): HalfYearMonthInput {
	const [key, label] = MONTH_LABELS[index];
	return {
		month: key,
		label,
		entryCount: options.entryCount ?? 10,
		activeDays: 8,
		status: 'sufficient',
		mean,
		standardDeviation: options.standardDeviation ?? 0.8
	};
}

function thinMonth(index: number, entryCount = 2): HalfYearMonthInput {
	const [key, label] = MONTH_LABELS[index];
	return {
		month: key,
		label,
		entryCount,
		activeDays: 2,
		status: 'thin',
		mean: null,
		standardDeviation: null
	};
}

function missingMonth(index: number): HalfYearMonthInput {
	const [key, label] = MONTH_LABELS[index];
	return {
		month: key,
		label,
		entryCount: 0,
		activeDays: 0,
		status: 'missing',
		mean: null,
		standardDeviation: null
	};
}

function view(months: HalfYearMonthInput[], truncated = false) {
	const result = buildHalfYearView({ months, truncated });
	if (!result) throw new Error('förväntade en halvårsvy');
	return result;
}

describe('riktning över halvåret', () => {
	it('ser när slutet ligger tydligt högre än början', () => {
		const half = view([month(0, 4), month(1, 4.2), month(2, 5), month(3, 6), month(4, 7), month(5, 7.4)]);

		expect(half.edges?.direction).toBe('higher');
		expect(half.hasDirection).toBe(true);
		expect(half.summary).toContain('högre');
		expect(half.edges?.firstLabel).toBe('mars och april');
		expect(half.edges?.lastLabel).toBe('juli och augusti');
	});

	it('ser när slutet ligger tydligt lägre än början', () => {
		const half = view([month(0, 7.4), month(1, 7), month(2, 6), month(3, 5), month(4, 4.2), month(5, 4)]);

		expect(half.edges?.direction).toBe('lower');
		expect(half.hasDirection).toBe(true);
		expect(half.summary).toContain('lägre');
	});

	it('kallar en stabil period för oförändrad i stället för en trend', () => {
		const half = view([month(0, 6), month(1, 6.1), month(2, 5.9), month(3, 6), month(4, 6.1), month(5, 6)]);

		expect(half.edges?.direction).toBe('level');
		expect(half.hasDirection).toBe(false);
		expect(half.summary).toContain(NO_CLEAR_CHANGE_COPY);
	});

	it('uppfinner ingen riktning när skillnaden ligger precis under tröskeln', () => {
		const half = view([month(0, 6), month(1, 6), month(2, 6), month(3, 6), month(4, 6.5), month(5, 6.5)]);

		expect(half.edges?.difference).toBeLessThan(EDGE_DIFFERENCE_THRESHOLD);
		expect(half.edges?.direction).toBe('level');
		expect(half.summary).toContain(NO_CLEAR_CHANGE_COPY);
	});

	it('läser hög variation utan riktning som just det', () => {
		const half = view([
			month(0, 6, { standardDeviation: 0.4 }),
			month(1, 6, { standardDeviation: 0.5 }),
			month(2, 6, { standardDeviation: 0.6 }),
			month(3, 6, { standardDeviation: 1.6 }),
			month(4, 6, { standardDeviation: 1.7 }),
			month(5, 6, { standardDeviation: 1.8 })
		]);

		expect(half.edges?.direction).toBe('level');
		expect(half.hasDirection).toBe(false);
		expect(half.variation).toBe('more-varied');
		expect(half.summary).toContain('Variationen inom månaderna har ökat.');
	});

	it('ser när variationen har minskat', () => {
		const half = view([
			month(0, 6, { standardDeviation: 1.8 }),
			month(1, 6, { standardDeviation: 1.7 }),
			month(2, 6, { standardDeviation: 1.6 }),
			month(3, 6, { standardDeviation: 0.6 }),
			month(4, 6, { standardDeviation: 0.5 }),
			month(5, 6, { standardDeviation: 0.4 })
		]);

		expect(half.variation).toBe('steadier');
		expect(half.summary).toContain('Variationen inom månaderna har minskat.');
	});
});

describe('tunt och saknat underlag', () => {
	it('låter tunna månader väga noll och namnger dem i underlaget', () => {
		const half = view([thinMonth(0), month(1, 6), month(2, 6.2), month(3, 6), month(4, 6.1), thinMonth(5)]);

		expect(half.monthsWithData).toBe(4);
		expect(half.thinMonths).toEqual(['mars 2026', 'augusti 2026']);
		expect(half.basis).toContain('Mars 2026 och augusti 2026');
		expect(half.basis).toContain('bidrar därför inte till jämförelsen');
		// April och juli bär jämförelsen, eftersom mars och augusti saknar snitt.
		expect(half.edges?.firstLabel).toBe('april');
		expect(half.edges?.lastLabel).toBe('juli');
	});

	it('räknar aldrig en saknad månad som en förbättring', () => {
		const half = view([month(0, 3), month(1, 3.2), month(2, 3.1), month(3, 3), missingMonth(4), missingMonth(5)]);

		expect(half.edges).toBeNull();
		expect(half.hasDirection).toBe(false);
		expect(half.summary).not.toContain('högre');
		expect(half.basis).toContain('En månad utan registreringar räknas aldrig som en förändring.');
	});

	it('säger att underlaget är ojämnt när för få månader har underlag', () => {
		const half = view([missingMonth(0), missingMonth(1), thinMonth(2), thinMonth(3), month(4, 6), month(5, 6)]);

		expect(half.monthsWithData).toBeLessThan(MIN_MONTHS_FOR_DIRECTION);
		expect(half.summary).toBe(UNEVEN_COVERAGE_COPY);
		expect(half.hasDirection).toBe(false);
	});

	it('uttalar ingen riktning när underlaget är beskuret', () => {
		const months = [month(0, 3), month(1, 3), month(2, 5), month(3, 7), month(4, 8), month(5, 8)];

		expect(view(months).hasDirection).toBe(true);
		const truncated = view(months, true);
		expect(truncated.hasDirection).toBe(false);
		expect(truncated.summary).toBe(UNEVEN_COVERAGE_COPY);
		expect(truncated.basis).toContain('säkra läsgränsen');
	});

	it('ger ingen vy när det inte finns några månadsblock', () => {
		expect(buildHalfYearView({ months: [] })).toBeNull();
		expect(buildHalfYearView({ months: null })).toBeNull();
	});
});

describe('månadskortens jämförbarhet', () => {
	it('markerar varje månad mot användarens eget halvårssnitt', () => {
		const half = view([month(0, 4), month(1, 4), month(2, 6), month(3, 6), month(4, 8), month(5, 8)]);

		expect(half.average).toBe(6);
		expect(half.months.map((item) => item.relative)).toEqual([
			'much-lower',
			'much-lower',
			'near',
			'near',
			'much-higher',
			'much-higher'
		]);
		expect(half.months[4].relativeText).toBe('tydligt högre än halvårssnittet');
	});

	it('lämnar månader utan eget snitt omarkerade', () => {
		const half = view([thinMonth(0), missingMonth(1), month(2, 6), month(3, 6), month(4, 6), month(5, 6)]);

		expect(half.months[0].relative).toBeNull();
		expect(half.months[0].relativeText).toBeNull();
		expect(half.months[1].relative).toBeNull();
	});

	it('kallar en avvikelse under tröskeln för nära, inte för högre', () => {
		const half = view([month(0, 6), month(1, 6), month(2, 6), month(3, 6), month(4, 6), month(5, 6.3)]);
		const last = half.months.at(-1)!;

		expect(Math.abs(last.mean! - half.average!)).toBeLessThan(MONTH_RELATIVE_THRESHOLD);
		expect(last.relative).toBe('near');
	});

	it('kortar månadsetiketten utan årtal', () => {
		expect(view([month(0, 6), month(1, 6), month(2, 6), month(3, 6)]).months[0].shortLabel).toBe('mars');
	});
});

describe('förlopp i halvårsreflektionen', () => {
	it('beskriver en jämn start, en nedgång och en gradvis återgång', () => {
		const half = view([
			month(0, 7.4, { entryCount: 14 }),
			month(1, 7.5, { entryCount: 20 }),
			month(2, 6.7, { entryCount: 16 }),
			month(3, 7, { entryCount: 18 }),
			month(4, 7.2, { entryCount: 15 }),
			month(5, 7.2, { entryCount: 13 })
		]);

		expect(half.reflection.pattern).toBe('mid-dip-return');
		expect(half.reflection.sentences).toEqual([
			'Halvåret börjar på en ganska jämn nivå under mars och april.',
			'I maj syns en tydligare nedgång jämfört med april.',
			'Efter den lägre nivån i maj stiger värdena gradvis under juni, juli och augusti.',
			'Juli och augusti ligger sedan ungefär på samma nivå.',
			'Underlaget är ganska jämnt fördelat över månaderna.'
		]);
		expect(half.reflection.highlights).toEqual([
			'Maj ligger lägst bland månaderna med tillräckligt underlag.',
			'Juli och augusti ligger nästan på samma nivå.'
		]);
		expect(half.reflection.changes).toContainEqual({
			fromLabel: 'april',
			toLabel: 'maj',
			difference: -0.8,
			direction: 'down'
		});
	});

	it('beskriver en tydlig uppgång följd av stabilisering', () => {
		const half = view([month(0, 5), month(1, 5.1), month(2, 6), month(3, 7), month(4, 7.1), month(5, 7.1)]);

		expect(half.reflection.pattern).toBe('rise-stabilizes');
		expect(half.reflection.sentences.join(' ')).toContain('uppgång');
		expect(half.reflection.sentences.join(' ')).toContain('juli och augusti ungefär på samma nivå');
	});

	it('beskriver flera växlingar utan att skapa en riktning', () => {
		const half = view([month(0, 6), month(1, 7), month(2, 6), month(3, 7), month(4, 6), month(5, 7)]);

		expect(half.reflection.pattern).toBe('zigzag');
		expect(half.reflection.sentences[0]).toContain('växlar upp och ner');
		expect(half.reflection.highlights).toContain('Flera intilliggande månader växlar i riktning.');
	});

	it('beskriver nästan identiska månader som en jämn period', () => {
		const half = view([month(0, 6), month(1, 6.1), month(2, 5.9), month(3, 6), month(4, 6.1), month(5, 6)]);

		expect(half.reflection.pattern).toBe('even');
		expect(half.reflection.sentences).toHaveLength(4);
		expect(half.reflection.sentences[0]).toBe('Värdena ligger nära varandra under större delen av perioden.');
		expect(half.reflection.highlights).toEqual([]);
	});

	it('håller analysen försiktig vid två eller tre månader med underlag', () => {
		const half = view([missingMonth(0), thinMonth(1), month(2, 6), month(3, 7), missingMonth(4), month(5, 6.5)]);

		expect(half.reflection.pattern).toBe('varied');
		expect(half.reflection.sentences.at(-1)).toBe(
			'Några månader innehåller få eller inga registreringar, så förändringarna bör läsas försiktigt.'
		);
		expect(half.reflection.highlights).toEqual([]);
	});

	it('säger inte något om förloppet när färre än tre månader har underlag', () => {
		const half = view([missingMonth(0), thinMonth(1), missingMonth(2), month(3, 6), missingMonth(4), month(5, 6.5)]);

		expect(half.reflection.pattern).toBe('insufficient');
		expect(half.reflection.sentences).toEqual([
			'Underlaget räcker ännu inte för att läsa ett säkert förlopp över halvåret.'
		]);
		expect(half.reflection.highlights).toEqual([]);
	});

	it('låter saknade månader bryta månad-till-månad-jämförelser', () => {
		const half = view([month(0, 6), month(1, 6.5), missingMonth(2), month(3, 6), month(4, 6.5), month(5, 6.5)]);

		expect(half.reflection.changes).toEqual([
			{ fromLabel: 'mars', toLabel: 'april', difference: 0.5, direction: 'up' },
			{ fromLabel: 'juni', toLabel: 'juli', difference: 0.5, direction: 'up' },
			{ fromLabel: 'juli', toLabel: 'augusti', difference: 0, direction: 'level' }
		]);
	});
});

describe('nyckeltal och underlag', () => {
	it('visar högst fyra nyckeltal, alltid i samma ordning', () => {
		const half = view([month(0, 5), month(1, 5), month(2, 6), month(3, 6), month(4, 7), month(5, 7)]);

		expect(half.stats).toHaveLength(4);
		expect(half.stats.map((stat) => stat.id)).toEqual(['edges', 'extremes', 'spread', 'variation']);
	});

	it('räknar ytterligheter och spridning bara på månader med underlag', () => {
		const half = view([month(0, 5.2), month(1, 6), month(2, 7.4), month(3, 6), thinMonth(4), missingMonth(5)]);

		expect(half.highest).toEqual({ label: 'maj 2026', mean: 7.4 });
		expect(half.lowest).toEqual({ label: 'mars 2026', mean: 5.2 });
		expect(half.monthSpread).toBe(2.2);
	});

	it('säger uttryckligen när en jämförelse inte går att göra', () => {
		const half = view([missingMonth(0), missingMonth(1), month(2, 6), month(3, 6), missingMonth(4), missingMonth(5)]);
		const edgeStat = half.stats.find((stat) => stat.id === 'edges')!;

		expect(edgeStat.value).toBe('Går inte att jämföra');
		expect(half.basis).toContain('Ingen riktning räknas fram');
	});

	it('namnger de jämförda månaderna och antalet registreringar i underlaget', () => {
		const half = view([
			month(0, 5, { entryCount: 9 }),
			month(1, 5, { entryCount: 8 }),
			month(2, 6, { entryCount: 7 }),
			month(3, 6, { entryCount: 6 }),
			month(4, 7, { entryCount: 5 }),
			month(5, 7, { entryCount: 4 })
		]);

		expect(half.entryCount).toBe(39);
		expect(half.basis).toContain('39 måenderegistreringar');
		expect(half.basis).toContain('mars och april');
		expect(half.basis).toContain('juli och augusti');
		expect(half.basis).toContain('6 kalendermånader');
	});

	it('innehåller ingen dagbokstext, bara siffror och månadsnamn', () => {
		const half = view([month(0, 5), month(1, 5), month(2, 6), month(3, 6), month(4, 7), month(5, 7)]);
		const allCopy = [
			half.summary,
			half.basis,
			...half.reflection.sentences,
			...half.reflection.highlights,
			...half.months.flatMap((item) => item.relativeText ?? []),
			...half.stats.map((stat) => `${stat.value} ${stat.note}`)
		].join(' ');

		expect(allCopy).not.toMatch(/dagbok|anteckning|"|”/i);
		expect(allCopy).not.toMatch(/förbättr|försämr|framgång|resultat|prestation|du borde|diagnos|återhämtade/i);
	});
});

describe('determinism', () => {
	it('ger exakt samma utdata för samma indata', () => {
		const months = [thinMonth(0), month(1, 4.4), month(2, 6.1), missingMonth(3), month(4, 7.2), month(5, 7)];

		expect(JSON.stringify(buildHalfYearView({ months }))).toBe(
			JSON.stringify(buildHalfYearView({ months }))
		);
	});

	it('påverkas inte av ordningen i indata utöver kalenderordningen den får', () => {
		const months = [month(0, 4), month(1, 4), month(2, 6), month(3, 6), month(4, 8), month(5, 8)];
		const first = buildHalfYearView({ months });
		const second = buildHalfYearView({ months: [...months] });

		expect(first).toEqual(second);
	});

	it('muterar inte inskickade månader', () => {
		const months = [month(0, 4), month(1, 5), month(2, 6), month(3, 7)];
		const snapshot = JSON.stringify(months);
		buildHalfYearView({ months });

		expect(JSON.stringify(months)).toBe(snapshot);
	});
});
