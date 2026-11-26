// Webbläsartest (Playwright, riktig Chromium) för att en tidigare användares
// chattinnehåll försvinner när sessionen avslutas: vanlig utloggning, andra
// flikar, kontobyte, utgången session, kontoradering, bakåtknappen och ett
// AI-svar som kommer efter utloggningen.
//
// Bara syntetiska användare och data. Supabase och AI-anropen är ersatta med
// lokala fejkar, och all trafik ut från webbläsaren är blockerad.
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { chromium, type Browser, type Page } from 'playwright-core';
import { createServer, type ViteDevServer } from 'vite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const chromePath = process.env.CHROME_BIN ?? '/usr/bin/google-chrome';
const CHAT = '/chat/samtal';
const USER_A = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const SECRET_A = 'SYNTETISK-HEMLIGHET-A';
const SECRET_B = 'SYNTETISK-HISTORIK-B';
const LATE_REPLY = 'SENT-AI-SVAR-EFTER-UTLOGGNING';

// Fejkad Supabase-klient för både server och webbläsare. Sessionen ligger i
// en cookie, så alla flikar i samma webbläsarkontext delar den. Auth-händelser
// skickas mellan flikar med BroadcastChannel, som den riktiga klienten gör.
// chat_history ligger i localStorage under en testnyckel (delas av flikarna).
const clientMock = `
	const consent = { accepted: true, type: 'health_data_processing', timestamp: '2026-01-01T00:00:00Z', policy_version: '2026-04-29' };
	const user = (id) => ({ id, email: id.slice(0, 1) + '@example.test', is_anonymous: false,
		user_metadata: { health_data_processing_consent: consent } });
	const readCookie = (source) => (source.match(/(?:^|; )test-user=([^;]+)/) || [])[1] || null;
	const sessionFor = (id) => (id ? { access_token: 'syntetisk-token-' + id, user: user(id) } : null);
	const DB_KEY = '__test_db_chat_history';
	const readDb = () => JSON.parse(localStorage.getItem(DB_KEY) || '{}');
	const writeDb = (db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

	function tableQuery(table) {
		const filters = {};
		let op = 'select';
		let payload = null;
		const run = () => {
			if (typeof window === 'undefined' || table !== 'chat_history') return { data: op === 'select' ? [] : null, error: null };
			const db = readDb();
			if (op === 'upsert') {
				db[payload.user_id + ':' + payload.topic] = payload;
				writeDb(db);
				window.__testUpserts = (window.__testUpserts || []).concat([{ user_id: payload.user_id, topic: payload.topic, at: Date.now() }]);
				return { data: null, error: null };
			}
			if (op === 'delete') {
				delete db[filters.user_id + ':' + filters.topic];
				writeDb(db);
				return { data: null, error: null };
			}
			const row = db[filters.user_id + ':' + filters.topic] || null;
			return { data: row, error: null };
		};
		const query = {
			select: () => query,
			eq: (column, value) => { filters[column] = value; return query; },
			in: () => query, gte: () => query, lt: () => query, order: () => query, limit: () => query,
			upsert: (row) => { op = 'upsert'; payload = row; return query; },
			delete: () => { op = 'delete'; return query; },
			insert: () => query, update: () => query,
			maybeSingle: async () => run(),
			single: async () => run(),
			then: (resolve, reject) => Promise.resolve(run()).then((result) => resolve({ ...result, data: result.data ?? [], count: 0 }), reject)
		};
		return query;
	}

	export function fixtureClient(cookieSource) {
		const listeners = new Set();
		const isBrowser = typeof window !== 'undefined';
		const current = () => sessionFor(readCookie(isBrowser ? document.cookie : cookieSource || ''));
		const notify = (event) => { const session = current(); for (const cb of listeners) cb(event, session); };
		let channel = null;
		if (isBrowser) {
			channel = new BroadcastChannel('test-auth');
			channel.onmessage = (message) => notify(message.data);
			window.__testAuth = {
				switchTo(id) { document.cookie = 'test-user=' + id + '; path=/'; notify('SIGNED_IN'); channel.postMessage('SIGNED_IN'); },
				expire() { document.cookie = 'test-user=; path=/; max-age=0'; notify('SIGNED_OUT'); channel.postMessage('SIGNED_OUT'); }
			};
		}
		return {
			auth: {
				getUser: async () => ({ data: { user: current()?.user ?? null }, error: null }),
				getSession: async () => ({ data: { session: current() }, error: null }),
				onAuthStateChange: (cb) => {
					listeners.add(cb);
					queueMicrotask(() => cb('INITIAL_SESSION', current()));
					if (isBrowser) window.testHydrated = true;
					return { data: { subscription: { unsubscribe() { listeners.delete(cb); } } } };
				},
				signOut: async () => {
					document.cookie = 'test-user=; path=/; max-age=0';
					notify('SIGNED_OUT');
					channel?.postMessage('SIGNED_OUT');
					return { error: null };
				},
				updateUser: async () => ({ data: { user: current()?.user ?? null }, error: null })
			},
			from: (table) => tableQuery(table),
			rpc: async () => ({ data: null, error: null })
		};
	}
	export const supabase = fixtureClient();
`;

