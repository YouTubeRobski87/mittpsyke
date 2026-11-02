// Dataminimerad mätning av övningsdelen (/ovningar).
//
// Allt som skickas är fasta värden: övningens slug ur den publika övningslistan
// och några fasta källor/mål. Aldrig fritext, svar på reflektionsfrågor,
// skattningar, känslor eller inloggat tillstånd. Robban godkände 2026-11-02 att
// övningens slug skickas till GA4; sluggen syns redan i sidadressen.

import { tools } from '$lib/data/seo-architecture';

const EXERCISE_IDS = new Set(tools.map((tool) => tool.slug));

/** Var besökaren kom ifrån när övningen öppnades. Fast lista. */
export type ExerciseSource = 'overview' | 'related' | 'evening' | 'guide' | 'other';

/** Vart besökaren gick från övningens slut. Fast lista. */
export type ExerciseNextStepTarget = 'related_exercise' | 'overview' | 'guide';

export type ExerciseOpenedParams = { exercise_id: string; source: ExerciseSource };
export type ExerciseEndParams = { exercise_id: string };
export type ExerciseNextStepParams = { exercise_id: string; target: ExerciseNextStepTarget };

/** Bara slugs som finns i övningslistan får skickas. Allt annat ger null. */
export function toExerciseId(slug: string | null | undefined): string | null {
	return slug && EXERCISE_IDS.has(slug) ? slug : null;
}

/**
 * Källan avgörs av föregående sidas sökväg vid navigering inom sajten. Ingen
 * query, hash eller referrer läses. Saknas föregående sida (direktbesök, ny
 * flik, sökmotor) blir källan 'other'.
 */
export function getExerciseSource(fromPathname: string | null | undefined): ExerciseSource {
	if (!fromPathname) return 'other';
	if (fromPathname === '/ovningar' || fromPathname === '/ovningar/') return 'overview';
	if (/^\/ovningar\/[^/]+\/?$/.test(fromPathname)) return 'related';
	if (/^\/dashboard\/kvallsstugan(\/|$)/.test(fromPathname)) return 'evening';
	if (/^\/(guider|guider-seo|blogg)(\/|$)/.test(fromPathname)) return 'guide';
	return 'other';
}

export function buildExerciseOpenedParams(
	slug: string,
	fromPathname: string | null | undefined
): ExerciseOpenedParams | null {
	const exerciseId = toExerciseId(slug);
	if (!exerciseId) return null;
	return { exercise_id: exerciseId, source: getExerciseSource(fromPathname) };
}

export function buildExerciseEndParams(slug: string): ExerciseEndParams | null {
	const exerciseId = toExerciseId(slug);
	return exerciseId ? { exercise_id: exerciseId } : null;
}

export function buildExerciseNextStepParams(
	slug: string,
	target: ExerciseNextStepTarget
): ExerciseNextStepParams | null {
	const exerciseId = toExerciseId(slug);
	return exerciseId ? { exercise_id: exerciseId, target } : null;
}
