import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import { createRawSnippet } from 'svelte';
import Layout from './+layout.svelte';

// Root-layouten äger sidans enda huvudlandmärke (<main id="main-content">,
// målet för skip-länken). Sidor och komponenter renderas inuti den och får
// därför inte ha en egen <main>, annars får skärmläsare två huvudlandmärken.

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

const srcDir = fileURLToPath(new URL('..', import.meta.url));
const rootLayout = join(srcDir, 'routes', '+layout.svelte');

function svelteFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return svelteFiles(path);
		return entry.name.endsWith('.svelte') ? [path] : [];
	});
}

describe('ett enda main-landmärke per sida', () => {
	it('har ingen egen <main> i sidor eller komponenter utanför root-layouten', () => {
		const offenders = svelteFiles(srcDir)
			.filter((path) => path !== rootLayout)
			.filter((path) => /<main[\s>]/.test(readFileSync(path, 'utf8')))
			.map((path) => relative(srcDir, path));
		expect(offenders).toEqual([]);
	});

	it('renderar exakt ett <main> med id för skip-länken i root-layouten', () => {
		const children = createRawSnippet(() => ({ render: () => '<div class="page"><h1>Innehåll</h1></div>' }));
		const { body } = render(Layout, {
			props: {
				data: { authenticatedUser: null, signUpCompleted: false, profilePanel: null, unreadNotificationCount: 0 },
				children
			}
		});
		expect(body.match(/<main[\s>]/g)?.length).toBe(1);
		expect(body).toMatch(/<main id="main-content"/);
		expect(body).toContain('href="#main-content"');
	});
});
