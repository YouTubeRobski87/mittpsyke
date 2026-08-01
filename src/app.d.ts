import type { SupabaseClient } from '@supabase/supabase-js'
import type { SessionUser } from '$lib/server/admin-auth'

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void
	}

	namespace App {
		interface Locals {
			supabase: SupabaseClient
			getSession: () => Promise<SessionUser | null>
		}
	}
}

export {}
