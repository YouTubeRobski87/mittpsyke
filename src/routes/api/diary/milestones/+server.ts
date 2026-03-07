// src/routes/api/diary/milestones/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';

const MILESTONES = [
	{ entries: 1, text: 'Din första dagboksanteckning', emoji: '📝' },
	{ entries: 3, text: 'Du börjar hitta en rytm', emoji: '🎵' },
	{ entries: 5, text: '5 inlägg – Du är på vägen!', emoji: '🚀' },
	{ entries: 10, text: '10 inlägg – Stark början', emoji: '💪' },
	{ entries: 25, text: '25 inlägg – En vanlig journalist!', emoji: '📖' },
	{ entries: 50, text: '50 inlägg – Hälften till 100!', emoji: '🔥' },
	{ entries: 100, text: '100 inlägg – Miljon tankar sparade', emoji: '🌟' },
	{ entries: 365, text: 'Ett helt år – Du är otrolig!', emoji: '🎉' }
];

export const GET: RequestHandler = async ({ request }) => {
	try {
		const authHeader = request.headers.get('Authorization');
		if (!authHeader) return json({ error: 'Unauthorized' }, { status: 401 });

		const token = authHeader.replace('Bearer ', '');
		const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
			global: { headers: { Authorization: `Bearer ${token}` } }
		});

		const { data: { user } } = await supabase.auth.getUser(token);
		if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

		const { count, error } = await supabase
			.from('diary')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.id);

		if (error) return json({ error: error.message }, { status: 500 });

		const totalEntries = count || 0;
		const achieved = [];
		let nextMilestone = null;

		for (const milestone of MILESTONES) {
			if (totalEntries >= milestone.entries) {
				achieved.push({ ...milestone, achieved: true });
			} else if (!nextMilestone) {
				nextMilestone = { ...milestone, achieved: false, entriesNeeded: milestone.entries - totalEntries };
			}
		}

		if (!nextMilestone && achieved.length > 0) {
			const last = MILESTONES[MILESTONES.length - 1];
			nextMilestone = { entries: last.entries * 2, text: `${last.entries * 2} inlägg – Fortsätt så här!`, achieved: false, emoji: '✨', entriesNeeded: last.entries * 2 - totalEntries };
		}

		return json({
			achieved,
			nextMilestone: nextMilestone || { entries: 1, text: 'Skriv ditt första inlägg!', achieved: false, emoji: '📝', entriesNeeded: 1 },
			totalEntries
		});
	} catch (err) {
		console.error('Milestones error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};