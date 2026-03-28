import { fail } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { verifyUnsubscribeToken } from '$lib/server/unsubscribe';
import type { Actions, PageServerLoad } from './$types';

type TokenStatus = 'none' | 'success' | 'invalid' | 'error';

function createAdminClient() {
	const supabaseUrl = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const serviceRoleKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !serviceRoleKey) {
		return null;
	}

	return createClient(supabaseUrl, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});
}

async function markUserAsUnsubscribed(userId: string) {
	const adminClient = createAdminClient();
	if (!adminClient) {
		return { ok: false, message: 'Server configuration error.' };
	}

	const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(userId);
	if (userError || !userData.user) {
		return { ok: false, message: 'Kunde inte hitta kontot för avregistrering.' };
	}

	const existingMetadata =
		userData.user.user_metadata && typeof userData.user.user_metadata === 'object'
			? (userData.user.user_metadata as Record<string, unknown>)
			: {};

	const nowIso = new Date().toISOString();
	const nextMetadata = {
		...existingMetadata,
		marketing_opt_in: false,
		marketing_unsubscribed_at: nowIso,
		journal_reminder_opt_in: false,
		journal_reminder_channel: null,
		journal_reminder_next_at: null
	};

	const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
		user_metadata: nextMetadata
	});

	if (updateError) {
		return { ok: false, message: 'Kunde inte spara avregistreringen.' };
	}

	return { ok: true, message: 'Du har avregistrerats fran mejlutskick.' };
}

export const load: PageServerLoad = async ({ locals, url }) => {
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();
	const user = session?.user ?? null;

	const token = url.searchParams.get('token');
	let tokenStatus: TokenStatus = 'none';
	let tokenMessage = '';
	let tokenEmailType = '';

	if (token) {
		const verification = verifyUnsubscribeToken(token);
		if (!verification.ok) {
			tokenStatus = 'invalid';
			tokenMessage = 'Lanken ar ogiltig eller har gatt ut. Prova en ny lank fran senaste mejlet.';
		} else {
			tokenEmailType = verification.payload.emailType;
			const unsubscribeResult = await markUserAsUnsubscribed(verification.payload.sub);
			if (unsubscribeResult.ok) {
				tokenStatus = 'success';
				tokenMessage = 'Avregistreringen ar genomford. Du far inga fler utskick for den har profilen.';
			} else {
				tokenStatus = 'error';
				tokenMessage = unsubscribeResult.message;
			}
		}
	}

	return {
		isLoggedIn: Boolean(user),
		userEmail: user?.email ?? null,
		tokenStatus,
		tokenMessage,
		tokenEmailType
	};
};

export const actions: Actions = {
	unsubscribe: async ({ locals }) => {
		const {
			data: { session }
		} = await locals.supabase.auth.getSession();
		const user = session?.user ?? null;

		if (!user) {
			return fail(401, {
				action: 'unsubscribe',
				success: false,
				message: 'Du maste vara inloggad for att avregistrera dig.'
			});
		}

		const existingMetadata =
			user.user_metadata && typeof user.user_metadata === 'object'
				? (user.user_metadata as Record<string, unknown>)
				: {};

		const nowIso = new Date().toISOString();
		const { error: updateError } = await locals.supabase.auth.updateUser({
			data: {
				...existingMetadata,
				marketing_opt_in: false,
				marketing_unsubscribed_at: nowIso,
				journal_reminder_opt_in: false,
				journal_reminder_channel: null,
				journal_reminder_next_at: null
			}
		});

		if (updateError) {
			return fail(500, {
				action: 'unsubscribe',
				success: false,
				message: 'Kunde inte spara avregistreringen just nu.'
			});
		}

		return {
			action: 'unsubscribe',
			success: true,
			message: 'Klart. Du ar nu avregistrerad fran utskick.'
		};
	}
};
