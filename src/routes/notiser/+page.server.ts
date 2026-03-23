import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login?redirect=/notiser');
	}

	// Hämta de senaste 50 notiserna för användaren
	const { data: notifications } = await locals.supabase
		.from('notifications')
		.select('id, type, title, body, link, is_read, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(50);

	const { count: unreadCount } = await locals.supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.eq('is_read', false);

	return {
		title: 'Notiser',
		notifications: notifications ?? [],
		unreadCount: unreadCount ?? 0
	};
};
