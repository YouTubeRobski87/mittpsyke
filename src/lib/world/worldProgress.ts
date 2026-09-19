// Framstegs-världens beständiga progression.
//
// Världen är kumulativ: ett spår som en gång vuxit fram ska aldrig försvinna,
// och miljöstadiet ska aldrig sjunka - inte ens när själva beräkningen rättas.
// Den här modulen håller det löftet genom ett litet sparat tillstånd:
//
//   upplåst = det dagens riktiga villkor ger  ELLER  det som redan sparats
//
// Tillståndet ligger i user_metadata under WORLD_PROGRESS_METADATA_KEY, samma
// mönster som progress_theme_overrides. Det är rent kosmetiskt: användaren kan
// skriva metadata själv, men det enda som kan ändras är vilka spår som syns i
// den egna världen. Det får aldrig läsas som behörighet eller data om mående.
//
// Engångsmigration: världen räknade tidigare ett humörvärde som en extra
// registrering ovanpå inlägget, och aktiva dagar bara på dagar med humör.
// Rättningen skulle annars kunna ta bort spår som redan syntes. Första gången
// tillståndet saknas räknas därför också den gamla modellen en enda gång, och
// unionen sparas. Därefter läses den gamla modellen aldrig mer - humör ger
// ingen progression framåt.
//
// Migrationen gäller bara konton som hann finnas under den gamla modellen. Ett
// konto som skapas efter lanseringen har aldrig sett den gamla världen, och ska
// därför inte heller ärva dess dubbelräkning - se WORLD_PROGRESS_V1_CUTOFF.

import {
	WORLD_MARK_IDS,
	buildWorldPresence,
	getEligibleWorldMarkIds,
	getWorldStage,
	normalizeWorldPresence,
	type WorldMarkId,
	type WorldPresence,
	type WorldStage
} from '$lib/world/worldStage';

export const WORLD_PROGRESS_METADATA_KEY = 'world_progress';
export const WORLD_PROGRESS_VERSION = 1;

export interface WorldProgressState {
	version: typeof WORLD_PROGRESS_VERSION;
	/** Spår som vuxit fram, i renderingsordning. */
	marks: WorldMarkId[];
	/** Det högsta miljöstadiet som nåtts. */
	stage: WorldStage;
}

/**
 * Tidpunkten då den nya världsmodellen gick live, i UTC.
 *
 * Konton skapade FÖRE den här tidpunkten kan ha hunnit få progression enligt
 * den gamla humörmodellen, och migreras därför via unionen. Konton skapade
 * EFTER den startar direkt på den nya modellen och läser aldrig humördata.
 *
 * Värdet är release-tidpunkten för den nya modellen. Det ändras aldrig i
 * efterhand: en senareläggning skulle köra migrationen på nytt för konton som
 * redan migrerats, och en tidigareläggning skulle neka migrationen åt konton
 * som hann växa under den gamla modellen.
 */
export const WORLD_PROGRESS_V1_CUTOFF: Date | null = new Date('2026-09-19T00:45:31Z');

/**
 * Avgör om den gamla humörmodellen får läsas för ett konto utan sparat
 * tillstånd. Jämförelsen sker på absolut tid (epoch-millisekunder), så den är
 * oberoende av tidszon; `created_at` från Supabase är UTC (timestamptz).
 *
 * Exakt på gränsen räknas kontot som nytt (`>=` ger ingen migration), så
 * gränsvärdet har ett enda definierat utfall.
 *
 * Kan kontots ålder inte fastställas - saknad eller trasig tidsstämpel - körs
 * migrationen. Det är den riktning som aldrig tar bort något som redan syns.
 */
export function shouldRunLegacyMigration(input: {
	accountCreatedAt?: string | Date | null;
	cutoff?: Date | null;
}): boolean {
	const cutoff = input.cutoff ?? null;
	if (!cutoff || Number.isNaN(cutoff.getTime())) return true;

	const raw = input.accountCreatedAt;
	if (!raw) return true;
	const created = raw instanceof Date ? raw : new Date(raw);
	if (Number.isNaN(created.getTime())) return true;

	return created.getTime() < cutoff.getTime();
}

