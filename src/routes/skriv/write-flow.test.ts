import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import type { SupabaseClient } from '@supabase/supabase-js';
import { load } from './+page.server';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

function eventFor(user: { id: string; is_anonymous?: boolean } | null) {
	return {
		locals: {
			supabase: {
				auth: { getUser: async () => ({ data: { user }, error: null }) }
			} as unknown as SupabaseClient
		}
	} as unknown as Parameters<typeof load>[0];
}

describe('/skriv-flödet', () => {
	it('behåller SEO-sidan och visar anonym skrivyta direkt', async () => {
		await expect(load(eventFor(null))).resolves.toEqual({});

		const page = read('./+page.svelte');
		expect(page).toContain('<SEO canonical="https://mittpsyke.se/skriv" />');
		expect(page).toContain('<GuestQuickEntry />');
		expect(page.indexOf('<GuestQuickEntry />')).toBeLessThan(page.indexOf('Öppna AI-chatten'));
	});

	it('låter även en anonym auth-session stanna i den lokala skrivytan', async () => {
		await expect(load(eventFor({ id: 'guest-1', is_anonymous: true }))).resolves.toEqual({});
	});

	it('skickar en inloggad användare direkt till den öppnade dagbokseditorn', async () => {
		let caught: unknown;
		try {
			await load(eventFor({ id: 'user-1', is_anonymous: false }));
		} catch (error) {
			caught = error;
		}

		expect(isRedirect(caught)).toBe(true);
		if (!isRedirect(caught)) return;
		expect(caught.status).toBe(302);
		expect(caught.location).toBe('/dagbok/checkin#skriv-sjalv');
	});

	it('låter publika skriv-CTA:er gå direkt till den anonyma skrivytan', () => {
		for (const path of [
			'../../lib/components/BlogArticle.svelte',
			'../../lib/components/HomeSafetyStrip.svelte',
			'../qr/+page.svelte',
			'../tiktok/+page.svelte',
			'../share/+page.svelte'
		]) {
			const source = read(path);
			expect(source, path).toContain('/dagbok?action=new');
			expect(source, path).not.toMatch(/href=[^\n]*\/skriv/);
		}
	});

	it('öppnar inloggade skriv-CTA:er i dagbokens editor', () => {
		const signedHome = read('../../lib/components/home/SignedInHome.svelte');
		const layout = read('../+layout.svelte');

		expect(signedHome).toContain('href="/dagbok/checkin#skriv-sjalv"');
		expect(layout).toContain("href: '/dagbok/checkin#skriv-sjalv', label: 'Skriv'");
	});
});
