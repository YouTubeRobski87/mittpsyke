import { fail, redirect } from '@sveltejs/kit';
import { createServiceClient, isMissingTableError, isUuid } from '$lib/server/supabase-admin';
import type { Actions, PageServerLoad } from './$types';

export type PendingStory = {
	id: string;
	content: string;
	age_range: string | null;
	gender: string | null;
	emotion_emoji: string | null;
	ai_flag_reason: string | null;
	created_at: string | null;
};

async function requireAdmin(locals: App.Locals) {
	const user = await locals.getSession();

	if (!user?.is_super_admin) {
		throw redirect(303, '/');
	}

	return user;
}

async function ensureAdmin(locals: App.Locals) {
	const user = await locals.getSession();

	if (!user?.is_super_admin) {
		return fail(403, { error: 'Åtkomst nekad.' });
	}

	return user;
}

function getAdminClient(locals: App.Locals) {
	return createServiceClient() ?? locals.supabase;
}

export const load: PageServerLoad = async ({ locals }) => {
	await requireAdmin(locals);

	const { data, error } = await getAdminClient(locals)
		.from('anonymous_stories')
		.select('id, content, age_range, gender, emotion_emoji, ai_flag_reason, created_at')
		.eq('status', 'pending')
		.order('created_at', { ascending: true });

	if (error) {
		if (isMissingTableError(error, 'anonymous_stories')) {
			return {
				stories: [],
				schemaError: 'Tabellen anonymous_stories saknas. Kör migrationen i Supabase först.'
			};
		}

		console.error('Admin stories load error:', error);
		return { stories: [], schemaError: 'Berättelser kunde inte hämtas just nu.' };
	}

	return { stories: (data ?? []) as PendingStory[], schemaError: null };
};

export const actions: Actions = {
	approve: async ({ locals, request }) => {
		const admin = await ensureAdmin(locals);
		if ('error' in admin) return admin;

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
		if ('error' in admin) return admin;

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
	}
};
