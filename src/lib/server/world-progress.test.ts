import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncWorldProgress } from './world-progress';
import { WORLD_PROGRESS_METADATA_KEY } from '$lib/world/worldProgress';
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

const user = (metadata: Record<string, unknown> = {}) => ({
	id: 'user-1',
	user_metadata: metadata,
	created_at: '2026-08-20T10:00:00.000Z'
});

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
