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

it('flikar, diagram och underlag fungerar utan AI-anrop', async () => {
	const result = await build({
		configFile: false,
		logLevel: 'error',
		resolve: { alias: { '$lib': resolve('src/lib') } },
		plugins: [{
			name: 'progress-tabs-browser-fixture',
			enforce: 'pre',
			resolveId(id) {
				if (id === 'progress-tabs-fixture') return '\0' + id;
				if (id.endsWith('/supabase')) return '\0supabase-stub';
			},
			load(id) {
				if (id === '\0supabase-stub') return 'export const supabase = { auth: { getSession: async () => ({ data: { session: { access_token: "test" } } }) } };';
				if (id === '\0progress-tabs-fixture') return `
					import { mount, tick } from 'svelte';
					import { writable, fromStore } from 'svelte/store';
					import Card from '/src/lib/components/progress/LighterDaysCard.svelte';
					import Tabs from '/src/lib/components/progress/ProgressTabs.svelte';
					import PeriodPicker from '/src/lib/components/ProgressPeriodPicker.svelte';
					import Chart from '/src/lib/components/RecentPeriodChart.svelte';
					import { buildMoodTimelineView } from '/src/lib/progress-reflection.ts';

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
					const active = fromStore(writable('insights'));
					const timeline = () => buildMoodTimelineView([
						{ date: '2026-06-01', mood: 5 }, { date: '2026-06-02', mood: 6 }, { date: '2026-06-03', mood: 8 }, { date: '2026-06-04', mood: 7 }
					], reactive.current.periodDays, new Date('2026-06-04T12:00:00Z'));
					const requests = [];
					// Fliken Framsteg får inte göra några AI-anrop alls: varje förfrågan registreras.
					window.fetch = (url) => { requests.push(String(url)); return new Promise(() => {}); };
					const evidence = (id) => document.querySelector('[aria-controls="evidence-' + id + '"]');
					const assert = (ok,message) => { if (!ok) throw new Error(message); };

					try {
						const root = document.querySelector('main');
						for (const id of ['place','insights','mood','development']) {
							const panel = document.createElement('section');
							panel.id = 'progress-panel-' + id;
							panel.setAttribute('role','tabpanel');
							panel.setAttribute('aria-labelledby','progress-tab-' + id);
							panel.hidden = id !== active.current;
							root.append(panel);
						}
						const panel = id => document.getElementById('progress-panel-' + id);
						mount(Tabs,{target:root,anchor:panel('place'),props:{
							get active(){return active.current;},
							onSelect(id){
								active.current = id;
								for (const element of root.querySelectorAll('[role="tabpanel"]')) element.hidden = element !== panel(id);
							}
						}});
						mount(PeriodPicker,{target:root,anchor:panel('place'),props:{
							get period(){return reactive.current.periodDays;},
							onSelect(periodDays){views.set({...view,periodDays});}
						}});
						mount(Chart,{target:panel('mood'),props:{
							get points(){return timeline().points;},
							get period(){return reactive.current.periodDays;},
							get hasChart(){return timeline().hasChart;},
							get textAlternative(){return timeline().textAlternative;},
							onSelectPeriod() {}, options: [], fallbackText:'Saknar värden'
						}});
						mount(Card,{target:panel('insights'),props:{
							get view(){return reactive.current;}
						}});
						await tick();
						const tab = id => document.getElementById('progress-tab-' + id);
						assert(!document.querySelector('.personal-reflection-card'), 'reflection question removed');
						tab('insights').focus();
						const press = key => document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
						for (const [key,id] of [['Home','place'],['ArrowLeft','development'],['End','development'],['ArrowLeft','mood']]) {
							press(key);
							await tick();
							assert(document.activeElement === tab(id) && tab(id).ariaSelected === 'true' &&
								tab(id).tabIndex === 0 && !panel(id).hidden && tab(id).getAttribute('aria-controls') === panel(id).id,
								'keyboard navigation and selected panel: ' + id);
						}
						const plot = panel('mood').querySelector('svg');
						assert(plot?.getBoundingClientRect().width > 0 && plot.querySelector('polyline'), 'chart visible after tab change');
						press('ArrowLeft');
						await tick();
						assert(!panel('insights').hidden && panel('mood').hidden, 'insights panel selected');
						evidence('Sömn').click();
						await tick();
						assert(document.querySelectorAll('#evidence-Sömn blockquote').length === 5, 'all excerpts shown');
						assert(!document.querySelector('input[type="radio"]'), 'evidence has no question controls');
						document.querySelectorAll('[aria-label="Välj tidsperiod"] button')[1].click();
						await tick();
						for (const id of ['insights','mood','place','development']) {
							tab(id).click();
							await tick();
							assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth, 'horizontal overflow: ' + id);
						}
						assert(requests.length === 0, 'no requests: ' + requests.join(','));
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
			rollupOptions: { input: 'progress-tabs-fixture', output: { inlineDynamicImports: true } }
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
