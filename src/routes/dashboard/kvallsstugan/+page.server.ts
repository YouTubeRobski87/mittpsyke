import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { readProgressCompanionFromMetadata } from '$lib/progressCompanion';
import { loadCompanionDailyState } from '$lib/server/companion-daily-question';

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
		),
		// Samma additiva underlag som Mitt Hem redan läser för bond. Det används
		// enbart för ett lugnare urval av befintliga idle-beteenden i stugan.
		companionDaily: await loadCompanionDailyState(locals.supabase, user.id)
	};
};
