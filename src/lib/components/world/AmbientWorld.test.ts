import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ambientSource = readFileSync(new URL('./AmbientWorld.svelte', import.meta.url), 'utf8');
const progressSource = readFileSync(
	new URL('../../../routes/framsteg/+page.svelte', import.meta.url),
	'utf8'
);

describe('AmbientWorld vegetation wind', () => {
	it('ger befintliga gräslager växtsilhuetter med rotförankrad rörelse', () => {
		expect(ambientSource).toMatch(/\.grass-left,\r?\n\t\.grass-bank/);
		expect(ambientSource).toContain('.grass-left { transform-origin: 26% 100%; }');
		expect(ambientSource).toContain('.grass-bank { transform-origin: 64% 100%; }');
		expect(ambientSource).toContain(
			'calc(-0.82px * (0.55 + var(--depth, 0.5)) * var(--wind-amplitude, 1))'
		);
	});

	it('har stiltje och en separat lågmäld pust i vegetationscykeln', () => {
		expect(ambientSource).toContain('0%, 18%, 46%, 58%, 100%');
		expect(ambientSource).toContain('74%, 82% { transform: rotate(calc((-1.9deg');
		expect(ambientSource).toContain('0%, 20%, 48%, 60%, 100%');
	});

	it('stänger av kontinuerlig vind vid reduced motion', () => {
		expect(ambientSource).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.world-effect \{ animation: none !important;/
		);
		expect(progressSource).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.companion-media::before,[\s\S]*?animation: none !important;/
		);
	});
});

describe('AmbientWorld ambient director', () => {
	const directorEffect = ambientSource.slice(
		ambientSource.indexOf('const stop = startAmbientDirector') - 700,
		ambientSource.indexOf('</script>')
	);

	it('startar bara directorn när fliken är synlig och rörelse är tillåten', () => {
		expect(directorEffect).toContain('const active = motion.isActive;');
		expect(directorEffect).toContain(
			'if (!recurringFauna || !seed || !active || reduced || eventsBlocked) return;'
		);
		expect(directorEffect).toContain("isVisible: () => document.visibilityState === 'visible'");
	});

	it('stoppar directorn och rensar händelser när komponenten förstörs', () => {
		expect(directorEffect).toMatch(/return \(\) => \{\s*stop\(\);\s*clearDirectorEvents\(\);/);
	});

	// Att byta animation-duration mitt i en loop får lagret att hoppa. Pusten
	// ska läggas ovanpå med de fristående rotate/translate-egenskaperna.
	it('låter vindpusten luta vegetationen utan att röra dess animation', () => {
		expect(ambientSource).not.toMatch(/\.is-wind-event[^{]*\{[^}]*animation-duration/);
		expect(ambientSource).toMatch(/\.is-wind-event \.world-foliage \{[^}]*rotate:/);
	});

	it('döljer molnljus och kvällsliv vid reduced motion', () => {
		expect(ambientSource).toMatch(
			/@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.world-cloud-light, \.world-evening-life \{ display: none; \}/
		);
	});

	// Växtnivån spärrar fjärilar (nivå 3) och fåglar (nivå 4) via scene.features.
	// Directorn måste respektera spärren, annars är en ny plats lika full av
	// fauna som en gammal och den förändringen går förlorad.
	it('låter faunan följa växtnivåns spärr', () => {
		expect(ambientSource).toMatch(
			/const kinds: AmbientDirectorKind\[\] = scene\.events[\s\S]*?scene\.features\[event\.kind\] &&/
		);
	});

	it('ger fönsterplanen varken fauna eller vind när directorn äger dem', () => {
		expect(ambientSource).toContain(
			"visibleKinds.filter((kind) => kind !== 'bird' && kind !== 'butterfly' && kind !== 'wind')"
		);
	});
});
