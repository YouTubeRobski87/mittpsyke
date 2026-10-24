// Browser integration suite: also verifies the server data/SSR used for hydration.
// The .browser.test.ts suffix keeps this out of Render's browser-free prebuild
// once the separate CI/Render split (PR #56) has been merged.
import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { JSDOM } from 'jsdom';
import { render } from 'svelte/server';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { build } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { hostileDiaryMarkdown } from './diary-markdown-cases';
import { sanitizeCmsHtml } from '../../src/lib/server/cms-html';
import { load as loadBlog } from '../../src/routes/blogg/[slug]/+page.server';
import { load as loadAngest } from '../../src/routes/angest/+page.server';
import BlogPage from '../../src/routes/blogg/[slug]/+page.svelte';
import AngestPage from '../../src/routes/angest/+page.svelte';

const mocks = vi.hoisted(() => ({ landing: vi.fn() }));
vi.mock('$lib/server/supabase-admin', () => ({ createServiceClient: () => ({}) }));
vi.mock('$lib/server/admin-system', async (original) => ({
	...await original<typeof import('../../src/lib/server/admin-system')>(),
	getLandingPageByPageId: mocks.landing
}));

const good = '<h2 id="cms-section" class="section">Svensk återhämtning äöå 🌿</h2><p>En <strong>lugn</strong> stund med <em>vila</em>.</p><ul><li>Promenad</li></ul><a href="https://www.1177.se/">1177</a>';
const attack = '<script>window.__cmsXss=true</script><img src=x onerror="window.__cmsXss=true"><p onclick="window.__cmsXss=true">Text</p><a href="javascript:alert(1)">osäker</a><iframe srcdoc="<script>alert(1)</script>"></iframe><svg onload="window.__cmsXss=true"></svg>';
const metadata = 'Ångest äöå 🌿 </script><img src=x onerror="window.__cmsXss=true"> <!-- & " \u2028\u2029';
const hostile = [...hostileDiaryMarkdown, attack,
	'<p style="background:url(javascript:alert(1))">Text</p><base href="https://attacker.invalid/"><a href="&#106;avascript:alert(1)">länk</a>',
	'<template shadowrootmode="open"><script>window.__cmsXss=true</script></template>',
	'<img src="data:image/svg+xml,<svg onload=alert(1)>"><img src="blob:synthetic"><a href="file:///etc/passwd">fil</a>'
];

async function blogData(html: string) {
	const fetcher = vi.fn().mockResolvedValueOnce(new Response('var SORO_ARTICLES = ' + JSON.stringify([
		{ id: 'synthetic', title: 'Testartikel', slug: 'cms-test', excerpt: 'Test', date: '2026-10-22', isoDate: '2026-10-22' }
	]) + ';')).mockResolvedValueOnce(Response.json({ content: html }));
	const result = await loadBlog({ params: { slug: 'cms-test' }, fetch: fetcher, setHeaders: vi.fn() } as unknown as Parameters<typeof loadBlog>[0]);
	if (!result) throw new Error('Missing blog data');
	return result;
}

async function angestData(html: string) {
	mocks.landing.mockResolvedValue({ page: { id: 'synthetic', status: 'published' },
		content: { html_content: html, h1_heading: metadata, seo_meta: metadata, updated_at: '2026-10-22' },
		abTest: null, error: null });
	const result = await loadAngest({ cookies: { get: vi.fn(), set: vi.fn() } } as unknown as Parameters<typeof loadAngest>[0]);
	if (!result) throw new Error('Missing landing data');
	return result;
}

function expectSafeDom(html: string) {
	const dom = new JSDOM(html);
	try {
		expect(dom.window.document.querySelector('script,style,iframe,svg,math,object,embed,form,input,template,base')).toBeNull();
		for (const element of dom.window.document.body.querySelectorAll('*')) {
			expect(element.namespaceURI).toBe('http://www.w3.org/1999/xhtml');
			for (const attr of element.attributes) {
				expect(attr.name).not.toMatch(/^on|^style$|^srcdoc$|^name$/i);
				if (attr.name === 'href') expect(['http:', 'https:', 'mailto:', 'tel:']).toContain(new URL(attr.value, 'https://mittpsyke.se').protocol);
				if (attr.name === 'src') expect(['http:', 'https:']).toContain(new URL(attr.value, 'https://mittpsyke.se').protocol);
			}
		}
	} finally { dom.window.close(); }
}

