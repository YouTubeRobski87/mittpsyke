import { describe, expect, it, vi } from 'vitest';

// legacyPathRedirects testas fristående, inte genom den sammansatta `handle`:
// sequence() förutsätter SvelteKits interna request store, som bara finns när
// en riktig request går genom ramverkets egen server.js - den finns inte i ett
// vitest-anrop. Handlern själv gör inget sådant, så den går fint att anropa
// direkt med ett minimalt event.
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const {
	legacyPathRedirects,
	legacyPageRedirects,
	dedupeMetaDescriptions,
	DEDUPED_META_DESCRIPTION_PLACEHOLDER
} = await import('./hooks.server');

function requestEvent(pathname: string) {
	return { url: new URL(`http://localhost${pathname}`) } as never;
}

describe('legacyPathRedirects - gamla /dashboard', () => {
	it('redirectar exakt /dashboard permanent till Kvällstugan', async () => {
		const resolve = vi.fn(async () => new Response('unused'));

		await expect(
			legacyPathRedirects({ event: requestEvent('/dashboard'), resolve } as never)
		).rejects.toMatchObject({
			status: 301,
			location: '/dashboard/kvallsstugan'
		});
		expect(resolve).not.toHaveBeenCalled();
	});

	it('redirectar även med efterföljande slash, samma normalisering som /hem redan har', async () => {
		const resolve = vi.fn(async () => new Response('unused'));

		await expect(
			legacyPathRedirects({ event: requestEvent('/dashboard/'), resolve } as never)
		).rejects.toMatchObject({
			status: 301,
			location: '/dashboard/kvallsstugan'
		});
	});

	it('rör aldrig underroutes - de faller igenom till resolve() oförändrade', async () => {
		for (const pathname of [
			'/dashboard/kvallsstugan',
			'/dashboard/installningar',
			'/dashboard/gemenskap',
			'/dashboardx'
		]) {
			const resolve = vi.fn(async () => new Response('ok'));
			const response = await legacyPathRedirects({ event: requestEvent(pathname), resolve } as never);

			expect(resolve, pathname).toHaveBeenCalledTimes(1);
			expect(await (response as Response).text(), pathname).toBe('ok');
		}
	});

	// Kärnan i skyddet: kartan slås upp mot exakt normaliserad pathname som
	// objektnyckel - aldrig ett prefix eller startsWith-test - så en
	// underroute kan per konstruktion aldrig matcha '/dashboard'-nyckeln.
	it('kan aldrig fånga en underroute, oavsett vilken', () => {
		expect(legacyPageRedirects['/dashboard']).toBe('/dashboard/kvallsstugan');

		for (const pathname of [
			'/dashboard/kvallsstugan',
			'/dashboard/installningar',
			'/dashboard/gemenskap',
			'/dashboardx'
		]) {
			expect(legacyPageRedirects[pathname], pathname).toBeUndefined();
		}
	});
});

describe('legacyPathRedirects - /villkor', () => {
	it('redirectar /villkor och /villkor/ permanent till /kontakt-och-villkor', async () => {
		for (const pathname of ['/villkor', '/villkor/']) {
			const resolve = vi.fn(async () => new Response('unused'));
			await expect(
				legacyPathRedirects({ event: requestEvent(pathname), resolve } as never)
			).rejects.toMatchObject({ status: 301, location: '/kontakt-och-villkor' });
			expect(resolve, pathname).not.toHaveBeenCalled();
		}
	});

	it('rör inte /kontakt-och-villkor', async () => {
		const resolve = vi.fn(async () => new Response('ok'));
		await legacyPathRedirects({ event: requestEvent('/kontakt-och-villkor'), resolve } as never);
		expect(resolve).toHaveBeenCalledTimes(1);
	});
});

describe('dedupeMetaDescriptions', () => {
	it('behåller bara den sista metabeskrivningen', () => {
		const html =
			'<head><meta name="description" content="Layout"/> <meta name="author" content="MittPsyke"/> <meta name="description" content="Sida"/></head>';
		const result = dedupeMetaDescriptions(html);

		expect(result.match(/<meta\s+name="description"/g)).toHaveLength(1);
		expect(result).toContain('content="Sida"');
		expect(result).not.toContain('content="Layout"');
	});

	it('behåller antalet noder så att Svelte kan hydrera sidhuvudet', () => {
		// Hydreringen går nod för nod. Om dubbletten bara togs bort glider
		// resten ur fas och sidhuvudet byggs om, med dubbel JSON-LD som följd.
		const html =
			'<meta name="description" content="Layout"/> <meta name="author" content="MittPsyke"/> <meta name="description" content="Sida"/>';
		const countElements = (value: string) => (value.match(/<meta\b/g) ?? []).length;
		const result = dedupeMetaDescriptions(html);

		expect(countElements(result)).toBe(countElements(html));
		expect(result.startsWith(DEDUPED_META_DESCRIPTION_PLACEHOLDER)).toBe(true);
	});

	it('lämnar sidor med en enda metabeskrivning orörda', () => {
		const html = '<meta name="description" content="Bara en"/>';
		expect(dedupeMetaDescriptions(html)).toBe(html);
	});
});
