import { readFileSync } from 'node:fs';
import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import type { WorldMark } from '$lib/world/worldStage';
import WorldMarks from './WorldMarks.svelte';

// Regressionsskydd för scenmarkeringarnas träffytor i Framsteg.
//
// Spåren är avsiktligt små (på 320 px är Lyktan cirka 6 × 8 px och Stenen
// 12 × 3 px). Träffytan låg tidigare som ::before på varje knapp, och då låg en
// senare knapps yta ovanpå en tidigare knapps form: Bryggans mitt träffade
// Lyktan och Stenens mitt träffade Stigen. Nu ligger träffytorna i ett eget
// lager under formerna, och där ytor möts vinner det minsta spåret.

const source = readFileSync(new URL('./WorldMarks.svelte', import.meta.url), 'utf8');
const styles = source.slice(source.indexOf('<style>'));

function mark(overrides: Partial<WorldMark> & Pick<WorldMark, 'id' | 'label'>): WorldMark {
	return { revealText: `Text för ${overrides.label}.`, x: 10, y: 60, width: 5, height: 3, depth: 1, ...overrides };
}

// Samma grannskap som på 320 px: en större brygga med en liten lykta intill,
// och en lång stig med en liten sten precis ovanför.
const marks: WorldMark[] = [
	mark({ id: 'jetty', label: 'Bryggan', x: 52, y: 62, width: 7, height: 4 }),
	mark({ id: 'lantern', label: 'Lyktan', x: 58, y: 58, width: 2, height: 3 }),
	mark({ id: 'shore-stone', label: 'Stenen', x: 30, y: 80, width: 4, height: 1 }),
	mark({ id: 'shore-path', label: 'Stigen', x: 24, y: 83, width: 16, height: 2 })
];

const { body } = render(WorldMarks, { props: { marks } });

function hitIds() {
	return [...body.matchAll(/data-mark-hit="([^"]+)"/g)].map((match) => match[1]);
}

function buttonIds() {
	return [...body.matchAll(/<button[^>]*data-mark="([^"]+)"/g)].map((match) => match[1]);
}

function styleFor(attribute: 'data-mark-hit' | 'data-mark', id: string) {
	const tag = body.match(new RegExp(`<[^>]*${attribute}="${id}"[^>]*>`))?.[0] ?? '';
	return tag.match(/style="([^"]*)"/)?.[1] ?? '';
}

function cssRule(selector: string) {
	const start = styles.indexOf(`${selector} {`);
	return start === -1 ? '' : styles.slice(start, styles.indexOf('}', start));
}

describe('träffytor för scenmarkeringar', () => {
	it('ger varje markering en egen träffyta', () => {
		expect(hitIds().sort()).toEqual(marks.map((item) => item.id).sort());
	});

	it('gör träffytan minst 44 × 44 px och centrerar den över formen', () => {
		const rule = cssRule('.world-mark-hit');
		expect(rule).toMatch(/width:\s*max\(var\(--w[^)]*\),\s*44px\)/);
		expect(rule).toMatch(/height:\s*max\(var\(--h[^)]*\),\s*44px\)/);
		expect(rule).toMatch(/left:\s*calc\(var\(--x[^)]*\) \+ var\(--w[^)]*\) \/ 2\)/);
		expect(rule).toMatch(/top:\s*calc\(var\(--y[^)]*\) \+ var\(--h[^)]*\) \/ 2\)/);
		expect(rule).toContain('transform: translate(-50%, -50%)');
		expect(rule).toContain('pointer-events: auto');
	});

	it('placerar träffytan på samma koordinater som sin egen markering', () => {
		for (const item of marks) {
			expect(styleFor('data-mark-hit', item.id)).toBe(styleFor('data-mark', item.id));
			expect(styleFor('data-mark-hit', item.id)).toContain(`--x: ${item.x}%`);
		}
	});

	it('lägger formerna ovanför alla träffytor, så en synlig form aldrig träffar grannen', () => {
		const hitZ = Number(cssRule('.world-mark-hit').match(/z-index:\s*(\d+)/)?.[1]);
		const markZ = Number(cssRule('.world-mark').match(/z-index:\s*(\d+)/)?.[1]);
		expect(markZ).toBeGreaterThan(hitZ);
		// Den gamla ytan på knappen själv är borta - den var orsaken till överlappet.
		expect(styles).not.toMatch(/\.world-mark::before/);
	});

	it('låter det minsta spåret vinna där träffytor möts', () => {
		// Senare i DOM ligger överst. Lyktan och Stenen är minst och ska ligga sist.
		const order = hitIds();
		expect(order.indexOf('lantern')).toBeGreaterThan(order.indexOf('jetty'));
		expect(order.indexOf('shore-stone')).toBeGreaterThan(order.indexOf('shore-path'));
	});
});

describe('tillgänglighet', () => {
	it('behåller knapparna i ursprunglig ordning med etikett och tryckstatus', () => {
		expect(buttonIds()).toEqual(marks.map((item) => item.id));
		for (const item of marks) {
			expect(body).toMatch(new RegExp(`<button[^>]*type="button"[^>]*data-mark="${item.id}"[^>]*aria-pressed="false"[^>]*aria-label="${item.label}"`));
		}
	});

	it('håller träffytorna utanför tangentbord och skärmläsare', () => {
		const hits = [...body.matchAll(/<span[^>]*data-mark-hit="[^"]+"[^>]*>/g)].map((match) => match[0]);
		expect(hits).toHaveLength(marks.length);
		for (const hit of hits) {
			expect(hit).toContain('aria-hidden="true"');
			expect(hit).not.toMatch(/tabindex|role=/);
		}
	});

	it('behåller en tydlig fokusram på knapparna', () => {
		expect(cssRule('.world-mark:focus-visible')).toMatch(/outline:\s*2px solid/);
	});
});

describe('scenlayout', () => {
	it('placerar och storleksätter formen exakt som förut', () => {
		const rule = cssRule('.world-mark');
		expect(rule).toMatch(/left:\s*var\(--x, 0\)/);
		expect(rule).toMatch(/top:\s*var\(--y, 0\)/);
		expect(rule).toMatch(/width:\s*var\(--w, 2%\)/);
		expect(rule).toMatch(/height:\s*var\(--h, 2%\)/);
		expect(rule).toMatch(/min-width:\s*0/);
		expect(rule).toMatch(/background:\s*transparent/);
	});

	it('låter lagret klippa träffytorna och släppa igenom klick utanför spåren', () => {
		const rule = cssRule('.world-marks');
		expect(rule).toContain('overflow: hidden');
		expect(rule).toContain('pointer-events: none');
	});

	it('renderar ingenting utan spår', () => {
		expect(render(WorldMarks, { props: { marks: [] } }).body).not.toContain('world-mark');
	});
});
