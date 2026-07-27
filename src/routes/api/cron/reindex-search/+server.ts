import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import OpenAI from 'openai';
import { createServiceClient } from '$lib/server/supabase-admin';
import { reindexContentEmbeddings } from '$lib/server/search-index';
import type { RequestHandler } from './$types';

// Triggas av GitHub Actions (se .github/workflows/reindex-search.yml) på
// schema, så nytt eller ändrat sökbart innehåll (artiklar, guider, FAQ) blir
// sökbart utan manuell handpåläggning. Samma x-cron-secret-mönster som
// /api/cron/guest-cleanup.
export const POST: RequestHandler = async ({ request, url }) => {
	const configuredSecret = env.CRON_SECRET;
	const providedSecret =
		request.headers.get('x-cron-secret') ||
		request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
		url.searchParams.get('secret');

	if (!configuredSecret || providedSecret !== configuredSecret) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	const apiKey = env.OPENAI_API_KEY;
	if (!apiKey) {
		return json({ error: 'Server configuration error.' }, { status: 500 });
	}

	const supabase = createServiceClient();
	if (!supabase) {
		return json({ error: 'Server configuration error.' }, { status: 500 });
	}

	try {
		const result = await reindexContentEmbeddings(new OpenAI({ apiKey }), supabase);
		return json({ ok: true, ...result });
	} catch (err) {
		console.error('[cron][reindex-search] misslyckades', err);
		return json({ error: 'Reindexing failed.' }, { status: 500 });
	}
};
