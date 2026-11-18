import { describe, expect, it } from 'vitest';
import { buildRetrospectSources, selectRetrospectSources } from './progress-retrospect';
import { buildRetrospectRequest, evaluateRetrospect, parseRetrospect } from './progress-retrospect-observations';

const now = new Date('2026-11-18T12:00:00Z');

function row(day: string, text: string, mood = 5) {
	return { id: 'entry-' + day, created_at: day + 'T12:00:00Z', mood, text };
}

describe('urvalet för personlig återblick', () => {
	it('täcker kalenderdelar med underlag utan att vikta humör, och håller båda taken', () => {
		const rows = Array.from({ length: 89 }, (_, index) => row(
			new Date(now.getTime() - index * 86400000).toISOString().slice(0, 10),
			'Jag skrev en stund hemma den här dagen och markerade den i anteckningen med talet ' + index + '.',
			index % 10 + 1
		));
		for (const period of [30, 90] as const) {
			const selection = buildRetrospectSources(rows, period, now);
			expect(selection.sources).toHaveLength(4);
			expect(new Set(selection.sources.map(({ segment }) => segment))).toEqual(new Set([0, 1, 2]));
			expect(selection.sources.flatMap(({ excerpt }) => excerpt.split(/\s+/))).toHaveLength(64);
			expect(buildRetrospectSources(rows.map((entry) => ({ ...entry, mood: 11 - entry.mood })), period, now)).toEqual(selection);
		}
	});

	it('behåller korta anteckningar och hela öppningsstycken, samt lämnar för långa eller kvalificerade stycken utanför', () => {
		const long = 'Jag skrev en rad. '.repeat(15).trim();
		const rows = [
			row('2026-10-20', 'Jag läste hemma.'),
			row('2026-11-02', 'Jag gick en promenad.\n\n' + long),
			row('2026-11-10', long),
			row('2026-11-14', 'Jag vilade hemma.\n\nMen egentligen var det bara något jag önskade. ' + long)
		];
		const selection = buildRetrospectSources(rows, 30, now);
		expect(selection.sources.map(({ excerpt }) => excerpt)).toEqual(['Jag läste hemma.', 'Jag gick en promenad.']);
		expect(selection.sources.map(({ segment }) => segment)).toEqual([0, 1]);
	});

	it('avstår vid tunt underlag och visar bara en säker kandidat per dag', () => {
		const rows = [
			row('2026-11-09', 'Jag tog en promenad.'),
			row('2026-11-09', 'Jag läste hemma.'),
			row('2026-11-10', 'Jag tog en promenad.'),
			row('2026-11-11', 'Jag gick en promenad.\n\nJag tänker ta mitt liv.')
		];
		const { sources, candidates } = buildRetrospectSources(rows, 30, now);
		expect(sources).toEqual(candidates);
		expect(candidates.map(({ date }) => date)).toEqual(['2026-11-09']);
		expect(selectRetrospectSources(candidates, [1])).toBeNull();
	});

	it('tillåter byte bland kandidater och avvisar dubbletter eller okända referenser', () => {
		const rows = Array.from({ length: 5 }, (_, index) =>
			row('2026-11-' + (10 + index), 'Jag skrev en stund. Datum i testet är ' + index + '.')
		);
		const { candidates, sources } = buildRetrospectSources(rows, 30, now);
		const other = candidates.find((source) => !sources.includes(source))!;
		const selected = selectRetrospectSources(candidates, [other.ref, ...sources.slice(1).map(({ ref }) => ref)]);
		expect(selected).toContain(other);
		expect(selectRetrospectSources(candidates, [1, 1])).toBeNull();
		expect(selectRetrospectSources(candidates, [1, 99])).toBeNull();
		expect(JSON.parse(buildRetrospectRequest(selected!).messages[0].content)).toEqual(
			selected!.map(({ ref, excerpt }) => ({ ref, excerpt }))
		);
	});
});

