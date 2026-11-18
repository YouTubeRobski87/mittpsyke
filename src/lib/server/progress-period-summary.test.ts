// Urval och kontroll för "Det du har skrivit".

import { describe, expect, it } from 'vitest';
import { MAX_PERIOD_SUMMARY_ENTRIES, MAX_PERIOD_SUMMARY_WORDS, type PeriodSummarySegment } from '$lib/progress-period-summary';
import {
	buildPeriodSummaryRequest,
	looksPasted,
	omitPeriodSummaryEntries,
	parsePeriodSummary,
	periodSummarySnapshotId,
	selectPeriodSummaryEntries,
	spreadIndexes,
	stripCheckinReflection,
	trimEntryText
} from './progress-period-summary';

const NOW = new Date('2026-11-18T12:00:00Z');

function row(day: number, text: string | null, mood: number | string | null = 6, id: string | number = `entry-${day}`) {
	const date = new Date(NOW);
	date.setUTCDate(date.getUTCDate() - day);
	return { id, created_at: date.toISOString(), mood, text };
}

const baseRows = [
	row(400, 'Jag sov dåligt igen och tankarna snurrade länge.', 4),
	row(15, 'Gick en lång promenad med Bosse. Det kändes lugnt.', 6),
	row(10, 'Sov lite bättre i natt. Promenaden hjälpte nog.', 7),
	row(5, 'Jobbet var stressigt men jag tog en paus vid sjön.', 5),
	row(1, 'En bra dag. Jag vill komma ihåg stunden vid sjön.', 8)
];
const selection = selectPeriodSummaryEntries(baseRows);
const answer = (value: unknown) => parsePeriodSummary(JSON.stringify(value), selection);
const plainText = (paragraph: PeriodSummarySegment[]) =>
	paragraph.map((segment) => ('text' in segment ? segment.text : '|')).join('');

describe('selectPeriodSummaryEntries', () => {
	it('läser hela dagboken oavsett ålder, kronologiskt med ref 1..n', () => {
		const result = selectPeriodSummaryEntries([...baseRows].reverse());
		expect(result.entries.map(({ ref }) => ref)).toEqual([1, 2, 3, 4, 5]);
		expect(result.entries[0].text).toContain('sov dåligt');
		expect(result.entries[0].mood).toBe(4);
		expect(result.basis).toEqual({
			entryCount: 5,
			availableCount: 5,
			excludedCount: 0,
			skippedCount: 0,
			capped: false,
			truncated: false,
			firstDate: result.entries[0].date,
			lastDate: result.entries[4].date
		});
	});

	it('hoppar över testanteckningar men behåller korta anteckningar med humör', () => {
		const result = selectPeriodSummaryEntries([...baseRows, row(2, 'aaa', null), row(3, 'test test', null), row(4, 'trött', 3)]);
		expect(result.basis).toMatchObject({ entryCount: 6, skippedCount: 2 });
		expect(result.entries.some(({ text }) => text === 'trött')).toBe(true);
	});

	it('hoppar över långa inklistrade texter och tar bort MittPsykes reflektion', () => {
		const report = 'MittPsyke – Lägesrapport\n\n' + 'Plattformen har tagit flera steg framåt. '.repeat(70);
		const checkin = 'Guidad incheckning\n\nHur jag mår just nu:\n- Rastlös\n\nMittPsyke-reflektion:\nRastlösheten kan verkligen tära.';
		const result = selectPeriodSummaryEntries([...baseRows, row(2, report, null), row(3, checkin, null)]);
		expect(result.basis.skippedCount).toBe(1);
		const entry = result.entries.find(({ text }) => text.startsWith('Guidad incheckning'));
		expect(entry?.text).toBe('Guidad incheckning\n\nHur jag mår just nu:\n- Rastlös');
		expect(JSON.stringify(result.entries)).not.toContain('Rastlösheten kan');
	});

	it('hoppar över tomma rader och rader utan id', () => {
		const result = selectPeriodSummaryEntries([...baseRows, row(2, '   '), row(3, null), row(4, 'Utan id.', 5, '')]);
		expect(result.basis.entryCount).toBe(5);
	});

	it('skickar aldrig en anteckning som krisvakten flaggar och räknar den som utelämnad', () => {
		const result = selectPeriodSummaryEntries([...baseRows, row(3, 'Jag vill ta livet av mig.')]);
		expect(result.basis.excludedCount).toBe(1);
		expect(result.entries.some(({ text }) => text.includes('livet'))).toBe(false);
	});

	it('sprider urvalet jämnt från den första till den senaste när allt inte ryms', () => {
		const rows = Array.from({ length: 200 }, (_, index) => row(1000 - index * 5, `Anteckning nummer ${index}.`));
		const result = selectPeriodSummaryEntries(rows);
		expect(result.entries).toHaveLength(MAX_PERIOD_SUMMARY_ENTRIES);
		expect(result.entries[0].text).toBe('Anteckning nummer 0.');
		expect(result.entries.at(-1)?.text).toBe('Anteckning nummer 199.');
		expect(result.basis).toMatchObject({ availableCount: 200, capped: true });
	});

	it('delar ordtaket lika så att långa anteckningar inte tränger undan resten', () => {
		const long = Array.from({ length: 60 }, (_, index) => `Mening ${index} med några fler ord.`).join(' ');
		const rows = Array.from({ length: 60 }, (_, index) => row(600 - index, long));
		const result = selectPeriodSummaryEntries(rows);
		const words = result.entries.reduce((sum, { text }) => sum + text.split(/\s+/).length, 0);
		expect(result.entries).toHaveLength(MAX_PERIOD_SUMMARY_ENTRIES);
		expect(words).toBeLessThanOrEqual(MAX_PERIOD_SUMMARY_WORDS);
	});

	it('redovisar en kapad hämtning för sig, skild från spridningen', () => {
		const { basis } = selectPeriodSummaryEntries(baseRows, { truncated: true });
		expect(basis).toMatchObject({ truncated: true, capped: false, entryCount: 5 });
	});
});

