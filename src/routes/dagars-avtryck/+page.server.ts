import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

type StorifyEntry = {
	id: string;
	content: string;
	tone: string | null;
	mood_emojis: string[] | null;
	created_at: string;
};

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, '/dagbok');
	}

	const { data: entries, error } = await locals.supabase
		.from('storify_entries')
		.select('id, content, tone, mood_emojis, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(10);

	if (error) {
		console.error('Fel vid hämtning av storify_entries:', error);
	}

	return {
		entries: (entries ?? []) as StorifyEntry[]
	};
};