let server: ViteDevServer | undefined;
let browser: Browser | undefined;
let profile: string | undefined;
let base = '';

/** AI-svar som testet släpper fram när det vill. */
let pendingChat: { response: ServerResponse; message: string }[] = [];
let holdChatReplies = false;

// API-fejkar i Vite-servern (inte via Playwright-routing, som stänger av
// webbläsarens bakåt-cache och då skulle dölja ett av scenarierna).
function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
	return new Promise((resolve) => {
		let raw = '';
		req.on('data', (chunk) => (raw += chunk));
		req.on('end', () => resolve(raw ? JSON.parse(raw) : {}));
	});
}

function sendJson(res: ServerResponse, body: unknown) {
	res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
}

function apiFixtures(req: IncomingMessage, res: ServerResponse, next: () => void) {
	const url = req.url ?? '';
	if (!url.startsWith('/api/')) return next();
	if (url.startsWith('/api/consent/chat-ai')) return sendJson(res, { status: 'granted' });
	if (url === '/api/account/delete') return sendJson(res, { success: true });
	if (url === '/api/chat' && req.method === 'POST') {
		void readJson(req).then((body) => {
			const message = String(body.message ?? '');
			if (holdChatReplies) pendingChat.push({ response: res, message });
			else sendJson(res, { reply: `Svar på: ${message}`, conversationId: null });
		});
		return;
	}
	return sendJson(res, {});
}

async function newContext(userId: string | null) {
	const context = await browser!.newContext({ viewport: { width: 390, height: 844 } });
	// Visar om en sida kom tillbaka från bakåt-cachen
	await context.addInitScript(() => {
		window.addEventListener('pageshow', (event) => {
			(window as unknown as { __fromBfcache?: boolean }).__fromBfcache = event.persisted;
		});
	});
	if (userId) await context.addCookies([{ name: 'test-user', value: userId, url: base }]);
	return context;
}

async function openChat(page: Page) {
	await page.goto(base + CHAT);
	await page.waitForFunction(() => (window as unknown as { testHydrated?: boolean }).testHydrated === true);
	await page.locator('textarea').first().waitFor({ state: 'visible' });
	await expect.poll(() => page.locator('textarea').first().isEnabled()).toBe(true);
}

async function sendMessage(page: Page, text: string) {
	const field = page.locator('textarea').first();
	await field.fill(text);
	await page.getByRole('button', { name: 'Skicka meddelandet' }).click();
}

const bodyText = (page: Page) => page.evaluate(() => document.body.innerText);
const chatKeys = (page: Page) =>
	page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith('chat_history_')));

async function logoutViaMenu(page: Page) {
	await page.getByRole('button', { name: /meny/i }).first().click();
	await page.getByRole('button', { name: 'Logga ut' }).first().click();
	await page.waitForURL('**/login');
}

beforeAll(async () => {
	expect(existsSync(chromePath), 'Set CHROME_BIN to a local Chrome installation').toBe(true);
	profile = await mkdtemp(join(tmpdir(), 'mittpsyke-chat-privacy-'));
	server = await createServer({
		envDir: profile,
		logLevel: 'error',
		server: { host: '127.0.0.1', port: 0 },
		optimizeDeps: { entries: ['src/routes/+layout.svelte', 'src/routes/chat/[category]/+page.svelte', 'src/routes/login/+page.svelte', 'src/routes/dashboard/installningar/+page.svelte'] },
		plugins: [{
			name: 'chat-privacy-fixtures',
			enforce: 'pre',
			load(id) {
				const path = id.replaceAll('\\', '/');
				if (path.endsWith('/src/lib/supabase.ts')) return clientMock;
				if (path.endsWith('/src/hooks.server.ts')) {
					return `import { fixtureClient } from './lib/supabase';
						export const handle = ({ event, resolve }) => {
							const id = event.cookies.get('test-user');
							event.locals.supabase = fixtureClient(id ? 'test-user=' + id : '');
							return resolve(event);
						};`;
				}
			},
			configureServer(vite) {
				vite.middlewares.use(apiFixtures);
			}
		}]
	});
	await server.listen();
	const address = server.httpServer?.address();
	if (!address || typeof address === 'string') throw new Error('Local Vite server unavailable');
	base = `http://127.0.0.1:${address.port}`;
	browser = await chromium.launch({
		executablePath: chromePath,
		// Playwright stänger normalt av bakåt-cachen. Den behövs för bakåtknappstestet.
		ignoreDefaultArgs: ['--disable-back-forward-cache'],
		// All trafik utom den lokala servern blockeras
		args: ['--no-sandbox', '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1']
	});
}, 120_000);

