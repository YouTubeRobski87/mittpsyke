import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

type HeatmapData = Record<string, number>;

export const load: PageServerLoad = async ({ locals, fetch }) => {
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

	if (!user) {
		throw redirect(303, '/login');
	}

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

		const [{ count }, heatmapQuery] = await Promise.all([
			locals.supabase
			.from('diary')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.gte('created_at', weekStart),
			locals.supabase
				.from('diary')
				.select('created_at')
				.eq('user_id', user.id)
				.gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
				.order('created_at', { ascending: true })
		]);

		const heatmapData: HeatmapData = {};
		let heatmapError = '';

		if (heatmapQuery.error) {
			console.error('Framsteg heatmap load error:', heatmapQuery.error);
			heatmapError = 'Aktivitetskartan kunde inte laddas just nu.';
		} else {
			for (const entry of heatmapQuery.data ?? []) {
				const createdAt = typeof entry.created_at === 'string' ? entry.created_at : '';
				if (!createdAt) continue;
				const day = createdAt.split('T')[0];
				if (!day) continue;
				heatmapData[day] = (heatmapData[day] ?? 0) + 1;
			}
		}

		return {
			streak,
			milestones,
			weeklyEntries: count ?? 0,
			heatmapData,
			heatmapError,
			profileTheme:
				typeof user.user_metadata?.profile_theme === 'string'
					? user.user_metadata.profile_theme
					: null
		};
	} catch (err) {
		console.error('Framsteg load error:', err);
		return {
			streak: null,
			milestones: null,
			weeklyEntries: 0,
			heatmapData: {},
			heatmapError: 'Aktivitetskartan kunde inte laddas just nu.',
			profileTheme: null
		};
	}
};
