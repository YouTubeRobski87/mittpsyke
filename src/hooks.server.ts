import { createServerClient } from '@supabase/ssr'
import { env as publicEnv } from '$env/dynamic/public'
import { redirect, type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { getSessionUser } from '$lib/server/admin-auth'

const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY ?? ''

const canonicalHostRedirect: Handle = async ({ event, resolve }) => {
	const forwardedHost = event.request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ?? ''
	const requestHost = (forwardedHost || event.url.host).replace(/:\d+$/, '')

	if (requestHost === 'mittpsyke.se') {
		const canonicalUrl = new URL(event.url)
		canonicalUrl.host = 'www.mittpsyke.se'
		throw redirect(301, canonicalUrl.toString())
	}

	return resolve(event)
}

// --- Säkerhetsheaders ---
const securityHeaders: Handle = async ({ event, resolve }) => {
	const response = await resolve(event)

	// Strict-Transport-Security (HSTS)
	// Tvingar HTTPS i 1 år, inkl subdomains
	response.headers.set(
		'Strict-Transport-Security',
		'max-age=31536000; includeSubDomains; preload'
	)

	// Content-Security-Policy
	// Tillåter: self, Supabase, Google Analytics, inline för gtag
	const supabaseHost = supabaseUrl
		? new URL(supabaseUrl).host
		: '*.supabase.co'

	const csp = [
		// Standard
		"default-src 'self'",
		// Scripts: self + Google Analytics + inline för gtag
		`script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com`,
		// Styles: self + unsafe-inline (Tailwind/Svelte)
		"style-src 'self' 'unsafe-inline'",
		// Images
		`img-src 'self' data: https://www.google-analytics.com https://*.google-analytics.com https://www.google.se https://*.google.com https://${supabaseHost}`,
		// Fonts (lokala)
		"font-src 'self'",
		// API-anrop
		`connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://www.google-analytics.com https://*.google-analytics.com https://region1.analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://api.retellai.com`,
		// Frames
		"frame-src 'none'",
		// Objects
		"object-src 'none'",
		// Base URI
		"base-uri 'self'",
		// Form actions
		"form-action 'self'",
		// Frame ancestors (clickjacking-skydd)
		"frame-ancestors 'none'",
		// Upgrade insecure requests
		"upgrade-insecure-requests"
	].join('; ')

	response.headers.set('Content-Security-Policy', csp)

	// X-Content-Type-Options
	response.headers.set('X-Content-Type-Options', 'nosniff')

	// Referrer-Policy
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

	// Permissions-Policy
	response.headers.set(
		'Permissions-Policy',
		'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
	)

	// X-Frame-Options (backup för äldre webbläsare)
	response.headers.set('X-Frame-Options', 'DENY')

	// X-DNS-Prefetch-Control
	response.headers.set('X-DNS-Prefetch-Control', 'on')

	return response
}

// --- Supabase auth ---
const supabaseAuth: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				try {
					cookiesToSet.forEach(({ name, value, options }) =>
						event.cookies.set(name, value, { ...options, path: '/' })
					)
				} catch {
					// applyServerStorage kan anropas efter att responsen redan skickats
					// (t.ex. vid token-refresh på snabba API-routes).
					// Sessionen uppdateras korrekt på nästa request – detta kan ignoreras.
				}
			}
		}
	})

	event.locals.getSession = () => getSessionUser(event.locals.supabase)

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version'
		}
	})
}

// Kör säkerhetsheaders först, sedan Supabase auth
export const handle = sequence(canonicalHostRedirect, securityHeaders, supabaseAuth)
