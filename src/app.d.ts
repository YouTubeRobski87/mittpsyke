import type { SupabaseClient, User } from '@supabase/supabase-js'

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void
	}

	namespace App {
		interface Locals {
			supabase: SupabaseClient
			getSession: () => Promise<(User & { is_super_admin: boolean }) | null>
		}
	}
}

export {}
