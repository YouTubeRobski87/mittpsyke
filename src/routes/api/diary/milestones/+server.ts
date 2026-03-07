// src/routes/api/diary/milestones/+server.ts
import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { RequestHandler } from '@sveltejs/kit';

const MILESTONES = [
	{ entries: 1, text: 'Din fÃ¶rsta dagboksanteckning', emoji: 'ðŸ“' },
	{ entries: 3, text: 'Du bÃ¶rjar hitta en rytm', emoji: 'ðŸŽµ' },
	{ entries: 5, text: '5 inlÃ¤gg â€“ Du Ã¤r pÃ¥ vÃ¤gen!', emoji: 'ðŸš€' },
	{ entries: 10, text: '10 inlÃ¤gg â€“ Stark bÃ¶rjan', emoji: 'ðŸ’ª' },
	{ entries: 25, text: '25 inlÃ¤gg â€“ En vanlig journalist!', emoji: 'ðŸ“–' },
	{ entries: 50, text: '50 inlÃ¤gg â€“ HÃ¤lften till 100!', emoji: 'ðŸ”¥' },
	{ entries: 100, text: '100 inlÃ¤gg â€“ Miljon tankar sparade', emoji: 'ðŸŒŸ' },
	{ entries: 365, text: 'Ett helt Ã¥r â€“ Du Ã¤r otrolig!', emoji: 'ðŸŽ‰' }
];

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
			nextMilestone = { entries: last.entries * 2, text: `${last.entries * 2} inlÃ¤gg â€“ FortsÃ¤tt sÃ¥ hÃ¤r!`, achieved: false, emoji: 'âœ¨', entriesNeeded: last.entries * 2 - totalEntries };
		}

		return json({
			achieved,
			nextMilestone: nextMilestone || { entries: 1, text: 'Skriv ditt fÃ¶rsta inlÃ¤gg!', achieved: false, emoji: 'ðŸ“', entriesNeeded: 1 },
			totalEntries
		});
	} catch (err) {
		console.error('Milestones error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
