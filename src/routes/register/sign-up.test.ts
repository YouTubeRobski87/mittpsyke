import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { actions } from './+page.server';
import { load as layoutLoad } from '../+layout.server';
import { SIGN_UP_COMPLETED_COOKIE } from '$lib/sign-up-event';

function registrationRequest() {
	return new Request('http://localhost/register', {
		method: 'POST',
		body: new URLSearchParams({ email: 'test@example.com', password: 'safe-password' })
	});
}

function registrationEvent(options: { signUpError?: Error | null; identities?: unknown[] } = {}) {
	const cookies = { set: vi.fn() };
	const signInWithPassword = vi.fn().mockResolvedValue({ error: null });

	return {
		request: registrationRequest(),
		locals: {
			supabase: {
				auth: {
					signUp: vi.fn().mockResolvedValue({
						data: { user: { identities: options.identities ?? [{ provider: 'email' }] } },
						error: options.signUpError ?? null
					}),
					signInWithPassword
				}
			}
		},
		cookies,
		signInWithPassword
	};
}

describe('GA4 sign_up efter registrering', () => {
	it('lyckad ny e-postregistrering markerar exakt ett sign_up-event för nästa sidladdning', async () => {
		const event = registrationEvent();

		await expect(actions.default(event as never)).rejects.toMatchObject({
			status: 303,
			location: '/dashboard'
		});

		expect(event.cookies.set).toHaveBeenCalledTimes(1);
		expect(event.cookies.set).toHaveBeenCalledWith(
			SIGN_UP_COMPLETED_COOKIE,
			'1',
			expect.objectContaining({ httpOnly: true, maxAge: 60 })
		);
		expect(event.signInWithPassword).toHaveBeenCalledTimes(1);
	});

	it('misslyckad registrering markerar inget sign_up-event', async () => {
		const event = registrationEvent({ signUpError: new Error('Registreringen misslyckades.') });

		const result = await actions.default(event as never);

		expect(result).toMatchObject({ status: 400 });
		expect(event.cookies.set).not.toHaveBeenCalled();
		expect(event.signInWithPassword).not.toHaveBeenCalled();
	});

	it('ett maskerat svar för ett befintligt konto markerar inget sign_up-event', async () => {
		const event = registrationEvent({ identities: [] });

		await expect(actions.default(event as never)).rejects.toMatchObject({ status: 303 });

		expect(event.cookies.set).not.toHaveBeenCalled();
	});

	it('ett besök på /register skickar inte sign_up', () => {
		const registerPage = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

		expect(registerPage).not.toContain('trackSignUp(');
		expect(registerPage).not.toContain("'sign_up'");
	});

	it('layouten konsumerar markören före den skickar den till klienten', async () => {
		const cookieValues = new Map([[SIGN_UP_COMPLETED_COOKIE, '1']]);
		const cookies = {
			get: (name: string) => cookieValues.get(name),
			delete: vi.fn((name: string) => cookieValues.delete(name))
		};
		const locals = {
			supabase: { auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) } }
		};

		const first = await layoutLoad({ locals, cookies } as never);
		const second = await layoutLoad({ locals, cookies } as never);

		expect(first.signUpCompleted).toBe(true);
		expect(second.signUpCompleted).toBe(false);
		expect(cookies.delete).toHaveBeenCalledTimes(1);
	});

	it('klienten använder en befintlig GA4-helper och kan bara skicka en gång', () => {
		const layout = readFileSync(new URL('../+layout.svelte', import.meta.url), 'utf8');
		const eventHelper = readFileSync(new URL('../../lib/analytics.ts', import.meta.url), 'utf8');
		const signUpEffect = layout.slice(layout.indexOf('$effect(() => {\n\t\tif (!browser || !data?.signUpCompleted'));

		expect(eventHelper).toContain("trackEvent('sign_up')");
		expect(signUpEffect).toContain('signUpTracked');
		expect(signUpEffect).toContain('trackSignUp();');
		expect(layout.match(/trackSignUp\(\)/g)).toHaveLength(1);
	});
});
