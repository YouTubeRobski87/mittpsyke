import { describe, expect, it } from 'vitest';
import type { LighterDaysView, LighterDaysTheme } from './progress-lighter-days-types';
import { createSummaryRequests, getSummarySnapshotId } from './progress-summary-request';

const theme: LighterDaysTheme = {
	id: 'Sömn', label: 'Sömn', renamed: false, count: 3, base: 4, otherCount: 1, otherBase: 6,
	weekCount: 2, note: 'Sömn nämndes.', comparison: 'I övriga inlägg: 1 av 6.', evidence: []
};
const view: LighterDaysView = {
	periodDays: 30, relevantEntryCount: 10, higherEntryCount: 4, medianMood: 5,
	lowConfidence: false, themes: [theme], hiddenThemes: [], basis: '10 inlägg'
};

describe('ett svar hör till det underlag som var aktuellt vid klicket', () => {
	it.each([
		['periodbyte', { ...view, periodDays: 90 as const }],
		['omdöpt tema', { ...view, themes: [{ ...theme, label: 'Vila', renamed: true }] }],
		['dolt tema', { ...view, themes: [], hiddenThemes: [{ id: theme.id, label: theme.label }] }],
		['omladdning av underlaget', null]
	])('ignorerar ett sent svar vid %s och känner igen ändringen på servern', async (_name, next) => {
		const requests = createSummaryRequests();
		const pending = requests.start(view);
		expect(pending.isCurrent(view)).toBe(true);
		expect(pending.isCurrent(next)).toBe(false);
		if (next) expect(await getSummarySnapshotId(next)).not.toBe(await getSummarySnapshotId(view));
	});

	it('visar bara det senaste svaret när två svar för samma vy kommer i omvänd ordning', async () => {
		const requests = createSummaryRequests();
		let resolveFirst!: (value: string) => void;
		const firstResponse = new Promise<string>((resolve) => { resolveFirst = resolve; });
		const first = requests.start(view);
		const second = requests.start(view);
		const shown: string[] = [];

		const firstResult = firstResponse.then((reply) => {
			if (first.isCurrent(view)) shown.push(reply);
			first.finish();
		});
		const secondResponse = await Promise.resolve('det nyare svaret');
		if (second.isCurrent(view)) shown.push(secondResponse);
		second.finish();
		resolveFirst('det gamla svaret');
		await firstResult;

		expect(first.signal.aborted).toBe(true);
		expect(shown).toEqual(['det nyare svaret']);
	});

	it('låter ett tidigare avslut inte nollställa det senaste anropet', () => {
		const requests = createSummaryRequests();
		const first = requests.start(view);
		const second = requests.start(view);
		first.finish();
		expect(second.isCurrent(view)).toBe(true);
		requests.cancel();
		expect(second.signal.aborted).toBe(true);
		expect(second.isCurrent(view)).toBe(false);
	});

	it('ger samma kontrollsumma efter JSON-överföring av vyn', async () => {
		expect(await getSummarySnapshotId(JSON.parse(JSON.stringify(view)))).toBe(await getSummarySnapshotId(view));
	});
});
