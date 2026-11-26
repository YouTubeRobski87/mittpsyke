import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase-admin';
import {
	currentStockholmWeekStart,
	generateWeeklyReflectionsForWeek,
	shouldRunSpegelvattnetCron,
	summarizeSpegelvattnetRun
} from '$lib/server/spegelvattnet';
import type { RequestHandler } from './$types';

// Veckospeglingens schemalagda körning.
//
// Svaren skiljer på utfallen, och HTTP-statusen följer dem så att ett
// misslyckat jobb aldrig ser lyckat ut i GitHub Actions:
//   200 generated          minst en spegling skapades
//   200 already_generated  allt var redan genererat
//   200 nothing_to_do      ingen hade underlag den här veckan
//   200 skipped            utanför schemafönstret (söndag 06–24, Stockholm)
//   202 already_running    en körning pågår redan i den här processen
//   401                    fel eller saknad cron-hemlighet
//   500 failed             minst ett fel
// Svaret innehåller bara antal, aldrig användar-id eller innehåll.

// Hindrar två samtidiga körningar i samma process från att göra dubbla
// AI-anrop för samma användare. Workflowen har dessutom en concurrency-grupp,
// och databasens unik-villkor stoppar dubbletter som ändå skulle uppstå.
let activeRun: Promise<unknown> | null = null;

export const POST: RequestHandler = async ({ request, url }) => {
	const configuredSecret = env.CRON_SECRET || env.SPEGELVATTNET_CRON_SECRET;
	const providedSecret =
		request.headers.get('x-cron-secret') ||
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

	if (!configuredSecret || providedSecret !== configuredSecret) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	if (!shouldRunSpegelvattnetCron() && url.searchParams.get('force') !== 'true') {
		return json({ outcome: 'skipped', reason: 'outside_stockholm_schedule' });
	}

	if (activeRun) {
		return json({ outcome: 'already_running' }, { status: 202 });
	}

	const supabase = createServiceClient();
	if (!supabase) {
		return json({ outcome: 'failed', error: 'Server configuration error.' }, { status: 500 });
	}

	const weekStart = url.searchParams.get('week_start') || currentStockholmWeekStart();
	const run = generateWeeklyReflectionsForWeek(supabase, weekStart);
	activeRun = run;
	try {
		const result = await run;
		const outcome = summarizeSpegelvattnetRun(result);
		return json({ outcome, weekStart, ...result }, { status: outcome === 'failed' ? 500 : 200 });
	} catch (error) {
		console.error('Spegelvattnet run failed', { name: (error as Error)?.name });
		return json({ outcome: 'failed' }, { status: 500 });
	} finally {
		activeRun = null;
	}
};

/** Endast för tester: nollställer låset mellan testfall. */
export function _resetSpegelvattnetRunLock() {
	activeRun = null;
}
