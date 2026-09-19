import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncWorldProgress } from './world-progress';
import { WORLD_PROGRESS_METADATA_KEY, WORLD_PROGRESS_V1_CUTOFF } from '$lib/world/worldProgress';
import { buildWorldPresence } from '$lib/world/worldStage';

/** Supabase-attrapp: räknar diary-läsningar och fångar sparningar. */
function fakeSupabase(options: { moodRows?: { created_at: string }[]; moodError?: boolean; saveError?: boolean } = {}) {
	const reads: string[] = [];
	const saves: Record<string, unknown>[] = [];
	const query = {
		select: () => query,
		eq: () => query,
		not: () => query,
		order: () => query,
		limit: () =>
			Promise.resolve(
				options.moodError
					? { data: null, error: { message: 'nere' } }
					: { data: options.moodRows ?? [], error: null }
			)
	};
	const client = {
		from: (table: string) => {
			reads.push(table);
			return query;
		},
		auth: {
			updateUser: async ({ data }: { data: Record<string, unknown> }) => {
				saves.push(data);
				return { error: options.saveError ? { message: 'kunde inte spara' } : null };
			}
		}
	};
	return { client: client as never, reads, saves };
}

/**
 * Scenario D från rapporten: 14 inlägg på 12 dagar, varav 10 med humör, och
 * 4 svar på dagens fråga. Gamla modellen: 14 + 10 + 4 = 28, nya: 14 + 4 = 18.
 */
function scenarioD() {
	const dates = ['2026-08-21', '2026-08-24', '2026-08-27', '2026-08-29', '2026-09-02', '2026-09-04', '2026-09-08', '2026-09-10', '2026-09-12', '2026-09-15', '2026-09-17', '2026-09-19'];
	// Inläggen 29/8, 10/9, 19/9 och det andra inlägget 15/9 saknar humör.
	const withoutMood = new Set(['2026-08-29', '2026-09-10', '2026-09-19']);
	const moodRows = [...dates.filter((date) => !withoutMood.has(date)), '2026-09-02'].map((date) => ({
		created_at: `${date}T10:00:00.000Z`
	}));
	const activityDays = Object.fromEntries(dates.map((date) => [date, 1]));
	activityDays['2026-09-02'] = 2;
	activityDays['2026-09-15'] = 2;
	return { moodRows, activityDays, entryCount: 14, reflectionCount: 4 };
}

const user = (metadata: Record<string, unknown> = {}, createdAt = '2026-08-20T10:00:00.000Z') => ({
	id: 'user-1',
	user_metadata: metadata,
	created_at: createdAt
});

/** Lanseringstidpunkt i testerna. Produktionen kör på WORLD_PROGRESS_V1_CUTOFF. */
const CUTOFF = new Date('2026-09-01T00:00:00Z');

afterEach(() => vi.restoreAllMocks());

describe('syncWorldProgress', () => {
	it('migrerar en gång: läser den gamla humörmodellen och sparar unionen', async () => {
		const d = scenarioD();
		const { client, reads, saves } = fakeSupabase({ moodRows: d.moodRows });

		const state = await syncWorldProgress({
			supabase: client,
			user: user(),
			presence: buildWorldPresence({ activityDays: d.activityDays, entryCount: 14, reflectionCount: 4, accountCreatedAt: user().created_at, now: new Date('2026-09-19T12:00:00Z') }),
			entryCount: d.entryCount,
			reflectionCount: d.reflectionCount,
			now: new Date('2026-09-19T12:00:00Z')
		});

		expect(reads).toEqual(['diary']);
		expect(state.marks).toContain('mushrooms');
		expect(saves).toHaveLength(1);
		expect(saves[0][WORLD_PROGRESS_METADATA_KEY]).toEqual(state);
	});

	it('läser aldrig humördata igen när tillståndet finns, och sparar inget oförändrat', async () => {
		const d = scenarioD();
		const presence = buildWorldPresence({ activityDays: d.activityDays, entryCount: 14, reflectionCount: 4 });
		const { client, reads, saves } = fakeSupabase({ moodRows: d.moodRows });
		const stored = { version: 1, marks: ['mushrooms'], stage: 4 };

		const state = await syncWorldProgress({
			supabase: client,
			user: user({ [WORLD_PROGRESS_METADATA_KEY]: stored }),
			presence,
			entryCount: 14,
			reflectionCount: 4
		});

		// Ingen diary-läsning alls: humör kan inte längre ge progression.
		expect(reads).toEqual([]);
		// Svampen finns kvar trots att nya modellen bara ger 18 registreringar.
		expect(state.marks).toContain('mushrooms');
		// Nya regler kan fortfarande lägga till spår (stigen, lyktan m.fl.).
		expect(state.marks).toContain('shore-path');
		expect(saves).toHaveLength(1);
	});

	it('sparar ingenting om den gamla modellen inte kunde läsas, så migrationen görs om', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const { client, saves } = fakeSupabase({ moodError: true });

		const state = await syncWorldProgress({
			supabase: client,
			user: user(),
			presence: buildWorldPresence({ entryCount: 1, activityDays: { '2026-09-19': 1 } }),
			entryCount: 1,
			reflectionCount: 0
		});

		expect(saves).toEqual([]);
		expect(state.marks).toContain('shore-stone');
	});

	it('visar unionen även om sparningen misslyckas', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const d = scenarioD();
		const { client } = fakeSupabase({ moodRows: d.moodRows, saveError: true });

		const state = await syncWorldProgress({
			supabase: client,
			user: user(),
			presence: buildWorldPresence({ activityDays: d.activityDays, entryCount: 14, reflectionCount: 4 }),
			entryCount: 14,
			reflectionCount: 4
		});

		expect(state.marks).toContain('mushrooms');
	});
});