describe('stripCheckinReflection och looksPasted', () => {
	it('lämnar text utan reflektion orörd', () => {
		expect(stripCheckinReflection('Bara mina ord.')).toBe('Bara mina ord.');
		expect(stripCheckinReflection('Guidad incheckning\nMittPsyke-reflektion:\nAI')).toBe('Guidad incheckning');
	});

	it('känner igen rapporter, avdelare och adresslistor men inte vanliga anteckningar', () => {
		expect(looksPasted('═══════\nDAGLIG RAPPORT')).toBe(true);
		expect(looksPasted('## Rubrik\nText')).toBe(true);
		expect(looksPasted('Sidor:\n/psykiskt-stod\n/hjalp-vid-angest\n/stod-vid-stress')).toBe(true);
		expect(looksPasted('Guidad incheckning\n\nHur jag mår just nu:\n- Rastlös\n- Orolig i kroppen')).toBe(false);
		expect(
			looksPasted('https://a.se/somn hjälpte mig.\nhttps://a.se/vila påminde mig.\nhttps://a.se/gå gav mig lust.')
		).toBe(false);
		expect(looksPasted('Precis varit på Liseberg med mina bästa töser, så underbart.')).toBe(false);
	});
});

describe('omitPeriodSummaryEntries', () => {
	it('tar bort valda anteckningar och uppdaterar omfånget', () => {
		const omit = [selection.entries[0].entryId];
		const result = omitPeriodSummaryEntries(selection, omit);
		expect(result?.entries.map(({ ref }) => ref)).toEqual([2, 3, 4, 5]);
		expect(result?.basis).toMatchObject({ entryCount: 4, firstDate: selection.entries[1].date });
		expect(omitPeriodSummaryEntries(selection, [])?.entries).toHaveLength(5);
	});

	it('avvisar okända, upprepade eller felaktiga id:n', () => {
		expect(omitPeriodSummaryEntries(selection, ['okänd'])).toBeNull();
		const id = selection.entries[0].entryId;
		expect(omitPeriodSummaryEntries(selection, [id, id])).toBeNull();
		expect(omitPeriodSummaryEntries(selection, 'x')).toBeNull();
		expect(omitPeriodSummaryEntries(selection, [1])).toBeNull();
	});
});

describe('spreadIndexes', () => {
	it('tar med första och sista och inga dubbletter', () => {
		expect(spreadIndexes(10, 4)).toEqual([0, 3, 6, 9]);
		expect(spreadIndexes(3, 5)).toEqual([0, 1, 2]);
		const many = spreadIndexes(41, 40);
		expect(new Set(many).size).toBe(40);
	});
});

describe('trimEntryText', () => {
	it('kortar vid en meningsgräns', () => {
		expect(trimEntryText('Ett två tre. Fyra fem sex. Sju åtta.', 6)).toBe('Ett två tre. Fyra fem sex.');
	});
});

