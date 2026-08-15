import { env } from '$env/dynamic/private';
import { json } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient, isUuid } from '$lib/server/supabase-admin';
import { RateLimiter } from '$lib/server/rate-limit';
import {
	LANDING_PAGE_STATUSES,
	calculateAbTestWinner,
	isMissingSupabaseResourceError,
	type AbTestRecord,
	type LandingPageRecord,
	type LandingPageStatus
} from '$lib/server/admin-system';
import {
	REMOTE_COMMANDS,
	authorizeRemoteRequest,
	extractRemoteToken,
	parseRemoteCommand,
	readBooleanParam,
	readIntParam,
	readStringParam,
	type RemoteCommandName
} from '$lib/server/remote-admin';
import type { RequestHandler } from './$types';

/**
 * Fjärrstyrning av adminfunktioner utanför webbläsaren. Samma åtgärder som
 * finns i /admin, men anropbara från en telefongenväg eller ett skript med en
 * token i stället för en inloggad session.
 *
 * Skicka POST /api/remote med headern `x-remote-admin-token` och body:
 *   { "command": "pages.set-status", "params": { "pageId": "angst", "status": "published" } }
 *
 * Tokenen sätts som REMOTE_ADMIN_TOKEN i Render och måste vara minst 32 tecken.
 */

// Fjärranrop görs av en enda operatör, inte av användare. Taket är satt för att
// bromsa gissningsförsök mot tokenen utan att stå i vägen för normal användning.
const remoteLimiter = new RateLimiter(60_000, 20);

const FEEDBACK_DEFAULT_LIMIT = 10;
const FEEDBACK_MAX_LIMIT = 50;

const LANDING_PAGE_COLUMNS =
	'id, created_at, updated_at, page_id, name, slug, status, conversions, views, description';
const AB_TEST_COLUMNS =
	'id, created_at, updated_at, ended_at, landing_page_id, variant_a_name, variant_b_name, conversions_a, conversions_b, views_a, views_b, winner, is_active';

type CommandResult = {
	status: number;
	body: Record<string, unknown>;
};

function commandError(status: number, error: string): CommandResult {
	return { status, body: { ok: false, error } };
}

function commandOk(data: Record<string, unknown>): CommandResult {
	return { status: 200, body: { ok: true, data } };
}

// Admin-tabellerna ligger i en separat migration. Saknas de är det ett
// driftläge, inte ett fel i anropet - därför 503 med samma hänvisning som /admin.
function missingSchemaError() {
	return commandError(
		503,
		'Admin-tabellerna saknas ännu. Kör `supabase/admin_system.sql` i Supabase SQL Editor först.'
	);
}

function isLandingPageStatus(value: string): value is LandingPageStatus {
	return (LANDING_PAGE_STATUSES as readonly string[]).includes(value);
}

async function runStatus(supabase: SupabaseClient): Promise<CommandResult> {
	const [pagesResult, abTestsResult, feedbackResult] = await Promise.all([
		supabase.from('landing_pages').select('id, status'),
		supabase.from('ab_tests').select('id, is_active'),
		supabase.from('feedback_submissions').select('id', { count: 'exact', head: true })
	]);

	if (isMissingSupabaseResourceError(pagesResult.error ?? abTestsResult.error)) {
		return missingSchemaError();
	}

	if (pagesResult.error || abTestsResult.error) {
		console.error('[remote][status] kunde inte läsa admindata', pagesResult.error ?? abTestsResult.error);
		return commandError(500, 'Kunde inte läsa admindata.');
	}

	const pages = (pagesResult.data ?? []) as Pick<LandingPageRecord, 'id' | 'status'>[];
	const abTests = (abTestsResult.data ?? []) as Pick<AbTestRecord, 'id' | 'is_active'>[];

	return commandOk({
		generatedAt: new Date().toISOString(),
		pages: {
			total: pages.length,
			published: pages.filter((page) => page.status === 'published').length,
			draft: pages.filter((page) => page.status === 'draft').length,
			planned: pages.filter((page) => page.status === 'planned').length
		},
		abTests: {
			total: abTests.length,
			active: abTests.filter((test) => test.is_active).length
		},
		// Saknas feedbacktabellen är det inte kritiskt för statusvyn - rapportera
		// null i stället för att fälla hela kommandot.
		feedback: {
			total: feedbackResult.error ? null : (feedbackResult.count ?? 0)
		}
	});
}

