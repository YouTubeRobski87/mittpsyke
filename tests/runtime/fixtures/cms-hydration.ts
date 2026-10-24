import { hydrate, tick } from 'svelte';
import BlogPage from '../../../src/routes/blogg/[slug]/+page.svelte';
import AngestPage from '../../../src/routes/angest/+page.svelte';

declare global {
	interface Window {
		__cmsFixture: { route: string; data: unknown; expectedName: string };
		__cmsXss?: boolean;
	}
}

const output = document.querySelector('#result')!;
const warnings: string[] = [];
const originalWarn = console.warn;
console.warn = (...args) => { warnings.push(args.join(' ')); originalWarn(...args); };
const assert = (ok: unknown, message: string) => { if (!ok) throw new Error(message); };

try {
	const { route, data, expectedName } = window.__cmsFixture;
	const host = document.querySelector('.article-content, .rich-copy')!;
	const before = host.innerHTML;
	const options = {
		target: document.querySelector('#app')!, props: { data } as never, recover: false
	};
	if (route === 'blog') hydrate(BlogPage, options);
	else hydrate(AngestPage, options);
	await tick();
	await new Promise((resolve) => setTimeout(resolve, 50));
	assert(host.innerHTML === before, 'CMS HTML changed during hydration');
	assert(!host.querySelector('script,style,iframe,svg,math,form,object,embed,template'), 'Active element');
	for (const element of host.querySelectorAll('*')) {
		assert(element.namespaceURI === 'http://www.w3.org/1999/xhtml', 'Foreign namespace');
		for (const attr of element.attributes) {
			assert(!/^on/i.test(attr.name) && !['style', 'srcdoc', 'name'].includes(attr.name), 'Active attribute');
		}
	}
	assert(host.textContent?.includes('Svensk återhämtning äöå 🌿'), 'Swedish text missing');
	assert(host.querySelector('h2') && host.querySelector('ul li') && host.querySelector('strong'), 'Formatting missing');
	assert(host.querySelector('a[href="https://www.1177.se/"]'), 'Safe link missing');
	assert(!host.querySelector('a[href^="javascript:"], a[href^="data:"]'), 'Unsafe URL');
	if (route === 'angest') {
		const schemas = [...document.querySelectorAll('script[type="application/ld+json"]')]
			.map((node) => JSON.parse(node.textContent ?? ''));
		assert(schemas.some((schema) => schema.name === expectedName), 'JSON-LD changed metadata');
	}
	assert(!window.__cmsXss, 'Injected code executed');
	assert(!warnings.some((line) => /hydration|mismatch/i.test(line)), 'Hydration warning: ' + warnings.join('; '));
	// This isolated component fixture omits the app layout/global CSS. Record
	// width for diagnostics, but do not present it as full mobile layout QA.
	output.setAttribute('data-document-width', String(document.documentElement.scrollWidth));
	output.textContent = 'PASS: ' + route + ' SSR and hydration';
} catch (error) {
	output.textContent = 'FAIL: ' + (error instanceof Error ? error.message : String(error));
}
