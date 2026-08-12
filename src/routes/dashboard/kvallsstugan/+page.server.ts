import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { readProgressCompanionFromMetadata } from '$lib/progressCompanion';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user || user.is_anonymous) {
		throw redirect(303, '/login');
	}

	return {
		progressCompanion: readProgressCompanionFromMetadata(
			(user.user_metadata ?? {}) as Record<string, unknown>
		)
	};
};
