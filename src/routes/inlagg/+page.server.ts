import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

const dateFormatter = new Intl.DateTimeFormat('sv-SE', {
	timeZone: 'Europe/Stockholm',
	day: 'numeric',
	month: 'long',
	year: 'numeric'
});

function formatDate(value: string | null): string {
	if (!value) return '';
	const date = new Date(value);
	return isNaN(date.getTime()) ? '' : dateFormatter.format(date);
}

function toTitle(text: string, question: string | null): string {
	if (question) {
		return question.length > 72 ? question.slice(0, 72).trimEnd() + '…' : question;
	}
	const first = text.split(/[.\n]/)[0]?.trim() ?? '';
	if (!first) return 'Dagboksanteckning';
	return first.length > 72 ? first.slice(0, 72).trimEnd() + '…' : first;
}

function toSnippet(text: string, max = 180): string {
	const normalized = text.replace(/\s+/g, ' ').trim();
	return normalized.length <= max ? normalized : normalized.slice(0, max).trimEnd() + '…';
}

export type InlaggEntry = {
	id: string;
	title: string;
	snippet: string;
	tag: string;
	date: string;
};

export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	if (!user) throw redirect(303, '/login');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	const [entriesResult, countResult] = await Promise.all([
		locals.supabase
			.from('diary')
			.select('id, text, mood, tags, prompt_question, created_at')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.range(from, to),
		locals.supabase
			.from('diary')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id)
	]);

	if (entriesResult.error) {
		console.error('Inlägg load error:', entriesResult.error);
	}

	const entries: InlaggEntry[] = (entriesResult.data ?? []).map((row) => {
		const text = row.text ?? '';
		const mood = typeof row.mood === 'string' && row.mood ? row.mood : null;
		const firstTag =
			Array.isArray(row.tags) && row.tags.length > 0 ? String(row.tags[0]) : null;
		return {
			id: row.id,
			title: toTitle(text, row.prompt_question ?? null),
			snippet: toSnippet(text),
			tag: mood ?? firstTag ?? '',
			date: formatDate(row.created_at)
		};
	});

	const total = countResult.count ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	return { entries, page, totalPages, total };
};
