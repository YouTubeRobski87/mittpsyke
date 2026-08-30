import { describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { load } from './+page.server';

type TestUser = { id: string; is_anonymous?: boolean } | null;

function eventFor(user: TestUser, path = 'http://localhost/') {
	return {
		url: new URL(path),
		locals: {
			supabase: {
				auth: { getUser: async () => ({ data: { user }, error: null }) }
			} as unknown as SupabaseClient
		}
	} as unknown as Parameters<typeof load>[0];
}

/** Kör laddaren och returnerar antingen sidans data eller den kastade redirecten. */
async function runLoad(user: TestUser, path?: string) {
	try {
		return { data: await load(eventFor(user, path)), redirect: null };
	} catch (thrown) {
		if (isRedirect(thrown)) return { data: null, redirect: thrown };
		throw thrown;
	}
}

const signedIn: TestUser = { id: 'user-1', is_anonymous: false };
const guest: TestUser = { id: 'guest-1', is_anonymous: true };

describe('Startsidan för inloggade', () => {
	it('visar den publika startsidan för den som inte är inloggad', async () => {
		const { data, redirect } = await runLoad(null);

		expect(redirect).toBeNull();
		expect(data?.title).toBe('En lugn plats att återvända till');
	});

	it('skickar inloggade till Mitt Hem', async () => {
		const { redirect } = await runLoad(signedIn);

		expect(redirect).not.toBeNull();
		expect(redirect?.status).toBe(303);
		expect(redirect?.location).toBe('/dashboard');
	});

	it('redirectar innan startsidan hinner byggas', async () => {
		// Laddaren kastar i stället för att returnera data, så SvelteKit hinner
		// aldrig rendera den publika sidan för en inloggad användare.
		const { data } = await runLoad(signedIn);

		expect(data).toBeNull();
	});

	it('låter gäster utan konto vara kvar på startsidan', async () => {
		// "Skriv först, utan konto" vänder sig till just de här sessionerna.
		const { data, redirect } = await runLoad(guest);

		expect(redirect).toBeNull();
		expect(data?.title).toBe('En lugn plats att återvända till');
	});

	it('behåller legacy-länken till bloggen även för inloggade', async () => {
		// Publika URL:er ska fortsatt gå fram; bara "/" byter beteende.
		const { redirect } = await runLoad(signedIn, 'http://localhost/?post=angest-pa-natten');

		expect(redirect?.status).toBe(308);
		expect(redirect?.location).toBe('/blogg/angest-pa-natten');
	});

	it('rör inga andra publika laddare', async () => {
		// Ingen annan publik route har fått samma dashboard-redirect.
		const { readFileSync } = await import('node:fs');
		const { join } = await import('node:path');
		const others = ['blogg/+page.server.ts', 'om-oss/+page.server.ts'];

		for (const relative of others) {
			const path = join(process.cwd(), 'src/routes', relative);
			let source: string;
			try {
				source = readFileSync(path, 'utf8');
			} catch {
				continue;
			}
			expect(source, relative).not.toContain("redirect(303, '/dashboard')");
		}
	});
});
