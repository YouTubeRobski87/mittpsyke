import { describe, expect, it } from 'vitest';
import {
	WORLD_PROGRESS_METADATA_KEY,
	WORLD_PROGRESS_VERSION,
	WORLD_PROGRESS_V1_CUTOFF,
	buildLegacyWorldPresence,
	readWorldProgressState,
	resolveWorldProgress,
	shouldRunLegacyMigration,
	type WorldProgressState
} from './worldProgress';
import { buildWorldPresence, getWorldMarks, getWorldStage, type WorldMarkId } from './worldStage';

const NOW = new Date('2026-09-19T12:00:00.000Z');
const CREATED = '2026-08-20T10:00:00.000Z';

/** N dagar i följd från start, ett inlägg per dag. */
function consecutiveDays(start: string, count: number): Record<string, number> {
	const days: Record<string, number> = {};
	const date = new Date(`${start}T12:00:00Z`);
	for (let i = 0; i < count; i += 1) {
		days[date.toISOString().slice(0, 10)] = 1;
		date.setUTCDate(date.getUTCDate() + 1);
	}
	return days;
}

/**
 * Ett konto där varje inlägg har ett humörvärde - just det fall den gamla
 * dubbelräkningen blåste upp. Ger både den nya och den gamla modellen.
 */
function moodHeavyUser(entryCount: number, dayCount: number, reflectionCount = 0) {
	const days = consecutiveDays('2026-08-25', dayCount);
	const firstDay = Object.keys(days)[0];
	days[firstDay] += entryCount - dayCount;
	const presence = buildWorldPresence({
		activityDays: days,
		entryCount,
		reflectionCount,
		accountCreatedAt: CREATED,
		now: NOW
	});
	const legacy = buildLegacyWorldPresence({
		moodDays: days,
		moodEntryCount: entryCount,
		entryCount,
		reflectionCount,
		accountCreatedAt: CREATED,
		now: NOW
	});
	return { presence, legacy };
}

const ids = (state: WorldProgressState) => state.marks;

describe('engångsmigrationen skyddar spår som den gamla modellen gav', () => {
	it('behåller svampen (14 inlägg med humör och 4 svar: 32 gamla registreringar, 18 nya)', () => {
		const { presence, legacy } = moodHeavyUser(14, 12, 4);
		expect(presence.registrationCount).toBe(18);
		expect(legacy.registrationCount).toBe(32);
		expect(getWorldMarks(presence).map((mark) => mark.id)).not.toContain('mushrooms');

		const { state } = resolveWorldProgress({ stored: null, presence, legacy });
		expect(ids(state)).toContain('mushrooms');
	});

	it('behåller ljusen över vattnet (scenario F: 28 inlägg med humör, 56 gamla registreringar, 28 nya)', () => {
		const { presence, legacy } = moodHeavyUser(28, 22);
		expect(presence.registrationCount).toBe(28);
		expect(legacy.registrationCount).toBe(56);

		const { state } = resolveWorldProgress({ stored: null, presence, legacy });
		expect(ids(state)).toContain('night-glow');
		// Stadiet från den gamla modellen (5) blir ett golv i stället för att sjunka till 4.
		expect(getWorldStage(presence)).toBe(4);
		expect(state.stage).toBe(5);
	});

	it('behåller stenarna vid elden (55 inlägg med humör: 110 gamla, 55 nya)', () => {
		const { presence, legacy } = moodHeavyUser(55, 30);
		expect(getWorldMarks(presence).map((mark) => mark.id)).not.toContain('hearth-stones');

		const { state } = resolveWorldProgress({ stored: null, presence, legacy });
		expect(ids(state)).toContain('hearth-stones');
	});

	it('använder aldrig den gamla modellen igen när tillståndet väl finns', () => {
		const { presence, legacy } = moodHeavyUser(14, 12, 4);
		const stored: WorldProgressState = { version: WORLD_PROGRESS_VERSION, marks: [], stage: 0 };

		const { state } = resolveWorldProgress({ stored, presence, legacy });
		// Svampen kom bara från humördubbelräkningen - den ges inte efter migrationen.
		expect(ids(state)).not.toContain('mushrooms');
		expect(state.stage).toBe(getWorldStage(presence));
	});
});

