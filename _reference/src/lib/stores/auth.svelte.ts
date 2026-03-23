import { browser } from '$app/environment';
import { supabase } from '$lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

function createAuthStore() {
	let user = $state<User | null>(null);
	let session = $state<Session | null>(null);
	let isLoading = $state(true);

	async function init() {
		if (!browser) return;

		// Get the current session
		const { data } = await supabase.auth.getSession();
		session = data.session;
		user = data.session?.user ?? null;
		isLoading = false;

		// Listen for auth state changes (login, logout, token refresh)
		supabase.auth.onAuthStateChange((_event, newSession) => {
			session = newSession;
			user = newSession?.user ?? null;
			isLoading = false;
		});
	}

	async function signOut() {
		await supabase.auth.signOut();
	}

	return {
		get user() {
			return user;
		},
		get session() {
			return session;
		},
		get isLoggedIn() {
			return !!session;
		},
		get isLoading() {
			return isLoading;
		},
		init,
		signOut
	};
}

export const authStore = createAuthStore();
