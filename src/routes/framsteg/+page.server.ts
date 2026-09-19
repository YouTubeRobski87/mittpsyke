import type { PageServerLoad } from './$types';
import { THEMES } from '$lib/theme';
import { getProgressInitialSceneSpot } from '$lib/progressCompanionPlacement';
import { getCompanionRelationshipStageForUser } from '$lib/server/companion-presence';
import { loadCompanionDailyState } from '$lib/server/companion-daily-question';
import { loadDiaryEntryCount } from '$lib/server/diary-entry-count';
import { loadDiaryActivityDays } from '$lib/server/diary-activity-days';
import { loadEveningPatternRows } from '$lib/server/evening-checkin';
import { syncWorldProgress } from '$lib/server/world-progress';
import { buildWorldPresence } from '$lib/world/worldStage';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	// Balders startplats väljs på servern och följer med till klienten. Den är
	// tidsberoende, och hydreringen kräver att server och klient är överens -
	// se getProgressInitialSceneSpot.
	const initialSceneSpotId = getProgressInitialSceneSpot().id;

	if (!user) {
		return {
			isAnonymous: true,
			initialSceneSpotId,
			accountCreatedAt: null,
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
			companionRelationshipStage: 0,
			diaryActivityDays: {},
			worldProgress: null,
			eveningPatternRows: []
		};
	}

	const userMetadata = (user.user_metadata ?? {}) as Record<string, unknown>;
	const [entryCount, companionDaily, diaryActivityDays, eveningPatternRows] = await Promise.all([
		loadDiaryEntryCount(locals.supabase, user.id),
		loadCompanionDailyState(locals.supabase, user.id),
		// Världens aktiva dagar: dagar med minst ett sparat inlägg, humör krävs inte.
		loadDiaryActivityDays(locals.supabase, user.id),
		// "Kvällar över tid". Egen dataväg, aldrig sammanblandad med dagbokens
		// humörvärden, och utan kvällens fritext.
		loadEveningPatternRows(locals.supabase, user.id)
	]);

	// Världens beständiga progression: det som redan vuxit fram låses aldrig
	// igen, och stadiet sjunker aldrig. Samma underlag som sidan räknar på.
	const reflectionCount = companionDaily?.answeredDayCount ?? 0;
	const worldProgress = await syncWorldProgress({
		supabase: locals.supabase,
		user,
		presence: buildWorldPresence({
			activityDays: diaryActivityDays,
			entryCount,
			reflectionCount,
			accountCreatedAt: user.created_at ?? null
		}),
		entryCount,
		reflectionCount
	});

	return {
		isAnonymous: false,
		initialSceneSpotId,
		// Kontots ålder är en av världens tidssignaler. Den läses här i stället
		// för via ett extra anrop; user finns redan.
		accountCreatedAt: user.created_at ?? null,
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
		companionRelationshipStage: await getCompanionRelationshipStageForUser(locals.supabase, user.id),
		companionDaily,
		diaryActivityDays,
		worldProgress,
		eveningPatternRows
	};
};