afterAll(async () => {
	await browser?.close();
	await server?.close();
	if (profile?.includes('mittpsyke-chat-privacy-')) await rm(profile, { recursive: true, force: true });
}, 30_000);

beforeEach(() => {
	pendingChat = [];
	holdChatReplies = false;
});

describe('chattinnehåll efter avslutad session', () => {
	it('vanlig utloggning tömmer andra öppna flikar, minnet och lagringen men inte gästdagbok eller inställningar', async () => {
		const context = await newContext(USER_A);
		const tab1 = await context.newPage();
		const tab2 = await context.newPage();
		await openChat(tab1);
		await tab1.evaluate(() => {
			localStorage.setItem('mittpsyke_guest_entry', 'Gästdagbok som ska finnas kvar');
			localStorage.setItem('mittpsyke:chat-send-with-enter', 'false');
		});
		await sendMessage(tab1, SECRET_A);
		await expect.poll(() => bodyText(tab1)).toContain(`Svar på: ${SECRET_A}`);
		await expect.poll(() => chatKeys(tab1)).toContain(`chat_history_allmant_${USER_A}`);

		await openChat(tab2);
		await expect.poll(() => bodyText(tab2)).toContain(SECRET_A);

		await logoutViaMenu(tab1);

		await expect.poll(() => bodyText(tab2)).not.toContain(SECRET_A);
		expect(await tab2.locator('textarea').first().inputValue()).toBe('');
		expect(await chatKeys(tab2)).toEqual([]);
		expect(await tab2.evaluate(() => localStorage.getItem('mittpsyke_guest_entry'))).toBe('Gästdagbok som ska finnas kvar');
		expect(await tab2.evaluate(() => localStorage.getItem('mittpsyke:chat-send-with-enter'))).toBe('false');
		await context.close();
	}, 90_000);

	it('ett AI-svar som kommer efter utloggningen visas aldrig och sparas inte', async () => {
		const context = await newContext(USER_A);
		const tab = await context.newPage();
		await openChat(tab);
		holdChatReplies = true;
		await sendMessage(tab, SECRET_A);
		await expect.poll(() => pendingChat.length).toBe(1);
		await expect.poll(() => bodyText(tab)).toContain(SECRET_A);

		await tab.evaluate(() => (window as unknown as { __testAuth: { expire(): void } }).__testAuth.expire());
		await expect.poll(() => bodyText(tab)).not.toContain(SECRET_A);

		// Svaret släpps fram först nu. Begäran är avbruten, och även om svaret
		// skulle nå fram ska det inte visas.
		const late = pendingChat[0].response;
		if (!late.writableEnded && !late.destroyed) sendJson(late, { reply: LATE_REPLY, conversationId: null });
		await tab.waitForTimeout(800);
		const text = await bodyText(tab);
		expect(text).not.toContain(LATE_REPLY);
		expect(text).not.toContain(SECRET_A);
		expect(await chatKeys(tab)).toEqual([]);
		expect(await tab.locator('textarea').first().inputValue()).not.toContain(SECRET_A);
		await context.close();
	}, 90_000);

	it('kontobyte visar inte förra kontots samtal och laddar det nya kontots egen historik', async () => {
		const context = await newContext(USER_A);
		const seed = await context.newPage();
		await seed.goto(base + '/integritet');
		await seed.evaluate(([b, secret]) => {
			localStorage.setItem('__test_db_chat_history', JSON.stringify({
				[`${b}:allmant`]: { user_id: b, topic: 'allmant', messages: [{ role: 'user', content: secret }, { role: 'assistant', content: 'Syntetiskt svar till B' }] }
			}));
		}, [USER_B, SECRET_B]);
		const tab = await context.newPage();
		await openChat(tab);
		await sendMessage(tab, SECRET_A);
		await expect.poll(() => bodyText(tab)).toContain(`Svar på: ${SECRET_A}`);

		await tab.evaluate((b) => (window as unknown as { __testAuth: { switchTo(id: string): void } }).__testAuth.switchTo(b), USER_B);

		await expect.poll(() => bodyText(tab)).not.toContain(SECRET_A);
		await expect.poll(() => bodyText(tab)).toContain(SECRET_B);
		expect(await chatKeys(tab)).not.toContain(`chat_history_allmant_${USER_A}`);
		// B:s sparade historik skrevs inte över av den tömda vyn
		const db = await tab.evaluate(() => JSON.parse(localStorage.getItem('__test_db_chat_history') || '{}'));
		expect(JSON.stringify(db[`${USER_B}:allmant`])).toContain(SECRET_B);
		await context.close();
	}, 90_000);

	it('utgången session i en annan flik tömmer vyn', async () => {
		const context = await newContext(USER_A);
		const tab1 = await context.newPage();
		const tab2 = await context.newPage();
		await openChat(tab1);
		await sendMessage(tab1, SECRET_A);
		await expect.poll(() => bodyText(tab1)).toContain(`Svar på: ${SECRET_A}`);
		await openChat(tab2);
		await tab2.evaluate(() => (window as unknown as { __testAuth: { expire(): void } }).__testAuth.expire());

		await expect.poll(() => bodyText(tab1)).not.toContain(SECRET_A);
		await expect.poll(() => bodyText(tab2)).not.toContain(SECRET_A);
		expect(await chatKeys(tab1)).toEqual([]);
		await context.close();
	}, 90_000);

	it('kontoradering tömmer chatten i en annan öppen flik', async () => {
		const context = await newContext(USER_A);
		const chat = await context.newPage();
		await openChat(chat);
		await sendMessage(chat, SECRET_A);
		await expect.poll(() => bodyText(chat)).toContain(`Svar på: ${SECRET_A}`);

		const settings = await context.newPage();
		await settings.goto(base + '/dashboard/installningar');
		await settings.locator('#delete-confirm').fill('RADERA');
		await settings.getByRole('button', { name: 'Radera mitt konto' }).click();

		await expect.poll(() => bodyText(chat)).not.toContain(SECRET_A);
		expect(await chatKeys(chat)).toEqual([]);
		await context.close();
	}, 90_000);

	it('bakåtknappen efter utloggning visar inte det tidigare samtalet', async () => {
		const context = await newContext(USER_A);
		const tab = await context.newPage();
		await openChat(tab);
		await sendMessage(tab, SECRET_A);
		await expect.poll(() => bodyText(tab)).toContain(`Svar på: ${SECRET_A}`);
		await logoutViaMenu(tab);

		// Vid återställning ur bakåt-cachen kommer ingen load-händelse
		await tab.goBack({ waitUntil: 'commit' });
		await tab.waitForFunction(() => location.pathname.startsWith('/chat'));
		// Direkt efter återställningen (ingen blixt av gammalt innehåll) och en stund senare
		const immediately = await bodyText(tab);
		await tab.waitForTimeout(500);
		const fromBfcache = await tab.evaluate(() => (window as unknown as { __fromBfcache?: boolean }).__fromBfcache);
		console.info(`bakåtknapp: ${fromBfcache ? 'sidan kom från bakåt-cachen' : 'sidan laddades om'}`);
		expect(await bodyText(tab)).not.toContain(SECRET_A);
		expect(immediately).not.toContain(SECRET_A);
		expect(await chatKeys(tab)).toEqual([]);
		await context.close();
	}, 90_000);

	it('återinloggning med samma konto behåller den egna historiken', async () => {
		const context = await newContext(USER_A);
		const tab = await context.newPage();
		await openChat(tab);
		await sendMessage(tab, SECRET_A);
		await expect.poll(() => bodyText(tab)).toContain(`Svar på: ${SECRET_A}`);
		// Samma användare loggar in igen (till exempel efter tokenförnyelse)
		await tab.evaluate((a) => (window as unknown as { __testAuth: { switchTo(id: string): void } }).__testAuth.switchTo(a), USER_A);
		await tab.waitForTimeout(400);
		expect(await bodyText(tab)).toContain(SECRET_A);
		await context.close();
	}, 90_000);
});
