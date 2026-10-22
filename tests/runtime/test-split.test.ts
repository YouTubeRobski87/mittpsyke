import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Produktionsbygget (Render) saknar Chrome, så prebuild kör bara de
// webbläsaroberoende testerna. Säkerhetstestet för dagbokens HTML-sanering
// körs i stället uttryckligen i GitHub CI med riktig Chromium. Det här testet
// körs i båda miljöerna och vaktar att uppdelningen aldrig tappar det testet.

const root = process.cwd();
const scripts = (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
	scripts: Record<string, string>;
}).scripts;
const ci = readFileSync(join(root, '.github/workflows/ci.yml'), 'utf8');
const BROWSER_TEST = 'tests/runtime/diary-markdown.browser.test.ts';

function browserTestFiles(dir = 'tests'): string[] {
	return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
		const path = `${dir}/${entry.name}`;
		if (entry.isDirectory()) return browserTestFiles(path);
		return entry.name.endsWith('.browser.test.ts') ? [path] : [];
	});
}

describe('uppdelningen mellan bygg- och webbläsartester', () => {
	it('låter produktionsbygget köra alla tester utom webbläsartesterna', () => {
		expect(scripts.prebuild).toBe('npm run test:unit');
		expect(scripts['test:unit']).toBe('vitest run --exclude "tests/**/*.browser.test.ts"');
	});

	it('behåller full täckning i npm run test', () => {
		expect(scripts.test).toBe('vitest run');
	});

	it('kör säkerhetstestet i ett eget, uttryckligt kommando', () => {
		expect(existsSync(join(root, BROWSER_TEST))).toBe(true);
		expect(scripts['test:browser']).toBe('vitest run --reporter=verbose browser.test');
		// Varje webbläsartest som byggets uteslutning tar bort måste fångas av
		// test:browser, annars försvinner det ur båda flödena.
		const files = browserTestFiles();
		expect(files).toContain(BROWSER_TEST);
		for (const file of files) expect(file).toContain('browser.test');
	});

	it('kör säkerhetstestet i GitHub CI med Chrome, före bygget och utan undantag', () => {
		const step = ci.slice(ci.indexOf('- name: Chromium security test (DOMPurify)'));
		expect(step).toContain('CHROME_BIN: /usr/bin/google-chrome');
		expect(step).toContain('"$CHROME_BIN" --version');
		expect(step).toContain('npm run test:browser');
		expect(ci.indexOf('npm run test:browser')).toBeLessThan(ci.indexOf('npm run build'));
		expect(ci).not.toMatch(/continue-on-error/);
	});

	it('låter säkerhetstestet misslyckas uttryckligen utan Chrome i stället för att hoppas över', () => {
		const source = readFileSync(join(root, BROWSER_TEST), 'utf8');
		expect(source).toContain("expect(existsSync(chrome), 'Chrome required for client sanitization verification; set CHROME_BIN').toBe(true);");
		expect(source).not.toMatch(/\.(skip|skipIf|runIf|todo)\b/);
	});
});
