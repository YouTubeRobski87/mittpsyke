import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// MittPsyke har bara mörkt tema. Testerna vaktar tre saker: att dokumentet är
// mörkt redan innan CSS och JS har laddats (ingen vit blixt), att de globala
// tokens är de mörka, och att ingen växlare mellan ljust och mörkt kommer
// tillbaka.

const ROOT = process.cwd();
const read = (path: string) => readFileSync(join(ROOT, path), 'utf8');
const appHtml = read('src/app.html');
const appCss = read('src/app.css');

function sourceFiles(dir: string): string[] {
	const files: string[] = [];
	for (const name of readdirSync(join(ROOT, dir))) {
		const path = `${dir}/${name}`;
		if (statSync(join(ROOT, path)).isDirectory()) files.push(...sourceFiles(path));
		else if (/\.(svelte|ts)$/.test(name) && !name.endsWith('.test.ts')) files.push(path);
	}
	return files;
}

describe('mörkt före första målningen', () => {
	it('bär klassen dark, color-scheme och mörk bakgrund direkt på <html>', () => {
		expect(appHtml).toMatch(/<html lang="sv" class="dark" style="color-scheme: dark; background-color: #11151d">/);
		expect(appHtml).toContain('<meta name="color-scheme" content="dark" />');
		expect(appHtml).toContain('<meta name="theme-color" content="#11151d" />');
	});

	it('målar html och body mörka med en inline-stil i <head>, före sidans CSS', () => {
		const head = appHtml.slice(0, appHtml.indexOf('%sveltekit.head%'));
		expect(head).toMatch(/<style>\s*html,\s*body \{\s*background-color: #11151d;\s*color: #f2f2f2;\s*color-scheme: dark;/);
	});

	it('väljer inte längre läge i skriptet före första målningen', () => {
		expect(appHtml).not.toContain('theme-mode');
		expect(appHtml).not.toMatch(/classList\.(toggle|remove)\('dark'/);
	});
});

describe('globala tokens', () => {
	const root = appCss.slice(appCss.indexOf(':root {'), appCss.indexOf('}\n', appCss.indexOf(':root {')));

	it('har de mörka värdena i :root och inget separat ljust läge', () => {
		expect(root).toContain('color-scheme: dark;');
		expect(root).not.toContain('color-scheme: light;');
		expect(root).toContain('--background: 222 26% 9%;');
		expect(root).toContain('--foreground: 0 0% 95%;');
		expect(appCss).not.toMatch(/^\.dark \{/m);
		expect(appCss).not.toContain('prefers-color-scheme');
	});

	it('använder samma bakgrund i app.html som --background (hsl 222 26% 9%)', () => {
		// hsl(222 26% 9%) ≈ #11151d. Hålls i synk så att övergången från
		// inline-stilen till app.css inte ger ett färgskifte.
		expect(appHtml).toContain('#11151d');
	});
});

describe('ingen växlare mellan ljust och mörkt', () => {
	it('har tagit bort växlaren och dess modul', () => {
		expect(existsSync(join(ROOT, 'src/lib/components/ThemeToggle.svelte'))).toBe(false);
		expect(existsSync(join(ROOT, 'src/lib/theme-mode.ts'))).toBe(false);
	});

	it('läser eller skriver aldrig ljust/mörkt-läge i källkoden', () => {
		for (const file of sourceFiles('src')) {
			const source = read(file);
			expect(source, file).not.toContain('ThemeToggle');
			expect(source, file).not.toContain("'theme-mode'");
			expect(source, file).not.toMatch(/classList\.(toggle|remove)\(\s*'dark'/);
			expect(source, file).not.toMatch(/prefers-color-scheme:\s*light/);
		}
	});
});
