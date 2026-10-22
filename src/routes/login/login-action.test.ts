import { isActionFailure } from '@sveltejs/kit';
import { describe, expect, it, vi } from 'vitest';
import { actions } from './+page.server';

const loginAction = actions.default;
if (!loginAction) throw new Error('Inloggningsåtgärden saknas.');

function loginEvent(email: string, password: string, error: Error | null = null, redirect = '/framsteg') {
	const signInWithPassword = vi.fn().mockResolvedValue({ error });
	// Bara de eventfält som den riktiga åtgärden använder. Ingen riktig Auth-tjänst anropas.
	const event = {
		request: new Request('http://localhost/login', {
			method: 'POST',
			body: new URLSearchParams({ email, password })
		}),
		url: new URL(`http://localhost/login?redirect=${encodeURIComponent(redirect)}`),
		locals: { supabase: { auth: { signInWithPassword } } }
	} as unknown as Parameters<typeof loginAction>[0];
	return { event, signInWithPassword };
}

describe('inloggningsåtgärden efter runtime-uppdatering', () => {
	it.each([['', 'fixture-password'], ['synthetic@example.invalid', '']])(
		'bevarar SvelteKits fail-svar för ofullständiga uppgifter',
		async (email, password) => {
			const { event, signInWithPassword } = loginEvent(email, password);
			const result = await loginAction(event);
			expect(isActionFailure(result)).toBe(true);
			expect(result).toMatchObject({ status: 400, data: { error: 'E-post och lösenord krävs.' } });
			expect(signInWithPassword).not.toHaveBeenCalled();
		}
	);

	it('bevarar 401 utan att returnera leverantörsfel eller lösenord', async () => {
		const { event, signInWithPassword } = loginEvent(
			'synthetic@example.invalid', 'fixture-password', new Error('synthetic-provider-detail')
		);
		const result = await loginAction(event);
		expect(isActionFailure(result)).toBe(true);
		expect(result).toMatchObject({ status: 401, data: { error: 'Fel e-post eller lösenord.' } });
		expect(JSON.stringify(result)).not.toMatch(/fixture-password|synthetic-provider-detail/);
		expect(signInWithPassword).toHaveBeenCalledOnce();
	});

	it('behåller 303 och avvisar ett externt redirectmål efter lyckad mockad login', async () => {
		const { event, signInWithPassword } = loginEvent(
			'synthetic@example.invalid', 'fixture-password', null, 'https://example.invalid/elsewhere'
		);
		await expect(loginAction(event)).rejects.toMatchObject({ status: 303, location: '/dashboard/kvallsstugan' });
		expect(signInWithPassword).toHaveBeenCalledOnce();
	});
});
