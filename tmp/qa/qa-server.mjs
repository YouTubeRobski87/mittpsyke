// Serverdelen av den lokala QA-fixturen. Endast testinfrastruktur.
//
// Varje request körs i en AsyncLocalStorage-kontext med valt QA-läge, så att
// även kod som skapar egna Supabase-klienter (createClient i API-endpoints,
// createServiceClient) får samma syntetiska data som locals.supabase - utan
// att någon klient någonsin pekar mot en riktig Supabase.

import { AsyncLocalStorage } from 'node:async_hooks';
import { createSyntheticSupabase, resolveQaMode } from './synthetic-supabase.mjs';

export const QA_MODE_PARAM = 'qa-mode';
export const QA_MODE_COOKIE = 'qa-mode';

const requestContext = new AsyncLocalStorage();

/** Läget för en request: query-param först, sedan cookie, sedan env-standard. */
export function readQaMode(url, cookieValue, envDefault) {
	return resolveQaMode(url.searchParams.get(QA_MODE_PARAM) ?? cookieValue ?? envDefault);
}

export function runWithQaContext(context, callback) {
	return requestContext.run(context, callback);
}

/** Ersätter createClient från @supabase/supabase-js i QA-servern. Argumenten ignoreras. */
export function createQaServerClient() {
	const context = requestContext.getStore() ?? {};
	return createSyntheticSupabase({ mode: context.mode, guest: Boolean(context.guest) });
}
