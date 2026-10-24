import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { render } from 'svelte/server';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { build } from 'vite';
import { expect, it, vi } from 'vitest';
import ArticlePage from '../../src/routes/blogg/amne/[collection]/[slug]/+page.svelte';

vi.mock('$app/state', () => ({
	page: { url: new URL('https://mittpsyke.se/blogg/amne/test/testartikel') }
}));

const viewportWidths = [320, 360, 375, 390, 768, 1280];
const longWord = 'mycketlangtordutanradbrytning'.repeat(12);
const longUrl = `https://example.invalid/${'lang-lank-'.repeat(35)}`;

const data = {
	article: {
		url: '/blogg/amne/test/testartikel',
		title: `En lång artikelrubrik med ${longWord}`,
		description: `Ingress med ${longWord} som måste kunna radbrytas på en smal skärm.`,
		image: '/wide.svg',
		imageAlt: 'Bred testbild',
		dateLabel: '24 oktober 2026',
		updatedLabel: null,
		readingTime: '5 min läsning',
		type: 'article',
		author: 'MittPsyke-redaktionen',
		content: [
			`<h2>Rubrik med ${longWord}</h2>`,
			`<p>Brödtext med ${longWord}.</p>`,
			`<p><a href="${longUrl}">${longUrl}</a></p>`,
			`<blockquote>Citat med ${longWord}.</blockquote>`,
			`<pre><code>${longWord}</code></pre>`,
			'<img src="/wide.svg" alt="Bred bild i Markdown">'
		].join(''),
		faqs: [],
		references: [],
		relatedArticles: []
	},
	topic: { slug: 'test', label: 'Testämne' },
	jsonLd: { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: 'Testartikel' }
};

it('keeps every article element inside real Chromium viewports', async () => {
	const chrome = process.env.CHROME_BIN ?? (process.platform === 'win32'
		? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
		: '/usr/bin/google-chrome');
	expect(existsSync(chrome), 'Chrome required; set CHROME_BIN (never skipped)').toBe(true);

	const compiled = await build({
		configFile: false,
		logLevel: 'error',
		plugins: [
			svelte(),
			{
				name: 'article-layout-app-state',
				resolveId: (id) => id === '$app/state' ? '\0article-layout-app-state' : undefined,
				load: (id) => id === '\0article-layout-app-state'
					? "export const page={url:new URL('https://mittpsyke.se/blogg/amne/test/testartikel')}"
					: undefined
			}
		],
		resolve: { alias: { '$lib': resolve('src/lib') } },
		build: {
			write: false,
			minify: false,
			target: 'esnext',
			lib: { entry: resolve('src/routes/blogg/amne/[collection]/[slug]/+page.svelte'), formats: ['es'] }
		}
	});
	const output = Array.isArray(compiled) ? compiled[0] : compiled;
	if (!output || !('output' in output)) throw new Error('Missing browser bundle');
	const styles = output.output.filter((item) => item.type === 'asset' && item.fileName.endsWith('.css'));
	const cssLinks = styles.map((item) => `<link rel="stylesheet" href="/${item.fileName}">`).join('');
	const { head, body } = render(ArticlePage, { props: { data } as never });

	const article = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${head}${cssLinks}<style>*{box-sizing:border-box}html,body{margin:0;padding:0;scrollbar-width:none}::-webkit-scrollbar{width:0;height:0}body{font-family:Arial,sans-serif}</style></head><body>${body}</body></html>`;
	const frames = viewportWidths.map((width) => `<iframe title="${width}" src="/article" width="${width}" height="900"></iframe>`).join('');
	const harness = `<!doctype html><meta charset="utf-8"><body>${frames}<output id="result">PENDING</output><script>
		const widths=${JSON.stringify(viewportWidths)};
		Promise.all([...document.querySelectorAll('iframe')].map((frame) => new Promise((resolve) => frame.addEventListener('load', () => resolve(frame))))).then((frames) => {
			const results=frames.map((frame,index) => {
				const doc=frame.contentDocument;
				const root=doc.documentElement;
				const article=doc.querySelector('.article-page');
				const elements=[...doc.querySelectorAll('.article-page, .article-page header, .article-page h1, .breadcrumbs li, .breadcrumbs a, .breadcrumbs span, .lead, .featured-image, .article-content, .article-content h2, .article-content p, .article-content a, .article-content blockquote, .article-content pre, .article-content img')];
				const outside=elements.filter((element) => {
					const rect=element.getBoundingClientRect();
					return rect.left < -0.5 || rect.right > root.clientWidth + 0.5;
				}).map((element) => element.tagName + '.' + element.className);
				return {
					requestedWidth: widths[index],
					clientWidth: root.clientWidth,
					rootScrollWidth: root.scrollWidth,
					bodyScrollWidth: doc.body.scrollWidth,
					articleScrollWidth: article.scrollWidth,
					outside,
					preWhiteSpace: getComputedStyle(doc.querySelector('pre')).whiteSpace,
					imageWidth: doc.querySelector('.article-content img').getBoundingClientRect().width
				};
			});
			const passed=results.every((result) => result.clientWidth === result.requestedWidth && result.rootScrollWidth <= result.clientWidth && result.bodyScrollWidth <= result.clientWidth && result.articleScrollWidth <= result.clientWidth && result.outside.length === 0 && result.preWhiteSpace === 'pre-wrap' && result.imageWidth <= result.clientWidth);
			document.querySelector('#result').textContent=(passed?'PASS: ':'FAIL: ')+JSON.stringify(results);
		});
	</script>`;

	const server = createServer((request, response) => {
		const css = styles.find((item) => '/' + item.fileName === request.url);
		if (request.url === '/') {
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.end(harness);
		} else if (request.url === '/article') {
			response.setHeader('Content-Type', 'text/html; charset=utf-8');
			response.end(article);
		} else if (request.url === '/wide.svg') {
			response.setHeader('Content-Type', 'image/svg+xml');
			response.end('<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900"><rect width="1600" height="900" fill="#436e8f"/></svg>');
		} else if (css?.type === 'asset') {
			response.setHeader('Content-Type', 'text/css');
			response.end(css.source);
		} else {
			response.writeHead(404).end();
		}
	});
	const profile = mkdtempSync(join(tmpdir(), 'mittpsyke-article-layout-'));
	try {
		await new Promise<void>((resolvePromise, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolvePromise);
		});
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Missing test server');
		const { stdout, stderr } = await promisify(execFile)(chrome, [
			'--headless=new',
			'--no-sandbox',
			'--disable-gpu',
			'--disable-background-networking',
			'--no-first-run',
			'--no-default-browser-check',
			`--user-data-dir=${profile}`,
			'--dump-dom',
			'--timeout=30000',
			'--virtual-time-budget=10000',
			'--window-size=1400,1000',
			`http://127.0.0.1:${address.port}/`
		], { timeout: 45000, maxBuffer: 2 * 1024 * 1024 });
		expect(stdout, stderr).toContain('<output id="result">PASS:');
	} finally {
		await new Promise<void>((resolvePromise, reject) => server.close((error) => error ? reject(error) : resolvePromise()));
		if (dirname(resolve(profile)) !== resolve(tmpdir()) || !profile.includes('mittpsyke-article-layout-')) {
			throw new Error('Unsafe profile cleanup');
		}
		rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}, 60000);
