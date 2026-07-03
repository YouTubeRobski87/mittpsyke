import type { PageServerLoad } from './$types';
import { THEMES } from '$lib/theme';
import { readProgressCompanionFromMetadata } from '$lib/progressCompanion';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		return {
			isAnonymous: true,
			streak: { currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0 },
			milestones: { achieved: [], sections: [], nextMilestone: null, totalEntries: 0 },
			weeklyEntries: 0,
			entryCount: 0,
			activeDays: 0,
			growthScore: 0,
			growthLevel: 0,
			heatmapData: {},
			heatmapError: '',
			profileTheme: null,
			progressCompanion: null
		};
	}

	const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;

	return {
		isAnonymous: false,
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
			typeof userMetadata.profile_theme === 'string' && userMetadata.profile_theme in THEMES
				? userMetadata.profile_theme
				: null,
		progressCompanion: readProgressCompanionFromMetadata(userMetadata)
	};
};