const KNOWN_MARKS = new Set<string>(WORLD_MARK_IDS);

function isWorldStage(value: unknown): value is WorldStage {
	return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 5;
}

/**
 * Läser ett sparat tillstånd ur user_metadata. Saknas det, eller är det av en
 * okänd version, returneras null - det är signalen för engångsmigrationen.
 * Okända spår och trasiga värden filtreras bort i stället för att välta.
 */
export function readWorldProgressState(metadata: unknown): WorldProgressState | null {
	if (!metadata || typeof metadata !== 'object') return null;
	const raw = (metadata as Record<string, unknown>)[WORLD_PROGRESS_METADATA_KEY];
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;

	const value = raw as Record<string, unknown>;
	if (value.version !== WORLD_PROGRESS_VERSION) return null;

	const stored = new Set(
		Array.isArray(value.marks)
			? value.marks.filter((mark): mark is string => typeof mark === 'string' && KNOWN_MARKS.has(mark))
			: []
	);
	return {
		version: WORLD_PROGRESS_VERSION,
		marks: WORLD_MARK_IDS.filter((id) => stored.has(id)),
		stage: isWorldStage(value.stage) ? value.stage : 0
	};
}

/**
 * Den gamla modellen, bara för engångsmigrationen: aktiva dagar enbart på
 * dagar med humörvärde, och varje humörvärde som en extra registrering.
 * Används aldrig för att avgöra ny progression.
 */
export function buildLegacyWorldPresence(input: {
	moodDays: Record<string, number>;
	moodEntryCount: number;
	entryCount: number;
	reflectionCount: number;
	accountCreatedAt?: string | Date | null;
	now?: Date;
}): WorldPresence {
	const presence = buildWorldPresence({
		activityDays: input.moodDays,
		entryCount: input.entryCount,
		reflectionCount: input.reflectionCount,
		accountCreatedAt: input.accountCreatedAt,
		now: input.now
	});
	const moodEntryCount = normalizeWorldPresence({ entryCount: input.moodEntryCount }).entryCount;
	return { ...presence, registrationCount: presence.registrationCount + moodEntryCount };
}

export interface WorldProgressResolution {
	state: WorldProgressState;
	/** Sant när tillståndet behöver sparas (nytt spår, högre stadie eller migration). */
	changed: boolean;
}

/**
 * Slår ihop det sparade tillståndet med dagens underlag. Resultatet kan bara
 * växa: ingenting som finns i `stored` tas någonsin bort.
 *
 * `legacy` skickas bara med när `stored` saknas, dvs vid engångsmigrationen.
 */
export function resolveWorldProgress(input: {
	stored: WorldProgressState | null;
	presence: WorldPresence;
	legacy?: WorldPresence | null;
}): WorldProgressResolution {
	const { stored, presence } = input;
	// Den gamla modellen får bara bidra när inget tillstånd finns ännu.
	const legacy = stored ? null : (input.legacy ?? null);

	const unlocked = new Set<WorldMarkId>(stored?.marks ?? []);
	for (const id of getEligibleWorldMarkIds(presence)) unlocked.add(id);
	if (legacy) for (const id of getEligibleWorldMarkIds(legacy)) unlocked.add(id);

	const stage = Math.max(
		stored?.stage ?? 0,
		getWorldStage(presence),
		legacy ? getWorldStage(legacy) : 0
	) as WorldStage;

	const state: WorldProgressState = {
		version: WORLD_PROGRESS_VERSION,
		marks: WORLD_MARK_IDS.filter((id) => unlocked.has(id)),
		stage
	};
	const changed =
		!stored || stored.stage !== state.stage || stored.marks.length !== state.marks.length;
	return { state, changed };
}
