import { error, fail, redirect } from '@sveltejs/kit';
import { createServiceClient, isMissingTableError, isUuid } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

export type PendingStory = {
	id: string;
	content: string;
	age_range: string | null;
	gender: string | null;
	emotion_emoji: string | null;
	ai_flag_reason: string | null;
	status: 'pending' | 'approved' | 'rejected' | 'deleted';
	created_at: string | null;
};

const VISIBLE_STATUSES = ['pending', 'approved', 'rejected'] as const;
const STATUS_FILTERS = ['all', ...VISIBLE_STATUSES] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number];

function getStatusFilter(value: string | null): StatusFilter {
	return STATUS_FILTERS.includes(value as StatusFilter) ? (value as StatusFilter) : 'pending';
}

// Samma uppdelning som /admin: utloggad -> inloggning, obehörig -> 403.
async function requireAdmin(locals: App.Locals) {
	const user = await locals.getSession();

	if (!user) {
		throw redirect(303, '/login?redirect=/admin/stories');
	}

	if (!user.is_super_admin) {
		throw error(403, 'Du är inloggad men har inte behörighet att moderera berättelser.');
	}

	return user;
}

/**
 * Grind för form actions. Returnerar antingen användaren eller en
 * ActionFailure som anroparen MÅSTE returnera vidare.
 *
 * Anroparen kontrollerar `'status' in admin`, inte `'error' in admin`.
 * `fail()` ger en ActionFailure med bara `status` och `data`; felmeddelandet
 * ligger i `data.error`, inte på toppnivå. Ett `'error' in`-test är därför
 * alltid falskt och släpper igenom både utloggade och icke-admins - och
 * eftersom actions körs före `load` skyddar `requireAdmin` där inte POST.
 * Skrivningen sker dessutom med service role, som kringgår RLS.
 */
async function ensureAdmin(locals: App.Locals) {
	const user = await locals.getSession();

	if (!user) {
		return fail(401, { error: 'Du behöver logga in igen.' });
	}

	if (!user.is_super_admin) {
		return fail(403, { error: 'Åtkomst nekad.' });
	}

	return user;
}

function getAdminClient(locals: App.Locals) {
	return createServiceClient() ?? locals.supabase;
}

export const load: PageServerLoad = async ({ locals, url }) => {
	await requireAdmin(locals);

	const statusFilter = getStatusFilter(url.searchParams.get('status'));
	const query = getAdminClient(locals)
		.from('anonymous_stories')
		.select('id, content, age_range, gender, emotion_emoji, ai_flag_reason, status, created_at')
		.order('created_at', { ascending: true });

	const { data, error } =
		statusFilter === 'all' ? await query.in('status', VISIBLE_STATUSES) : await query.eq('status', statusFilter);

	if (error) {
		if (isMissingTableError(error, 'anonymous_stories')) {
			return {
				stories: [],
				statusFilter,
				schemaError: 'Tabellen anonymous_stories saknas. Kör migrationen i Supabase först.'
			};
		}

		console.error('Admin stories load error:', error);
		return { stories: [], statusFilter, schemaError: 'Berättelser kunde inte hämtas just nu.' };
	}

	return { stories: (data ?? []) as PendingStory[], statusFilter, schemaError: null };
};

export const actions: Actions = {
	approve: async ({ locals, request }) => {
		const admin = await ensureAdmin(locals);
		if ('status' in admin) return admin;

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		if (!isUuid(id)) {
			return fail(400, { error: 'Ogiltigt id.' });
		}

		const { error } = await getAdminClient(locals)
			.from('anonymous_stories')
			.update({ status: 'approved', approved_at: new Date().toISOString() })
			.eq('id', id);

		if (error) {
			console.error('Approve story error:', error);
			return fail(500, { error: 'Berättelsen kunde inte godkännas.' });
		}

		return { success: 'Berättelsen godkändes.' };
	},
	reject: async ({ locals, request }) => {
		const admin = await ensureAdmin(locals);
		if ('status' in admin) return admin;

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		if (!isUuid(id)) {
			return fail(400, { error: 'Ogiltigt id.' });
		}

		const { error } = await getAdminClient(locals)
			.from('anonymous_stories')
			.update({ status: 'rejected', approved_at: null })
			.eq('id', id);

		if (error) {
			console.error('Reject story error:', error);
			return fail(500, { error: 'Berättelsen kunde inte avvisas.' });
		}

		return { success: 'Berättelsen avvisades.' };
	},
	delete: async ({ locals, request }) => {
		const admin = await ensureAdmin(locals);
		if ('status' in admin) return admin;

		const form = await request.formData();
		const id = String(form.get('id') ?? '');

		if (!isUuid(id)) {
			return fail(400, { error: 'Ogiltigt id.' });
		}

		const { data, error } = await getAdminClient(locals)
			.from('anonymous_stories')
			.update({ status: 'deleted', approved_at: null })
			.eq('id', id)
			.select('id')
			.maybeSingle();

		if (error) {
			console.error('Delete story error:', error);
			return fail(500, { error: 'Berättelsen kunde inte raderas.' });
		}

		if (!data) {
			return fail(404, { error: 'Berättelsen finns inte längre.' });
		}

		return { success: 'Berättelsen raderades.' };
	}
};
