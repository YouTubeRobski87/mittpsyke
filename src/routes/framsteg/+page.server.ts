import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const { data: { user } } = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/login');
	}

	const { data: { session } } = await locals.supabase.auth.getSession();
	const token = session?.access_token;

	if (!token) {
		throw redirect(303, '/login');
	}

	const headers = { Authorization: `Bearer ${token}` };

	try {
		const [streakRes, milestonesRes] = await Promise.all([
			fetch('/api/diary/streak', { headers }),
			fetch('/api/diary/milestones', { headers })
		]);

		const streak = streakRes.ok ? await streakRes.json() : null;
		const milestones = milestonesRes.ok ? await milestonesRes.json() : null;

		// Fetch this week's entry count for the weekly summary
		const now = new Date();
		const dayOfWeek = now.getDay(); // 0=Sun
		const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
		const monday = new Date(now);
		monday.setDate(now.getDate() + mondayOffset);
		monday.setHours(0, 0, 0, 0);
		const weekStart = monday.toISOString();

		const { count } = await locals.supabase
			.from('diary')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.gte('created_at', weekStart);

		return { streak, milestones, weeklyEntries: count ?? 0 };
	} catch (err) {
		console.error('Framsteg load error:', err);
		return { streak: null, milestones: null, weeklyEntries: 0 };
	}
};
