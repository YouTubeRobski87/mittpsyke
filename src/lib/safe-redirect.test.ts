import { describe, expect, it } from 'vitest';
import { safeInternalRedirect } from './safe-redirect';

// Byggs ur teckenkod så testfilen aldrig behöver innehålla literala
// backslash-escapes eller styrbytes.
const BACKSLASH = String.fromCharCode(92);
const NEWLINE = String.fromCharCode(10);
const NUL = String.fromCharCode(0);

describe('safeInternalRedirect', () => {
	it('släpper igenom interna sökvägar', () => {
		expect(safeInternalRedirect('/admin')).toBe('/admin');
		expect(safeInternalRedirect('/admin/stories')).toBe('/admin/stories');
		expect(safeInternalRedirect('/admin/radar')).toBe('/admin/radar');
		expect(safeInternalRedirect('/dagbok?action=new')).toBe('/dagbok?action=new');
	});

	it('faller tillbaka när parametern saknas eller är tom', () => {
		expect(safeInternalRedirect(null)).toBe('/dashboard');
		expect(safeInternalRedirect(undefined)).toBe('/dashboard');
		expect(safeInternalRedirect('')).toBe('/dashboard');
		expect(safeInternalRedirect('   ')).toBe('/dashboard');
	});

	it('respekterar en egen fallback', () => {
		expect(safeInternalRedirect(null, '/admin')).toBe('/admin');
	});

	// Kärnan i skyddet: inloggningssidan får aldrig kunna skicka en användare
	// vidare till en annan domän direkt efter att lösenordet skrivits in.
	it('avvisar absoluta URL:er', () => {
		expect(safeInternalRedirect('https://evil.tld')).toBe('/dashboard');
		expect(safeInternalRedirect('http://evil.tld/admin')).toBe('/dashboard');
		expect(safeInternalRedirect('javascript:alert(1)')).toBe('/dashboard');
		expect(safeInternalRedirect('data:text/html,x')).toBe('/dashboard');
	});

	it('avvisar protokollrelativa sökvägar', () => {
		expect(safeInternalRedirect('//evil.tld')).toBe('/dashboard');
		expect(safeInternalRedirect('//evil.tld/admin')).toBe('/dashboard');
	});

	it('avvisar backslash-varianten som webbläsare normaliserar till //', () => {
		expect(safeInternalRedirect('/' + BACKSLASH + 'evil.tld')).toBe('/dashboard');
		expect(safeInternalRedirect('/' + BACKSLASH + BACKSLASH + 'evil.tld')).toBe('/dashboard');
	});

	it('avvisar relativa sökvägar utan inledande slash', () => {
		expect(safeInternalRedirect('admin')).toBe('/dashboard');
		expect(safeInternalRedirect('../admin')).toBe('/dashboard');
	});

	it('avvisar kontrolltecken som kan injicera i Location-headern', () => {
		expect(safeInternalRedirect('/admin' + NEWLINE + 'Set-Cookie: a=b')).toBe('/dashboard');
		expect(safeInternalRedirect('/admin' + NUL)).toBe('/dashboard');
	});
});
