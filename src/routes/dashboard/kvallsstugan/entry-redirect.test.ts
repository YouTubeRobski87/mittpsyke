import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { EMPTY_EVENING_INTERIOR_MEMORY } from '$lib/evening-interior-memory';
import { safeInternalRedirect } from '$lib/safe-redirect';
import { getStableOAuthCallbackUrl } from '$lib/auth-redirect';
import { load } from './+page.server';
import { actions } from '../../login/+page.server';
import { GET } from '../../auth/callback/+server';

vi.mock('$env/dynamic/public', () => ({ env: {} }));
vi.mock('$lib/server/companion-daily-question', () => ({ loadCompanionDailyState: vi.fn(async () => null) }));
vi.mock('$lib/server/evening-checkin', () => ({ loadEveningInteriorMemory: vi.fn(async () => EMPTY_EVENING_INTERIOR_MEMORY) }));
const { loadEveningInteriorMemory } = await import('$lib/server/evening-checkin');

const destination = '/dashboard/kvallsstugan';
const signedIn = { id: 'test-user', is_anonymous: false } as User;
function cabinEvent(user: User | null) {
	return { locals: { supabase: { auth: { getUser: vi.fn(async () => ({ data: { user } })) } } } } as unknown as Parameters<typeof load>[0];
}

beforeEach(() => vi.clearAllMocks());

describe('Kvällstugans navigation genom inloggning', () => {
	it.each([null, { ...signedIn, is_anonymous: true }])('bevarar destinationen och läser inte stugdata för gästen', async (user) => {
		await expect(load(cabinEvent(user))).rejects.toMatchObject({ status: 303, location: `/login?redirect=${destination}` });
		expect(loadEveningInteriorMemory).not.toHaveBeenCalled();
	});

	it('släpper in ett vanligt konto direkt utan ytterligare redirect', async () => {
		await expect(load(cabinEvent(signedIn))).resolves.toEqual({ companionDaily: null, interiorMemory: EMPTY_EVENING_INTERIOR_MEMORY });
	});

	it('återvänder efter lösenordsinloggning och kan ladda stugan utan loop', async () => {
		const request = new Request('http://localhost/login', { method: 'POST', body: new URLSearchParams({ email: 'test@example.invalid', password: 'test-fixture' }) });
		const event = { request, url: new URL(`http://localhost/login?redirect=${destination}`), locals: { supabase: { auth: { signInWithPassword: vi.fn(async () => ({ error: null })) } } } } as unknown as Parameters<NonNullable<typeof actions.default>>[0];
		await expect(actions.default!(event)).rejects.toMatchObject({ status: 303, location: destination });
		await expect(load(cabinEvent(signedIn))).resolves.toBeDefined();
	});

	it('bevarar det säkra målet genom Google-callbacken', async () => {
		const url = new URL(getStableOAuthCallbackUrl(safeInternalRedirect(destination)));
		url.searchParams.set('code', 'test-fixture');
		const event = { url, locals: { supabase: { auth: { exchangeCodeForSession: vi.fn(async () => ({ error: null })) } } } } as unknown as Parameters<typeof GET>[0];
		await expect(GET(event)).rejects.toMatchObject({ status: 303, location: destination });
		await expect(load(cabinEvent(signedIn))).resolves.toBeDefined();
	});
});
