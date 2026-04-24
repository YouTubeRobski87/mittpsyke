import type { LayoutServerLoad } from './$types';

type ProfilePanelStats = {
	diaryEntryCount: number;
	chatSessionCount: number;
};

type CachedLayoutData = {
	profilePanel: ProfilePanelStats;
	unreadNotificationCount: number;
	expiresAt: number;
};

const LAYOUT_DATA_CACHE_TTL_MS = 30_000;
const layoutDataCache = new Map<string, CachedLayoutData>();

async function loadProfilePanelStats(
	supabase: App.Locals['supabase'],
	userId: string
): Promise<ProfilePanelStats> {
	const [diaryCountResult, chatSessionCountResult] = await Promise.all([
		supabase.from('diary').select('id', { count: 'exact', head: true }).eq('user_id', userId),
		supabase
			.from('conversations')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
	]);

	if (diaryCountResult.error) {
		console.error('Layout profile panel diary count error:', diaryCountResult.error);
	}

	if (chatSessionCountResult.error) {
		console.error('Layout profile panel chat session count error:', chatSessionCountResult.error);
	}

	return {
		diaryEntryCount: diaryCountResult.count ?? 0,
		chatSessionCount: chatSessionCountResult.count ?? 0
	};
}

async function loadUnreadNotificationCount(
	supabase: App.Locals['supabase'],
	userId: string
): Promise<number> {
	const { count, error } = await supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.eq('is_read', false);

	if (error) {
		// Notiser är tilläggsfunktionalitet. Om tabellen saknas eller queryn fallerar,
		// håll resten av layouten fungerande.
		console.error('Layout unread notifications error:', error);
		return 0;
	}

	return count ?? 0;
}

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session) {
		return { session, profilePanel: null, unreadNotificationCount: 0 };
	}

	const now = Date.now();
	const cached = layoutDataCache.get(session.user.id);
	if (cached && cached.expiresAt > now) {
		return {
			session,
			profilePanel: cached.profilePanel,
			unreadNotificationCount: cached.unreadNotificationCount
		};
	}

	const [profilePanel, unreadNotificationCount] = await Promise.all([
		loadProfilePanelStats(supabase, session.user.id),
		loadUnreadNotificationCount(supabase, session.user.id)
	]);

	layoutDataCache.set(session.user.id, {
		profilePanel,
		unreadNotificationCount,
		expiresAt: now + LAYOUT_DATA_CACHE_TTL_MS
	});

	return { session, profilePanel, unreadNotificationCount };
};
