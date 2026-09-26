import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AccountTeaser from './AccountTeaser.svelte';

describe('kontoerbjudandet', () => {
	it('kopplar Framsteg till kontinuitet utan att blockera de öppna vägarna', () => {
		const { body } = render(AccountTeaser, { props: { variant: 'progress' } });

		expect(body).toContain('Fortsätt härifrån och börja se din utveckling över tid.');
		expect(body).toContain('se vad som återkommer eller förändras när du kommer tillbaka');
		expect(body).toContain('href="/register"');
		expect(body).toContain('href="/dagbok?action=new"');
		expect(body).toContain('Anonym dagbok');
	});

	it('behåller den kortare generella texten utanför Framsteg', () => {
		const { body } = render(AccountTeaser, { props: { variant: 'dashboard' } });

		expect(body).toContain('Skapa ett konto när du vill spara det du lämnar här.');
		expect(body).not.toContain('börja se din utveckling över tid');
	});
});
