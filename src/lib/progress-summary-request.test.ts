import { describe, expect, it } from 'vitest';
import type { LighterDaysView, LighterDaysTheme } from './progress-lighter-days-types';
import { createSummaryRequests, getLighterDaysSummaryView, getSummarySnapshotId, selectSummarySource } from './progress-summary-request';

const theme: LighterDaysTheme = {
	id: 'Sömn', label: 'Sömn', renamed: false, count: 3, base: 4, otherCount: 1, otherBase: 6,
	weekCount: 2, note: 'Sömn nämndes.', comparison: 'I övriga inlägg: 1 av 6.', evidence: [
		{ entryId: 'entry-1', date: '2026-06-01', dateLabel: '1 juni', mood: 8, excerpt: 'Jag sov länge efter en lugn kväll.' }
	]
};
const view: LighterDaysView = {
	periodDays: 30, relevantEntryCount: 10, higherEntryCount: 4, medianMood: 5,
	lowConfidence: false, themes: [theme], helpfulPatterns: { ready: true, themes: [theme] }, hiddenThemes: [], basis: '10 inlägg'
};

const snapshot = selectSummarySource(getLighterDaysSummaryView(view, false, theme.id), 1)!;

describe('ett svar hör till det underlag som var aktuellt vid klicket', () => {
	it.each([
		['periodbyte', { ...view, periodDays: 90 as const }],
		['omdöpt tema', { ...view, helpfulPatterns: { ready: true, themes: [{ ...theme, label: 'Vila', note: 'Vila nämndes.', renamed: true }] } }],
		['dolt tema', { ...view, helpfulPatterns: { ready: true, themes: [] }, hiddenThemes: [{ id: theme.id, label: theme.label }] }],
		['omladdning av underlaget', null]
	])('ignorerar ett sent svar vid %s och känner igen ändringen på servern', async (_name, next) => {
		const requests = createSummaryRequests();
		const pending = requests.start(snapshot);
		const nextSnapshot = selectSummarySource(getLighterDaysSummaryView(next, false, theme.id), 1);
		expect(pending.isCurrent(snapshot)).toBe(true);
		expect(pending.isCurrent(nextSnapshot)).toBe(false);
		if (nextSnapshot) expect(await getSummarySnapshotId(nextSnapshot)).not.toBe(await getSummarySnapshotId(snapshot));
	});

	it('binder en pågående fråga till det valda temat även om utdragen är identiska', async () => {
		const otherTheme = { ...theme, id: 'Vila' };
		const currentView = { ...view, helpfulPatterns: { ready: true, themes: [theme, otherTheme] } };
		const next = selectSummarySource(getLighterDaysSummaryView(currentView, false, otherTheme.id), 1)!;
		const requests = createSummaryRequests();
		const pending = requests.start(snapshot);
		expect(pending.isCurrent(next)).toBe(false);
		expect(await getSummarySnapshotId(next)).not.toBe(await getSummarySnapshotId(snapshot));
		requests.cancel();
		expect(pending.signal.aborted).toBe(true);
	});

	it('binder snapshot och väntande svar till det enskilda utdraget', async () => {
		const other = { ...theme.evidence[0], entryId: 'entry-2', excerpt: 'Jag valde att vila efter middagen.' };
		const expanded = { ...theme, evidence: [...theme.evidence, other] };
		const candidates = getLighterDaysSummaryView({
			...view, helpfulPatterns: { ready: true, themes: [expanded] }
		}, false, theme.id);
		expect(selectSummarySource(candidates, null)).toBeNull();
		const first = selectSummarySource(candidates, 1)!;
		const second = selectSummarySource(candidates, 2)!;
		const active = createSummaryRequests().start(first);
		expect(active.isCurrent(second)).toBe(false);
		expect(await getSummarySnapshotId(first)).not.toBe(await getSummarySnapshotId(second));
	});

	it('visar bara det senaste svaret när två svar för samma vy kommer i omvänd ordning', async () => {
		const requests = createSummaryRequests();
		let resolveFirst!: (value: string) => void;
		const firstResponse = new Promise<string>((resolve) => { resolveFirst = resolve; });
		const first = requests.start(snapshot);
		const second = requests.start(snapshot);
		const shown: string[] = [];

		const firstResult = firstResponse.then((reply) => {
			if (first.isCurrent(snapshot)) shown.push(reply);
			first.finish();
		});
		const secondResponse = await Promise.resolve('det nyare svaret');
		if (second.isCurrent(snapshot)) shown.push(secondResponse);
		second.finish();
		resolveFirst('det gamla svaret');
		await firstResult;

		expect(first.signal.aborted).toBe(true);
		expect(shown).toEqual(['det nyare svaret']);
	});

	it('låter ett tidigare avslut inte nollställa det senaste anropet', () => {
		const requests = createSummaryRequests();
		const first = requests.start(snapshot);
		const second = requests.start(snapshot);
		first.finish();
		expect(second.isCurrent(snapshot)).toBe(true);
		requests.cancel();
		expect(second.signal.aborted).toBe(true);
		expect(second.isCurrent(snapshot)).toBe(false);
	});

	it('ger samma kontrollsumma efter JSON-överföring av vyn', async () => {
		expect(await getSummarySnapshotId(JSON.parse(JSON.stringify(snapshot)))).toBe(await getSummarySnapshotId(snapshot));
	});
});
