// src/routes/api/diary/heatmap/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import type { RequestHandler } from '@sveltejs/kit';

const HEATMAP_CACHE_TTL_MS = 60 * 1000;
const HEATMAP_ROW_LIMIT = 1000;

type HeatmapResponse = {
	data: { [date: string]: number };
	startDate: string;
	endDate: string;
	totalEntries: number;
};

const heatmapCache = new Map<string, { expiresAt: number; value: HeatmapResponse }>();

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader) return json({ error: 'Unauthorized' }, { status: 401 });

		const token = authHeader.replace('Bearer ', '');
		const supabase = createClient(env.PUBLIC_SUPABASE_URL ?? '', env.PUBLIC_SUPABASE_ANON_KEY ?? '', {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data, error: authError } = await supabase.auth.getUser(token);
		if (authError || !data?.user) return json({ error: 'Unauthorized' }, { status: 401 });
		const user = data.user;
		const cached = heatmapCache.get(user.id);
		if (cached && cached.expiresAt > Date.now()) {
			return json(cached.value);
		}

		const endDate = new Date();
		const startDate = new Date();
		startDate.setDate(startDate.getDate() - 365);
		const startDateISO = startDate.toISOString().split('T')[0];
		const endDateISO = endDate.toISOString().split('T')[0];

		// Try diary table first
		let { data: entries, error } = await supabase
			.from('diary')
			.select('created_at')
			.eq('user_id', user.id)
			.gte('created_at', startDateISO)
			.lte('created_at', endDateISO + 'T23:59:59Z')
			.order('created_at', { ascending: true })
			.limit(HEATMAP_ROW_LIMIT);

		// Fallback to journal_entries if diary table doesn't exist
		const tableMissing =
			error?.code === 'PGRST205' ||
			error?.code === '42P01' ||
			(error?.message ?? '').includes("diary");

		if (tableMissing) {
			const fallback = await supabase
				.from('journal_entries')
				.select('created_at')
				.eq('user_id', user.id)
				.gte('created_at', startDateISO)
				.lte('created_at', endDateISO + 'T23:59:59Z')
				.order('created_at', { ascending: true })
				.limit(HEATMAP_ROW_LIMIT);
			entries = fallback.data;
			error = fallback.error;
		}

		if (error) return json({ error: error.message }, { status: 500 });

		const heatmapData: { [date: string]: number } = {};
		if (entries && entries.length > 0) {
			entries.forEach((entry) => {
				const date = entry.created_at.split('T')[0];
				heatmapData[date] = (heatmapData[date] || 0) + 1;
			});
		}

		const value = {
			data: heatmapData,
			startDate: startDateISO,
			endDate: endDateISO,
			totalEntries: entries ? entries.length : 0
		};
		heatmapCache.set(user.id, { expiresAt: Date.now() + HEATMAP_CACHE_TTL_MS, value });
		return json(value);
	} catch (err) {
		console.error('Heatmap error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
