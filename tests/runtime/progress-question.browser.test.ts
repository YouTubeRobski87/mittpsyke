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

it('knyter frågan till markerade utdrag och släpper svar för en tidigare vy', async () => {
	const result = await build({
		configFile: false,
		logLevel: 'error',
		resolve: { alias: { '$lib': resolve('src/lib') } },
		plugins: [{
			name: 'progress-question-browser-fixture',
			enforce: 'pre',
			resolveId(id) {
				if (id === 'progress-question-fixture') return '\0' + id;
				if (id.endsWith('/supabase')) return '\0supabase-stub';
			},
			load(id) {
				if (id === '\0supabase-stub') return 'export const supabase = { auth: { getSession: async () => ({ data: { session: { access_token: "test" } } }) } };';
				if (id === '\0progress-question-fixture') return `
					import { mount, tick } from 'svelte';
					import { writable, fromStore } from 'svelte/store';
					import Card from '/src/lib/components/progress/LighterDaysCard.svelte';

					const themes = ['Sömn','Motion'].map((id, i) => ({
						id, label:id, count:4, base:6, otherCount:1, otherBase:8, weekCount:2,
						note:'Fanns med i flera anteckningar.', comparison:'I övriga inlägg: 1 av 8.',
						evidence:['Kort notis.', 'Jag valde att vila en stund till.', 'Jag kände mig trött efter middagen.', 'Jag ville lämna lite tid för mig själv.', 'Efteråt läste jag en stund i köket.'].map((excerpt,j) => ({
							entryId:'entry-'+i+'-'+j, date:'2026-06-0'+(j+1), dateLabel:(j+1)+' juni', mood:8, excerpt
						}))
					}));
					const view = {periodDays:30, lowConfidence:false, themes, hiddenThemes:[], helpfulPatterns:{ready:true,themes}};
					const views = writable(view);
					const reactive = fromStore(views);
					const calls = [];
					window.fetch = (url, options) => new Promise(resolve => {
						if (url !== '/api/diary/insights/summary') throw new Error('Unexpected request');
						calls.push({
							body:JSON.parse(options.body), signal:options.signal,
							reply:(question, questionOrigin = 'ai') => resolve({
								status:200,ok:true,json:async()=>({question,sourceRef:JSON.parse(options.body).sourceRef,questionOrigin,reason:null})
							})
						});
					});
					const until = async (predicate) => {
						for (let i=0;i<100;i++) {
							if (predicate()) return;
							await new Promise(resolve=>setTimeout(resolve,20));
						}
						throw new Error('browser timeout');
					};
					const ai = () => document.querySelector('[data-testid="lighter-days-ai-button"]');
					const evidence = (id) => document.querySelector('[aria-controls="evidence-' + id + '"]');
					const assert = (ok,message) => { if (!ok) throw new Error(message); };

					try {
						mount(Card,{target:document.querySelector('main'),props:{get view(){return reactive.current;}}});
						await tick();
						assert(!ai() && calls.length===0,'initially no question or request');
						const radios = () => [...document.querySelectorAll('input[type="radio"][name="progress-question-source"]')];
						const assertUnselected = () => assert(
							radios().length === 3 && !radios().some(radio => radio.checked) && !ai(),
							'three choices, no preselection or request button'
						);
						evidence('Sömn').click();
						await tick();
						assertUnselected();
						assert(calls.length === 0, 'opening evidence does not send');
						assert(radios().map(radio => radio.closest('li').querySelector('blockquote').textContent).join('|') ===
							themes[0].evidence.slice(1,4).map(x=>x.excerpt).join('|'), 'only eligible excerpts are selectable');
						assert(document.querySelectorAll('#evidence-Sömn blockquote').length === 5, 'additional excerpts and links remain');
						radios()[0].focus();
						assert(document.activeElement === radios()[0] && radios()[0].tabIndex === 0 &&
							getComputedStyle(radios()[0]).outlineStyle !== 'none', 'radio keyboard focus');
						radios()[0].click();
						await tick();
						assert(calls.length === 0 && ai()?.textContent.trim() === 'Få en fråga att fundera på', 'selection requires explicit click');
						assert(document.body.textContent.includes('Bara det valda utdraget behandlas av OpenAI'), 'single source notice');
						ai().focus();
						assert(document.activeElement === ai() && ai().tabIndex === 0 &&
							getComputedStyle(ai()).outlineStyle !== 'none', 'request button keyboard focus');
						ai().click();
						await until(() => calls.length === 1);
						assert(calls[0].body.themeId === 'Sömn' && calls[0].body.period === 30 &&
							calls[0].body.sourceRef === 1 && Object.keys(calls[0].body).length === 4, 'scoped request');
						radios()[1].click();
						await tick();
						assert(calls[0].signal.aborted && ai(), 'selection change aborts');
						calls[0].reply('Inaktuellt utdrag?');
						await tick();
						assert(!document.body.textContent.includes('Inaktuellt utdrag?'), 'late source response ignored');
						ai().click();
						await until(() => calls.length === 2);
						assert(calls[1].body.sourceRef === 2 &&
							calls[1].body.snapshotId !== calls[0].body.snapshotId, 'selection is bound to snapshot');
						evidence('Motion').click();
						await tick();
						assert(calls[1].signal.aborted, 'theme change aborts');
						assertUnselected();
						calls[1].reply('Inaktuellt tema?');
						await tick();
						assert(!document.body.textContent.includes('Inaktuellt tema?'), 'late theme response ignored');
						radios()[0].click();
						await tick();
						ai().click();
						await until(() => calls.length === 3);
						views.set({...view,periodDays:90});
						await tick();
						assert(calls[2].signal.aborted, 'period change aborts');
						assertUnselected();
						calls[2].reply('Inaktuell period?');
						await tick();
						assert(!document.body.textContent.includes('Inaktuell period?'), 'late period response ignored');
						radios()[1].click();
						await tick();
						ai().click();
						await until(() => calls.length === 4);
						assert(calls[3].body.themeId === 'Motion' && calls[3].body.period === 90 &&
							calls[3].body.sourceRef === 2, 'new view request');
						calls[3].reply('Finns det något i det här utdraget som du vill stanna upp vid?', 'mittpsyke');
						await until(() => document.body.textContent.includes('Allmän reflektionsfråga från MittPsyke.'));
						const link = [...document.querySelectorAll('a')].find(a => a.textContent.includes('Läs anteckningen som frågan bygger på'));
						assert(link?.closest('#evidence-Motion') && link.getAttribute('href').includes('anteckning=entry-1-2'), 'answer links to selected diary entry');
						assert(document.querySelector('#ai-question-source-2 blockquote')?.textContent === themes[1].evidence[2].excerpt, 'selected source retained');
						link.focus();
						assert(document.activeElement === link && link.tabIndex === 0 && getComputedStyle(link).outlineStyle !== 'none', 'source link focus');
						assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth, 'horizontal overflow');
						parent.postMessage([innerWidth,'PASS'],location.origin);
					} catch(error) {
						parent.postMessage([innerWidth,error.message],location.origin);
					}
				`;

			}
		}, svelte()],
		build: {
			write: false,
			target: 'esnext',
			rollupOptions: { input: 'progress-question-fixture', output: { inlineDynamicImports: true } }
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
		response.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; frame-src 'self'");
		if (path?.startsWith('/component?width=')) return response.end('<!doctype html><meta charset="utf-8"><link rel="stylesheet" href="/fixture.css"><main style="--primary:145 35% 24%;--foreground:140 20% 11%;--border:130 10% 85%;--ring:145 35% 24%;--muted-foreground:130 7% 30%"></main><script type="module" src="/fixture.js"></script>');
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
	const profile = await mkdtemp(join(tmpdir(), 'mittpsyke-question-browser-'));
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
