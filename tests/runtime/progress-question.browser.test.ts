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
					const calls = [];
					let consentWrites = 0;
					window.fetch = (url, options) => new Promise(resolve => {
						if (url === '/api/consent/diary-ai') {
							consentWrites++;
							resolve({ok:true});
							return;
						}
						if (url !== '/api/diary/insights/summary') throw new Error('Unexpected request');
						calls.push({
							body:JSON.parse(options.body), signal:options.signal,
							requireConsent:() => resolve({status:403,ok:false,json:async()=>({reason:'ai-consent'})}),
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
							get view(){return reactive.current;},get active(){return active.current === 'insights';}
						}});
						await tick();
						const tab = id => document.getElementById('progress-tab-' + id);
						const themeSelect = () => document.querySelector('.personal-reflection-card select');
						const chooseTheme = (id) => {
							themeSelect().value = id;
							themeSelect().dispatchEvent(new Event('change', {bubbles:true}));
						};
						assert(!ai() && !themeSelect().value && calls.length===0,'no preselection or request');
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
						assert(!panel('insights').hidden && panel('mood').hidden && calls.length === 0, 'tabs do not request AI');
						const radios = () => [...document.querySelectorAll('input[type="radio"][name="progress-question-source"]')];
						const assertUnselected = () => assert(
							radios().length === 3 && !radios().some(radio => radio.checked) && !ai(),
							'three choices, no preselection or request button'
						);
						evidence('Sömn').click();
						await tick();
						assert(!radios().length, 'evidence has no question controls');
						chooseTheme('Sömn');
						await tick();
						assertUnselected();
						assert(calls.length === 0, 'opening evidence does not send');
						assert(radios().map(radio => radio.closest('label').querySelector('span span').textContent).join('|') ===
							themes[0].evidence.slice(1,4).map(x=>x.excerpt).join('|'), 'only eligible excerpts are selectable');
						assert(document.querySelectorAll('#evidence-Sömn blockquote').length === 5, 'additional excerpts and links remain');
						radios()[0].focus();
						assert(document.activeElement === radios()[0] && radios()[0].tabIndex === 0 &&
							getComputedStyle(radios()[0]).outlineStyle !== 'none', 'radio keyboard focus');
						radios()[0].click();
						await tick();
						assert(calls.length === 0 && ai()?.textContent.trim() === 'Skapa min reflektionsfråga', 'selection requires explicit click');
						const notice = document.getElementById(ai().getAttribute('aria-describedby'));
						assert(notice?.textContent.includes('Bara det valda utdraget behandlas av OpenAI') &&
							notice.getBoundingClientRect().bottom <= ai().getBoundingClientRect().top, 'processing notice above the button');
						if (innerWidth <= 640) {
							const button = ai().getBoundingClientRect();
							const actions = ai().parentElement.getBoundingClientRect();
							assert(button.width === actions.width && button.height >= 44, 'full-width mobile button');
						}
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
						chooseTheme('Motion');
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
						document.querySelectorAll('[aria-label="Välj tidsperiod"] button')[1].click();
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
						calls[3].requireConsent();
						await until(() => document.body.textContent.includes('Innan AI tar fram en fråga'));
						assert(consentWrites === 0, 'consent requires a user action');
						document.querySelector('.personal-reflection-card [role="dialog"] button').click();
						await until(() => calls.length === 5);
						assert(consentWrites === 1 && calls[4].body.snapshotId === calls[3].body.snapshotId, 'consent retry uses the same excerpt');
						tab('mood').click();
						await tick();
						assert(calls[4].signal.aborted && !panel('mood').hidden, 'leaving insights aborts');
						calls[4].reply('Inaktiv flik?');
						tab('insights').click();
						await tick();
						assertUnselected();
						assert(calls.length === 5 && !document.body.textContent.includes('Inaktiv flik?'), 'late tab response ignored');
						radios()[1].click();
						await tick();
						ai().click();
						await until(() => calls.length === 6);
						calls[5].reply('Finns det något i det här utdraget som du vill stanna upp vid?', 'mittpsyke');
						await until(() => document.body.textContent.includes('Allmän reflektionsfråga från MittPsyke.'));
						const link = [...document.querySelectorAll('a')].find(a => a.textContent.includes('Läs anteckningen som frågan bygger på'));
						assert(link?.closest('.personal-reflection-card') && link.getAttribute('href').includes('anteckning=entry-1-2'), 'answer links to selected diary entry');
						assert(document.querySelector('#ai-question-source-2 label span span')?.textContent === themes[1].evidence[2].excerpt, 'selected source retained');
						link.focus();
						assert(document.activeElement === link && link.tabIndex === 0 && getComputedStyle(link).outlineStyle !== 'none', 'source link focus');
						for (const id of ['insights','mood','place','development']) {
							tab(id).click();
							await tick();
							assert(document.documentElement.scrollWidth <= document.documentElement.clientWidth, 'horizontal overflow: ' + id);
						}
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
