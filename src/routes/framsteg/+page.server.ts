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

		return { streak, milestones };
	} catch (err) {
		console.error('Framsteg load error:', err);
		return { streak: null, milestones: null };
	}
};