describe('serverns källkontroll', () => {
	const { candidates: sources } = buildRetrospectSources([
		row('2026-10-21', 'Jag gick en promenad i parken. Jag ville läsa hemma.'),
		row('2026-11-04', 'Jag tog en kort promenad efter middagen. Jag ville inte läsa hemma.'),
		row('2026-11-14', 'Jag vill komma ihåg stunden vid sjön.'),
		row('2026-11-15', 'Hon sa att hon var orolig. Jag läste hemma.'),
		row('2026-11-16', 'Jag vill komma ihåg det.'),
		row('2026-11-17', 'Jag ville inte läsa i köket.')
	], 30, now);
	const recurring = { kind: 'recurring', evidence: [
		{ ref: 1, span: 'Jag gick en promenad i parken.' },
		{ ref: 2, span: 'Jag tog en kort promenad efter middagen.' }
	] };
	const contrast = { kind: 'contrast', evidence: [
		{ ref: 1, span: 'Jag ville läsa hemma.' },
		{ ref: 2, span: 'Jag ville inte läsa hemma.' }
	] };

	it('återger återkomst, motstridiga beskrivningar och uttryckliga önskemål med rätt datum och källor', () => {
		const result = parseRetrospect(JSON.stringify({ observations: [
			recurring, contrast, { kind: 'carry', evidence: [{ ref: 3, span: sources[2].excerpt }] }
		] }), sources);
		expect(result?.observations.map(({ refs }) => refs)).toEqual([[1, 2], [1, 2], [3]]);
		expect(result?.observations[0].text).toContain('Vid två tillfällen skrev du om promenader.');
		expect(result?.observations[0].text).toContain('en promenad i parken och en kort promenad efter middagen');
		expect(result?.observations[1].text).toContain('I anteckningen från 4 november skrev du att du inte ville det.');
		expect(result?.observations[2].text).toContain('vill komma ihåg stunden vid sjön');
		expect(result?.question).toBe('Vad lägger du märke till i det du skrev om att läsa hemma?');
	});

	it.each([
		['felaktigt utdrag', { ...contrast, evidence: [contrast.evidence[0], { ref: 2, span: 'Jag ville läsa hemma.' }] }],
		['fel referens', { ...recurring, evidence: [recurring.evidence[0], { ref: 90, span: recurring.evidence[1].span }] }],
		['samma dag', { ...recurring, evidence: [recurring.evidence[0], recurring.evidence[0]] }],
		['osäkert pronomen', { kind: 'carry', evidence: [{ ref: 5, span: sources[4].excerpt }] }],
		['annan persons upplevelse', { kind: 'recurring', evidence: [
			{ ref: 1, span: 'Jag ville läsa hemma.' }, { ref: 4, span: 'Jag läste hemma.' }
		] }],
		['olika situationer', { ...contrast, evidence: [contrast.evidence[0], { ref: 6, span: sources[5].excerpt }] }],
		['fritt modellpåstående', { ...recurring, text: 'Du har förbättrats.' }]
	])('avvisar %s och visar en annan giltig observation', (_, rejected) => {
		const evaluated = evaluateRetrospect(JSON.stringify({ observations: [rejected, contrast] }), sources);
		expect(evaluated?.decisions.map(({ accepted }) => accepted)).toEqual([false, true]);
		expect(evaluated?.result.observations).toHaveLength(1);
	});

	it('godkänner det återskapade läsparet med flera hela meningar och behåller rätt källor', () => {
		const expanded = { ...contrast, evidence: contrast.evidence.map(({ ref }) => ({
			ref, span: sources[ref - 1].excerpt
		})) };
		const result = parseRetrospect(JSON.stringify({ observations: [expanded] }), sources);
		expect(result?.observations).toEqual([{
			text: 'Den 21 oktober skrev du att du ville läsa hemma. I anteckningen från 4 november skrev du att du inte ville det.',
			refs: [1, 2]
		}]);
		expect(result?.question).toContain('läsa hemma');
	});

	it.each([
		['ett avklippt stödspann', 'promenad i parken. Jag ville läsa hemma.', sources[0].excerpt],
		['två viljor i samma utdrag', sources[0].excerpt, sources[0].excerpt + ' Jag ville inte läsa hemma.'],
		['en relevant mening utanför stödspannet', 'Så löd formuleringen Jag ville läsa hemma.', sources[0].excerpt + ' Så löd formuleringen Jag ville läsa hemma.'],
		['en vidare reservation', sources[0].excerpt, sources[0].excerpt + ' Det gjorde jag inte.']
	])('avvisar jämförelsen vid %s', (_, span, excerpt) => {
		const updated = [{ ...sources[0], excerpt }, ...sources.slice(1)];
		const proposal = { ...contrast, evidence: [{ ref: 1, span }, contrast.evidence[1]] };
		expect(parseRetrospect(JSON.stringify({ observations: [proposal] }), updated)?.observations).toEqual([]);
	});

	it.each(['Nä, jag ville aldrig läsa hemma.', 'Jag ville aldrig läsa hemma.', 'Rättelse: jag ville läsa i köket.'])(
		'avvisar en jämförelse när hela utdraget innehåller rättelsen %s', (correction) => {
			const updated = [{ ...sources[0], excerpt: sources[0].excerpt + ' ' + correction }, ...sources.slice(1)];
			expect(parseRetrospect(JSON.stringify({ observations: [contrast] }), updated)?.observations).toEqual([]);
		}
	);

	it('avvisar återkomst vid rättelse men behåller en separat negation om en annan aktivitet', () => {
		const corrected = [{ ...sources[0], excerpt: sources[0].excerpt + ' Nä, jag gick aldrig en promenad.' }, ...sources.slice(1)];
		expect(parseRetrospect(JSON.stringify({ observations: [recurring] }), corrected)?.observations).toEqual([]);
		expect(parseRetrospect(JSON.stringify({ observations: [recurring] }), sources)?.observations).toHaveLength(1);
	});

	it('utelämnar frågan vid en enkel vardagsobservation och riktar den vid ett uttryckligt minne', () => {
		const reading = [
			{ ...sources[0], excerpt: 'Jag läste hemma.' },
			{ ...sources[1], excerpt: 'Jag läste en stund.' }
		];
		const result = parseRetrospect(JSON.stringify({ observations: [{
			kind: 'recurring', evidence: reading.map(({ ref, excerpt }) => ({ ref, span: excerpt }))
		}] }), reading);
		expect(result?.observations).toHaveLength(1);
		expect(result?.question).toBeNull();

		const memory = parseRetrospect(JSON.stringify({ observations: [
			{ kind: 'carry', evidence: [{ ref: 3, span: sources[2].excerpt }] }
		] }), sources);
		expect(memory?.question).toBe('Vad vill du minnas från stunden vid sjön?');
	});

	it('hanterar avstående, ogiltig respons och efterföljande reservation', () => {
		expect(parseRetrospect('trasig JSON', sources)).toBeNull();
		expect(parseRetrospect('{"observations":[]}', sources)).toMatchObject({ observations: [], question: null });
		const amended = [{ ...sources[0], excerpt: sources[0].excerpt + ' Men egentligen ville jag inte läsa.' }, ...sources.slice(1)];
		expect(parseRetrospect(JSON.stringify({ observations: [contrast] }), amended)?.observations).toEqual([]);
	});
});
