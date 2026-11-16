import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { build } from 'vite';
import { expect, it } from 'vitest';

const chrome = process.env.CHROME_BIN ?? (process.platform === 'win32'
	? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
	: '/usr/bin/google-chrome');

it('visar en användbar personlig lista på mobil och sparar bara efter en aktiv handling', async () => {
	const result = await build({
		configFile: false,
		logLevel: 'error',
		resolve: { alias: { '$lib': resolve('src/lib') } },
		plugins: [{
			name: 'helpful-reminders-browser-fixture',
			enforce: 'pre',
			resolveId(id) {
				if (id === 'helpful-fixture') return '\0' + id;
			},
			load(id) {
				if (id === '\0helpful-fixture') return `
					import { mount, tick } from 'svelte';
					import Reminders from '/src/lib/components/progress/HelpfulReminders.svelte';
					const calls = [];
					const saved = new Map();
					let reads = 0;
					let failure = '';
					let release;
					const reply = (data, status = 200) => ({ status, ok: status === 200, json: async () => data });
					window.fetch = async (url, options) => {
						if (options.method !== 'POST') {
							if (url !== '/api/progress/helpful-reminders' || options.headers['X-MittPsyke-Account-Id'] !== 'own') {
								throw new Error('Unexpected read');
							}
							reads++;
							return reply({ reminders: [...saved.values()] });
						}
						const { accountId, item, action, revision } = JSON.parse(options.body);
						if (url !== '/api/progress/helpful-reminders' || accountId !== 'own') throw new Error('Unexpected request');
						calls.push(revision);
						if (calls.length === 1) await new Promise(done => { release = done; });
						const before = failure;
						failure = '';
						if (before === 'storage') return reply({}, 502);
						if ((saved.get(item)?.revision ?? 0) !== revision) return reply({}, 409);
						const reminder = { item_id: item, active: action === 'add', revision: revision + 1 };
						saved.set(item, reminder);
						if (before === 'network') throw new Error('Lost response');
						return reply({ reminder });
					};

					try {
						const assert = (ok, message) => { if (!ok) throw new Error(message); };
						mount(Reminders, { target: document.querySelector('main'), props: { accountId: 'own', initial: [] } });
						await tick();
						const select = document.querySelector('select');
						const submit = document.querySelector('button[type="submit"]');
						const status = document.querySelector('[role="status"]');
						assert(document.querySelector('label').control === select, 'select label');
						assert(submit.disabled && calls.length === 0, 'empty form must not save');
						assert(document.documentElement.scrollWidth === innerWidth, 'horizontal overflow');
						assert(select.getBoundingClientRect().height >= 44 && submit.getBoundingClientRect().height >= 44, 'touch targets');
						select.focus();
						assert(document.activeElement === select && getComputedStyle(select).outlineStyle !== 'none', 'visible focus');
						select.value = 'music';
						select.dispatchEvent(new Event('change', { bubbles: true }));
						await tick();
						assert(calls.length === 0 && !submit.disabled, 'selection must not save');
						submit.form.requestSubmit(submit);
						submit.form.requestSubmit(submit);
						assert(calls.length === 1 && !status.textContent.trim(), 'one pending write, no early confirmation');
						release();
						await new Promise(resolve => setTimeout(resolve, 0));
						assert(calls.length === 1 && status.textContent.includes('Musik'), 'explicit save and live status: ' + calls.length + ', ' + status.textContent + ', ' + document.querySelector('[role=alert]')?.textContent);
						assert(document.activeElement === select, 'focus restored after save');
						const remove = document.querySelector('button[aria-label="Ta bort Musik"]');
						const readsBefore = reads;
						failure = 'storage';
						remove.click();
						await new Promise(resolve => setTimeout(resolve, 0));
						assert(document.querySelector('[role="alert"]') && document.querySelector('li') && reads === readsBefore + 1, 'failed removal refreshes and preserves the item');
						remove.click();
						await new Promise(resolve => setTimeout(resolve, 0));
						assert(calls.length === 3 && calls[2] === 1 && !document.querySelector('li'), 'explicit removal');
						assert(document.activeElement === select && status.textContent.includes('tagits bort'), 'focus and live status after removal');
						select.value = 'music';
						select.dispatchEvent(new Event('change', { bubbles: true }));
						await tick();
						failure = 'network';
						submit.form.requestSubmit(submit);
						await new Promise(resolve => setTimeout(resolve, 0));
						assert(document.querySelector('li') && !status.textContent.trim() && calls.length === 4, 'lost response refreshes without resend or false success');
						saved.set('music', { item_id: 'music', active: false, revision: 4 });
						document.querySelector('button[aria-label="Ta bort Musik"]').click();
						await new Promise(resolve => setTimeout(resolve, 0));
						assert(!document.querySelector('li') && calls[4] === 3 && document.querySelector('[role="alert"]').textContent.includes('annan flik'), '409 refreshes stale list');
						parent.postMessage([innerWidth, 'PASS'], location.origin);
					} catch (error) {
						parent.postMessage([innerWidth, error.message], location.origin);
					}
				`;

			}
		}, svelte()],
		build: {
			write: false,
			target: 'esnext',
			rollupOptions: { input: 'helpful-fixture', output: { inlineDynamicImports: true } }
		}
	});
	const output = Array.isArray(result) ? result[0] : result;
	if (!('output' in output)) throw new Error('Missing browser bundle');
	const js = output.output.find((entry) => entry.type === 'chunk')?.code;
	const cssAsset = output.output.find((entry) => entry.type === 'asset' && entry.fileName.endsWith('.css'));
	const css = cssAsset?.type === 'asset' ? cssAsset.source : undefined;
	if (!js || !css) throw new Error('Missing browser fixture assets');
	const widths = [320, 390, 1024];
	const server = createServer((request, response) => {
		const path = request.url;
		if (path === '/fixture.js') return response.writeHead(200, { 'Content-Type': 'text/javascript' }).end(js);
		if (path === '/fixture.css') return response.writeHead(200, { 'Content-Type': 'text/css' }).end(css);
		response.setHeader('Content-Type', 'text/html; charset=utf-8');
		response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self'; frame-src 'self'");
		if (path?.startsWith('/component?width=')) return response.end('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"><main></main><script type="module" src="/fixture.js"></script>');
		if (path !== '/') return response.writeHead(404).end();
		return response.end(`<!doctype html><meta charset="utf-8"><output></output><script>
			const widths = ${JSON.stringify(widths)};
			const frame = document.createElement('iframe');
			frame.height = '500';
			let index = 0;
			function nextWidth() {
				frame.width = widths[index];
				frame.src = '/component?width=' + widths[index];
			}
			addEventListener('message', ({ origin, source, data }) => {
				if (origin !== location.origin || source !== frame.contentWindow) return;
				document.querySelector('output').append(data.join(': ') + '; ');
				if (++index < widths.length) nextWidth();
			});
			nextWidth();
			document.body.append(frame);
		</script>`);
	});
	const profile = await mkdtemp(join(tmpdir(), 'mittpsyke-helpful-browser-'));
	try {
		await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
		const address = server.address();
		if (!address || typeof address === 'string') throw new Error('Missing browser test server address');
		const { stdout } = await promisify(execFile)(chrome, [
			'--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', `--user-data-dir=${profile}`,
			'--dump-dom', '--timeout=15000', '--virtual-time-budget=10000', `http://127.0.0.1:${address.port}/`
		], { timeout: 35000 });
		for (const width of widths) expect(stdout).toContain(`${width}: PASS`);
	} finally {
		await new Promise<void>((done) => {
			server.close(() => done());
			server.closeAllConnections();
		});
		if (dirname(resolve(profile)) !== resolve(tmpdir())) throw new Error('Unexpected browser profile path');
		await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}, 65000);