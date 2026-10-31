import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const workspace = process.cwd();
const staticRoot = join(workspace, 'static');
const appHtml = readFileSync(join(workspace, 'src/app.html'), 'utf8');
const manifest = JSON.parse(readFileSync(join(staticRoot, 'site.webmanifest'), 'utf8')) as {
	name: string;
	short_name: string;
	start_url: string;
	scope: string;
	display: string;
	background_color: string;
	theme_color: string;
	icons: Array<{ src: string; sizes: string; type: string; purpose: string }>;
};

function pngSize(relativePath: string) {
	const image = readFileSync(join(staticRoot, relativePath));
	expect(image.subarray(1, 4).toString('ascii')).toBe('PNG');
	return {
		width: image.readUInt32BE(16),
		height: image.readUInt32BE(20)
	};
}

describe('PWA-metadata', () => {
	it('har ett installerbart manifest i det mörka temats färger', () => {
		expect(manifest).toMatchObject({
			name: 'MittPsyke',
			short_name: 'MittPsyke',
			start_url: '/',
			scope: '/',
			display: 'standalone',
			// Samma mörka grund som app.html, så startskärmen i installerat läge
			// aldrig blinkar vitt.
			background_color: '#11151d',
			theme_color: '#11151d'
		});
	});

	it('har korrekta vanliga och maskable PNG-ikoner', () => {
		expect(manifest.icons).toEqual([
			{ src: '/logo-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
			{ src: '/logo-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
			{ src: '/logo-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
		]);

		expect(pngSize('logo-192.png')).toEqual({ width: 192, height: 192 });
		expect(pngSize('logo-512.png')).toEqual({ width: 512, height: 512 });
		expect(pngSize('logo-maskable-512.png')).toEqual({ width: 512, height: 512 });
		expect(pngSize('apple-touch-icon.png')).toEqual({ width: 180, height: 180 });
	});

	it('länkar manifest, tema och iOS-metadata globalt', () => {
		expect(appHtml).toContain('<link rel="manifest" href="%sveltekit.assets%/site.webmanifest" />');
		expect(appHtml).toContain('<meta name="theme-color" content="#11151d" />');
		expect(appHtml).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />');
		expect(appHtml).toContain('<meta name="apple-mobile-web-app-title" content="MittPsyke" />');
		expect(appHtml).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />');
		expect(appHtml).toContain('<link rel="icon" type="image/png" href="/logo-192.png" sizes="192x192" />');
	});

	// Webbläsare och sökmotorer frågar efter /favicon.ico oavsett länktaggarna.
	// Utan filen blev det ett 404 i loggen för varje ny besökare.
	it('har en favicon.ico i roten med små standardstorlekar', () => {
		const icon = readFileSync(join(staticRoot, 'favicon.ico'));
		// ICO-huvud: reserverat 0, typ 1 (ikon), antal bilder.
		expect(icon.readUInt16LE(0)).toBe(0);
		expect(icon.readUInt16LE(2)).toBe(1);
		const count = icon.readUInt16LE(4);
		const sizes = Array.from({ length: count }, (_, index) => icon[6 + index * 16] || 256);
		expect(sizes).toEqual(expect.arrayContaining([16, 32]));
		expect(icon.length).toBeLessThan(20_000);
	});

	it('introducerar ingen service worker eller cachelogik', () => {
		expect(existsSync(join(workspace, 'src/service-worker.ts'))).toBe(false);
		expect(existsSync(join(workspace, 'src/service-worker.js'))).toBe(false);
		expect(appHtml).not.toContain('serviceWorker');
	});
});
