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
	it('har ett installerbart manifest med befintliga designfärger', () => {
		expect(manifest).toMatchObject({
			name: 'MittPsyke',
			short_name: 'MittPsyke',
			start_url: '/',
			scope: '/',
			display: 'standalone',
			background_color: '#fafafa',
			theme_color: '#0f172a'
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
		expect(appHtml).toContain('<meta name="theme-color" content="#0f172a" />');
		expect(appHtml).toContain('<meta name="apple-mobile-web-app-capable" content="yes" />');
		expect(appHtml).toContain('<meta name="apple-mobile-web-app-title" content="MittPsyke" />');
		expect(appHtml).toContain('<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" />');
		expect(appHtml).toContain('<link rel="icon" type="image/png" href="/logo-192.png" sizes="192x192" />');
	});

	it('introducerar ingen service worker eller cachelogik', () => {
		expect(existsSync(join(workspace, 'src/service-worker.ts'))).toBe(false);
		expect(existsSync(join(workspace, 'src/service-worker.js'))).toBe(false);
		expect(appHtml).not.toContain('serviceWorker');
	});
});
