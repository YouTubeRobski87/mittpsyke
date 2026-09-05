// Överblicken högst upp på Framsteg: "Så här har den senaste tiden sett ut".
//
// Framsteg kunde tidigare bara svara på 30, 90 och 180 dagar. Frågan användaren
// oftast bär med sig - "hur har den senaste tiden varit?" - hade därför ingen
// yta alls. Den här modulen svarar på den utan att införa ännu ett periodfilter
// och utan någon ny datakälla: den läser samma humörvärden som tidslinjen redan
// har hämtat.
//
// Språkregel: observationer, aldrig tolkningar. Ingen mening får påstå en
// riktning som inte passerat tröskelvärdena nedan, och ingen mening får
// beskriva saknade registreringar som ett sämre mående (docs/NORTH_STAR.md).
//
// Datumgränserna räknas i Stockholms kalender via shiftDateKey, inte genom att
// dra millisekunder från en Date. Det senare glider ett dygn fel vid
// sommartidsskiftet, vilket är just den sortens fel som skulle få en vecka att
// jämföras mot fel föregående vecka.

import { shiftDateKey, stockholmTodayKey } from '$lib/stockholm-date';
import type { MoodSample } from '$lib/progress-recent-period';

/** Fönstrets längd i dagar, inklusive dagens datum. */
export const WEEK_WINDOW_DAYS = 7;

/**
 * Minsta antal registreringar i ETT fönster för att fönstret ska få beskrivas.
 * Tre punkter är samma nivå som resten av Framsteg använder för en halva
 * (MIN_SAMPLES_PER_HALF i progress-reflection), och medvetet lågt nog att en
 * vanlig vecka kan kvalificera - men för högt för att en enstaka incheckning
 * ska bli en "riktning".
 */
export const MIN_WEEK_SAMPLES = 3;

/**
 * Hur stor skillnaden mellan två veckor måste vara innan den beskrivs. Samma
 * tröskel som MOOD_CHANGE_THRESHOLD på övriga Framsteg, så att två ytor aldrig
 * kan säga olika saker om samma underlag.
 */
export const WEEK_CHANGE_THRESHOLD = 0.75;

export type WeekComparison = 'higher' | 'lower' | 'similar' | 'unknown';

export interface WeekSummary {
	/** Sant när det senaste fönstret inte når MIN_WEEK_SAMPLES. */
	insufficient: boolean;
	/** Registreringar i det senaste fönstret. Kontext, inte ett resultat. */
	checkInCount: number;
	/** Dagar med minst en registrering i det senaste fönstret. */
	activeDays: number;
	/** Registreringar i föregående lika långa fönster. */
	previousCheckInCount: number;
	comparison: WeekComparison;
	/** Huvudmeningen. Alltid satt, även vid för tunt underlag. */
	summary: string;
	/** Jämförelsen mot föregående vecka, eller null när den inte får göras. */
	comparisonText: string | null;
}

function average(samples: MoodSample[]): number {
	return samples.reduce((sum, sample) => sum + sample.mood, 0) / samples.length;
}

function countLabel(count: number): string {
	return count === 1 ? '1 registrering' : `${count} registreringar`;
}

/**
 * Delar upp underlaget i det senaste fönstret och det närmast föregående, lika
 * långa fönstret. Gränserna är kalenderdatum i Stockholm.
 */
export function splitWeekWindows(samples: MoodSample[], now: Date = new Date()) {
	const end = stockholmTodayKey(now);
	const recentStart = shiftDateKey(end, -(WEEK_WINDOW_DAYS - 1));
	const previousEnd = shiftDateKey(recentStart, -1);
	const previousStart = shiftDateKey(recentStart, -WEEK_WINDOW_DAYS);

	const recent = samples.filter((sample) => sample.date >= recentStart && sample.date <= end);
	const previous = samples.filter(
		(sample) => sample.date >= previousStart && sample.date <= previousEnd
	);

	return { recent, previous, recentStart, end, previousStart, previousEnd };
}

/**
 * Bygger överblicken. Returnerar alltid ett objekt - en tom vecka beskrivs som
 * saknat underlag, aldrig som en nedgång.
 */
export function buildWeekSummary(
	samples: MoodSample[] | null | undefined,
	now: Date = new Date()
): WeekSummary {
	const safeSamples = Array.isArray(samples) ? samples : [];
	const { recent, previous } = splitWeekWindows(safeSamples, now);

	const activeDays = new Set(recent.map((sample) => sample.date)).size;
	const base: Omit<WeekSummary, 'insufficient' | 'summary' | 'comparison' | 'comparisonText'> = {
		checkInCount: recent.length,
		activeDays,
		previousCheckInCount: previous.length
	};

	if (recent.length < MIN_WEEK_SAMPLES) {
		return {
			...base,
			insufficient: true,
			comparison: 'unknown',
			comparisonText: null,
			summary:
				recent.length === 0
					? 'Inga humörvärden är sparade den senaste veckan, så det finns inget att jämföra ännu. Dagar utan registrering säger ingenting om hur du haft det.'
					: `Den senaste veckan har ${countLabel(recent.length)}. Det räcker ännu inte för att beskriva en riktning.`
		};
	}

	const recentAverage = average(recent);
	const summary = `Den senaste veckan har ${countLabel(recent.length)} fördelade på ${
		activeDays === 1 ? '1 dag' : `${activeDays} dagar`
	}. Snittet ligger på ${recentAverage.toFixed(1).replace('.', ',')} av 10.`;

	if (previous.length < MIN_WEEK_SAMPLES) {
		return {
			...base,
			insufficient: false,
			comparison: 'unknown',
			comparisonText: null,
			summary
		};
	}

	const difference = recentAverage - average(previous);

	if (difference >= WEEK_CHANGE_THRESHOLD) {
		return {
			...base,
			insufficient: false,
			comparison: 'higher',
			comparisonText: 'Registreringarna ligger något högre än veckan innan.',
			summary
		};
	}

	if (difference <= -WEEK_CHANGE_THRESHOLD) {
		return {
			...base,
			insufficient: false,
			comparison: 'lower',
			comparisonText: 'Registreringarna ligger något lägre än veckan innan.',
			summary
		};
	}

	return {
		...base,
		insufficient: false,
		comparison: 'similar',
		comparisonText: 'Registreringarna ligger på ungefär samma nivå som veckan innan.',
		summary
	};
}
