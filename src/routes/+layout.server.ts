import type { LayoutServerLoad } from './$types';

type ProfilePanelStats = {
	diaryEntryCount: number;
	chatSessionCount: number;
};

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

export const load: LayoutServerLoad = async ({ locals: { supabase } }) => {
	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session) {
		return { session, profilePanel: null };
	}

	const profilePanel = await loadProfilePanelStats(supabase, session.user.id);

	return { session, profilePanel };
};
