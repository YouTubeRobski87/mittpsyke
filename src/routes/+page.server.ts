import { redirect } from '@sveltejs/kit';
import { normalizeSoroArticleSlug } from '$lib/server/soro-articles';
import { loadDiaryEntryCount } from '$lib/server/diary-entry-count';
import type { PageServerLoad } from './$types';

function cleanName(value: unknown): string | null {
	if (typeof value !== 'string') return null;
	const trimmed = value.trim();
	return trimmed && !trimmed.includes('@') ? trimmed : null;
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const legacyPost = url.searchParams.get('post');
	if (legacyPost) {
		const slug = normalizeSoroArticleSlug(legacyPost);
		if (slug) {
			throw redirect(308, `/blogg/${encodeURIComponent(slug)}`);
		}
		throw redirect(308, '/blogg');
	}

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (user && !user.is_anonymous) {
		const metadata = (user.user_metadata ?? {}) as Record<string, unknown>;

		return {
			title: 'Mitt hem',
			description: 'En lugn översikt över dina platser i MittPsyke.',
			isSignedInHome: true,
			homeOverview: {
				displayName:
					cleanName(metadata.display_name) ?? cleanName(metadata.full_name) ?? cleanName(metadata.name),
				entryCount: await loadDiaryEntryCount(locals.supabase, user.id)
			}
		};
	}

	return {
		title: 'Dagbok och reflektionsverktyg för ditt mående',
		description:
			'En kravlös digital dagbok för ditt mående. Skriv, gör en kvällsincheckning och se vad som återkommer över tid, utan streaks eller poäng. Inte vård eller akuthjälp.',
		isSignedInHome: false
	};
};
