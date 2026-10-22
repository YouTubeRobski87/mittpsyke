import { execFile } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { build } from 'vite';
import { expect, it } from 'vitest';
import { hostileDiaryMarkdown, ordinaryDiaryMarkdown } from './diary-markdown-cases';

// No new npm/browser dependency. ubuntu-latest provides Chrome; developers may
// use CHROME_BIN. Missing Chrome FAILS explicitly, never silently skips coverage.
const chrome = process.env.CHROME_BIN ?? (process.platform === 'win32'
	? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
	: '/usr/bin/google-chrome');

it('runs the production markdown function and real DOMPurify in Chromium, including HTML reparsing', async () => {
	expect(existsSync(chrome), 'Chrome required for client sanitization verification; set CHROME_BIN').toBe(true);
	// Bundle before launching Chrome: cold dev-module transforms must not race
	// the browser's page-load deadline while the full Vitest suite runs in parallel.
	const compiled = await build({
		configFile: false,
		root: process.cwd(),
		logLevel: 'error',
		plugins: [{
			name: 'browser-environment-only',
			resolveId: (id) => id === '$app/environment' ? '\0diary-browser-env' : undefined,
			load: (id) => id === '\0diary-browser-env' ? 'export const browser = true;' : undefined
		}],
		build: {
			write: false,
			minify: false,
			lib: { entry: resolve('src/lib/markdown.ts'), formats: ['es'] }
		}
	});
	const output = Array.isArray(compiled) ? compiled[0] : compiled;
	if (!output || !('output' in output)) throw new Error('Unexpected browser bundle');
	const bundle = output.output.find((item) => item.type === 'chunk')?.code;
	if (!bundle) throw new Error('Missing browser bundle');
	const profile = mkdtempSync(join(tmpdir(), 'mittpsyke-dompurify-'));
	const encoded = JSON.stringify({ hostileDiaryMarkdown, ordinaryDiaryMarkdown }).replaceAll('<', '\\u003c');
	const server = createServer((request, response) => {
		if (request.url === '/diary-markdown.js') {
			response.setHeader('Content-Type', 'text/javascript');
			response.end(bundle);
			return;
		}
		if (request.url !== '/diary-security-test') {
			response.writeHead(404).end();
			return;
		}
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'none'; frame-src 'none'; object-src 'none'");
		response.end(`<!doctype html><meta charset="utf-8"><body><output id="result">PENDING</output><script type="module">
import { renderDiaryMarkdown } from '/diary-markdown.js';
try {
 const { hostileDiaryMarkdown, ordinaryDiaryMarkdown } = ${encoded};
 const assert = (ok, message) => { if (!ok) throw new Error(message); };
 const allowed = new Set(['P','BR','UL','OL','LI','STRONG','EM','H2','H3','BLOCKQUOTE','CODE','PRE']);
 const check = (root) => {
   for (const element of root.querySelectorAll('*')) {
     assert(allowed.has(element.tagName), 'Unexpected tag: ' + element.tagName);
     assert(element.namespaceURI === 'http://www.w3.org/1999/xhtml', 'Foreign namespace');
     assert(element.attributes.length === 0, 'Unexpected attributes');
   }
 };
 window.__diaryXss = false;
 for (const input of hostileDiaryMarkdown) {
   const host = document.createElement('div');
   let html = renderDiaryMarkdown(input);
   for (let reparse = 0; reparse < 3; reparse++) {
     host.innerHTML = html;
     check(host);
     html = host.innerHTML;
   }
   document.body.append(host);
   assert(!window.__diaryClobber, 'Named DOM clobbering');
   host.remove();
 }
 const good = document.createElement('div');
 good.innerHTML = renderDiaryMarkdown(ordinaryDiaryMarkdown);
 check(good);
 assert(good.textContent.includes('Återhämtning äöå 🌿'), 'Swedish text/emoji');
 assert(good.querySelector('br'), 'Line break');
 assert(good.querySelectorAll('p').length >= 2, 'Paragraphs');
 assert(good.querySelector('strong')?.textContent === 'Vila', 'Bold');
 assert(good.querySelector('em')?.textContent === 'lugn', 'Italic');
 assert(good.querySelectorAll('ul > li').length === 2, 'List');
 good.innerHTML = renderDiaryMarkdown('[1177](https://1177.se)');
 assert(good.textContent.trim() === '1177' && !good.querySelector('a'), 'Links are intentionally text only');
 good.innerHTML = renderDiaryMarkdown('# Rubrik\\n\\n> Citat\\n\\n~~~\\n<test>\\n~~~');
 assert(good.querySelector('h2') && good.querySelector('blockquote') && good.querySelector('pre code'), 'Other existing formatting');
 check(good);
 await new Promise(resolve => setTimeout(resolve, 50));
 assert(!window.__diaryXss, 'Script/event handler execution');
 document.querySelector('#result').textContent = 'PASS: ' + hostileDiaryMarkdown.length + ' hostile cases, reparsing and formatting';
} catch (error) { document.querySelector('#result').textContent = 'FAIL: ' + error.message; }
</script>`);
	});
	try {
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject);
			server.listen(0, '127.0.0.1', resolve);
		});
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Missing local test server address');
		const { stdout, stderr } = await promisify(execFile)(chrome, [
			'--headless=new', '--disable-gpu', '--no-sandbox', '--disable-background-networking',
			'--no-first-run', '--no-default-browser-check', `--user-data-dir=${profile}`,
			'--dump-dom', '--timeout=30000', '--virtual-time-budget=10000',
			`http://127.0.0.1:${address.port}/diary-security-test`
		], { timeout: 45000, maxBuffer: 1024 * 1024 });
		expect(stdout, stderr).toContain('<output id="result">PASS: 14 hostile cases, reparsing and formatting</output>');
	} finally {
		await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
		// Delete only the disposable profile created above, never a user's profile.
		if (dirname(resolve(profile)) !== resolve(tmpdir()) || !profile.includes('mittpsyke-dompurify-')) {
			throw new Error('Refusing cleanup outside the disposable test profile');
		}
		rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}, 60000);
