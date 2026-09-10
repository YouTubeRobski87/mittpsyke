const port = Number(process.argv[2] || 9223);
const base = `http://127.0.0.1:${port}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function waitForJson(path, timeoutMs = 10000) {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		try {
			const response = await fetch(`${base}${path}`);
			if (response.ok) return response.json();
		} catch {}
		await sleep(100);
	}
	throw new Error(`Timed out waiting for ${path}`);
}

class Cdp {
	constructor(url) {
		this.ws = new WebSocket(url);
		this.nextId = 1;
		this.pending = new Map();
		this.listeners = new Map();
		this.ready = new Promise((resolve, reject) => {
			this.ws.addEventListener('open', resolve, { once: true });
			this.ws.addEventListener('error', reject, { once: true });
		});
		this.ws.addEventListener('message', (event) => {
			const message = JSON.parse(event.data);
			if (message.id) {
				const pending = this.pending.get(message.id);
				if (!pending) return;
				this.pending.delete(message.id);
				if (message.error) pending.reject(new Error(message.error.message));
				else pending.resolve(message.result);
				return;
			}
			for (const listener of this.listeners.get(message.method) || []) listener(message.params);
		});
	}

	async send(method, params = {}) {
		await this.ready;
		const id = this.nextId++;
		const promise = new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
		this.ws.send(JSON.stringify({ id, method, params }));
		return promise;
	}

	on(method, listener) {
		const listeners = this.listeners.get(method) || [];
		listeners.push(listener);
		this.listeners.set(method, listeners);
	}
}

function parseGaRequest(request, timestamp) {
	if (!/google-analytics\.com\/(g\/collect|collect)|analytics\.google\.com\/g\/collect/.test(request.url)) return null;
	const url = new URL(request.url);
	const common = new URLSearchParams(url.search);
	const lines = request.postData ? request.postData.split(/\r?\n/).filter(Boolean) : [''];
	return lines.map((line, batchIndex) => {
		const params = new URLSearchParams(common);
		for (const [key, value] of new URLSearchParams(line)) params.set(key, value);
		return {
			timestamp,
			batchIndex,
			method: request.method,
			eventName: params.get('en'),
			dl: params.get('dl'),
			dr: params.get('dr'),
			measurementId: params.get('tid'),
			dp: params.get('dp'),
			dt: params.get('dt'),
			eu: params.get('_eu'),
			ae: params.get('ae')
		};
	});
}

const tabs = await waitForJson('/json');
const page = tabs.find((tab) => tab.type === 'page');
if (!page) throw new Error('No CDP page target');
const cdp = new Cdp(page.webSocketDebuggerUrl);
const requests = [];
cdp.on('Network.requestWillBeSent', ({ request, timestamp }) => {
	const parsed = parseGaRequest(request, timestamp);
	if (parsed) requests.push(...parsed);
});

await cdp.send('Network.enable', { maxPostDataSize: 65536 });
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');

async function evaluate(expression) {
	const result = await cdp.send('Runtime.evaluate', {
		expression,
		awaitPromise: true,
		returnByValue: true
	});
	if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
	return result.result.value;
}

async function waitFor(expression, timeoutMs = 10000) {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		if (await evaluate(expression)) return;
		await sleep(100);
	}
	throw new Error(`Timed out: ${expression}`);
}

async function waitSettled(ms = 3500) {
	await sleep(ms);
}

function mark(label) {
	return { label, requestStart: requests.length, time: Date.now() };
}

async function snapshot(marker) {
	const pageState = await evaluate(`(() => ({
		url: location.href,
		referrer: document.referrer,
		consent: localStorage.getItem('cookie-consent'),
		cookies: document.cookie,
		scripts: [...document.scripts].map(s => ({ id: s.id, src: s.src })).filter(s => s.src),
		dataLayer: Array.isArray(window.dataLayer) ? window.dataLayer.map(item => Array.from(item)) : null
	}))()`);
	return {
		label: marker.label,
		pageState: {
			...pageState,
			scriptCount: pageState.scripts.length,
			configCalls: pageState.dataLayer?.filter(item => item[0] === 'config') ?? [],
			pageViewCommands: pageState.dataLayer?.filter(item => item[0] === 'event' && item[1] === 'page_view') ?? []
		},
		requests: requests.slice(marker.requestStart)
	};
}

async function navigateSpa(href, label) {
	const marker = mark(label);
	const before = await evaluate('location.href');
	const clicked = await evaluate(`(() => {
		const candidates = [...document.querySelectorAll('a[href]')];
		const link = candidates.find(a => new URL(a.href, location.href).pathname === ${JSON.stringify(href)});
		if (!link) return false;
		link.click();
		return true;
	})()`);
	if (!clicked) throw new Error(`No link found for ${href} from ${before}`);
	await waitFor(`location.pathname === ${JSON.stringify(href)}`);
	await waitSettled();
	return snapshot(marker);
}

async function historyMove(direction, expectedPath, label) {
	const marker = mark(label);
	await evaluate(`history.${direction}()`);
	await waitFor(`location.pathname === ${JSON.stringify(expectedPath)}`);
	await waitSettled();
	return snapshot(marker);
}

const report = [];
let marker = mark('initial load, no consent');
await cdp.send('Page.navigate', { url: 'https://mittpsyke.se/' });
await waitFor("document.readyState === 'complete'");
await waitSettled();
report.push(await snapshot(marker));

marker = mark('accept analytics on /');
const accepted = await evaluate(`(() => {
	const button = [...document.querySelectorAll('button')].find(b => b.textContent?.includes('Acceptera analys'));
	if (!button) return false;
	button.click();
	return true;
})()`);
if (!accepted) throw new Error('Consent button not found');
await waitFor("localStorage.getItem('cookie-consent') === 'accepted'");
await waitSettled(2500);
report.push(await snapshot(marker));

marker = mark('initial reload with consent already accepted');
await cdp.send('Page.reload', { ignoreCache: true });
await waitFor("document.readyState === 'complete'");
await waitSettled();
report.push(await snapshot(marker));

report.push(await navigateSpa('/chat', '/ -> /chat'));
report.push(await navigateSpa('/dagbok', '/chat -> /dagbok'));
report.push(await navigateSpa('/guider', '/dagbok -> /guider'));
report.push(await historyMove('back', '/dagbok', 'back: /guider -> /dagbok'));
report.push(await historyMove('back', '/chat', 'back: /dagbok -> /chat'));
report.push(await historyMove('forward', '/dagbok', 'forward: /chat -> /dagbok'));
report.push(await historyMove('forward', '/guider', 'forward: /dagbok -> /guider'));

marker = mark('privacy probe with query and fragment');
await cdp.send('Page.navigate', { url: 'https://mittpsyke.se/chat?chat_test_value=synthetic#chat_fragment' });
await waitFor("document.readyState === 'complete'");
await waitSettled(2500);
report.push(await snapshot(marker));

console.log(JSON.stringify({ report: report.map(stage => ({
	label: stage.label,
	url: stage.pageState.url,
	consent: stage.pageState.consent,
	cookies: stage.pageState.cookies,
	scripts: stage.pageState.scripts,
	configCalls: stage.pageState.configCalls,
	pageViewCommands: stage.pageState.pageViewCommands,
	requests: stage.requests
})) }, null, 2));
cdp.ws.close();
