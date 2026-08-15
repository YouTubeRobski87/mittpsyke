import { describe, expect, it } from 'vitest';
import {
	MIN_REMOTE_TOKEN_LENGTH,
	authorizeRemoteRequest,
	extractRemoteToken,
	isRemoteCommand,
	parseRemoteCommand,
	readBooleanParam,
	readIntParam,
	readStringParam
} from './remote-admin';

const VALID_TOKEN = 'a'.repeat(MIN_REMOTE_TOKEN_LENGTH);

describe('extractRemoteToken', () => {
	it('läser tokenen ur x-remote-admin-token', () => {
		const headers = new Headers({ 'x-remote-admin-token': VALID_TOKEN });
		expect(extractRemoteToken(headers)).toBe(VALID_TOKEN);
	});

	it('läser tokenen ur Authorization: Bearer', () => {
		const headers = new Headers({ authorization: `Bearer ${VALID_TOKEN}` });
		expect(extractRemoteToken(headers)).toBe(VALID_TOKEN);
	});

	it('trimmar bort omgivande blanktecken', () => {
		const headers = new Headers({ 'x-remote-admin-token': `  ${VALID_TOKEN}  ` });
		expect(extractRemoteToken(headers)).toBe(VALID_TOKEN);
	});

	it('ger null när headern finns men är tom', () => {
		const headers = new Headers({ 'x-remote-admin-token': '   ' });
		expect(extractRemoteToken(headers)).toBeNull();
	});

	it('ger null när Authorization inte är ett Bearer-värde', () => {
		const headers = new Headers({ authorization: `Basic ${VALID_TOKEN}` });
		expect(extractRemoteToken(headers)).toBeNull();
	});

	it('ger null när ingen token skickas alls', () => {
		expect(extractRemoteToken(new Headers())).toBeNull();
	});
});

describe('authorizeRemoteRequest', () => {
	it('släpper igenom rätt token', () => {
		expect(authorizeRemoteRequest(VALID_TOKEN, VALID_TOKEN)).toEqual({ ok: true });
	});

	it('stänger rutten när ingen token är konfigurerad', () => {
		const result = authorizeRemoteRequest(undefined, VALID_TOKEN);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.status).toBe(503);
	});

	it('stänger rutten när den konfigurerade tokenen är för kort', () => {
		const shortToken = 'b'.repeat(MIN_REMOTE_TOKEN_LENGTH - 1);
		const result = authorizeRemoteRequest(shortToken, shortToken);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.status).toBe(503);
		expect(result.logReason).toContain(String(MIN_REMOTE_TOKEN_LENGTH));
	});

	it('nekar anrop utan token med 401', () => {
		const result = authorizeRemoteRequest(VALID_TOKEN, null);

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.status).toBe(401);
	});

	it('nekar fel token med 401', () => {
		const result = authorizeRemoteRequest(VALID_TOKEN, 'c'.repeat(MIN_REMOTE_TOKEN_LENGTH));

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.status).toBe(401);
	});

	it('nekar en token som bara är ett prefix av den riktiga', () => {
		const result = authorizeRemoteRequest(VALID_TOKEN, VALID_TOKEN.slice(0, -1));

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.status).toBe(401);
	});

	it('avslöjar aldrig orsaken i felmeddelandet till anroparen', () => {
		const missingConfig = authorizeRemoteRequest('', VALID_TOKEN);
		const wrongToken = authorizeRemoteRequest(VALID_TOKEN, 'd'.repeat(MIN_REMOTE_TOKEN_LENGTH));

		if (missingConfig.ok || wrongToken.ok) throw new Error('förväntade nekade anrop');
		expect(missingConfig.error).not.toContain('REMOTE_ADMIN_TOKEN');
		expect(wrongToken.error).toBe('Unauthorized.');
	});
});

describe('parseRemoteCommand', () => {
	it('godtar ett känt kommando utan params', () => {
		expect(parseRemoteCommand({ command: 'status' })).toEqual({
			ok: true,
			command: 'status',
			params: {}
		});
	});

	it('behåller params när de skickas med', () => {
		const result = parseRemoteCommand({
			command: 'pages.set-status',
			params: { pageId: 'angst', status: 'published' }
		});

		expect(result).toEqual({
			ok: true,
			command: 'pages.set-status',
			params: { pageId: 'angst', status: 'published' }
		});
	});

	it('avvisar okända kommandon', () => {
		const result = parseRemoteCommand({ command: 'pages.delete-everything' });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('Okänt kommando');
	});

	it('avvisar en body som inte är ett objekt', () => {
		expect(parseRemoteCommand(null).ok).toBe(false);
		expect(parseRemoteCommand('status').ok).toBe(false);
		expect(parseRemoteCommand([{ command: 'status' }]).ok).toBe(false);
	});

	it('avvisar params som inte är ett objekt', () => {
		const result = parseRemoteCommand({ command: 'status', params: 'pages' });

		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.error).toContain('params');
	});

	it('behandlar params: null som tomma params', () => {
		expect(parseRemoteCommand({ command: 'status', params: null })).toEqual({
			ok: true,
			command: 'status',
			params: {}
		});
	});
});

describe('isRemoteCommand', () => {
	it('känner igen listade kommandon', () => {
		expect(isRemoteCommand('ab.winner')).toBe(true);
	});

	it('avvisar allt annat', () => {
		expect(isRemoteCommand('ab.delete')).toBe(false);
		expect(isRemoteCommand(42)).toBe(false);
		expect(isRemoteCommand(undefined)).toBe(false);
	});
});

describe('parameterläsare', () => {
	it('readStringParam ger trimmad sträng eller null', () => {
		expect(readStringParam({ slug: '  /angest ' }, 'slug')).toBe('/angest');
		expect(readStringParam({ slug: '   ' }, 'slug')).toBeNull();
		expect(readStringParam({ slug: 12 }, 'slug')).toBeNull();
		expect(readStringParam({}, 'slug')).toBeNull();
	});

	it('readBooleanParam kräver en riktig boolean', () => {
		expect(readBooleanParam({ activeOnly: true }, 'activeOnly')).toBe(true);
		expect(readBooleanParam({ activeOnly: 'true' }, 'activeOnly')).toBe(false);
		expect(readBooleanParam({}, 'activeOnly', true)).toBe(true);
	});

	it('readIntParam klamrar värdet till intervallet', () => {
		expect(readIntParam({ limit: 5 }, 'limit', 10, 1, 50)).toBe(5);
		expect(readIntParam({ limit: 999 }, 'limit', 10, 1, 50)).toBe(50);
		expect(readIntParam({ limit: -3 }, 'limit', 10, 1, 50)).toBe(1);
		expect(readIntParam({ limit: '7' }, 'limit', 10, 1, 50)).toBe(7);
		expect(readIntParam({ limit: 'många' }, 'limit', 10, 1, 50)).toBe(10);
		expect(readIntParam({}, 'limit', 10, 1, 50)).toBe(10);
	});
});
