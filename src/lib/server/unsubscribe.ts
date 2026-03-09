import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 45;

type UnsubscribeTokenPayload = {
	sub: string;
	jti: string;
	exp: number;
	purpose: 'unsubscribe';
	emailType: string;
};

type TokenVerificationResult =
	| { ok: true; payload: UnsubscribeTokenPayload }
	| { ok: false; error: string };

function getSigningSecret() {
	const signingSecret = env.UNSUBSCRIBE_TOKEN_SECRET ?? env.SUPABASE_JWT_SECRET ?? '';
	if (!signingSecret.trim()) {
		throw new Error('Missing UNSUBSCRIBE_TOKEN_SECRET (or SUPABASE_JWT_SECRET fallback).');
	}
	return signingSecret;
}

function signPayload(payloadSegment: string, secret: string) {
	return createHmac('sha256', secret).update(payloadSegment).digest('base64url');
}

function safeEqual(left: string, right: string) {
	const leftBuffer = Buffer.from(left, 'utf8');
	const rightBuffer = Buffer.from(right, 'utf8');
	if (leftBuffer.length !== rightBuffer.length) return false;
	return timingSafeEqual(leftBuffer, rightBuffer);
}

function sanitizeEmailType(emailType: string | null | undefined) {
	const value = (emailType ?? '').trim().toLowerCase();
	if (!value) return 'general';
	return value.replace(/[^a-z0-9_-]/g, '').slice(0, 40) || 'general';
}

export function createUnsubscribeToken(options: {
	userId: string;
	emailType?: string | null;
	ttlSeconds?: number;
	now?: Date;
}) {
	const { userId, now = new Date() } = options;
	if (!UUID_REGEX.test(userId)) {
		throw new Error('Invalid user id for unsubscribe token.');
	}

	const expiresAt = Math.floor(now.getTime() / 1000) + (options.ttlSeconds ?? DEFAULT_TTL_SECONDS);
	const payload: UnsubscribeTokenPayload = {
		sub: userId,
		jti: randomUUID(),
		exp: expiresAt,
		purpose: 'unsubscribe',
		emailType: sanitizeEmailType(options.emailType)
	};

	const payloadSegment = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
	const signature = signPayload(payloadSegment, getSigningSecret());
	return `${payloadSegment}.${signature}`;
}

export function verifyUnsubscribeToken(token: string, now = new Date()): TokenVerificationResult {
	const tokenValue = token.trim();
	if (!tokenValue) return { ok: false, error: 'Token is missing.' };

	const [payloadSegment, signature] = tokenValue.split('.');
	if (!payloadSegment || !signature) {
		return { ok: false, error: 'Token format is invalid.' };
	}

	let payload: UnsubscribeTokenPayload;
	try {
		payload = JSON.parse(Buffer.from(payloadSegment, 'base64url').toString('utf8')) as UnsubscribeTokenPayload;
	} catch {
		return { ok: false, error: 'Token payload is invalid.' };
	}

	if (
		!payload ||
		payload.purpose !== 'unsubscribe' ||
		typeof payload.sub !== 'string' ||
		!UUID_REGEX.test(payload.sub) ||
		typeof payload.jti !== 'string' ||
		!UUID_REGEX.test(payload.jti) ||
		typeof payload.exp !== 'number'
	) {
		return { ok: false, error: 'Token payload is malformed.' };
	}

	const expectedSignature = signPayload(payloadSegment, getSigningSecret());
	if (!safeEqual(expectedSignature, signature)) {
		return { ok: false, error: 'Token signature is invalid.' };
	}

	const nowUnix = Math.floor(now.getTime() / 1000);
	if (payload.exp <= nowUnix) {
		return { ok: false, error: 'Token has expired.' };
	}

	return { ok: true, payload: { ...payload, emailType: sanitizeEmailType(payload.emailType) } };
}

export function buildUnsubscribeUrl(origin: string, token: string) {
	const normalizedOrigin = origin.replace(/\/+$/, '');
	return `${normalizedOrigin}/avregistrera?token=${encodeURIComponent(token)}`;
}
