// src/routes/api/diary/heatmap/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';


interface HeatmapData {
	[date: string]: number; // ISO 8601 format → antal inlägg
}

interface HeatmapResponse {
	data: HeatmapData;
	startDate: string;
	endDate: string;
	totalEntries: number;
}

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Hämta user_id från session
		const {
			data: { session }
		} = await locals.supabase.auth.getSession();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;

		// Beräkna datum 52 veckor bakåt
		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 365);

		const startDateISO = startDate.toISOString().split('T')[0];
		const endDateISO = endDate.toISOString().split('T')[0];

		// Hämta alla inlägg från senaste året
		const { data: entries, error } = await locals.supabase
			.from('diary')
			.select('date')
			.eq('user_id', userId)
			.gte('date', startDateISO)
			.lte('date', endDateISO)
			.order('date', { ascending: true });

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		// Skapa heatmap-data (datum → antal inlägg)
		const heatmapData: HeatmapData = {};

		if (entries && entries.length > 0) {
			// Gruppera inlägg per datum
			const groupedByDate: { [date: string]: number } = {};

			entries.forEach((entry) => {
				const date = entry.date; // Antar att detta är ISO format från Supabase
				groupedByDate[date] = (groupedByDate[date] || 0) + 1;
			});

			// Kopiera till heatmap
			Object.assign(heatmapData, groupedByDate);
		}

		const response: HeatmapResponse = {
			data: heatmapData,
			startDate: startDateISO,
			endDate: endDateISO,
			totalEntries: entries ? entries.length : 0
		};

		return json(response);
	} catch (err) {
		console.error('Heatmap calculation error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