describe('buildPeriodSummaryRequest', () => {
	it('skickar bara ref, datum, humör och text och ber om löptext med hänvisningar', () => {
		const request = buildPeriodSummaryRequest(selection.entries);
		const sent = JSON.parse(request.messages[0].content);
		expect(Object.keys(sent[0]).sort()).toEqual(['date', 'mood', 'ref', 'text']);
		expect(request.confidential).toBe(true);
		const instructions = (request.systemInstructions ?? []).join('\n');
		expect(instructions).toContain('"paragraphs"');
		expect(instructions).toContain('Ge inga råd, inga diagnoser');
		expect(instructions).toContain('Beskriv aldrig personens personlighet');
		expect(instructions).toContain('Skriv inga siffror');
	});
});

describe('parsePeriodSummary', () => {
	it('delar upp stycken i text och klickbara hänvisningar', () => {
		const result = answer({
			paragraphs: ['Du skriver ofta om sömnen [1, 3] och om promenader [2][3].', 'Mot slutet nämner du sjön [4].'],
			question: 'Vad betyder sjön för dig?'
		});
		expect(result.status).toBe('ok');
		if (result.status !== 'ok') return;
		const [first, second] = result.result.paragraphs;
		expect(first).toEqual([
			{ text: 'Du skriver ofta om sömnen' },
			{ sources: [expect.objectContaining({ ref: 1 }), expect.objectContaining({ ref: 3 })] },
			{ text: ' och om promenader' },
			{ sources: [expect.objectContaining({ ref: 2 }), expect.objectContaining({ ref: 3 })] },
			{ text: '.' }
		]);
		expect(plainText(second)).toBe('Mot slutet nämner du sjön|.');
		expect(result.result.question).toBe('Vad betyder sjön för dig?');
		expect(result.result.basis).toEqual(selection.basis);
	});

	it('tar bort stycken utan hänvisning eller med okända hänvisningar', () => {
		const result = answer({
			paragraphs: ['Utan stöd.', 'Fel nummer [9].', 'Trasig hänvisning [2.', 'Med stöd [2].']
		});
		expect(result.status).toBe('ok');
		if (result.status === 'ok') expect(result.result.paragraphs.map(plainText)).toEqual(['Med stöd|.']);
	});

	it('godtar bara citat som står ordagrant i en anteckning stycket hänvisar till', () => {
		const ok = answer({ paragraphs: ['Du skrev ”Jag vill komma ihåg stunden vid sjön” [5].'] });
		expect(ok.status).toBe('ok');
		const wrongEntry = answer({ paragraphs: ['Du skrev ”Jag vill komma ihåg stunden vid sjön” [1].', 'Annat [2].'] });
		expect(wrongEntry.status === 'ok' && wrongEntry.result.paragraphs.map(plainText)).toEqual(['Annat|.']);
		const invented = answer({ paragraphs: ['Du skrev "jag är så lycklig" [5].'] });
		expect(invented.status).toBe('invalid');
	});

	it('visar ingenting om krisvakten flaggar något i svaret, även i bortsorterade stycken', () => {
		expect(answer({ paragraphs: ['Du skriver om sömn [1].', 'Du vill ta livet av dig.'] }).status).toBe('withheld');
		expect(answer({ paragraphs: ['Du skriver om sömn [1].'], question: 'Vill du ta livet av dig?' }).status).toBe(
			'withheld'
		);
	});

	it('ger invalid för trasig JSON, fel form eller inga godkända stycken', () => {
		expect(parsePeriodSummary('inte json', selection).status).toBe('invalid');
		expect(answer({ themes: [] }).status).toBe('invalid');
		expect(answer({ paragraphs: ['Utan stöd.'] }).status).toBe('invalid');
	});

	it('högst fyra stycken och frågan måste vara en fråga', () => {
		const result = answer({ paragraphs: Array.from({ length: 6 }, (_, i) => `Stycke ${i} [1].`), question: 'Inte en fråga.' });
		expect(result.status === 'ok' && result.result.paragraphs).toHaveLength(4);
		expect(result.status === 'ok' && result.result.question).toBeNull();
	});
});

describe('periodSummarySnapshotId', () => {
	it('ändras när kontot eller underlaget ändras', async () => {
		const id = await periodSummarySnapshotId('user-a', selection);
		expect(id).toMatch(/^[a-f0-9]{64}$/);
		expect(await periodSummarySnapshotId('user-a', selectPeriodSummaryEntries(baseRows))).toBe(id);
		expect(await periodSummarySnapshotId('user-b', selection)).not.toBe(id);
		const edited = selectPeriodSummaryEntries([...baseRows.slice(0, 4), row(1, 'Ändrad text.', 8)]);
		expect(await periodSummarySnapshotId('user-a', edited)).not.toBe(id);
	});
});