/**
 * Migrations-cutoffen. Alla fall nedan kör samma underlag (scenario D), så den
 * enda skillnaden mellan ett gammalt och ett nytt konto är kontots ålder.
 * Svampen kräver 25 registreringar och är därför facit: den nya modellen ger 18
 * och når den inte, den gamla ger 28 och gör det.
 *
 * Underlaget hålls medvetet identiskt även för det nya kontot, trots att dess
 * dagar då ligger före kontots created_at. Det isolerar cutoffen som den enda
 * variabeln; hur dagarna räknas testas i worldStage.test.ts.
 */
describe('syncWorldProgress - migrations-cutoff', () => {
	function runScenarioD(createdAt: string, metadata: Record<string, unknown> = {}) {
		const d = scenarioD();
		const fake = fakeSupabase({ moodRows: d.moodRows });
		const now = new Date('2026-09-19T12:00:00Z');
		return {
			...fake,
			d,
			state: syncWorldProgress({
				supabase: fake.client,
				user: user(metadata, createdAt),
				presence: buildWorldPresence({
					activityDays: d.activityDays,
					entryCount: d.entryCount,
					reflectionCount: d.reflectionCount,
					accountCreatedAt: createdAt,
					now
				}),
				entryCount: d.entryCount,
				reflectionCount: d.reflectionCount,
				now,
				cutoff: CUTOFF
			})
		};
	}

	it('gammalt konto utan tillstånd: migrationen körs och den gamla modellen läses', async () => {
		const run = runScenarioD('2026-08-20T10:00:00.000Z');
		const state = await run.state;

		expect(run.reads).toEqual(['diary']);
		expect(state.marks).toContain('mushrooms');
		expect(run.saves).toHaveLength(1);
	});

	it('nytt konto utan tillstånd: ingen humördata läses över huvud taget', async () => {
		const run = runScenarioD('2026-09-10T08:00:00.000Z');
		await run.state;

		expect(run.reads).toEqual([]);
	});

	it('gammalt konto behåller spår som bara den gamla modellen gav', async () => {
		const state = await runScenarioD('2026-08-20T10:00:00.000Z').state;

		// 18 registreringar räcker inte i den nya modellen; spåret ärvs.
		expect(state.marks).toContain('mushrooms');
		expect(state.stage).toBe(4);
	});

	it('nytt konto får bara spår som den nya modellen ger', async () => {
		const state = await runScenarioD('2026-09-10T08:00:00.000Z').state;

		expect(state.marks).not.toContain('mushrooms');
		// Exakt de spår scenario D ger utan humördubbelräkningen, i renderingsordning.
		expect(state.marks).toEqual([
			'still-birds',
			'lantern',
			'resting-seat',
			'first-bloom',
			'shore-stone',
			'shore-path'
		]);
		// Nya modellen sparas ändå, så nästa besök har ett tillstånd att växa från.
		expect(state.stage).toBe(4);
	});

	/**
	 * Utan `cutoff`-argument faller syncWorldProgress igenom till konstanten, så
	 * det här är vägen produktionen faktiskt tar.
	 */
	it('konstantvärdet gäller när ingen cutoff skickas in', async () => {
		const live = WORLD_PROGRESS_V1_CUTOFF as Date;
		const d = scenarioD();

		for (const [label, createdAt, expectedReads] of [
			['före', new Date(live.getTime() - 1).toISOString(), ['diary']],
			['exakt', live.toISOString(), []],
			['efter', new Date(live.getTime() + 1).toISOString(), []]
		] as const) {
			const fake = fakeSupabase({ moodRows: d.moodRows });
			await syncWorldProgress({
				supabase: fake.client,
				user: user({}, createdAt),
				presence: buildWorldPresence({
					activityDays: d.activityDays,
					entryCount: d.entryCount,
					reflectionCount: d.reflectionCount
				}),
				entryCount: d.entryCount,
				reflectionCount: d.reflectionCount
			});

			expect(fake.reads, label).toEqual(expectedReads);
		}
	});

	it('nytt konto sparar sitt tillstånd trots att migrationen hoppades över', async () => {
		const run = runScenarioD('2026-09-10T08:00:00.000Z');
		const state = await run.state;

		expect(run.saves).toHaveLength(1);
		expect(run.saves[0][WORLD_PROGRESS_METADATA_KEY]).toEqual(state);
	});

	it('befintligt tillstånd ger ingen humörläsning, oavsett kontots ålder', async () => {
		const stored = { version: 1, marks: ['mushrooms'], stage: 4 };

		for (const createdAt of ['2026-08-20T10:00:00.000Z', '2026-09-10T08:00:00.000Z']) {
			const run = runScenarioD(createdAt, { [WORLD_PROGRESS_METADATA_KEY]: stored });
			const state = await run.state;

			expect(run.reads, createdAt).toEqual([]);
			expect(state.marks, createdAt).toContain('mushrooms');
		}
	});

	it('gammalt konto vars humörläsning misslyckas sparar fortfarande ingenting', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const d = scenarioD();
		const { client, reads, saves } = fakeSupabase({ moodError: true });

		const state = await syncWorldProgress({
			supabase: client,
			user: user({}, '2026-08-20T10:00:00.000Z'),
			presence: buildWorldPresence({ activityDays: d.activityDays, entryCount: d.entryCount, reflectionCount: d.reflectionCount }),
			entryCount: d.entryCount,
			reflectionCount: d.reflectionCount,
			cutoff: CUTOFF
		});

		// Försöket gjordes, men utan underlag får migrationen inte räknas som klar.
		expect(reads).toEqual(['diary']);
		expect(saves).toEqual([]);
		expect(state.marks).toContain('shore-stone');
	});
});
