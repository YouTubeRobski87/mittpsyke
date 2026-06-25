import { env } from '$env/dynamic/private';
import { json, type RequestHandler } from '@sveltejs/kit';

type HibpBreachResponse = {
	Name?: unknown;
	Title?: unknown;
	Domain?: unknown;
	BreachDate?: unknown;
	DataClasses?: unknown;
	IsVerified?: unknown;
	IsSensitive?: unknown;
};

const HIBP_BREACHED_ACCOUNT_URL = 'https://haveibeenpwned.com/api/v3/breachedaccount';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const REQUEST_TIMEOUT_MS = 8_000;

const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = 5;
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function normalizeEmail(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const email = value.trim().toLowerCase();
	if (!email || email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
		return null;
	}

	return email;
}

function isRateLimited(clientId: string): boolean {
	const now = Date.now();
	const bucket = rateLimitBuckets.get(clientId);

	if (!bucket || bucket.resetAt <= now) {
		rateLimitBuckets.set(clientId, { count: 1, resetAt: now + rateLimitWindowMs });
		return false;
	}

	bucket.count += 1;
	return bucket.count > rateLimitMaxRequests;
}

function toSafeBreach(breach: HibpBreachResponse) {
	return {
		name: typeof breach.Name === 'string' ? breach.Name : '',
		title: typeof breach.Title === 'string' ? breach.Title : 'Okänt dataintrång',
		domain: typeof breach.Domain === 'string' ? breach.Domain : '',
		breachDate: typeof breach.BreachDate === 'string' ? breach.BreachDate : '',
		dataClasses: Array.isArray(breach.DataClasses)
			? breach.DataClasses.filter((item): item is string => typeof item === 'string')
			: [],
		isVerified: breach.IsVerified === true,
		isSensitive: breach.IsSensitive === true
	};
}

function noStoreResponse(body: Record<string, unknown>, init?: ResponseInit) {
	return json(body, {
		...init,
		headers: {
			'cache-control': 'no-store',
			...init?.headers
		}
	});
}

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return noStoreResponse({ message: 'Skicka en giltig e-postadress.' }, { status: 400 });
	}

	const email = normalizeEmail((body as { email?: unknown })?.email);
	if (!email) {
		return noStoreResponse({ message: 'Skicka en giltig e-postadress.' }, { status: 400 });
	}

	const clientId = getClientAddress();
	if (isRateLimited(clientId)) {
		return noStoreResponse(
			{ message: 'För många försök just nu. Vänta en liten stund och prova igen.' },
			{ status: 429 }
		);
	}

	const apiKey = env.HIBP_API_KEY?.trim();
	if (!apiKey) {
		return noStoreResponse(
			{ message: 'Tjänsten är tillfälligt inte konfigurerad.' },
			{ status: 500 }
		);
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

	try {
		const response = await fetch(
			`${HIBP_BREACHED_ACCOUNT_URL}/${encodeURIComponent(email)}?truncateResponse=false`,
			{
				headers: {
					'hibp-api-key': apiKey,
					'user-agent': 'MittPsyke',
					accept: 'application/json'
				},
				signal: controller.signal
			}
		);

		if (response.status === 404) {
			return noStoreResponse({ breaches: [] });
		}

		if (response.status === 429) {
			const retryAfter = response.headers.get('retry-after');
			return noStoreResponse(
				{
					message: retryAfter
						? `Have I Been Pwned ber oss vänta ${retryAfter} sekunder innan nästa sökning.`
						: 'Have I Been Pwned ber oss vänta en stund innan nästa sökning.',
					retryAfter
				},
				{ status: 429 }
			);
		}

		if (!response.ok) {
			console.error('[hibp/breaches] HIBP upstream error', { status: response.status });
			return noStoreResponse(
				{ message: 'Det gick inte att kontrollera e-postadressen just nu.' },
				{ status: 502 }
			);
		}

		const breaches = await response.json();
		if (!Array.isArray(breaches)) {
			console.error('[hibp/breaches] Unexpected HIBP response shape');
			return noStoreResponse(
				{ message: 'Det gick inte att läsa svaret från Have I Been Pwned.' },
				{ status: 502 }
			);
		}

		return noStoreResponse({ breaches: breaches.map(toSafeBreach) });
	} catch (error) {
		const isAbortError = error instanceof Error && error.name === 'AbortError';
		console.error('[hibp/breaches] HIBP request failed', {
			reason: isAbortError ? 'timeout' : 'request_failed'
		});
		return noStoreResponse(
			{ message: 'Det gick inte att kontrollera e-postadressen just nu.' },
			{ status: 502 }
		);
	} finally {
		clearTimeout(timeout);
	}
};
