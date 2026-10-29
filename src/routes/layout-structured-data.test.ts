import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Layout from './+layout.svelte';

// Root-layoutens globala strukturerade data renderas på varje sida. Den får
// beskriva MittPsyke men aldrig innehålla person- eller organisationsnummer.
// Synliga företagsuppgifter på de juridiska sidorna omfattas inte här.

vi.mock('$app/state', () => ({
	page: {
		url: new URL('https://mittpsyke.se/'),
		route: { id: '/' },
		data: {},
		params: {},
		status: 200,
		error: null
	}
}));

// Utloggad besökare utan öppna paneler.
const guestData = {
	authenticatedUser: null,
	signUpCompleted: false,
	profilePanel: null,
	unreadNotificationCount: 0
};

const layoutSource = readFileSync(new URL('./+layout.svelte', import.meta.url), 'utf8');

function renderHead() {
	const children = createRawSnippet(() => ({ render: () => '<p>Innehåll</p>' }));
	return render(Layout, { props: { data: guestData, children } }).head;
}

function jsonLdBlocks(head: string): Record<string, unknown>[] {
	return [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
		(match) => JSON.parse(match[1]) as Record<string, unknown>
	);
}

describe('global Organization JSON-LD', () => {
	it('är giltig JSON och behåller namn, adress och logotyp', () => {
		const organization = jsonLdBlocks(renderHead()).find((block) => block['@type'] === 'Organization');
		expect(organization).toBeDefined();
		expect(organization?.['@context']).toBe('https://schema.org');
		expect(organization?.name).toBe('MittPsyke');
		expect(organization?.url).toMatch(/^https:\/\//);
		expect(organization?.logo).toMatch(/\/logo\.png$/);
	});

	it('saknar identifier och nummer som liknar person- eller organisationsnummer', () => {
		const head = renderHead();
		for (const block of jsonLdBlocks(head)) {
			// Bara booleska påståenden, så att ett felande test aldrig skriver ut
			// själva numret i testloggen eller CI.
			expect(Object.hasOwn(block, 'identifier'), 'JSON-LD har fältet identifier').toBe(false);
			expect(/\b\d{6}-?\d{4}\b|\b\d{12}\b/.test(JSON.stringify(block)), 'JSON-LD har ett 10–12-siffrigt nummer').toBe(false);
		}
		expect(/\bidentifier\s*:/.test(layoutSource)).toBe(false);
	});
});

describe('layoutens ARIA-referenser i stängt läge', () => {
	it('pekar aria-controls bara på element som finns i den renderade sidan', () => {
		const children = createRawSnippet(() => ({ render: () => '<p>Innehåll</p>' }));
		const { body } = render(Layout, { props: { data: guestData, children } });
		const ids = new Set([...body.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
		const controls = [...body.matchAll(/aria-controls="([^"]+)"/g)].flatMap((match) => match[1].split(/\s+/));
		for (const id of controls) expect(ids.has(id), `aria-controls="${id}" saknar element`).toBe(true);
		expect(body).toContain('aria-expanded="false"');
	});
});
