import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Page from './+page.svelte';

const route = readFileSync(
	join(process.cwd(), 'src/routes/dashboard/kvallsstugan/+page.svelte'),
	'utf8'
);

const pageData = (hasBook: boolean) => ({
	progressCompanion: null,
	companionDaily: null,
	interiorMemory: { hasBook, hasRug: true, hasBlanket: true, hasVeranda: true }
});

/** Markupen runt genvägen, ur den renderade sidan. */
function bookLink(body: string): string {
	const anchor = body.indexOf('scene-object-book');
	expect(anchor, 'hittade ingen genväg till dagboken').toBeGreaterThan(-1);
	return body.slice(body.lastIndexOf('<a', anchor), body.indexOf('</a>', anchor));
}

describe('Dagboken vid fönstret', () => {
	it('är interaktiv och går att nå med tangentbord', () => {
		const { body } = render(Page, { props: { data: pageData(true) } });
		const link = bookLink(body);

		// En länk är fokuserbar av sig själv - ingen tabindex eller click-handler
		// på ett dött element.
		expect(link).toContain('<a');
		expect(link).toContain('href=');
	});

	it('pekar på den riktiga dagboksrouten', () => {
		const { body } = render(Page, { props: { data: pageData(true) } });

		expect(bookLink(body)).toContain('href="/dagbok"');
	});

	it('har ett tillgängligt namn', () => {
		const { body } = render(Page, { props: { data: pageData(true) } });

		expect(bookLink(body)).toContain('aria-label="Öppna min dagbok"');
	});

	it('finns bara när boken faktiskt syns i rummet', () => {
		const { body } = render(Page, { props: { data: pageData(false) } });

		expect(body).not.toContain('scene-object-book');
		expect(body).not.toContain('Öppna min dagbok');
	});

	it('har en träffyta som håller på mobil och en diskret fokusmarkering', () => {
		const style = route.slice(route.indexOf('\t.scene-object {'));

		expect(style).toContain('min-width: 44px;');
		expect(style).toContain('min-height: 44px;');
		expect(style).toContain(':focus-visible');
		expect(style).toContain(':hover');
	});

	it('lämnar scenens övriga delar orörda', () => {
		const { body } = render(Page, { props: { data: pageData(true) } });

		// Bilden av boken är kvar som eget lager, inte ersatt av länken.
		expect(body).toContain('/images/evening/interior/boken.png');
		expect(body).toContain('/images/evening/interior/rug.png');
		expect(body).toContain('/images/evening/interior/blanket.png');
		// Dörrarna och vyn fungerar som förut.
		expect(body).toContain('aria-label="Gå ut på verandan"');
		expect(body).toContain('data-view="interior"');
	});

	it('lägger inte genvägen över dörrytorna', () => {
		// Dörren ut ligger på x 4,5-20,5 %. Boken ska ligga klart till höger om den.
		const bookLeft = Number(/\.scene-object-book \{ left: ([\d.]+)%/.exec(route)?.[1]);

		expect(Number.isFinite(bookLeft)).toBe(true);
		expect(bookLeft).toBeGreaterThan(20.5);
	});
});
