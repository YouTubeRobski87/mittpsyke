import type { SupabaseClient } from '@supabase/supabase-js'

declare global {
	interface Window {
		gtag?: (...args: unknown[]) => void
	}

	namespace App {
		interface Locals {
			supabase: SupabaseClient
		}
	}
}

export {}
