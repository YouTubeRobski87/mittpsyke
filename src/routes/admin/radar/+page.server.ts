import { fail, redirect } from '@sveltejs/kit';
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

const RADAR_ADMIN_USER_IDS = new Set(['f4f107ef-461a-4090-bc2f-6ddccc0cc64d']);
const RADAR_ADMIN_EMAILS = new Set(['rbsthh@gmail.com']);

function getAdminClient(locals: App.Locals) {
	return createServiceClient() ?? locals.supabase;
}

function isRadarAdmin(user: Awaited<ReturnType<App.Locals['getSession']>>) {
	if (!user) return false;
	const email = user.email?.trim().toLowerCase() ?? '';
	return Boolean(
		user.is_super_admin ||
		RADAR_ADMIN_USER_IDS.has(user.id) ||
		RADAR_ADMIN_EMAILS.has(email)
	);
}

async function requireAdmin(locals: App.Locals) {
	const user = await locals.getSession();
	if (!user) throw redirect(303, '/login?redirect=/admin/radar');
	if (!isRadarAdmin(user)) throw redirect(303, '/?admin=denied');
	return user;
}

async function ensureAdmin(locals: App.Locals) {
	const user = await locals.getSession();
	if (!user) return fail(401, { error: 'Du behöver logga in igen.' });
	if (!isRadarAdmin(user)) return fail(403, { error: 'Åtkomst nekad.' });
	return user;
}

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals);
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