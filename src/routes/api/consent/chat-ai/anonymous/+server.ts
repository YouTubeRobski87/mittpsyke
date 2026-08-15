import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';
import {
	ANONYMOUS_CHAT_CONSENT_COOKIE,
	ANONYMOUS_CHAT_CONSENT_TTL_SECONDS,
	hasAnonymousChatConsentSecret,
	hasValidAnonymousChatConsent,
	issueAnonymousChatConsentToken
} from '$lib/server/anonymous-chat-consent';
import { CHAT_AI_CONSENT_POLICY_VERSION } from '$lib/server/chat-ai-consent';

// Samtycke för anonym AI-chatt. Gäller enbart gäster: en inloggad användare
// styrs av user_ai_consents (V3.2) och får aldrig auktoriseras härifrån.
//
// Tokenvärdet lämnar aldrig servern i JSON. Klienten behöver bara veta om
// samtycke finns, inte vad cookien innehåller.

const COOKIE_OPTIONS = {
	httpOnly: true,
	sameSite: 'strict',
	path: '/',
	secure: !dev
} as const;

function isAuthenticatedRequest(request: Request): boolean {
	const header = request.headers.get('authorization');
	if (!header) return false;
	const [scheme, token] = header.split(' ');
	return scheme?.toLowerCase() === 'bearer' && Boolean(token?.trim());
}

/**
 * En redan autentiserad request ska inte kunna skaffa sig ett anonymt
 * samtycke. Att tillåta det hade gett två parallella canonical states för
 * samma person, och en väg att kringgå V3.2 genom att logga ut i tanken men
 * behålla cookien. Vi svarar 409 och pekar på den inloggade vägen.
 */
function authenticatedConflict() {
	return json(
		{
			error: 'Inloggade användare styrs av /api/consent/chat-ai.',
			status: 'authenticated'
		},
		{ status: 409 }
	);
}

function misconfigured() {
	return json({ error: 'Server configuration error.' }, { status: 500 });
}

export const GET: RequestHandler = async ({ request, cookies }) => {
	if (isAuthenticatedRequest(request)) return authenticatedConflict();
	if (!hasAnonymousChatConsentSecret()) return misconfigured();

	const granted = hasValidAnonymousChatConsent(cookies.get(ANONYMOUS_CHAT_CONSENT_COOKIE));

	return json({
		status: granted ? 'granted' : 'missing',
		policyVersion: CHAT_AI_CONSENT_POLICY_VERSION
	});
};

export const POST: RequestHandler = async ({ request, cookies }) => {
	if (isAuthenticatedRequest(request)) return authenticatedConflict();
	if (!hasAnonymousChatConsentSecret()) return misconfigured();

	let token: string;
	try {
		({ token } = issueAnonymousChatConsentToken());
	} catch {
		return misconfigured();
	}

	cookies.set(ANONYMOUS_CHAT_CONSENT_COOKIE, token, {
		...COOKIE_OPTIONS,
		maxAge: ANONYMOUS_CHAT_CONSENT_TTL_SECONDS
	});

	return json({ status: 'granted', policyVersion: CHAT_AI_CONSENT_POLICY_VERSION });
};

export const DELETE: RequestHandler = async ({ request, cookies }) => {
	// Återkallande får fungera även utan hemlighet - att rensa en cookie kan
	// aldrig vara osäkert, och användaren ska aldrig fastna med ett samtycke.
	if (isAuthenticatedRequest(request)) return authenticatedConflict();

	cookies.delete(ANONYMOUS_CHAT_CONSENT_COOKIE, COOKIE_OPTIONS);

	return json({ status: 'revoked', policyVersion: CHAT_AI_CONSENT_POLICY_VERSION });
};
