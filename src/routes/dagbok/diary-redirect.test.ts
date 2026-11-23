import { describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { load } from './+page.server';

type TestUser = { id: string; is_anonymous?: boolean } | null;

function eventFor(user: TestUser, path: string) {
	return {
		url: new URL(path, 'http://localhost'),
		locals: {
			supabase: {
				auth: { getUser: async () => ({ data: { user }, error: null }) }
			} as unknown as SupabaseClient
		}
	} as unknown as Parameters<typeof load>[0];
}

/** Vart laddaren skickar vidare, eller null om sidan visas. */
async function redirectFor(user: TestUser, path: string): Promise<string | null> {
	try {
		await load(eventFor(user, path));
		return null;
	} catch (error) {
		if (isRedirect(error)) return error.location;
		throw error;
	}
}

describe('/dagbok för inloggade', () => {
	const signedIn: TestUser = { id: 'user-1', is_anonymous: false };

	it('öppnar skrivrutan direkt när man kommer via en skriv-länk', async () => {
		expect(await redirectFor(signedIn, '/dagbok?action=new')).toBe('/dagbok/checkin#skriv-sjalv');
	});

	it('leder till dagboken som vanligt utan skriv-länk', async () => {
		expect(await redirectFor(signedIn, '/dagbok')).toBe('/dagbok/checkin');
		expect(await redirectFor(signedIn, '/dagbok?action=annat')).toBe('/dagbok/checkin');
	});

	it('låter den som inte är inloggad skriva i gästdagboken', async () => {
		expect(await redirectFor(null, '/dagbok?action=new')).toBeNull();
	});
});
