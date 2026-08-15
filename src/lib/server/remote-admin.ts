import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Fjärrstyrnings-API:et (/api/remote) anropas utanför webbläsaren — från en
 * telefongenväg, ett skript eller en terminal — och kan därför inte luta sig
 * mot en inloggad adminsession. Skyddet är i stället en delad token som sätts
 * som REMOTE_ADMIN_TOKEN i Render.
 *
 * Modulen håller all logik som går att testa utan Supabase och utan $env:
 * tokenkontroll, kommandotolkning och parameterläsning.
 */

/**
 * Minsta längd på tokenen. Endpointen ger skrivåtkomst till publicerat
 * innehåll, så en kort och gissningsbar token får aldrig räcka. Kortare än så
 * behandlas som felkonfiguration och stänger rutten helt.
 */
export const MIN_REMOTE_TOKEN_LENGTH = 32;

export const REMOTE_COMMANDS = [
	'status',
	'pages.list',
	'pages.set-status',
	'ab.list',
	'ab.winner',
	'feedback.recent'
] as const;

export type RemoteCommandName = (typeof REMOTE_COMMANDS)[number];

export function isRemoteCommand(value: unknown): value is RemoteCommandName {
	return typeof value === 'string' && (REMOTE_COMMANDS as readonly string[]).includes(value);
}

/**
 * Jämför två tokens utan att läcka hur många tecken som stämde. Båda hashas
 * först, så jämförelsen sker alltid på lika långa buffertar och längden på den
 * riktiga tokenen läcker inte heller.
 */
function tokensMatch(configured: string, provided: string) {
	const configuredHash = createHash('sha256').update(configured, 'utf8').digest();
	const providedHash = createHash('sha256').update(provided, 'utf8').digest();

	return timingSafeEqual(configuredHash, providedHash);
}

/**
 * Läser tokenen ur headers. Till skillnad från cron-rutterna accepteras den
 * aldrig i query-strängen: hela URL:er hamnar i access-loggar, proxyhistorik
 * och Referer-headers, och en token som ger skrivåtkomst hör inte hemma där.
 */
export function extractRemoteToken(headers: Headers): string | null {
	const direct = headers.get('x-remote-admin-token')?.trim();
	if (direct) return direct;

	const authorization = headers.get('authorization')?.trim();
	if (authorization) {
		const match = /^Bearer\s+(.+)$/i.exec(authorization);
		const token = match?.[1].trim();
		if (token) return token;
	}

	return null;
}

export type RemoteAuthResult =
	| { ok: true }
	| { ok: false; status: number; error: string; logReason: string };

/**
 * `logReason` är avsedd för serverloggen, `error` för svaret. Anroparen ska
 * aldrig få veta om det var tokenen eller konfigurationen som fällde anropet.
 */
export function authorizeRemoteRequest(
	configuredToken: string | undefined | null,
	providedToken: string | null
): RemoteAuthResult {
	const configured = (configuredToken ?? '').trim();

	if (!configured) {
		return {
			ok: false,
			status: 503,
			error: 'Fjärrstyrning är inte aktiverad på den här servern.',
			logReason: 'REMOTE_ADMIN_TOKEN saknas'
		};
	}

	if (configured.length < MIN_REMOTE_TOKEN_LENGTH) {
		return {
			ok: false,
			status: 503,
			error: 'Fjärrstyrning är inte aktiverad på den här servern.',
			logReason: `REMOTE_ADMIN_TOKEN är kortare än ${MIN_REMOTE_TOKEN_LENGTH} tecken`
		};
	}

	if (!providedToken) {
		return {
			ok: false,
			status: 401,
			error: 'Unauthorized.',
			logReason: 'token saknades i anropet'
		};
	}

	if (!tokensMatch(configured, providedToken)) {
		return {
			ok: false,
			status: 401,
			error: 'Unauthorized.',
			logReason: 'felaktig token'
		};
	}

	return { ok: true };
}

export type ParsedRemoteCommand =
	| { ok: true; command: RemoteCommandName; params: Record<string, unknown> }
	| { ok: false; error: string };

export function parseRemoteCommand(body: unknown): ParsedRemoteCommand {
	if (!body || typeof body !== 'object' || Array.isArray(body)) {
		return { ok: false, error: 'Body måste vara ett JSON-objekt.' };
	}

	const record = body as Record<string, unknown>;

	if (!isRemoteCommand(record.command)) {
		return {
			ok: false,
			error: `Okänt kommando. Giltiga värden: ${REMOTE_COMMANDS.join(', ')}.`
		};
	}

	const rawParams = record.params;
	const paramsMissing = rawParams === undefined || rawParams === null;
	const paramsInvalid = !paramsMissing && (typeof rawParams !== 'object' || Array.isArray(rawParams));

	if (paramsInvalid) {
		return { ok: false, error: 'params måste vara ett objekt.' };
	}

	return {
		ok: true,
		command: record.command,
		params: paramsMissing ? {} : (rawParams as Record<string, unknown>)
	};
}

export function readStringParam(params: Record<string, unknown>, key: string): string | null {
	const value = params[key];
	if (typeof value !== 'string') return null;

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

export function readBooleanParam(
	params: Record<string, unknown>,
	key: string,
	fallback = false
): boolean {
	const value = params[key];
	return typeof value === 'boolean' ? value : fallback;
}

/** Klamrar värdet till [min, max] så en fjärranropare inte kan be om hur stora uttag som helst. */
export function readIntParam(
	params: Record<string, unknown>,
	key: string,
	fallback: number,
	min: number,
	max: number
): number {
	const value = params[key];
	const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;

	if (!Number.isFinite(parsed)) return fallback;

	return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
