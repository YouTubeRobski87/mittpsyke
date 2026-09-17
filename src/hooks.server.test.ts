import { describe, expect, it, vi } from 'vitest';

// legacyPathRedirects testas fristående, inte genom den sammansatta `handle`:
// sequence() förutsätter SvelteKits interna request store, som bara finns när
// en riktig request går genom ramverkets egen server.js - den finns inte i ett
// vitest-anrop. Handlern själv gör inget sådant, så den går fint att anropa
// direkt med ett minimalt event.
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const { legacyPathRedirects, legacyPageRedirects } = await import('./hooks.server');

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