async function runPagesList(
	supabase: SupabaseClient,
	params: Record<string, unknown>
): Promise<CommandResult> {
	const statusFilter = readStringParam(params, 'status');

	if (statusFilter && !isLandingPageStatus(statusFilter)) {
		return commandError(
			400,
			`Ogiltig status. Giltiga värden: ${LANDING_PAGE_STATUSES.join(', ')}.`
		);
	}

	let query = supabase.from('landing_pages').select(LANDING_PAGE_COLUMNS).order('name');
	if (statusFilter) {
		query = query.eq('status', statusFilter);
	}

	const { data, error } = await query;

	if (isMissingSupabaseResourceError(error)) return missingSchemaError();

	if (error) {
		console.error('[remote][pages.list] kunde inte läsa landningssidor', error);
		return commandError(500, 'Kunde inte läsa landningssidorna.');
	}

	const pages = (data ?? []) as LandingPageRecord[];

	return commandOk({
		count: pages.length,
		pages: pages.map((page) => ({
			id: page.id,
			pageId: page.page_id,
			name: page.name,
			slug: page.slug,
			status: page.status,
			views: page.views,
			conversions: page.conversions
		}))
	});
}

async function runPagesSetStatus(
	supabase: SupabaseClient,
	params: Record<string, unknown>
): Promise<CommandResult> {
	const pageId = readStringParam(params, 'pageId');
	const status = readStringParam(params, 'status');

	if (!pageId) {
		return commandError(400, 'params.pageId krävs (page_id eller sidans uuid).');
	}

	if (!status || !isLandingPageStatus(status)) {
		return commandError(
			400,
			`params.status krävs. Giltiga värden: ${LANDING_PAGE_STATUSES.join(', ')}.`
		);
	}

	// Fjärranroparen skriver hellre "angst" än ett uuid, men båda ska fungera.
	const matchColumn = isUuid(pageId) ? 'id' : 'page_id';

	const { data, error } = await supabase
		.from('landing_pages')
		.update({ status })
		.eq(matchColumn, pageId)
		.select('id, page_id, name, slug, status')
		.maybeSingle<Pick<LandingPageRecord, 'id' | 'page_id' | 'name' | 'slug' | 'status'>>();

	if (isMissingSupabaseResourceError(error)) return missingSchemaError();

	if (error) {
		console.error('[remote][pages.set-status] kunde inte uppdatera status', error);
		return commandError(500, 'Kunde inte uppdatera statusen.');
	}

	if (!data) {
		return commandError(404, `Hittade ingen landningssida för "${pageId}".`);
	}

	return commandOk({
		page: {
			id: data.id,
			pageId: data.page_id,
			name: data.name,
			slug: data.slug,
			status: data.status
		}
	});
}

async function runAbList(
	supabase: SupabaseClient,
	params: Record<string, unknown>
): Promise<CommandResult> {
	const activeOnly = readBooleanParam(params, 'activeOnly', false);

	let query = supabase.from('ab_tests').select(AB_TEST_COLUMNS).order('created_at', { ascending: false });
	if (activeOnly) {
		query = query.eq('is_active', true);
	}

	const { data, error } = await query;

	if (isMissingSupabaseResourceError(error)) return missingSchemaError();

	if (error) {
		console.error('[remote][ab.list] kunde inte läsa A/B-tester', error);
		return commandError(500, 'Kunde inte läsa A/B-testerna.');
	}

	const tests = (data ?? []) as AbTestRecord[];

	return commandOk({
		count: tests.length,
		abTests: tests.map((test) => ({
			id: test.id,
			landingPageId: test.landing_page_id,
			variantA: test.variant_a_name,
			variantB: test.variant_b_name,
			viewsA: test.views_a,
			viewsB: test.views_b,
			conversionsA: test.conversions_a,
			conversionsB: test.conversions_b,
			winner: test.winner,
			isActive: test.is_active,
			endedAt: test.ended_at
		}))
	});
}

async function runAbWinner(
	supabase: SupabaseClient,
	params: Record<string, unknown>
): Promise<CommandResult> {
	const abTestId = readStringParam(params, 'abTestId');

	if (!abTestId || !isUuid(abTestId)) {
		return commandError(400, 'params.abTestId krävs och måste vara ett uuid.');
	}

	const { data: abTest, error: loadError } = await supabase
		.from('ab_tests')
		.select(AB_TEST_COLUMNS)
		.eq('id', abTestId)
		.maybeSingle<AbTestRecord>();

	if (isMissingSupabaseResourceError(loadError)) return missingSchemaError();

	if (loadError) {
		console.error('[remote][ab.winner] kunde inte läsa testet', loadError);
		return commandError(500, 'Kunde inte läsa in testet.');
	}

	if (!abTest) {
		return commandError(404, 'Hittade inget A/B-test med det id:t.');
	}

	// Samma beräkning som adminvyns "calculateWinner", så fjärrvägen och
	// webbvägen aldrig kan ge olika vinnare för samma siffror.
	const result = calculateAbTestWinner(abTest);

	const { error: updateError } = await supabase
		.from('ab_tests')
		.update({
			winner: result.winner,
			is_active: result.winner ? false : abTest.is_active,
			ended_at: result.winner ? new Date().toISOString() : abTest.ended_at
		})
		.eq('id', abTestId);

	if (updateError) {
		console.error('[remote][ab.winner] kunde inte spara vinnaren', updateError);
		return commandError(500, 'Kunde inte uppdatera vinnaren.');
	}

	return commandOk({
		abTestId,
		winner: result.winner,
		summary: result.summary
	});
}

