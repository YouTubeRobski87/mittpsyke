import { describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { load } from './+page.server';

type TestUser = { id: string; is_anonymous?: boolean } | null;
type HomeData = {
	title: string;
	isSignedInHome: boolean;
	homeOverview?: {
		displayName: string | null;
		entryCount: number;
		progressCompanion: null;
	};
};

function eventFor(user: TestUser, path = 'http://localhost/') {
	return {
		url: new URL(path),
		locals: {
			supabase: {
				auth: { getUser: async () => ({ data: { user }, error: null }) },
				from: () => ({
					select: () => ({
						eq: async () => ({ count: 3, error: null })
					})
				})
			} as unknown as SupabaseClient
		}
	} as unknown as Parameters<typeof load>[0];
}

/** Kör startsidans serverladdare med den angivna sessionen. */
async function runLoad(user: TestUser, path?: string): Promise<HomeData> {
	return (await load(eventFor(user, path))) as HomeData;
}

const signedIn: TestUser = { id: 'user-1', is_anonymous: false };
const guest: TestUser = { id: 'guest-1', is_anonymous: true };

describe('Startsidan för inloggade', () => {
	it('visar den publika startsidan för den som inte är inloggad', async () => {
		const data = await runLoad(null);

		expect(data.title).toBe('En lugn plats att återvända till');
		expect(data.isSignedInHome).toBe(false);
	});

	it('visar översikten för inloggade utan att redirecta till Mitt Hem', async () => {
		const data = await runLoad(signedIn);

		expect(data.isSignedInHome).toBe(true);
		expect(data.homeOverview).toEqual({
			displayName: null,
			entryCount: 3,
			progressCompanion: null
		});
	});

	it('låter gäster utan konto vara kvar på startsidan', async () => {
		// "Skriv först, utan konto" vänder sig till just de här sessionerna.
		const data = await runLoad(guest);

		expect(data.title).toBe('En lugn plats att återvända till');
		expect(data.isSignedInHome).toBe(false);
	});

	it('behåller legacy-länken till bloggen även för inloggade', async () => {
		// Publika URL:er ska fortsatt gå fram; bara "/" byter beteende.
		let caught: unknown;
		try {
			await runLoad(signedIn, 'http://localhost/?post=angest-pa-natten');
		} catch (error) {
			caught = error;
		}

		expect(isRedirect(caught)).toBe(true);
		if (!isRedirect(caught)) return;
		expect(caught.status).toBe(308);
		expect(caught.location).toBe('/blogg/angest-pa-natten');
	});

	it('rör inga andra publika laddare', async () => {
		// Ingen annan publik route får en inloggad startsida som bieffekt.
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
			expect(source, relative).not.toContain('isSignedInHome');
		}
	});
});
