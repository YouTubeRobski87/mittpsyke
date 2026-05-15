import { redirect } from '@sveltejs/kit';
import { isReflectionVisibleByAge, type WeeklyReflectionRecord } from '$lib/server/spegelvattnet';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user) {
		throw redirect(303, '/login');
	}

	const { data, error } = await locals.supabase
		.from('weekly_reflections')
		.select(
			'id, user_id, week_start, words, quoted_sentence, quoted_sentence_post_id, movement, open_question, status, paused_reason, context_snapshot, created_at, opened_at'
		)
		.eq('user_id', user.id)
		.in('status', ['ready', 'paused', 'opened'])
		.order('week_start', { ascending: false })
		.limit(1)
		.maybeSingle<WeeklyReflectionRecord>();

	if (error) {
		console.error('Spegelvattnet page load error:', error);
	}

	if (data && data.status !== 'opened' && !isReflectionVisibleByAge(data.week_start)) {
		await locals.supabase
			.from('weekly_reflections')
			.update({ status: 'expired' })
			.eq('id', data.id)
			.is('opened_at', null);
		return {
			title: 'Spegelvattnet',
			description: 'En stilla veckospegling av ditt skrivande.',
			noindex: true,
			reflection: null
		};
	}

	return {
		title: 'Spegelvattnet',
		description: 'En stilla veckospegling av ditt skrivande.',
		noindex: true,
		reflection: data ?? null
	};
};
