import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { THEMES } from '$lib/theme';

type ProgressCompanion = 'dino' | 'fox' | 'turtle';

const PROGRESS_COMPANIONS = new Set<ProgressCompanion>(['dino', 'fox', 'turtle']);

function toProgressCompanion(value: unknown): ProgressCompanion | null {
	return typeof value === 'string' && PROGRESS_COMPANIONS.has(value as ProgressCompanion)
		? (value as ProgressCompanion)
		: null;
}

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

	if (!user) {
		throw redirect(303, '/login');
	}

	const userMetadata = user.user_metadata ?? {};

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
			typeof userMetadata.profile_theme === 'string' && userMetadata.profile_theme in THEMES
				? userMetadata.profile_theme
				: null,
		progressCompanion: toProgressCompanion(userMetadata.progress_companion)
	};
};
