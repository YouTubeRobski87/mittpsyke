import { spawn, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import type { ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, expect, it } from 'vitest';

const chromePath = process.env.CHROME_BIN ?? (process.platform === 'win32'
	? 'C:/Program Files/Google/Chrome/Application/chrome.exe'
	: '/usr/bin/google-chrome');
const diary = '/dagbok/checkin';
const other = '/integritet';
const text = 'Syntetiskt dagboksutkast för regressionstest.';
const field = '.diary-input--editor';
const fixture = {
	access_token: 'synthetic-token',
	user: {
		id: 'synthetic-user',
		email: 'synthetic@example.test',
		user_metadata: {
			health_data_processing_consent: {
				accepted: true,
				type: 'health_data_processing',
				timestamp: '2026-01-01T00:00:00Z',
				policy_version: '2026-04-29'
			}
		}
	}
};

const clientMock = `
	const fixture = ${JSON.stringify(fixture)};
	export function fixtureClient(signedOut) {
		const session = signedOut ? null : fixture;
		return {
			auth: {
				getUser: async () => ({ data: { user: session?.user ?? null }, error: null }),
				getSession: async () => {
					if (typeof window !== 'undefined') await window.testSessionGate;
					return { data: { session } };
				},
				onAuthStateChange: () => {
					if (typeof window !== 'undefined') window.testHydrated = true;
					return { data: { subscription: { unsubscribe() {} } } };
				},
				signOut: async () => {
					window.testSignOutCalls = (window.testSignOutCalls ?? 0) + 1;
					const result = await window.testSignOutGate;
					if (result === 'error') return { error: new Error('Synthetic sign-out error') };
					sessionStorage.setItem('test-sign-out', 'yes');
					document.cookie = 'test-signed-out=yes; path=/';
					return { error: null };
				}
			},
			from: (table) => {
				const fail = typeof window !== 'undefined' && window.testListFails && table === 'diary';
				let query;
				query = new Proxy({}, { get: (_, key) => key === 'then'
					? (next) => Promise.resolve({ data: [], error: fail ? { message: 'Synthetic list error' } : null, count: 0 }).then(next)
					: () => query });
				return query;
			}
		};
	}
	export const supabase = fixtureClient(typeof document !== 'undefined' && document.cookie.includes('test-signed-out=yes'));
`;

let server: ViteDevServer | undefined;
let chrome: ChildProcess | undefined;
let socket: WebSocket | undefined;
let profile: string | undefined;
let base = '';
let nativeDialogs = 0;
let nativeDialogType = '';
let allowTestSetupNavigation = false;
const posts: { body: Record<string, unknown>; response: ServerResponse }[] = [];
let commandId = 0;
const commands = new Map<number, { resolve: (result: unknown) => void; reject: (error: Error) => void }>();

async function until(predicate: () => unknown | Promise<unknown>, label: string) {
	const deadline = Date.now() + 15000;
	while (Date.now() < deadline) {
		if (await predicate()) return;
		await delay(60);
	}
	throw new Error('Timed out waiting for ' + label);
}

function cdp<T = unknown>(method: string, params: object = {}): Promise<T> {
	return new Promise((resolve, reject) => {
		const id = ++commandId;
		commands.set(id, { resolve: (result) => resolve(result as T), reject });
		socket?.send(JSON.stringify({ id, method, params }));
	});
}

async function evaluate<T = unknown>(expression: string, userGesture = false): Promise<T> {
	const response = await cdp<{
		result: { value: T };
		exceptionDetails?: { exception?: { description: string }; text: string };
	}>('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true, userGesture });
	if (response.exceptionDetails) {
		throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
	}
	return response.result.value;
}

async function go(path: string) {
	const previousDocument = await evaluate<number>('performance.timeOrigin');
	allowTestSetupNavigation = true;
	try {
		await cdp('Page.navigate', { url: base + path });
		await until(() => evaluate(`document.body && location.pathname + location.search === ${JSON.stringify(path)}
			&& performance.timeOrigin !== ${previousDocument}`), path);
	} finally {
		allowTestSetupNavigation = false;
	}
}

const click = (selector: string) => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`, true);
const button = (label: string) => evaluate(`(() => {
	const target = [...document.querySelectorAll('button')].find((element) =>
		element.getClientRects().length && element.textContent.trim() === ${JSON.stringify(label)});
	if (!target) throw new Error('Button missing: ' + ${JSON.stringify(label)});
	target.focus();
	target.click();
})()`, true);
const value = (selector = field) => evaluate<string>(`document.querySelector(${JSON.stringify(selector)})?.value`);
const openDialog = () => evaluate<boolean>('Boolean(document.querySelector("dialog[open]"))');
const waitForDialog = () => until(openDialog, 'discard dialog');
const waitForEditor = () => until(() => evaluate(`Boolean(document.querySelector('${field}'))`), 'editor');
const bodyIncludes = (label: string) => evaluate<boolean>('document.body?.innerText.includes(' + JSON.stringify(label) + ')');

async function edit() {
	await until(() => evaluate('window.testHydrated'), 'hydration');
	await until(() => bodyIncludes('Börja skriva'), 'start button');
	await button('Börja skriva');
	await waitForEditor();
}

async function type(content = text, selector = field) {
	await evaluate(`document.querySelector(${JSON.stringify(selector)}).focus()`, true);
	await cdp('Input.insertText', { text: content });
}

async function key(name: string, code: number) {
	await cdp('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: name, code: name, windowsVirtualKeyCode: code });
	await cdp('Input.dispatchKeyEvent', { type: 'keyUp', key: name, code: name, windowsVirtualKeyCode: code });
}

function reply(index: number, status: number, body: object) {
	posts[index].response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

beforeAll(async () => {
	expect(existsSync(chromePath), 'Set CHROME_BIN to a local Chrome installation').toBe(true);
	profile = await mkdtemp(join(tmpdir(), 'mittpsyke-diary-browser-'));
	server = await createServer({
		envDir: profile,
		logLevel: 'error',
		server: { host: '127.0.0.1', port: 0 },
		optimizeDeps: { entries: [
			'src/routes/+layout.svelte', 'src/routes/+page.svelte', 'src/routes/dagbok/checkin/+page.svelte',
			'src/routes/chat/+page.svelte',
			'src/routes/dagbok/+page.svelte', 'src/routes/integritet/+page.svelte', 'src/routes/login/+page.svelte'
		] },
		plugins: [{
			name: 'diary-browser-fixtures',
			enforce: 'pre',
			load(id) {
				const path = id.replaceAll('\\', '/');
				if (path.endsWith('/src/lib/supabase.ts')) return clientMock;
				if (path.endsWith('/src/hooks.server.ts')) {
					return `import { fixtureClient } from './lib/supabase';
						export const handle = ({ event, resolve }) => {
							event.locals.supabase = fixtureClient(event.cookies.get('test-signed-out') === 'yes');
							return resolve(event);
						};`;
				}
			},
			configureServer(vite) {
				vite.middlewares.use((req, res, next) => {
					res.setHeader('Content-Security-Policy', "connect-src 'self'; form-action 'self'");
					if (!req.url?.startsWith('/api/')) return next();
					if (req.url === '/api/diary/create' && req.method === 'POST') {
						let raw = '';
						req.on('data', (chunk) => { raw += chunk; });
						req.on('end', () => posts.push({ body: JSON.parse(raw), response: res }));
						return;
					}
					res.writeHead(200, { 'Content-Type': 'application/json' }).end('{}');
				});
			}
		}]
	});
	await server.listen();
	const address = server.httpServer?.address();
	if (!address || typeof address === 'string') throw new Error('Local Vite server unavailable');
	base = 'http://127.0.0.1:' + address.port;
	chrome = spawn(chromePath, [
		'--headless=new', '--no-sandbox', '--disable-background-networking', '--no-first-run',
		'--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank'
	], { windowsHide: true, stdio: 'ignore' });
	let port = '';
	await until(async () => {
		port = (await readFile(join(profile!, 'DevToolsActivePort'), 'utf8').catch(() => '')).split('\n')[0];
		return port;
	}, 'Chrome CDP');
	const targets = await fetch('http://127.0.0.1:' + port + '/json/list').then((response) => response.json()) as
		{ type: string; webSocketDebuggerUrl: string }[];
	socket = new WebSocket(targets.find((target) => target.type === 'page')!.webSocketDebuggerUrl);
	await new Promise<void>((resolve, reject) => {
		socket!.addEventListener('open', () => resolve(), { once: true });
		socket!.addEventListener('error', reject, { once: true });
	});
	socket.addEventListener('message', (event) => {
		const message = JSON.parse(event.data);
		if (message.method === 'Page.javascriptDialogOpening') {
			nativeDialogs += 1;
			nativeDialogType = message.params.type;
			void cdp('Page.handleJavaScriptDialog', { accept: allowTestSetupNavigation });
		}
		const command = commands.get(message.id);
		if (!command) return;
		commands.delete(message.id);
		if (message.error) command.reject(new Error(message.error.message));
		else command.resolve(message.result);
	});
	await cdp('Page.enable');
	await cdp('Network.enable');
	await cdp('Network.setBlockedURLs', { urls: ['https://*'] });
	await go(other);
}, 120000);

afterAll(async () => {
	socket?.close();
	if (chrome && chrome.exitCode === null) {
		const exited = new Promise((resolve) => chrome!.once('exit', resolve));
		chrome.kill();
		await exited;
	}
	for (const post of posts) if (!post.response.writableEnded) post.response.destroy();
	await server?.close();
	if (profile && dirname(resolve(profile)) === resolve(tmpdir()) && profile.includes('mittpsyke-diary-browser-')) {
		await rm(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
	}
}, 20000);

it('skyddar stängning, riktig intern navigering och historik och bevarar fokus', async () => {
	await until(() => evaluate('window.testHydrated'), 'layout hydration');
	const documentId = await evaluate('performance.timeOrigin');
	await evaluate(`const diaryLink = document.createElement('a');
		diaryLink.href = '${diary}'; diaryLink.id = 'test-diary-link'; document.body.append(diaryLink);`);
	await click('#test-diary-link');
	await edit();
	await button('Stäng skrivytan');
	await until(() => evaluate(`!document.querySelector('${field}')`), 'clean editor closed');
	expect(await openDialog()).toBe(false);
	await edit();
	await type();
	for (const width of [320, 360, 390, 430]) {
		await cdp('Emulation.setDeviceMetricsOverride', { width, height: 650, deviceScaleFactor: 1, mobile: true });
		await cdp('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
		await button('Stäng skrivytan');
		await waitForDialog();
		if (width === 320) {
			const { nodes } = await cdp<{ nodes: { role?: { value: string }; name?: { value: string } }[] }>(
				'Accessibility.getFullAXTree'
			);
			expect(nodes).toEqual(expect.arrayContaining([
				expect.objectContaining({
					role: expect.objectContaining({ value: 'dialog' }),
					name: expect.objectContaining({ value: 'Vill du lämna skrivytan?' })
				})
			]));
		}
		expect(await evaluate(`(() => {
			const dialog = document.querySelector('dialog[open]');
			const rect = dialog.getBoundingClientRect();
			return rect.left >= 0 && rect.right <= innerWidth && dialog.scrollWidth <= dialog.clientWidth
				&& getComputedStyle(dialog).animationName === 'none'
				&& Boolean(dialog.getAttribute('aria-labelledby') && dialog.getAttribute('aria-describedby'))
				&& document.activeElement.textContent.trim() === 'Fortsätt skriva';
		})()`)).toBe(true);
		await key('Tab', 9);
		expect(await evaluate('document.activeElement.textContent.trim()')).toBe('Lämna utan att spara');
		await key('Escape', 27);
		expect(await openDialog()).toBe(false);
		expect(await evaluate('document.activeElement.textContent.trim()')).toBe('Stäng skrivytan');
		expect(await value()).toBe(text);
	}
	await click('footer a[href="/integritet"]');
	await waitForDialog();
	await button('Fortsätt skriva');
	expect(await value()).toBe(text);
	expect(await evaluate('location.pathname')).toBe(diary);
	await evaluate('history.back()');
	await waitForDialog();
	await button('Fortsätt skriva');
	expect(await value()).toBe(text);
	await evaluate('history.back()');
	await waitForDialog();
	await button('Lämna utan att spara');
	await until(() => evaluate(`location.pathname === '${other}' && !document.querySelector('${field}')`), 'back navigation');
	expect(await evaluate('performance.timeOrigin')).toBe(documentId);
	await evaluate('history.forward()');
	await edit();
	expect(await value()).toBe('');
	await click('footer a[href="/integritet"]');
	await until(() => evaluate(`location.pathname === '${other}'`), 'clean internal navigation');
	await evaluate('history.back()');
	await edit();
	await type();
	await evaluate('history.forward()');
	await waitForDialog();
	await button('Fortsätt skriva');
	expect(await value()).toBe(text);
	await click('footer a[href="/integritet"]');
	await waitForDialog();
	await button('Lämna utan att spara');
	await until(() => evaluate(`location.pathname === '${other}' && !document.querySelector('${field}')`), 'internal navigation');
	expect(nativeDialogs).toBe(0);
}, 120000);

it('visar webbläsarens varning bara vid omladdning med osparat innehåll', async () => {
	await go(diary);
	nativeDialogs = 0;
	await edit();
	await type();
	await cdp('Page.reload');
	await until(() => nativeDialogs === 1, 'native reload warning');
	expect(nativeDialogType).toBe('beforeunload');
	expect(await openDialog()).toBe(false);
	expect(await value()).toBe(text);
	await button('Stäng skrivytan');
	await waitForDialog();
	await button('Lämna utan att spara');
	await until(() => evaluate(`!document.querySelector('${field}')`), 'discarded draft');
	const before = await evaluate('performance.timeOrigin');
	await cdp('Page.reload');
	await until(() => evaluate('performance.timeOrigin !== ' + before), 'clean reload');
	expect(nativeDialogs).toBe(1);
}, 45000);

it('låser före och efter POST, hanterar dubbelklick, fel, okänt utfall och separat listfel', async () => {
	await go(diary);
	nativeDialogs = 0;
	await edit();
	await type();
	await evaluate(`document.querySelector('#draft-mood').value = '7';
		document.querySelector('#draft-mood').dispatchEvent(new Event('input', { bubbles: true }));
		window.testSessionGate = new Promise(resolve => window.releaseTestSession = resolve);
		document.querySelector('.editor-primary').click();
		document.querySelector('.editor-primary').click();`);
	await until(() => bodyIncludes('Sparar inlägget…'), 'saving status');
	expect(posts).toHaveLength(0);
	await cdp('Emulation.setDeviceMetricsOverride', { width: 360, height: 320, deviceScaleFactor: 1, mobile: true });
	expect(await evaluate(`(() => {
		const status = document.querySelector('.editor-save-status');
		document.querySelector('.editor-primary').scrollIntoView({ block: 'center' });
		const rect = status.getBoundingClientRect();
		return rect.top >= 0 && rect.bottom <= visualViewport.height;
	})()`)).toBe(true);
	expect(await evaluate(`['${field}', '#draft-mood', '#draft-image-input', '.editor-primary', '.editor-secondary']
		.every(selector => document.querySelector(selector).matches(':disabled'))`)).toBe(true);
	await cdp('Input.insertText', { text: 'Text under sparning' });
	expect(await value()).toBe(text);
	await evaluate('window.releaseTestSession()');
	await until(() => posts.length === 1, 'first POST');
	expect(posts[0].body).toMatchObject({ text, mood: '7', image_url: null, video_path: null });
	await click('.editor-primary');
	expect(await value()).toBe(text);
	reply(0, 500, { success: false, error: 'Syntetiskt sparfel' });
	await until(() => bodyIncludes('Syntetiskt sparfel'), 'known failure');
	expect(await value()).toBe(text);
	expect(await value('#draft-mood')).toBe('7');
	expect(await evaluate(`document.querySelector('${field}').matches(':disabled')`)).toBe(false);
	await button('Spara inlägg');
	await until(() => posts.length === 2, 'second POST');
	// Skicka ofullständigt svar så att Chrome får avbrottet efter svarshuvudena.
	const interrupted = posts[1].response;
	interrupted.writeHead(200, { 'Content-Type': 'application/json', 'Content-Length': 999 });
	interrupted.write('{"success":');
	await delay(100);
	interrupted.destroy();
	await until(() => bodyIncludes('Vi kunde inte bekräfta om inlägget sparades.'), 'unknown outcome');
	expect(await value()).toBe(text);
	expect(posts).toHaveLength(2);
	await evaluate('window.testListFails = true');
	await button('Spara inlägg');
	await until(() => posts.length === 3, 'third POST');
	expect(await value()).toBe(text);
	reply(2, 200, { success: true, diary: { id: 'synthetic-entry' } });
	await until(() => bodyIncludes('Inlägget är sparat'), 'save receipt');
	await until(() => evaluate(`Boolean(document.querySelector('[data-testid="diary-list-refresh-notice"]'))`), 'list refresh notice');
	expect(await value()).toBe('');
	expect(await bodyIncludes('Syntetiskt sparfel')).toBe(false);
	expect(await evaluate(`Object.values(localStorage).some(value => value.includes(${JSON.stringify(text)}))`)).toBe(false);
	await click('footer a[href="/integritet"]');
	await until(() => evaluate(`location.pathname === '${other}'`), 'navigation after save');
	expect(await openDialog()).toBe(false);
	expect(nativeDialogs).toBe(0);
	expect(posts).toHaveLength(3);
}, 45000);

it('skyddar utloggning före signOut och låter gästen återuppta lokalt utkast', async () => {
	await go(diary);
	nativeDialogs = 0;
	await cdp('Emulation.setDeviceMetricsOverride', { width: 390, height: 650, deviceScaleFactor: 1, mobile: true });
	await edit();
	await type();
	await click('.mobile-menu-button');
	await button('Logga ut');
	await waitForDialog();
	expect(await evaluate("sessionStorage.getItem('test-sign-out')")).toBe(null);
	await button('Fortsätt skriva');
	expect(await value()).toBe(text);
	await type(' Mer text.');
	expect(await value()).toBe(text + ' Mer text.');
	await button('Logga ut');
	await waitForDialog();
	await evaluate('void (window.testSignOutGate = new Promise(resolve => window.releaseTestSignOut = resolve))');
	await button('Lämna utan att spara');
	await until(() => evaluate('window.testSignOutCalls === 1'), 'pending sign-out');
	await type('Ny syntetisk text under utloggning.');
	expect(await value(), 'text typed after discard while signOut is pending').toBe('');
	await until(() => bodyIncludes('Loggar ut…'), 'sign-out status');
	expect(await evaluate(`document.querySelector('${field}').matches(':disabled')
		&& document.querySelector('.editor-primary').disabled`)).toBe(true);
	const postCount = posts.length;
	await click('.editor-primary');
	expect(posts).toHaveLength(postCount);
	expect(await openDialog()).toBe(false);
	await click('.mobile-menu-button');
	await evaluate(`const logout = [...document.querySelectorAll('#mobile-menu button')]
		.find(button => button.textContent.trim() === 'Logga ut');
		logout.click();
		logout.click();`, true);
	expect(await evaluate('window.testSignOutCalls')).toBe(1);
	expect(await openDialog()).toBe(false);
	await evaluate("window.releaseTestSignOut('error')");
	await until(() => bodyIncludes('Utloggningen kunde inte bekräftas.'), 'sign-out error');
	expect(await evaluate('location.pathname')).toBe(diary);
	expect(await evaluate("sessionStorage.getItem('test-sign-out')")).toBe(null);
	await type('Text efter utloggningsfel.');
	expect(await value()).toBe('Text efter utloggningsfel.');
	if (!await evaluate('Boolean(document.querySelector("#mobile-menu"))')) await click('.mobile-menu-button');
	await button('Logga ut');
	await waitForDialog();
	await evaluate('void (window.testSignOutGate = new Promise(resolve => window.releaseTestSignOut = resolve))');
	await button('Lämna utan att spara');
	await until(() => evaluate('window.testSignOutCalls === 2'), 'pending sign-out retry');
	expect(await value()).toBe('');
	await evaluate("window.releaseTestSignOut('success')");
	await until(() => evaluate("location.pathname === '/login' && sessionStorage.getItem('test-sign-out') === 'yes'"), 'confirmed logout');
	expect(nativeDialogs).toBe(0);
	await go('/dagbok?action=new');
	await until(() => evaluate('document.activeElement === document.querySelector("#guest-entry textarea")'), 'guest editor hydration');
	await type(text, 'textarea');
	await until(() => evaluate(`localStorage.getItem('mittpsyke_guest_entry') === ${JSON.stringify(text)}`), 'guest autosave');
	await cdp('Page.reload');
	await until(() => bodyIncludes('Fortsätt där jag var'), 'guest recovery');
	await button('Fortsätt där jag var');
	await until(async () => await value('textarea') === text, 'restored guest text');
	expect(await value('textarea')).toBe(text);
	expect(nativeDialogs).toBe(0);
}, 45000);


it('låter gästen skriva direkt från startsidan och hitta tillbaka till utkastet på mobil och dator', async () => {
	const guestField = '#guest-entry textarea';
	const sentence = 'I dag gick jag till biblioteket.';
	await evaluate("document.cookie = 'test-signed-out=yes; path=/'");
	for (const [width, height] of [[390, 844], [1440, 900]]) {
		await cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
		await go('/');
		await evaluate('localStorage.clear()');
		await until(() => bodyIncludes('Chatta med AI'), 'public home');
		await click('.hero-actions .cta-primary');
		await until(() => evaluate(`document.activeElement === document.querySelector('${guestField}')`), 'focused guest field');
		await until(() => evaluate(`(() => {
			const rect = document.activeElement.getBoundingClientRect();
			const header = document.querySelector('.site-header').getBoundingClientRect();
			return rect.top >= header.bottom && rect.bottom <= visualViewport.height
				&& document.documentElement.scrollWidth <= innerWidth;
		})()`), `visible guest field at ${width}px`);
		await cdp('Input.insertText', { text: sentence });
		await until(() => evaluate(`localStorage.getItem('mittpsyke_guest_entry') === ${JSON.stringify(sentence)}`), 'guest draft saved');
		await cdp('Page.reload');
		await until(() => bodyIncludes('Fortsätt där jag var'), 'guest draft recovery');
		await button('Fortsätt där jag var');
		await until(async () => await value(guestField) === sentence, 'restored sentence');

		await go('/');
		await click('.hero-chat-choice a[href="/chat"]');
		await until(() => evaluate("location.pathname === '/chat'"), 'guest chat route');
		await until(() => bodyIncludes('Jag samtycker och vill fortsätta'), 'guest chat consent');

		await go('/');
		await click('.evening-actions a');
		await until(() => evaluate(`location.pathname === '/login' &&
			new URLSearchParams(location.search).get('redirect') === '/dashboard/kvallsstugan'`), 'evening check-in login');
	}
}, 90000);
