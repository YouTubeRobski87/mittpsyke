import { error, fail, redirect } from '@sveltejs/kit';
import { createServiceClient, isMissingTableError, isUuid } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

type RadarStatus = 'new' | 'reviewed' | 'approved' | 'ignored' | 'article_idea' | 'development_task';

const RADAR_STATUSES: RadarStatus[] = [
	'new',
	'reviewed',
	'approved',
	'ignored',
	'article_idea',
	'development_task'
];

function getAdminClient(locals: App.Locals) {
	return createServiceClient() ?? locals.supabase;
}

async function checkRadarAdmin(locals: App.Locals, pathname: string) {
	const user = await locals.getSession();
	const serviceClient = createServiceClient();
	const sessionIsAdmin = user?.is_super_admin === true;
	let adminLookup: 'not_run' | 'found' | 'missing' | 'error' = 'not_run';

	if (user && serviceClient) {
		const { data, error: lookupError } = await serviceClient.auth.admin.getUserById(user.id);
		adminLookup = lookupError ? 'error' : data.user ? 'found' : 'missing';
	}

	// Tillfällig diagnostik för Render. Inga nycklar, tokenvärden eller cookieinnehåll loggas.
	console.info('[radar-admin-auth]', {
		pathname,
		hasSession: Boolean(user),
		userId: user?.id ?? null,
		userEmail: user?.email ?? null,
		isSuperAdmin: user?.is_super_admin ?? false,
		serviceClientCreated: Boolean(serviceClient),
		adminGetUserById: adminLookup,
		failedCheck: !user ? 'missing_session' : !sessionIsAdmin ? 'not_super_admin' : null
	});

	return { user, isAdmin: sessionIsAdmin };
}

async function requireAdmin(locals: App.Locals, pathname: string) {
	const { user, isAdmin } = await checkRadarAdmin(locals, pathname);
	if (!user) throw redirect(303, '/login?redirect=/admin/radar');
	if (!isAdmin) throw error(403, 'Du är inloggad men har inte behörighet till Radar.');
	return user;
}

async function ensureAdmin(locals: App.Locals) {
	const { user, isAdmin } = await checkRadarAdmin(locals, '/admin/radar (action)');
	if (!user) return fail(401, { error: 'Du behöver logga in igen.' });
	if (!isAdmin) return fail(403, { error: 'Du har inte behörighet till Radar.' });
	return user;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireAdmin(locals, url.pathname);
	const admin = getAdminClient(locals);

	const [findingsResult, sourcesResult, runsResult] = await Promise.all([
		admin
			.from('radar_findings')
			.select(
				'id, title, url, provider, published_at, category, summary, why_it_matters, recommended_action, relevance_score, confidence_score, status, source_is_official'
			)
			.order('discovered_at', { ascending: false })
			.limit(100),
		admin
			.from('radar_sources')
			.select('id, name, provider, category, enabled, is_official, last_checked_at')
			.order('provider'),
		admin
			.from('radar_runs')
			.select(
				'id, started_at, finished_at, status, sources_checked, candidates_found, findings_saved, error_message'
			)
			.order('started_at', { ascending: false })
			.limit(10)
	]);

	const error = findingsResult.error ?? sourcesResult.error ?? runsResult.error;
	if (error) {
		if (isMissingTableError(error, 'radar_findings')) {
			return { findings: [], sources: [], runs: [], schemaError: 'Radar-tabellerna saknas ännu.' };
		}

		console.error('Admin radar load error:', error);
		return { findings: [], sources: [], runs: [], schemaError: 'Radarn kunde inte hämtas just nu.' };
	}

	return {
		findings: findingsResult.data ?? [],
		sources: sourcesResult.data ?? [],
		runs: runsResult.data ?? [],
		schemaError: null
	};
};

export const actions: Actions = {
	setStatus: async ({ locals, request }) => {
		const adminUser = await ensureAdmin(locals);
		if ('status' in adminUser) return adminUser;

		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const status = String(form.get('status') ?? '') as RadarStatus;

		if (!isUuid(id) || !RADAR_STATUSES.includes(status)) {
			return fail(400, { error: 'Fyndet eller statusen är inte giltig.' });
		}

		const { error } = await getAdminClient(locals)
			.from('radar_findings')
			.update({ status })
			.eq('id', id);

		if (error) {
			console.error('Radar status update error:', error);
			return fail(500, { error: 'Statusen kunde inte sparas.' });
		}

		return { success: 'Statusen sparades.' };
	}
};
