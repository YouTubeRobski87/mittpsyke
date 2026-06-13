import { createServerClient } from '@supabase/ssr'
import { env as publicEnv } from '$env/dynamic/public'
import { redirect, type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { getSessionUser } from '$lib/server/admin-auth'

const supabaseUrl = publicEnv.PUBLIC_SUPABASE_URL ?? ''
const supabaseAnonKey = publicEnv.PUBLIC_SUPABASE_ANON_KEY ?? ''

// Gamla bloggslugg som flyttats till egna sidor (eller saknar Soro-artikel) → 301
const legacyBlogRedirects: Record<string, string> = {
	'/blogg/digital-dagbok-for-maende': '/digital-dagbok-for-maende',
	'/blogg/psykiskt-stod-online': '/psykiskt-stod-online',
	'/blogg/humorsparning-app-psykisk-halsa': '/humorsparning',
	'/blogg/skriva-dagbok-online': '/dagbok',
	'/blogg/att-skriva-av-sig-anonymt-online': '/anonym-dagbok-online',
	'/blogg/ovningar-for-att-lugna-tankarna': '/ovningar',
	'/blogg/stod-utan-konto-online': '/chatta-anonymt',
	'/blogg/textbaserat-samtalsstod-vid-oro': '/hjalp-mot-oro-online',
	'/blogg/hur-sortera-tankar-vid-stress': '/stod-vid-stress-online',
	'/blogg/mans-psykiska-halsa': '/blogg/varfor-syns-inte-man-i-samtalet-om-psykisk-ohalsa',
	'/blogg/integritet-i-appar-for-mental-halsa': '/blogg/s%C3%A4kra-maendedata-tjanster'
}

const legacyPathRedirects: Handle = async ({ event, resolve }) => {
	const { url } = event

	const legacyBlogTarget = legacyBlogRedirects[url.pathname]
	if (legacyBlogTarget) {
		throw redirect(301, legacyBlogTarget)
	}

	if (url.pathname === '/guider-seo') {
		throw redirect(301, '/guider')
	}

	if (url.pathname.startsWith('/guider-seo/')) {
		throw redirect(301, url.pathname.replace('/guider-seo/', '/guider/'))
	}

	if (url.pathname === '/kbt') {
		throw redirect(301, '/guider/kbt')
	}

	return resolve(event)
}

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
		`script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://app.trysoro.com`,
		// Styles: self + unsafe-inline (Tailwind/Svelte)
		"style-src 'self' 'unsafe-inline'",
		// Images
		`img-src 'self' data: blob: https://www.google-analytics.com https://*.google-analytics.com https://www.google.se https://*.google.com https://app.trysoro.com https://${supabaseHost} https://*.supabase.co https://*.storage.supabase.co`,
		// Fonts (lokala)
		"font-src 'self'",
		// Media (video): self + blob för inspelad förhandsvisning + Supabase storage för sparade videor
		`media-src 'self' blob: https://${supabaseHost} https://*.supabase.co https://*.storage.supabase.co`,
		// API-anrop
		`connect-src 'self' https://${supabaseHost} wss://${supabaseHost} https://www.google-analytics.com https://*.google-analytics.com https://region1.analytics.google.com https://region1.google-analytics.com https://www.googletagmanager.com https://stats.g.doubleclick.net https://app.trysoro.com`,
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
	// camera + microphone tillåts för egen origin (self) — krävs för videodagboken.
	response.headers.set(
		'Permissions-Policy',
		'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
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
export const handle = sequence(legacyPathRedirects, canonicalHostRedirect, securityHeaders, supabaseAuth)
