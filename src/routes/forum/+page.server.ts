import type { PageServerLoad } from './$types';
import type { ForumCategoryRecord } from '$lib/types';

const FALLBACK_CATEGORIES: ForumCategoryRecord[] = [
	{ id: 'angest-och-oro', name: 'Ångest och oro', description: 'Ett rum för dig som brottas med ångest, oro eller rastlöshet. Dela din upplevelse och hitta igenkänning.', icon: '🌊', sort_order: 1, created_at: '' },
	{ id: 'nedstamdhet-och-tunga-dagar', name: 'Nedstämdhet och tunga dagar', description: 'Här kan du dela hur det är när tillvaron känns tung. Du behöver inte ha svar – bara närvaro.', icon: '🌧', sort_order: 2, created_at: '' },
	{ id: 'stress-och-utmattning', name: 'Stress och utmattning', description: 'För dig som är trött på att vara trött. Dela vad stress gör med dig och lyssna på andras erfarenheter.', icon: '🔋', sort_order: 3, created_at: '' },
	{ id: 'somn-och-nattankar', name: 'Sömn och nattankar', description: 'Nätterna kan vara långa. Dela tankar som håller dig vaken eller hur sömnsvårigheter påverkar dig.', icon: '🌙', sort_order: 4, created_at: '' },
	{ id: 'relationer-och-ensamhet', name: 'Relationer och ensamhet', description: 'Om längtan efter kontakt, svårigheter i relationer eller känslan av att vara ensam.', icon: '🤝', sort_order: 5, created_at: '' },
	{ id: 'sjalvkansla-och-sjalvkritik', name: 'Självkänsla och självkritik', description: 'För tankar om att inte räcka till, inre kritik och resan mot att vara snällare mot sig själv.', icon: '🌱', sort_order: 6, created_at: '' },
	{ id: 'trauma-och-svara-upplevelser', name: 'Trauma och svåra upplevelser', description: 'Ett varsamt rum för dig som bär på svåra minnen eller upplevelser. Dela i din egen takt.', icon: '🕊', sort_order: 7, created_at: '' },
	{ id: 'framsteg-och-ljusglimtar', name: 'Framsteg och ljusglimtar', description: 'Dela det som gått bättre, stora som små. Igenkänning och hopp är också en del av hälsa.', icon: '✨', sort_order: 8, created_at: '' }
];

function isMissingTableError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!error) return false;
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

export const load: PageServerLoad = async ({ locals }) => {
	const { data: categoriesData, error: categoriesError } = await locals.supabase
		.from('forum_categories')
		.select('id, name, description, icon, sort_order, created_at')
		.order('sort_order', { ascending: true });

	let categories: ForumCategoryRecord[] = [];

	if (categoriesError && !isMissingTableError(categoriesError, 'forum_categories')) {
		console.error('Forum categories load error:', categoriesError);
	} else if (categoriesData && categoriesData.length > 0) {
		categories = categoriesData as ForumCategoryRecord[];
	}

	if (categories.length === 0) {
		categories = FALLBACK_CATEGORIES;
	}

	// Hämta trådantal per samtalsrum
	const threadCounts: Record<string, number> = {};
	const { data: countData } = await locals.supabase
		.from('forum_threads')
		.select('category_id')
		.is('deleted_at', null)
		.eq('is_hidden', false);

	if (countData) {
		for (const row of countData) {
			if (typeof row.category_id === 'string') {
				threadCounts[row.category_id] = (threadCounts[row.category_id] ?? 0) + 1;
			}
		}
	}

	return {
		title: 'Forum – Samtalsrum för psykisk hälsa',
		description: 'Dela tankar och hitta igenkänning i MittPsykes forum. Lugna samtalsrum om ångest, stress, sömn, relationer och mer. Skriv anonymt eller med namn.',
		categories,
		threadCounts
	};
};
