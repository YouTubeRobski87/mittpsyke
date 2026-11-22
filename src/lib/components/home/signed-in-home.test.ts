import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import SignedInHome from './SignedInHome.svelte';
import { MIN_PERIOD_SUMMARY_ENTRIES } from '$lib/progress-period-summary';

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
		expect(body).toContain('Det du sparar finns kvar. Efter några anteckningar till kan du i Framsteg läsa en text om det du har skrivit.');
		expect(body).not.toMatch(/\d+ sparade texter/);
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
		// Ny användare: en lugn rad om vad som blir möjligt, utan krav och utan länk dit än.
		expect(body).toContain('När du har sparat några anteckningar kan du i Framsteg läsa en text om det du har skrivit. Det finns inget att hålla igång.');
		expect(body).not.toContain('href="/framsteg?tab=insights"');
	});

	it('leder direkt till Det du har skrivit när det finns nog att skriva om', () => {
		const render5 = (entryCount: number) =>
			render(SignedInHome, { props: { overview: { displayName: null, entryCount } } }).body;

		const enough = render5(MIN_PERIOD_SUMMARY_ENTRIES);
		expect(enough).toContain('Dina anteckningar finns samlade.');
		expect(enough).toMatch(/<a class="signal-link[^"]*" href="\/framsteg\?tab=insights">Läs det du har skrivit<\/a>/);
		// Inga siffror i raden, och platskortet leder fortfarande till Framsteg.
		expect(enough).not.toMatch(/\d+ sparade texter|\d+ anteckningar/);
		expect(enough).toContain('href="/framsteg"');

		const almost = render5(MIN_PERIOD_SUMMARY_ENTRIES - 1);
		expect(almost).not.toContain('href="/framsteg?tab=insights"');
		expect(almost).toContain('Efter några anteckningar till');
	});
});
