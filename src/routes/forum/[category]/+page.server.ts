import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const FALLBACK_CATEGORIES: Record<string, { name: string; description: string; icon: string }> = {
	'angest-och-oro': { name: 'Ångest och oro', description: 'Ett rum för dig som brottas med ångest, oro eller rastlöshet.', icon: '🌊' },
	'nedstamdhet-och-tunga-dagar': { name: 'Nedstämdhet och tunga dagar', description: 'Här kan du dela hur det är när tillvaron känns tung.', icon: '🌧' },
	'stress-och-utmattning': { name: 'Stress och utmattning', description: 'För dig som är trött på att vara trött.', icon: '🔋' },
	'somn-och-nattankar': { name: 'Sömn och nattankar', description: 'Nätterna kan vara långa.', icon: '🌙' },
	'relationer-och-ensamhet': { name: 'Relationer och ensamhet', description: 'Om längtan efter kontakt, svårigheter i relationer eller känslan av att vara ensam.', icon: '🤝' },
	'sjalvkansla-och-sjalvkritik': { name: 'Självkänsla och självkritik', description: 'För tankar om att inte räcka till och inre kritik.', icon: '🌱' },
	'trauma-och-svara-upplevelser': { name: 'Trauma och svåra upplevelser', description: 'Ett varsamt rum för dig som bär på svåra minnen.', icon: '🕊' },
	'framsteg-och-ljusglimtar': { name: 'Framsteg och ljusglimtar', description: 'Dela det som gått bättre, stora som små.', icon: '✨' }
};

function isMissingTableError(
	err: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!err) return false;
	return (
		err.code === 'PGRST205' ||
		err.code === '42P01' ||
		(err.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const { category } = params;

	// Hämta kategoriinfo
	const { data: catData, error: catError } = await locals.supabase
		.from('forum_categories')
		.select('id, name, description, icon, sort_order')
		.eq('id', category)
		.maybeSingle();

	let cat: { id: string; name: string; description: string; icon: string } | null = null;

	if (catError && !isMissingTableError(catError, 'forum_categories')) {
		console.error('Forum category load error:', catError);
	}

	if (catData) {
		cat = { id: catData.id, name: catData.name, description: catData.description, icon: catData.icon };
	} else if (FALLBACK_CATEGORIES[category]) {
		cat = { id: category, ...FALLBACK_CATEGORIES[category] };
	} else {
		throw error(404, 'Samtalsrummet hittades inte.');
	}

	// Hämta trådar – nyaste först
	type ThreadRow = {
		id: string;
		title: string;
		is_anonymous: boolean;
		display_name: string | null;
		reply_count: number;
		created_at: string;
		user_id: string | null;
	};

	let threads: ThreadRow[] = [];

	const { data: threadsData, error: threadsError } = await locals.supabase
		.from('forum_threads')
		.select('id, title, is_anonymous, display_name, reply_count, created_at, user_id')
		.eq('category_id', category)
		.is('deleted_at', null)
		.eq('is_hidden', false)
		.order('created_at', { ascending: false })
		.limit(50);

	if (threadsError && !isMissingTableError(threadsError, 'forum_threads')) {
		console.error('Forum threads load error:', threadsError);
	} else if (threadsData) {
		threads = threadsData.map((row) => ({
			id: typeof row.id === 'string' ? row.id : '',
			title: typeof row.title === 'string' ? row.title : '',
			is_anonymous: Boolean(row.is_anonymous),
			display_name: typeof row.display_name === 'string' ? row.display_name : null,
			reply_count: typeof row.reply_count === 'number' ? row.reply_count : 0,
			created_at: typeof row.created_at === 'string' ? row.created_at : '',
			user_id: typeof row.user_id === 'string' ? row.user_id : null
		})).filter((t) => t.id.length > 0 && t.title.trim().length > 0);
	}

	// Hämta inloggad användare
	const { data: { user } } = await locals.supabase.auth.getUser();

	return {
		title: cat.name,
		description: cat.description,
		category: cat,
		threads,
		userId: user?.id ?? null
	};
};
