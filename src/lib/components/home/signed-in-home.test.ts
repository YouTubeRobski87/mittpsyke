import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import SignedInHome from './SignedInHome.svelte';

describe('inloggad startsida', () => {
	it('visar användarens översikt med kärnnyttan före stöd och upplevelselager', () => {
		const { body } = render(SignedInHome, {
			props: {
				overview: {
					displayName: 'Maja',
					entryCount: 3
				}
			}
		});

		expect(body).toContain('Välkommen tillbaka, Maja');
		expect(body).toContain('3 sparade texter finns samlade när du vill se tillbaka över tid.');
		expect(body).toContain('Chatta');
		expect(body).toContain('Framsteg');
		expect(body).toContain('Se vad som återkommer i det du skrivit, över tid.');
		expect(body).toContain('>Kvällstugan</strong>');
		expect(body).toContain('Stäm av kvällen och lägg undan det du inte behöver bära vidare just nu.');
		expect(body).not.toContain('Kvällslugn');
		expect(body).toContain('Artiklar');
		expect(body).toContain('loading="eager"');
		expect(body).toContain('fetchpriority="high"');
		expect(body).toContain('href="/dagbok/checkin#skriv-sjalv"');

		for (const href of ['/chat', '/framsteg', '/dashboard/kvallsstugan', '/blogg']) {
			expect(body).toContain(`href="${href}"`);
		}
		expect(body.split('href="/dashboard/kvallsstugan"').length - 1).toBe(1);
		expect(body.indexOf('href="/framsteg"')).toBeLessThan(body.indexOf('href="/dashboard/kvallsstugan"'));
		expect(body.indexOf('href="/framsteg"')).toBeLessThan(body.indexOf('href="/chat"'));
	});

	it('har ett lugnt empty state utan påhittad personlig signal', () => {
		const { body } = render(SignedInHome, {
			props: {
				overview: {
					displayName: null,
					entryCount: 0
				}
			}
		});

		expect(body).toContain('Skriv din första rad');
		expect(body).toContain('href="/dagbok/checkin#skriv-sjalv"');
		expect(body).not.toContain('sparade texter finns kvar');
		expect(body).toContain('Se vad som återkommer i det du skrivit, över tid.');
	});
});
