import { isMissingTableError } from '$lib/server/supabase-admin';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

export type AnonymousStory = {
	id: string;
	content: string;
	age_range: string | null;
	gender: string | null;
	emotion_emoji: string | null;
	created_at: string | null;
	approved_at: string | null;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const requestedPage = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const { data, count, error } = await locals.supabase
		.from('anonymous_stories')
		.select('id, content, age_range, gender, emotion_emoji, created_at, approved_at', {
			count: 'exact'
		})
		.eq('status', 'approved')
		.order('approved_at', { ascending: false, nullsFirst: false })
		.range(from, to);

	if (error) {
		if (isMissingTableError(error, 'anonymous_stories')) {
			return { stories: [], page, pageSize: PAGE_SIZE, total: 0, schemaMissing: true };
		}

		console.error('Anonymous stories load error:', error);
	}

	return {
		stories: ((data ?? []) as AnonymousStory[]).filter((story) => story.content?.trim()),
		page,
		pageSize: PAGE_SIZE,
		total: count ?? 0,
		schemaMissing: false
	};
};
