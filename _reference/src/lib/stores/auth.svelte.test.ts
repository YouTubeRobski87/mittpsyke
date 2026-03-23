import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$app/environment', () => ({
	browser: true
}));

vi.mock('$lib/supabase/client', () => ({
	supabase: {
		auth: {
			getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
			onAuthStateChange: vi
				.fn()
				.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
			signOut: vi.fn().mockResolvedValue({ error: null })
		}
	}
}));

import { authStore } from './auth.svelte';
import { supabase } from '$lib/supabase/client';

// Typed mock helpers
const mockGetSession = vi.mocked(supabase.auth.getSession);
const mockOnAuthStateChange = vi.mocked(supabase.auth.onAuthStateChange);
const mockSignOut = vi.mocked(supabase.auth.signOut);

describe('authStore', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// Restore default implementations after clearAllMocks
		mockGetSession.mockResolvedValue({ data: { session: null } } as any);
		mockOnAuthStateChange.mockReturnValue({
			data: { subscription: { unsubscribe: vi.fn() } }
		} as any);
		mockSignOut.mockResolvedValue({ error: null } as any);
	});

	describe('initial state', () => {
		it('isLoggedIn is false before init', () => {
			expect(authStore.isLoggedIn).toBe(false);
		});
	});

	describe('init', () => {
		it('sets session and user when session exists', async () => {
			const mockSession = {
				access_token: 'token',
				user: { id: 'user-1', email: 'test@example.com' }
			};
			mockGetSession.mockResolvedValueOnce({
				data: { session: mockSession }
			} as any);

			await authStore.init();

			expect(authStore.session).toEqual(mockSession);
			expect(authStore.user).toEqual(mockSession.user);
			expect(authStore.isLoggedIn).toBe(true);
			expect(authStore.isLoading).toBe(false);
		});

		it('stays null when no session', async () => {
			await authStore.init();

			expect(authStore.session).toBeNull();
			expect(authStore.user).toBeNull();
			expect(authStore.isLoggedIn).toBe(false);
			expect(authStore.isLoading).toBe(false);
		});

		it('sets up auth state change listener', async () => {
			await authStore.init();

			expect(mockOnAuthStateChange).toHaveBeenCalledOnce();
		});
	});

	describe('auth state change listener', () => {
		it('updates state on sign-in and clears on sign-out', async () => {
			// Capture the callback
			let capturedCallback: any;
			mockOnAuthStateChange.mockImplementation((cb: any) => {
				capturedCallback = cb;
				return { data: { subscription: { unsubscribe: vi.fn() } } } as any;
			});

			await authStore.init();
			expect(authStore.isLoggedIn).toBe(false);

			// Simulate sign-in
			const newSession = {
				access_token: 'new-token',
				user: { id: 'user-2', email: 'new@example.com' }
			};
			capturedCallback('SIGNED_IN', newSession);

			expect(authStore.session).toEqual(newSession);
			expect(authStore.user).toEqual(newSession.user);
			expect(authStore.isLoggedIn).toBe(true);

			// Simulate sign-out
			capturedCallback('SIGNED_OUT', null);

			expect(authStore.session).toBeNull();
			expect(authStore.user).toBeNull();
			expect(authStore.isLoggedIn).toBe(false);
		});
	});

	describe('signOut', () => {
		it('calls supabase signOut', async () => {
			await authStore.signOut();

			expect(mockSignOut).toHaveBeenCalledOnce();
		});
	});
});
