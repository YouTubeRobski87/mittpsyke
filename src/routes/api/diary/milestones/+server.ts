// src/routes/api/diary/milestones/+server.ts
import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
	import.meta.env.VITE_SUPABASE_URL,
	import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Milestone {
	entries: number;
	text: string;
	achieved: boolean;
	emoji: string;
}

interface MilestonesResponse {
	achieved: Milestone[];
	nextMilestone: Milestone & { entriesNeeded: number };
	totalEntries: number;
}

// Alla möjliga milstolpar
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

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Hämta user_id från session
		const {
			data: { session }
		} = await supabase.auth.getSession();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const userId = session.user.id;

		// Räkna antalet inlägg
		const { count, error } = await supabase
			.from('diary')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', userId);

		if (error) {
			console.error('Supabase error:', error);
			return json({ error: error.message }, { status: 500 });
		}

		const totalEntries = count || 0;

		// Bestäm vilka milstolpar som är uppnådda
		const achieved: Milestone[] = [];
		let nextMilestone: (Milestone & { entriesNeeded: number }) | null = null;

		for (const milestone of MILESTONES) {
			if (totalEntries >= milestone.entries) {
				achieved.push({
					entries: milestone.entries,
					text: milestone.text,
					achieved: true,
					emoji: milestone.emoji
				});
			} else if (!nextMilestone) {
				nextMilestone = {
					entries: milestone.entries,
					text: milestone.text,
					achieved: false,
					emoji: milestone.emoji,
					entriesNeeded: milestone.entries - totalEntries
				};
			}
		}

		// Om all milstolpar är uppnådda, sätt nästa till samma som den sista
		if (!nextMilestone && achieved.length > 0) {
			const lastMilestone = MILESTONES[MILESTONES.length - 1];
			nextMilestone = {
				entries: lastMilestone.entries * 2,
				text: `${lastMilestone.entries * 2} inlägg – Fortsätt så här!`,
				achieved: false,
				emoji: '✨',
				entriesNeeded: lastMilestone.entries * 2 - totalEntries
			};
		}

		const response: MilestonesResponse = {
			achieved,
			nextMilestone: nextMilestone || {
				entries: 1,
				text: 'Skriv ditt första inlägg!',
				achieved: false,
				emoji: '📝',
				entriesNeeded: 1
			},
			totalEntries
		};

		return json(response);
	} catch (err) {
		console.error('Milestones calculation error:', err);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
