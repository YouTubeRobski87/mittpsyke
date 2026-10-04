import type { SupabaseClient } from '@supabase/supabase-js';

export const CREATIVE_MOMENT_ACTIVITY = 'world_coloring' as const;
export const CREATIVE_MOMENT_WINDOW_DAYS = 7;

export function getCreativeMomentWindowStart(now = new Date()): string {
	return new Date(now.getTime() - CREATIVE_MOMENT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function getCreativeMomentCopy(count: number): string {
	if (count === 0) {
		return 'När du använder Måla i världen kan dina lugna kreativa stunder visas här.';
	}

	if (count === 1) {
		return 'Du har tagit dig tid för 1 lugn kreativ stund de senaste 7 dagarna.';
	}

	return `Du har tagit dig tid för ${count} lugna kreativa stunder de senaste 7 dagarna.`;
}

export type CreativeMomentRecordResult =
	| { ok: true }
	| { ok: false; reason: 'not_signed_in' | 'save_failed'; error?: { code?: string; message: string } };

/** Sparar en minimal, användarägd aktivitetsrad. Motivet och färgläggningen lämnar aldrig klienten. */
export async function recordCreativeMoment(
	supabase: SupabaseClient,
	sessionId: string
): Promise<CreativeMomentRecordResult> {
	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();

	if (authError || !user || user.is_anonymous) return { ok: false, reason: 'not_signed_in' };

	const { error } = await supabase.from('creative_moments').insert({
		user_id: user.id,
		activity_type: CREATIVE_MOMENT_ACTIVITY,
		session_id: sessionId
	});

	// Samma sessions-id är idempotent även om nätverket skulle skicka om anropet.
	if (!error || error.code === '23505') return { ok: true };

	return {
		ok: false,
		reason: 'save_failed',
		error: { code: error.code, message: error.message }
	};
}
