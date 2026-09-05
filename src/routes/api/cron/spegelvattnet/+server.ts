import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import { createServiceClient } from '$lib/server/supabase-admin';
import {
	currentStockholmWeekStart,
	generateWeeklyReflectionsForWeek,
	shouldRunSpegelvattnetCron
} from '$lib/server/spegelvattnet';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, url }) => {
	const configuredSecret = env.CRON_SECRET || env.SPEGELVATTNET_CRON_SECRET;
	const providedSecret =
		request.headers.get('x-cron-secret') ||
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

	if (!configuredSecret || providedSecret !== configuredSecret) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	if (!shouldRunSpegelvattnetCron() && url.searchParams.get('force') !== 'true') {
		return json({ skipped: true, reason: 'outside_stockholm_schedule' });
	}

	const supabase = createServiceClient();
	if (!supabase) {
		return json({ error: 'Server configuration error.' }, { status: 500 });
	}

	const weekStart = url.searchParams.get('week_start') || currentStockholmWeekStart();
	const result = await generateWeeklyReflectionsForWeek(supabase, weekStart);
	return json({ weekStart, ...result });
};
