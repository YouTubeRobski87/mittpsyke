import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { THEMES } from '$lib/theme';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

	if (!user) {
		throw redirect(303, '/login');
	}

	return {
		streak: { currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0 },
		milestones: { achieved: [], sections: [], nextMilestone: null, totalEntries: 0 },
		weeklyEntries: 0,
		entryCount: 0,
		activeDays: 0,
		growthScore: 0,
		growthLevel: 0,
		heatmapData: {},
		heatmapError: '',
		profileTheme:
			typeof user.user_metadata?.profile_theme === 'string' &&
			user.user_metadata.profile_theme in THEMES
				? user.user_metadata.profile_theme
				: null
	};
};
