import type { PageServerLoad } from './$types';
import { THEMES } from '$lib/theme';
import { readProgressCompanionFromMetadata } from '$lib/progressCompanion';
import { getCompanionRelationshipStageForUser } from '$lib/server/companion-presence';
import { loadCompanionDailyState } from '$lib/server/companion-daily-question';
import { loadDiaryEntryCount } from '$lib/server/diary-entry-count';

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
			progressCompanion: null,
			companionRelationshipStage: 0
		};
	}

	const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
	const [entryCount, companionDaily] = await Promise.all([
		loadDiaryEntryCount(locals.supabase, user.id),
		loadCompanionDailyState(locals.supabase, user.id)
	]);

	return {
		isAnonymous: false,
		streak: { currentStreak: 0, longestStreak: 0, lastEntryDate: null, lastEntryDaysAgo: 0 },
		milestones: { achieved: [], sections: [], nextMilestone: null, totalEntries: 0 },
		weeklyEntries: 0,
		entryCount,
		activeDays: 0,
		growthScore: 0,
		growthLevel: 0,
		heatmapData: {},
		heatmapError: '',
		profileTheme:
			typeof userMetadata.profile_theme === 'string' && userMetadata.profile_theme in THEMES
				? userMetadata.profile_theme
				: null,
		progressCompanion: readProgressCompanionFromMetadata(userMetadata),
		companionRelationshipStage: await getCompanionRelationshipStageForUser(locals.supabase, user.id),
		companionDaily
	};
};
