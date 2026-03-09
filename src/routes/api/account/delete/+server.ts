import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';
import type { DeleteAccountErrorResponse, DeleteAccountSuccessResponse } from '$lib/types';

const errorResponse = (message: string, status: number) => {
	const body: DeleteAccountErrorResponse = { success: false, error: message };
	return json(body, { status });
};

const getAccessToken = (header: string | null): string | null => {
	if (!header) return null;
	const [scheme, token] = header.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
};

export const DELETE: RequestHandler = async ({ request }) => {
	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return errorResponse('Missing or invalid Authorization header.', 401);
	}

	const supabaseUrl = privateEnv.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = privateEnv.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	const serviceRoleKey = privateEnv.SUPABASE_SERVICE_ROLE_KEY;

	if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
		console.error('Supabase environment variables are not fully configured.');
		return errorResponse('Server configuration error.', 500);
	}

	const userClient = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: userError
	} = await userClient.auth.getUser();

	if (userError || !user) {
		return errorResponse('Unauthorized.', 401);
	}

	const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);
	if (deleteError) {
		console.error('Failed to delete user account', deleteError);
		return errorResponse('Kunde inte radera kontot.', 500);
	}

	const response: DeleteAccountSuccessResponse = { success: true };
	return json(response, { status: 200 });
};