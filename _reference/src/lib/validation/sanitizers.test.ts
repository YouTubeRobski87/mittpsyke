import { describe, it, expect } from 'vitest';
import {
	sanitizeString,
	sanitizeArray,
	escapeHtml,
	safeMarkdownToHtml
} from './sanitizers';

describe('sanitizeString', () => {
	it('returns empty string for empty input', () => {
		expect(sanitizeString('')).toBe('');
	});

	it('returns empty string for null/undefined', () => {
		expect(sanitizeString(null as unknown as string)).toBe('');
		expect(sanitizeString(undefined as unknown as string)).toBe('');
	});

	it('trims whitespace', () => {
		expect(sanitizeString('  hello  ')).toBe('hello');
	});

	it('normalizes internal whitespace', () => {
		expect(sanitizeString('hello   world')).toBe('hello world');
		expect(sanitizeString('hello\n\nworld')).toBe('hello world');
		expect(sanitizeString('hello\t\tworld')).toBe('hello world');
	});

	it('removes HTML tags', () => {
		expect(sanitizeString('<b>bold</b>')).toBe('bold');
		expect(sanitizeString('<script>alert(1)</script>')).toBe('alert(1)');
		expect(sanitizeString('<div class="test">content</div>')).toBe('content');
	});

	it('removes javascript: protocol', () => {
		expect(sanitizeString('javascript:alert(1)')).toBe('alert(1)');
		expect(sanitizeString('JAVASCRIPT:alert(1)')).toBe('alert(1)');
	});

	it('removes event handlers', () => {
		expect(sanitizeString('onclick=alert(1)')).toBe('alert(1)');
		expect(sanitizeString('onmouseover=bad()')).toBe('bad()');
		expect(sanitizeString('ONCLICK=alert(1)')).toBe('alert(1)');
	});

	it('handles combined attacks', () => {
		const input = '<img src="x" onerror=alert(1)>';
		const result = sanitizeString(input);
		expect(result).not.toContain('<');
		expect(result).not.toContain('onerror=');
	});

	it('preserves normal text with special characters', () => {
		expect(sanitizeString('Café résumé')).toBe('Café résumé');
		expect(sanitizeString('Hello & Goodbye')).toBe('Hello & Goodbye');
	});
});

describe('sanitizeArray', () => {
	it('returns empty array for empty input', () => {
		expect(sanitizeArray([])).toEqual([]);
	});

	it('returns empty array for null/undefined', () => {
		expect(sanitizeArray(null as unknown as string[])).toEqual([]);
		expect(sanitizeArray(undefined as unknown as string[])).toEqual([]);
	});

	it('sanitizes each item', () => {
		const input = ['<b>one</b>', '  two  ', 'three'];
		expect(sanitizeArray(input)).toEqual(['one', 'two', 'three']);
	});

	it('filters out empty items after sanitization', () => {
		const input = ['valid', '<script></script>', '   ', 'also valid'];
		expect(sanitizeArray(input)).toEqual(['valid', 'also valid']);
	});

	it('handles XSS attempts in array items', () => {
		const input = ['normal', '<script>bad</script>', 'javascript:alert(1)'];
		const result = sanitizeArray(input);
		expect(result).not.toContain('<script>');
		expect(result).not.toContain('javascript:');
	});
});

describe('escapeHtml', () => {
	it('returns empty string for empty input', () => {
		expect(escapeHtml('')).toBe('');
	});

	it('returns empty string for null/undefined', () => {
		expect(escapeHtml(null as unknown as string)).toBe('');
		expect(escapeHtml(undefined as unknown as string)).toBe('');
	});

	it('escapes ampersand', () => {
		expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
	});

	it('escapes less than', () => {
		expect(escapeHtml('a < b')).toBe('a &lt; b');
	});

	it('escapes greater than', () => {
		expect(escapeHtml('a > b')).toBe('a &gt; b');
	});

	it('escapes double quotes', () => {
		expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
	});

	it('escapes single quotes', () => {
		expect(escapeHtml("it's")).toBe('it&#039;s');
	});

	it('escapes HTML tags', () => {
		expect(escapeHtml('<script>alert(1)</script>')).toBe(
			'&lt;script&gt;alert(1)&lt;/script&gt;'
		);
	});

	it('handles multiple special characters', () => {
		expect(escapeHtml('<a href="x">link</a>')).toBe(
			'&lt;a href=&quot;x&quot;&gt;link&lt;/a&gt;'
		);
	});
});

describe('safeMarkdownToHtml', () => {
	it('returns empty string for empty input', () => {
		expect(safeMarkdownToHtml('')).toBe('');
	});

	it('returns empty string for null/undefined', () => {
		expect(safeMarkdownToHtml(null as unknown as string)).toBe('');
		expect(safeMarkdownToHtml(undefined as unknown as string)).toBe('');
	});

	it('converts bold markdown', () => {
		const result = safeMarkdownToHtml('**bold**');
		expect(result).toContain('<strong>bold</strong>');
	});

	it('converts italic markdown', () => {
		const result = safeMarkdownToHtml('*italic*');
		expect(result).toContain('<em>italic</em>');
	});

	it('converts line breaks', () => {
		const result = safeMarkdownToHtml('line1\nline2');
		expect(result).toContain('<br');
	});

	it('escapes raw HTML tags in input', () => {
		const result = safeMarkdownToHtml('<script>alert(1)</script>');
		expect(result).not.toContain('<script>');
		expect(result).toContain('&lt;script&gt;');
	});

	it('converts links', () => {
		const result = safeMarkdownToHtml('[link](https://example.com)');
		expect(result).toContain('href="https://example.com"');
		expect(result).toContain('>link</a>');
	});

	it('handles paragraphs', () => {
		const result = safeMarkdownToHtml('paragraph text');
		expect(result).toContain('<p>');
	});
});
