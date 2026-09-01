import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import SignedInHome from './SignedInHome.svelte';

describe('inloggad startsida', () => {
	it('visar användarens översikt med produktens sex huvuddestinationer', () => {
		const { body } = render(SignedInHome, {
			props: {
				overview: {
					displayName: 'Maja',
					entryCount: 3,
					progressCompanion: { id: 'fox' }
				}
			}
		});

		expect(body).toContain('Välkommen tillbaka, Maja');
		expect(body).toContain('3 sparade texter finns kvar när du vill återvända till dem.');
		expect(body).toContain('Mitt Hem');
		expect(body).toContain('Chatten');
		expect(body).toContain('Framsteg');
		expect(body).toContain('Dagbok');
		expect(body).toContain('Kvällslugn');
		expect(body).toContain('Artiklar');

		for (const href of [
			'/dashboard',
			'/chat',
			'/framsteg',
			'/dagbok',
			'/dashboard/kvallsstugan',
			'/blogg'
		]) {
			expect(body).toContain(`href="${href}"`);
		}
	});

	it('har ett lugnt empty state utan påhittad personlig signal', () => {
		const { body } = render(SignedInHome, {
			props: {
				overview: {
					displayName: null,
					entryCount: 0,
					progressCompanion: null
				}
			}
		});

		expect(body).toContain('Skriv din första rad');
		expect(body).not.toContain('sparade texter finns kvar');
	});
});