type FeedbackRow = {
	id: string;
	created_at: string | null;
	experience: string;
	what_worked: string | null;
	unclear: string | null;
	missing: string | null;
	use_again: string;
	other: string | null;
};

async function runFeedbackRecent(
	supabase: SupabaseClient,
	params: Record<string, unknown>
): Promise<CommandResult> {
	const limit = readIntParam(params, 'limit', FEEDBACK_DEFAULT_LIMIT, 1, FEEDBACK_MAX_LIMIT);

	// user_id hämtas medvetet inte: fritextsvaren räcker för att läsa av läget,
	// och fjärr-API:et ska inte kunna knyta enskilda svar till en användare.
	const { data, error } = await supabase
		.from('feedback_submissions')
		.select('id, created_at, experience, what_worked, unclear, missing, use_again, other')
		.order('created_at', { ascending: false })
		.limit(limit);

	if (isMissingSupabaseResourceError(error)) {
		return commandError(
			503,
			'Feedbacktabellen saknas ännu. Kör `supabase/feedback_submissions.sql` först.'
		);
	}

	if (error) {
		console.error('[remote][feedback.recent] kunde inte läsa feedback', error);
		return commandError(500, 'Kunde inte läsa feedbacken.');
	}

	const rows = (data ?? []) as FeedbackRow[];

	return commandOk({
		count: rows.length,
		limit,
		submissions: rows.map((row) => ({
			id: row.id,
			createdAt: row.created_at,
			experience: row.experience,
			whatWorked: row.what_worked,
			unclear: row.unclear,
			missing: row.missing,
			useAgain: row.use_again,
			other: row.other
		}))
	});
}

async function runCommand(
	supabase: SupabaseClient,
	command: RemoteCommandName,
	params: Record<string, unknown>
): Promise<CommandResult> {
	switch (command) {
		case 'status':
			return runStatus(supabase);
		case 'pages.list':
			return runPagesList(supabase, params);
		case 'pages.set-status':
			return runPagesSetStatus(supabase, params);
		case 'ab.list':
			return runAbList(supabase, params);
		case 'ab.winner':
			return runAbWinner(supabase, params);
		case 'feedback.recent':
			return runFeedbackRecent(supabase, params);
	}
}

// Svaren får aldrig cachas: de speglar aktuellt innehållsläge och skickas till
// en klient som autentiserat sig med en delad token.
const NO_STORE = { 'cache-control': 'no-store' };

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const auth = authorizeRemoteRequest(env.REMOTE_ADMIN_TOKEN, extractRemoteToken(request.headers));

	if (!auth.ok) {
		console.warn(`[remote] nekat anrop: ${auth.logReason}`);
		return json({ ok: false, error: auth.error }, { status: auth.status, headers: NO_STORE });
	}

	// Rate limit efter tokenkontrollen: en giltig operatör ska inte kunna låsas
	// ute av någon annans gissningsförsök från en annan IP.
	if (remoteLimiter.consume(`remote:${getClientAddress()}`)) {
		return json(
			{ ok: false, error: 'För många anrop. Försök igen om en stund.' },
			{ status: 429, headers: NO_STORE }
		);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Body måste vara giltig JSON.' }, { status: 400, headers: NO_STORE });
	}

	const parsed = parseRemoteCommand(body);
	if (!parsed.ok) {
		return json(
			{ ok: false, error: parsed.error, commands: REMOTE_COMMANDS },
			{ status: 400, headers: NO_STORE }
		);
	}

	const supabase = createServiceClient();
	if (!supabase) {
		console.error('[remote] service role-klienten kunde inte skapas');
		return json({ ok: false, error: 'Server configuration error.' }, { status: 500, headers: NO_STORE });
	}

	try {
		const result = await runCommand(supabase, parsed.command, parsed.params);
		return json(
			{ command: parsed.command, ...result.body },
			{ status: result.status, headers: NO_STORE }
		);
	} catch (err) {
		console.error(`[remote][${parsed.command}] oväntat fel`, err);
		return json({ ok: false, error: 'Kommandot kunde inte köras.' }, { status: 500, headers: NO_STORE });
	}
};
