import type { SupabaseClient, User } from '@supabase/supabase-js';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';

type SessionUser = User & {
	is_super_admin: boolean;
};

type UnknownRecord = Record<string, unknown>;

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
			const { data, error } = await serviceClient.auth.admin.getUserById(user.id);
			if (!error && data.user) {
				isSuperAdmin = isSuperAdminUser(data.user as User & UnknownRecord);
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
