import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

type HeatmapData = Record<string, number>;

function getGrowthLevel(entryCount: number) {
	let growthLevel = 0;
	if (entryCount >= 1) growthLevel = 1;
	if (entryCount >= 6) growthLevel = 2;
	if (entryCount >= 16) growthLevel = 3;
	if (entryCount >= 31) growthLevel = 4;
	return growthLevel;
}

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
		const yearAgoIso = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

		const [{ count }, diaryEntriesQuery] = await Promise.all([
			locals.supabase
			.from('diary')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id)
			.gte('created_at', weekStart),
			locals.supabase
				.from('diary')
				.select('created_at')
				.eq('user_id', user.id)
				.order('created_at', { ascending: true })
		]);

		const heatmapData: HeatmapData = {};
		let heatmapError = '';
		let entryCount = 0;
		let activeDays = 0;
		let growthScore = 0;
		let growthLevel = 0;

		if (diaryEntriesQuery.error) {
			console.error('Framsteg heatmap load error:', diaryEntriesQuery.error);
			heatmapError = 'Aktivitetskartan kunde inte laddas just nu.';
		} else {
			const activeDaySet = new Set<string>();

			for (const entry of diaryEntriesQuery.data ?? []) {
				const createdAt = typeof entry.created_at === 'string' ? entry.created_at : '';
				if (!createdAt) continue;
				const day = createdAt.split('T')[0];
				if (!day) continue;

				entryCount += 1;
				activeDaySet.add(day);

				if (createdAt >= yearAgoIso) {
					heatmapData[day] = (heatmapData[day] ?? 0) + 1;
				}
			}

			activeDays = activeDaySet.size;
			growthScore = entryCount + activeDays * 3;
			growthLevel = getGrowthLevel(entryCount);
		}

		return {
			streak,
			milestones,
			weeklyEntries: count ?? 0,
			entryCount,
			activeDays,
			growthScore,
			growthLevel,
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
			entryCount: 0,
			activeDays: 0,
			growthScore: 0,
			growthLevel: 0,
			heatmapData: {},
			heatmapError: 'Aktivitetskartan kunde inte laddas just nu.',
			profileTheme: null
		};
	}
};
