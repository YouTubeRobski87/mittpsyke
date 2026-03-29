import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';

type SessionUser = User & {
	is_super_admin: boolean;
};

type UnknownRecord = Record<string, unknown>;
const LEGACY_ADMIN_USER_IDS = new Set(['f4f107ef-461a-4090-bc2f-6ddccc0cc64d']);

function asRecord(value: unknown): UnknownRecord {
	return value && typeof value === 'object' && !Array.isArray(value)
		? (value as UnknownRecord)
		: {};
}

function readBoolean(value: unknown) {
	return value === true;
}

export function isSuperAdminUser(user: (User & UnknownRecord) | null | undefined) {
	if (!user) return false;

	const appMetadata = asRecord(user.app_metadata);
	const userMetadata = asRecord(user.user_metadata);

	return (
		LEGACY_ADMIN_USER_IDS.has(user.id) ||
		readBoolean(user.is_super_admin) ||
		readBoolean(appMetadata.is_super_admin) ||
		readBoolean(userMetadata.is_super_admin)
	);
}

async function hydrateSessionUser(user: User): Promise<SessionUser> {
	let isSuperAdmin = isSuperAdminUser(user as User & UnknownRecord);

	if (!isSuperAdmin) {
		const serviceClient = createServiceClient();
		if (serviceClient) {
			const { data, error } = await serviceClient
				.schema('auth')
				.from('users')
				.select('is_super_admin')
				.eq('id', user.id)
				.maybeSingle<{ is_super_admin: boolean | null }>();

			if (!error && data?.is_super_admin === true) {
				isSuperAdmin = true;
			}
		}
	}

	return {
		...user,
		is_super_admin: isSuperAdmin
	};
}

export async function getSessionUser(supabase: SupabaseClient): Promise<SessionUser | null> {
	const {
		data: { session }
	} = await supabase.auth.getSession();

	if (!session?.user) {
		return null;
	}

	return hydrateSessionUser(session.user);
}

export async function getUserFromAccessToken(accessToken: string): Promise<SessionUser | null> {
	const tokenClient = createTokenClient(accessToken);
	if (!tokenClient) {
		return null;
	}

	const {
		data: { user },
		error
	} = await tokenClient.auth.getUser();

	if (error || !user) {
		return null;
	}

	return hydrateSessionUser(user);
}
