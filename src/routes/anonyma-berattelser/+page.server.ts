import { isMissingTableError } from '$lib/server/supabase-admin';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;
const SITE_URL = 'https://www.mittpsyke.se';

export type AnonymousStory = {
	id: string;
	content: string;
	age_range: string | null;
	gender: string | null;
	emotion_emoji: string | null;
	created_at: string | null;
	approved_at: string | null;
};

function truncateArticleBody(value: string) {
	const normalized = value.replace(/\s+/g, ' ').trim();
	return normalized.length > 160 ? `${normalized.slice(0, 157).trimEnd()}...` : normalized;
}

function asIsoDate(value: string | null) {
	if (!value) return undefined;
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function buildJsonLd(stories: AnonymousStory[], page: number) {
	return {
		'@context': 'https://schema.org',
		'@type': 'ItemList',
		itemListElement: stories.map((story, index) => ({
			'@type': 'ListItem',
			position: (page - 1) * PAGE_SIZE + index + 1,
			item: {
				'@type': 'Article',
				headline: 'Anonym berättelse om psykisk hälsa',
				articleBody: truncateArticleBody(story.content),
				datePublished: asIsoDate(story.approved_at),
				author: {
					'@type': 'Organization',
					name: 'Anonym'
				},
				publisher: {
					'@type': 'Organization',
					name: 'MittPsyke',
					url: SITE_URL
				}
			}
		}))
	};
}

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
			return {
				stories: [],
				jsonLd: buildJsonLd([], page),
				page,
				pageSize: PAGE_SIZE,
				total: 0,
				schemaMissing: true
			};
		}

		console.error('Anonymous stories load error:', error);
	}

	const stories = ((data ?? []) as AnonymousStory[]).filter((story) => story.content?.trim());

	return {
		stories,
		jsonLd: buildJsonLd(stories, page),
		page,
		pageSize: PAGE_SIZE,
		total: count ?? 0,
		schemaMissing: false
	};
};
