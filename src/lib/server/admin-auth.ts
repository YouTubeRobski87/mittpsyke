import type { SupabaseClient, User } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';

export type SessionUser = User & {
	is_super_admin: boolean;
};

type UnknownRecord = Record<string, unknown>;
const LEGACY_ADMIN_USER_IDS = new Set(['f4f107ef-461a-4090-bc2f-6ddccc0cc64d']);

/**
 * Serverkontrollerad allowlist av user-id:n, satt som miljövariabel
 * (kommaseparerad). Enda sättet att ge någon adminbehörighet utan
 * kodändring eller direkt DB-ingrepp.
 *
 * Miljövariabler sätts i Render, inte av användaren, så källan är lika
 * serverkontrollerad som `auth.users.is_super_admin`. Läs ALDRIG
 * `user_metadata` här: det fältet kan användaren skriva själv via
 * supabase.auth.updateUser() och vore en privilege escalation.
 */
function getConfiguredAdminIds(): Set<string> {
	const raw = env.ADMIN_USER_IDS ?? '';
	return new Set(
		raw
			.split(',')
			.map((value) => value.trim().toLowerCase())
			.filter(Boolean)
	);
}

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
	const normalizedId = typeof user.id === 'string' ? user.id.toLowerCase() : '';

	return (
		LEGACY_ADMIN_USER_IDS.has(user.id) ||
		getConfiguredAdminIds().has(normalizedId) ||
		// Fylls inte av supabase.auth.getUser() (kolumnen ligger i auth-schemat
		// och exponeras inte via API:et), men behålls för klienter som hämtar
		// användaren med service role.
		readBoolean(user.is_super_admin) ||
		readBoolean(appMetadata.is_super_admin)
	);
}

async function hydrateSessionUser(supabase: SupabaseClient, user: User): Promise<SessionUser> {
	let isSuperAdmin = isSuperAdminUser(user as User & UnknownRecord);

	if (!isSuperAdmin) {
		const { data, error } = await supabase.rpc('current_user_is_super_admin');

		if (error) {
			// Tystades tidigare helt, vilket gjorde ett trasigt RPC omöjligt att
			// skilja från en användare som faktiskt saknar behörighet.
			console.error(
				'[admin-auth] current_user_is_super_admin misslyckades:',
				error.message ?? error
			);
		} else if (data === true) {
			isSuperAdmin = true;
		}
	}

	if (!isSuperAdmin) {
		// Gör nekad adminåtkomst spårbar i serverloggen. Ingen av källorna nedan
		// gav behörighet - utan det här är enda symptomet en tyst omdirigering.
		console.warn(
			`[admin-auth] nekad adminåtkomst för user ${user.id}: varken legacy-id, ADMIN_USER_IDS, app_metadata eller RPC gav behörighet`
		);
	}

	return {
		...user,
		is_super_admin: isSuperAdmin
	};
}

export async function getSessionUser(supabase: SupabaseClient): Promise<SessionUser | null> {
	// getUser() autentiserar mot Supabase Auth-servern, till skillnad från getSession()
	// som bara läser cookien. Detta tar bort "insecure"-varningen och är säkrare.
	const {
		data: { user },
		error
	} = await supabase.auth.getUser();

	if (error || !user) {
		return null;
	}

	return hydrateSessionUser(supabase, user);
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

	return hydrateSessionUser(tokenClient, user);
}