describe('världen är kumulativ', () => {
	it('låter ett tidigare upplåst spår finnas kvar när underlaget inte längre räcker', () => {
		const stored: WorldProgressState = {
			version: WORLD_PROGRESS_VERSION,
			marks: ['mushrooms', 'night-glow', 'hearth-stones'],
			stage: 5
		};
		const empty = buildWorldPresence({});

		const { state, changed } = resolveWorldProgress({ stored, presence: empty });
		expect(ids(state)).toEqual(['night-glow', 'hearth-stones', 'mushrooms']);
		expect(state.stage).toBe(5);
		expect(changed).toBe(false);

		// Och spåret renderas, trots att dagens villkor inte uppfylls.
		const rendered = getWorldMarks(empty, { timeOfDay: 'night', unlocked: state.marks }).map((mark) => mark.id);
		expect(rendered).toContain('mushrooms');
		expect(rendered).toContain('night-glow');
	});

	it('låser upp nya spår med de nya reglerna och markerar att de ska sparas', () => {
		const stored: WorldProgressState = { version: WORLD_PROGRESS_VERSION, marks: ['shore-stone'], stage: 1 };
		const presence = buildWorldPresence({ activityDays: consecutiveDays('2026-09-01', 3), entryCount: 3 });

		const { state, changed } = resolveWorldProgress({ stored, presence });
		expect(ids(state)).toEqual(expect.arrayContaining(['shore-stone', 'shore-path', 'lantern']));
		expect(state.stage).toBe(2);
		expect(changed).toBe(true);
	});

	it('kan aldrig tappa ett spår eller sänka stadiet, oavsett ordning', () => {
		let stored: WorldProgressState | null = null;
		const presences = [
			buildWorldPresence({ entryCount: 30, activityDays: consecutiveDays('2026-08-01', 30) }),
			buildWorldPresence({ entryCount: 2 }),
			buildWorldPresence({}),
			buildWorldPresence({ entryCount: 5, reflectionCount: 1 })
		];
		for (const presence of presences) {
			const before: WorldMarkId[] = stored?.marks ?? [];
			const beforeStage = stored?.stage ?? 0;
			stored = resolveWorldProgress({ stored, presence }).state;
			for (const id of before) expect(stored.marks).toContain(id);
			expect(stored.stage).toBeGreaterThanOrEqual(beforeStage);
		}
	});
});

describe('det sparade tillståndet', () => {
	it('saknas när nyckeln inte finns eller har en okänd version', () => {
		expect(readWorldProgressState({})).toBeNull();
		expect(readWorldProgressState(null)).toBeNull();
		expect(readWorldProgressState({ [WORLD_PROGRESS_METADATA_KEY]: { version: 99, marks: [], stage: 3 } })).toBeNull();
	});

	it('filtrerar bort okända spår och trasiga stadier i stället för att välta', () => {
		const state = readWorldProgressState({
			[WORLD_PROGRESS_METADATA_KEY]: { version: 1, marks: ['mushrooms', 'unicorn', 7], stage: 12 }
		});
		expect(state).toEqual({ version: 1, marks: ['mushrooms'], stage: 0 });
	});
});

describe('shouldRunLegacyMigration', () => {
	const cutoff = new Date('2026-09-01T00:00:00Z');

	it('kör migrationen för konton skapade före lanseringen', () => {
		expect(shouldRunLegacyMigration({ accountCreatedAt: '2026-08-31T23:59:59.999Z', cutoff })).toBe(
			true
		);
	});

	it('hoppar över migrationen för konton skapade efter lanseringen', () => {
		expect(shouldRunLegacyMigration({ accountCreatedAt: '2026-09-01T00:00:00.001Z', cutoff })).toBe(
			false
		);
	});

	it('räknar exakt på gränsen som nytt konto, och gör det likadant varje gång', () => {
		const exact = { accountCreatedAt: '2026-09-01T00:00:00.000Z', cutoff };
		expect(shouldRunLegacyMigration(exact)).toBe(false);
		expect(shouldRunLegacyMigration(exact)).toBe(false);
		// Samma tidpunkt uttryckt i en annan tidszon ger samma svar: jämförelsen
		// sker på absolut tid, inte på lokal kalenderdag.
		expect(shouldRunLegacyMigration({ accountCreatedAt: '2026-09-01T02:00:00.000+02:00', cutoff })).toBe(
			false
		);
		expect(shouldRunLegacyMigration({ accountCreatedAt: new Date('2026-09-01T00:00:00Z'), cutoff })).toBe(
			false
		);
	});

	it('kör migrationen när cutoffen inte är satt ännu', () => {
		expect(shouldRunLegacyMigration({ accountCreatedAt: '2026-09-10T08:00:00Z', cutoff: null })).toBe(
			true
		);
		expect(shouldRunLegacyMigration({ accountCreatedAt: '2026-09-10T08:00:00Z' })).toBe(true);
	});

	it('kör migrationen när kontots ålder inte går att fastställa', () => {
		expect(shouldRunLegacyMigration({ accountCreatedAt: null, cutoff })).toBe(true);
		expect(shouldRunLegacyMigration({ accountCreatedAt: 'inte ett datum', cutoff })).toBe(true);
		expect(shouldRunLegacyMigration({ cutoff })).toBe(true);
	});

	it('cutoff-konstanten är satt till en giltig tidpunkt', () => {
		expect(WORLD_PROGRESS_V1_CUTOFF).not.toBeNull();
		expect(Number.isNaN((WORLD_PROGRESS_V1_CUTOFF as Date).getTime())).toBe(false);
	});

	// Samma tre fall som ovan, men mot det konstantvärde produktionen faktiskt
	// kör på - inte mot en injicerad testtidpunkt.
	it('det verkliga konstantvärdet delar konton på rätt sida gränsen', () => {
		const live = WORLD_PROGRESS_V1_CUTOFF as Date;
		const at = (offsetMs: number) => new Date(live.getTime() + offsetMs).toISOString();

		expect(shouldRunLegacyMigration({ accountCreatedAt: at(-1), cutoff: live })).toBe(true);
		expect(shouldRunLegacyMigration({ accountCreatedAt: at(0), cutoff: live })).toBe(false);
		expect(shouldRunLegacyMigration({ accountCreatedAt: at(1), cutoff: live })).toBe(false);
		// Ett konto från långt före lanseringen migreras fortfarande.
		expect(shouldRunLegacyMigration({ accountCreatedAt: '2026-01-15T09:00:00Z', cutoff: live })).toBe(
			true
		);
	});
});