beforeEach(() => {
	vi.stubGlobal('fetch', vi.fn(() => { throw new Error('External fetch forbidden in CMS regression tests'); }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('actual CMS server loads and SSR components', () => {
	it.each(hostile)('Soro sanitizes after normalization: %s', async (html) => {
		const data = await blogData(good + html);
		expectSafeDom(data.article.content);
		expectSafeDom(render(BlogPage, { props: { data } as never }).body);
		expect(data.article.content).toContain('Svensk återhämtning äöå 🌿');
	});
	it.each(hostile)('admin landing HTML is sanitized before SSR: %s', async (html) => {
		const data = await angestData(good + html);
		expectSafeDom(data.content.html_content);
		expectSafeDom(render(AngestPage, { props: { data } as never }).body);
	});
	it('keeps article structure, class/id, safe links and existing protocol-less link normalization', async () => {
		const data = await blogData(good + '<a href="www.1177.se">Vårdråd</a>');
		for (const fragment of ['id="cms-section"', 'class="section"', '<strong>lugn</strong>', '<em>vila</em>', '<ul><li>Promenad</li></ul>', 'href="https://www.1177.se"']) {
			expect(data.article.content).toContain(fragment);
		}
	});
	it('serializes admin metadata as valid script-safe JSON-LD without changing its meaning', async () => {
		const data = await angestData(good);
		const { head } = render(AngestPage, { props: { data } as never });
		const scripts = [...head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
		expect(scripts).toHaveLength(1);
		const json = scripts[0][1];
		expect(json).not.toMatch(/<|\u2028|\u2029/);
		expect(JSON.parse(json)).toMatchObject({ name: metadata, description: metadata });
		const dom = new JSDOM('<!doctype html><head>' + head + '</head><body></body>');
		try { expect(dom.window.document.querySelector('img')).toBeNull(); }
		finally { dom.window.close(); }
	});
	it('handles empty input and removes browser-clobbering form names', () => {
		expect(sanitizeCmsHtml(null)).toBe('');
		expect(sanitizeCmsHtml(undefined)).toBe('');
		expectSafeDom(sanitizeCmsHtml('<form id="attributes"><input name="attributes"></form>'));
	});
	it('keeps ordinary images and relative, fragment, mail and telephone links', () => {
		const html = sanitizeCmsHtml('<img src="/bild.webp" alt="Återhämtning"><a href="/dagbok">Dagbok</a><a href="#cms-section">Avsnitt</a><a href="mailto:test@example.invalid">Mejl</a><a href="tel:1177">Ring</a>');
		for (const value of ['/bild.webp', '/dagbok', '#cms-section', 'mailto:test@example.invalid', 'tel:1177']) expect(html).toContain(value);
		expectSafeDom(html);
	});
});

it('hydrates both actual CMS pages from sanitized SSR with no HTML mismatch in Chromium', async () => {
	const chrome = process.env.CHROME_BIN ?? (process.platform === 'win32'
		? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : '/usr/bin/google-chrome');
	expect(existsSync(chrome), 'Chrome required; set CHROME_BIN (never skipped)').toBe(true);
	const compiled = await build({ configFile: false, logLevel: 'error',
		plugins: [svelte({ compilerOptions: { dev: true } }), {
			name: 'cms-test-analytics-only',
			resolveId: (id) => id === '\0cms-analytics' ? id : undefined,
			load: (id) => id === '\0cms-analytics' ? 'export const saveLandingPageEvent=()=>{}; export const trackHeroCtaPrimaryClick=()=>{}; export const trackHeroCtaSecondaryClick=()=>{}; export const trackArticleView=()=>{};' : undefined
		}],
		resolve: { alias: { '$lib/analytics': '\0cms-analytics', '$lib': resolve('src/lib') } },
		build: { write: false, minify: false, target: 'esnext', lib: { entry: resolve('tests/runtime/fixtures/cms-hydration.ts'), formats: ['es'] } }
	});
	const output = Array.isArray(compiled) ? compiled[0] : compiled;
	if (!output || !('output' in output)) throw new Error('Missing browser bundle');
	const bundle = output.output.find((item) => item.type === 'chunk')?.code;
	if (!bundle) throw new Error('Missing browser JS');
	const styles = output.output.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'));
	const cssLinks = styles.map((item) => `<link rel="stylesheet" href="/${item.fileName}">`).join('');
	const pages = new Map<string, string>();
	for (const route of ['blog', 'angest']) {
		const data = route === 'blog' ? await blogData(good + attack) : await angestData(good + attack);
		const { head, body } = render(route === 'blog' ? BlogPage : AngestPage, { props: { data } as never });
		const fixture = JSON.stringify({ route, data, expectedName: metadata }).replace(/</g, '\\u003c');
		pages.set('/' + route, '<!doctype html><meta charset="utf-8"><head>' + head + cssLinks + '</head><body><div id="app">' + body + '</div><output id="result">PENDING</output><script>window.__cmsFixture=' + fixture + '</script><script type="module" src="/cms-test.js"></script>');
	}
	const server = createServer((request, response) => {
		const page = pages.get(request.url ?? '');
		const css = styles.find((item) => '/' + item.fileName === request.url);
		if (request.url === '/cms-test.js') { response.setHeader('Content-Type', 'text/javascript'); response.end(bundle); }
		else if (css?.type === 'asset') { response.setHeader('Content-Type', 'text/css'); response.end(css.source); }
		else if (page) {
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'none'; connect-src 'none'");
			response.end(page);
		} else response.writeHead(404).end();
	});
	const profile = mkdtempSync(join(tmpdir(), 'mittpsyke-cms-'));
	try {
		await new Promise<void>((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Missing test server');
		for (const route of ['blog', 'angest']) {
			const { stdout, stderr } = await promisify(execFile)(chrome, ['--headless=new', '--no-sandbox', '--disable-gpu',
				'--disable-background-networking', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
				'--dump-dom', '--timeout=30000', '--virtual-time-budget=10000', '--window-size=390,900',
				`http://127.0.0.1:${address.port}/${route}`], { timeout: 45000, maxBuffer: 1024 * 1024 });
			expect(stdout, stderr).toMatch(new RegExp(`<output id="result"[^>]*>PASS: ${route} SSR and hydration</output>`));
		}
	} finally {
		await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
		if (dirname(resolve(profile)) !== resolve(tmpdir()) || !profile.includes('mittpsyke-cms-')) throw new Error('Unsafe profile cleanup');
		rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}, 60000);
