import { json, type RequestHandler } from '@sveltejs/kit';

async function loadProfilePanelStats(supabase: App.Locals['supabase'], userId: string) {
	const [diaryCountResult, chatSessionCountResult] = await Promise.all([
		supabase.from('diary').select('id', { count: 'exact', head: true }).eq('user_id', userId),
		supabase
			.from('conversations')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', userId)
	]);

	if (diaryCountResult.error) {
		console.error('Layout summary diary count error:', diaryCountResult.error);
	}

	if (chatSessionCountResult.error) {
		console.error('Layout summary chat session count error:', chatSessionCountResult.error);
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
		console.error('Layout summary unread notifications error:', error);
		return 0;
	}

	return count ?? 0;
}

export const GET: RequestHandler = async ({ locals: { supabase } }) => {
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user) {
		return json({ profilePanel: null, unreadNotificationCount: 0 }, { status: 401 });
	}

	const [profilePanel, unreadNotificationCount] = await Promise.all([
		loadProfilePanelStats(supabase, user.id),
		loadUnreadNotificationCount(supabase, user.id)
	]);

	return json({ profilePanel, unreadNotificationCount });
};
