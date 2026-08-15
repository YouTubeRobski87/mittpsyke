import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { CHAT_AI_CONSENT_POLICY_VERSION } from '$lib/server/chat-ai-consent';

// Serververifierbart samtycke för anonym AI-chatt.
//
// En gäst har inget auth.users-id och kan därför inte ha en rad i
// user_ai_consents. I stället utfärdar servern en kortlivad HMAC-signerad
// token som bara den kan skapa, och lägger den i en HttpOnly-cookie. Klienten
// kan varken läsa eller förfalska den.
//
// Det här är inte en persistent identifierare: nyttolasten pekar inte ut någon
// person, den säger bara "den här webbläsaren har lämnat samtycke enligt den
// här policyversionen, fram till den här tidpunkten". jti finns för att två
// tokens utfärdade samma sekund ska skilja sig åt, inte för att spåra.
//
// Signeringsmönstret följer $lib/server/unsubscribe.ts.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const ANONYMOUS_CHAT_CONSENT_COOKIE = 'mittpsyke_chat_consent';
export const ANONYMOUS_CHAT_CONSENT_PURPOSE = 'chat-ai-anon';
export const ANONYMOUS_CHAT_CONSENT_TTL_SECONDS = 60 * 60 * 24;

type AnonymousChatConsentPayload = {
	purpose: typeof ANONYMOUS_CHAT_CONSENT_PURPOSE;
	policyVersion: string;
	exp: number;
	jti: string;
};

type VerificationResult =
	| { ok: true; payload: AnonymousChatConsentPayload }
	| { ok: false; error: string };

/**
 * Egen hemlighet, avsiktligt utan fallback. Att låna SUPABASE_JWT_SECRET hade
 * gjort att en läckt chattoken kunde blandas ihop med auth-domänen, och att en
 * rotation av den ena tyst hade påverkat den andra. Saknas nyckeln kastar vi,
 * och anroparen översätter det till ett stängt svar.
 */
function getSigningSecret(): string {
	const secret = env.CHAT_ANON_CONSENT_SECRET ?? '';
	if (secret.trim().length < 32) {
		throw new Error('Missing or too short CHAT_ANON_CONSENT_SECRET.');
	}
	return secret;
}

/** Sant när en hemlighet finns och duger. Används för att svara 500 i stället för att kasta. */
export function hasAnonymousChatConsentSecret(): boolean {
	try {
		getSigningSecret();
		return true;
	} catch {
		return false;
	}
}

function signPayload(payloadSegment: string, secret: string): string {
	return createHmac('sha256', secret).update(payloadSegment).digest('base64url');
}

function safeEqual(left: string, right: string): boolean {
	const leftBuffer = Buffer.from(left, 'utf8');
	const rightBuffer = Buffer.from(right, 'utf8');
	if (leftBuffer.length !== rightBuffer.length) return false;
	return timingSafeEqual(leftBuffer, rightBuffer);
}

/** Kastar om hemligheten saknas. Anroparen måste fånga och svara stängt. */
export function issueAnonymousChatConsentToken(options: { now?: Date; ttlSeconds?: number } = {}) {
	const { now = new Date() } = options;
	const ttlSeconds = options.ttlSeconds ?? ANONYMOUS_CHAT_CONSENT_TTL_SECONDS;

	const payload: AnonymousChatConsentPayload = {
		purpose: ANONYMOUS_CHAT_CONSENT_PURPOSE,
		policyVersion: CHAT_AI_CONSENT_POLICY_VERSION,
		exp: Math.floor(now.getTime() / 1000) + ttlSeconds,
		jti: randomUUID()
	};

	const payloadSegment = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
	const signature = signPayload(payloadSegment, getSigningSecret());

	return { token: `${payloadSegment}.${signature}`, expiresAt: payload.exp };
}

/**
 * Fail-closed verifiering. Varje avvikelse ger ok: false, aldrig ett kast som
 * kan passera vidare som "godkänd".
 */
export function verifyAnonymousChatConsentToken(
	token: string | null | undefined,
	now: Date = new Date()
): VerificationResult {
	const tokenValue = typeof token === 'string' ? token.trim() : '';
	if (!tokenValue) return { ok: false, error: 'Token is missing.' };

	const segments = tokenValue.split('.');
	if (segments.length !== 2) return { ok: false, error: 'Token format is invalid.' };

	const [payloadSegment, signature] = segments;
	if (!payloadSegment || !signature) return { ok: false, error: 'Token format is invalid.' };

	let secret: string;
	try {
		secret = getSigningSecret();
	} catch {
		// Saknad hemlighet får aldrig tolkas som giltigt samtycke.
		return { ok: false, error: 'Server configuration error.' };
	}

	// Signaturen prövas före nyttolasten, så manipulerat innehåll aldrig ens
	// hinner tolkas.
	const expectedSignature = signPayload(payloadSegment, secret);
	if (!safeEqual(expectedSignature, signature)) {
		return { ok: false, error: 'Token signature is invalid.' };
	}

	let payload: AnonymousChatConsentPayload;
	try {
		payload = JSON.parse(
			Buffer.from(payloadSegment, 'base64url').toString('utf8')
		) as AnonymousChatConsentPayload;
	} catch {
		return { ok: false, error: 'Token payload is invalid.' };
	}

	if (!payload || typeof payload !== 'object') {
		return { ok: false, error: 'Token payload is malformed.' };
	}

	if (payload.purpose !== ANONYMOUS_CHAT_CONSENT_PURPOSE) {
		return { ok: false, error: 'Token purpose is invalid.' };
	}

	if (payload.policyVersion !== CHAT_AI_CONSENT_POLICY_VERSION) {
		return { ok: false, error: 'Token policy version is outdated.' };
	}

	if (typeof payload.jti !== 'string' || !UUID_REGEX.test(payload.jti)) {
		return { ok: false, error: 'Token payload is malformed.' };
	}

	if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
		return { ok: false, error: 'Token payload is malformed.' };
	}

	if (payload.exp <= Math.floor(now.getTime() / 1000)) {
		return { ok: false, error: 'Token has expired.' };
	}

	return { ok: true, payload };
}

/** Bekvämlighet för grindarna: bara ja eller nej. */
export function hasValidAnonymousChatConsent(
	token: string | null | undefined,
	now: Date = new Date()
): boolean {
	return verifyAnonymousChatConsentToken(token, now).ok;
}
