// src/routes/api/diary/heatmap/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader) return json({ error: 'Unauthorized' }, { status: 401 });

		const token = authHeader.replace('Bearer ', '');
		const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data, error: authError } = await supabase.auth.getUser(token);
		if (authError || !data?.user) return json({ error: 'Unauthorized' }, { status: 401 });
		const user = data.user;

		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 365);
		const startDateISO = startDate.toISOString().split('T')[0];
		const endDateISO = endDate.toISOString().split('T')[0];

		const { data: entries, error } = await supabase
			.from('diary')
			.select('created_at')
			.eq('user_id', user.id)
			.gte('created_at', startDateISO)
			.lte('created_at', endDateISO + 'T23:59:59Z')
			.order('created_at', { ascending: true });

		if (error) return json({ error: error.message }, { status: 500 });

		const heatmapData: { [date: string]: number } = {};
		if (entries && entries.length > 0) {
			entries.forEach((entry) => {
				const date = entry.created_at.split('T')[0];
				heatmapData[date] = (heatmapData[date] || 0) + 1;
			});
		}

		return json({ data: heatmapData, startDate: startDateISO, endDate: endDateISO, totalEntries: entries ? entries.length : 0 });
	} catch (err) {
		console.error('Heatmap error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
