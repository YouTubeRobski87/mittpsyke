import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { loadCompanionDailyState } from '$lib/server/companion-daily-question';
import { loadEveningCheckinOverview } from '$lib/server/evening-checkin';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user || user.is_anonymous) {
		throw redirect(303, '/login?redirect=/dashboard/kvallsstugan');
	}

	const [companionDaily, eveningCheckin] = await Promise.all([
		loadCompanionDailyState(locals.supabase, user.id),
		loadEveningCheckinOverview(locals.supabase, user.id)
	]);

	return {
		// Samma additiva underlag som Mitt Hem redan läser för bond. Det används
		// enbart för ett lugnare urval av befintliga idle-beteenden i stugan.
		companionDaily,
		interiorMemory: eveningCheckin.interiorMemory,
		hasEveningCheckinToday: eveningCheckin.hasCheckinToday
	};
};
