import { redirect } from '@sveltejs/kit';
import { normalizeSoroArticleSlug } from '$lib/server/soro-articles';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const legacyPost = url.searchParams.get('post');
	if (legacyPost) {
		const slug = normalizeSoroArticleSlug(legacyPost);
		if (slug) {
			throw redirect(308, `/blogg/${encodeURIComponent(slug)}`);
		}
		throw redirect(308, '/blogg');
	}

	// Startsidans copy är skriven för den som ännu inte har en plats här
	// ("Skapa din plats", "Skriv först, utan konto"). Den som redan är inloggad
	// har den platsen, och skickas till Mitt Hem innan sidan hinner renderas.
	//
	// Gästsessioner räknas inte som inloggade: hela poängen med att kunna skriva
	// utan konto är att startsidan ska finnas kvar för dem. Samma bedömning som
	// i /api/evening-checkins och Kvällsstugan.
	//
	// Ligger efter legacy-redirecten ovan, så att en delad ?post-länk fortsätter
	// leda till artikeln även för inloggade.
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (user && !user.is_anonymous) {
		throw redirect(303, '/dashboard');
	}

	return {
		title: 'En lugn plats att återvända till',
		description:
			'MittPsyke är en personlig plats för självreflektion. Skriv, checka in och följ hur du har det över tid – i din takt, med eller utan konto. Inte vård, behandling eller akuthjälp.'
	};
};
