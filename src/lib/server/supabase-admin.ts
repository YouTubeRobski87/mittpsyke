import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';

type PostgrestErrorLike = {
	code?: string | null;
	message?: string | null;
};

export function createServiceClient() {
	const url = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SERVICE_ROLE_KEY;

	if (!url || !serviceKey) {
		return null;
	}

	return createClient(url, serviceKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}

export function createTokenClient(accessToken: string) {
	const url = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const anonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!url || !anonKey || !accessToken) {
		return null;
	}

	return createClient(url, anonKey, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		},
		global: {
			headers: {
				Authorization: `Bearer ${accessToken}`
			}
		}
	});
}

export function isMissingTableError(error: PostgrestErrorLike | null | undefined, tableName: string) {
	if (!error) return false;

	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

export function isUuid(value: string) {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
		value
	);
}
