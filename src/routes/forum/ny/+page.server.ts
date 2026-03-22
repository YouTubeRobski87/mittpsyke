import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const VALID_CATEGORY_IDS = new Set([
	'angest-och-oro',
	'nedstamdhet-och-tunga-dagar',
	'stress-och-utmattning',
	'somn-och-nattankar',
	'relationer-och-ensamhet',
	'sjalvkansla-och-sjalvkritik',
	'trauma-och-svara-upplevelser',
	'framsteg-och-ljusglimtar'
]);

type CategoryOption = { id: string; name: string; icon: string };

const FALLBACK_CATEGORIES: CategoryOption[] = [
	{ id: 'angest-och-oro', name: 'Ångest och oro', icon: '🌊' },
	{ id: 'nedstamdhet-och-tunga-dagar', name: 'Nedstämdhet och tunga dagar', icon: '🌧' },
	{ id: 'stress-och-utmattning', name: 'Stress och utmattning', icon: '🔋' },
	{ id: 'somn-och-nattankar', name: 'Sömn och nattankar', icon: '🌙' },
	{ id: 'relationer-och-ensamhet', name: 'Relationer och ensamhet', icon: '🤝' },
	{ id: 'sjalvkansla-och-sjalvkritik', name: 'Självkänsla och självkritik', icon: '🌱' },
	{ id: 'trauma-och-svara-upplevelser', name: 'Trauma och svåra upplevelser', icon: '🕊' },
	{ id: 'framsteg-och-ljusglimtar', name: 'Framsteg och ljusglimtar', icon: '✨' }
];

export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();

	if (!user) {
		throw redirect(303, `/login?redirect=/forum/ny${url.search ? url.search : ''}`);
	}

	const { data: catsData } = await locals.supabase
		.from('forum_categories')
		.select('id, name, icon')
		.order('sort_order', { ascending: true });

	const categories: CategoryOption[] =
		catsData && catsData.length > 0
			? catsData.map((c) => ({ id: String(c.id), name: String(c.name), icon: String(c.icon) }))
			: FALLBACK_CATEGORIES;

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('display_name')
		.eq('id', user.id)
		.maybeSingle();

	const preselectedCategory = url.searchParams.get('kategori') ?? '';

	return {
		title: 'Nytt inlägg',
		categories,
		preselectedCategory,
		displayName: typeof profile?.display_name === 'string' ? profile.display_name.trim() : null
	};
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const {
			data: { user }
		} = await locals.supabase.auth.getUser();

		if (!user) {
			return fail(401, { error: 'Du måste vara inloggad för att skriva.' });
		}

		const formData = await request.formData();
		const title = (formData.get('title') as string | null)?.trim() ?? '';
		const body = (formData.get('body') as string | null)?.trim() ?? '';
		const categoryId = (formData.get('category') as string | null)?.trim() ?? '';
		const isAnonymous = formData.get('anonymous') === 'on';

		// Validering
		if (title.length < 3) {
			return fail(400, {
				error: 'Rubriken måste vara minst 3 tecken.',
				title,
				body,
				categoryId,
				isAnonymous
			});
		}
		if (title.length > 200) {
			return fail(400, {
				error: 'Rubriken får vara högst 200 tecken.',
				title,
				body,
				categoryId,
				isAnonymous
			});
		}
		if (body.length < 10) {
			return fail(400, {
				error: 'Texten måste vara minst 10 tecken.',
				title,
				body,
				categoryId,
				isAnonymous
			});
		}
		if (!categoryId || !VALID_CATEGORY_IDS.has(categoryId)) {
			return fail(400, {
				error: 'Välj ett samtalsrum.',
				title,
				body,
				categoryId,
				isAnonymous
			});
		}

		// Hämta visningsnamn om inte anonym
		let displayName: string | null = null;
		if (!isAnonymous) {
			const { data: profile, error: profileError } = await locals.supabase
				.from('profiles')
				.select('display_name')
				.eq('id', user.id)
				.maybeSingle();

			if (profileError) {
				console.error('Forum ny: could not fetch display_name from profiles:', profileError);
			}

			displayName = typeof profile?.display_name === 'string' ? profile.display_name.trim() || null : null;

			// Fallback: använd det display_name som load-funktionen skickade med i formuläret
			if (!displayName) {
				const hiddenName = (formData.get('_displayName') as string | null)?.trim() ?? '';
				if (hiddenName.length > 0) {
					displayName = hiddenName;
				}
			}
		}

		const { data: thread, error: insertError } = await locals.supabase
			.from('forum_threads')
			.insert({
				category_id: categoryId,
				user_id: user.id,
				title,
				body,
				is_anonymous: isAnonymous,
				display_name: isAnonymous ? null : displayName
			})
			.select('id')
			.single();

		if (insertError) {
			console.error('Forum thread insert error:', insertError);
			if (insertError.code === 'PGRST205' || insertError.code === '42P01') {
				return fail(500, {
					error: 'Forumtabellen saknas. Kör supabase/forum.sql i Supabase SQL Editor.',
					title,
					body,
					categoryId,
					isAnonymous
				});
			}
			return fail(500, {
				error: 'Kunde inte spara inlägget just nu. Försök igen.',
				title,
				body,
				categoryId,
				isAnonymous
			});
		}

		throw redirect(303, `/forum/thread/${thread.id}`);
	}
};
