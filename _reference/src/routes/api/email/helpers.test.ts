import { describe, it, expect } from 'vitest';
import { buildEmailHtml, buildEmailSubject } from './helpers';

describe('buildEmailHtml', () => {
	it('includes weekday in header', () => {
		const result = buildEmailHtml('Test entry', 'Måndag', '2024-06-15');
		expect(result).toContain('Måndag');
	});

	it('includes date in header', () => {
		const result = buildEmailHtml('Test entry', 'Måndag', '2024-06-15');
		expect(result).toContain('2024-06-15');
	});

	it('includes entry content', () => {
		const result = buildEmailHtml('This is my diary entry', 'Måndag', '2024-06-15');
		expect(result).toContain('This is my diary entry');
	});

	it('converts markdown to HTML', () => {
		const result = buildEmailHtml('**bold text**', 'Måndag', '2024-06-15');
		expect(result).toContain('<strong>bold text</strong>');
	});

	it('uses default weekday when empty', () => {
		const result = buildEmailHtml('Test', '', '2024-06-15');
		expect(result).toContain('Dagbok');
	});

	it('handles empty date', () => {
		const result = buildEmailHtml('Test', 'Måndag', '');
		expect(result).toContain('Måndag');
		expect(result).not.toContain('undefined');
	});

	it('escapes HTML in weekday', () => {
		const result = buildEmailHtml('Test', '<script>alert(1)</script>', '2024-06-15');
		expect(result).toContain('&lt;script&gt;');
		expect(result).not.toContain('<script>alert');
	});

	it('escapes HTML in date', () => {
		const result = buildEmailHtml('Test', 'Måndag', '<img src=x onerror=alert(1)>');
		expect(result).toContain('&lt;img');
		// The < and > are escaped, making the img tag inactive
		expect(result).not.toMatch(/<img[^>]*onerror/);
	});

	it('includes Storify branding', () => {
		const result = buildEmailHtml('Test', 'Måndag', '2024-06-15');
		expect(result).toContain('Berättat av Storify');
	});

	it('includes proper HTML structure', () => {
		const result = buildEmailHtml('Test', 'Måndag', '2024-06-15');
		expect(result).toContain('<!DOCTYPE html>');
		expect(result).toContain('<html>');
		expect(result).toContain('</html>');
		expect(result).toContain('<meta charset="utf-8">');
	});

	it('includes responsive viewport meta', () => {
		const result = buildEmailHtml('Test', 'Måndag', '2024-06-15');
		expect(result).toContain('viewport');
		expect(result).toContain('width=device-width');
	});

	it('includes entry styling', () => {
		const result = buildEmailHtml('Test', 'Måndag', '2024-06-15');
		expect(result).toContain('.entry p');
		expect(result).toContain('.entry h1');
		expect(result).toContain('.entry blockquote');
	});
});

describe('buildEmailSubject', () => {
	it('formats subject with weekday', () => {
		const result = buildEmailSubject('Måndag');
		expect(result).toBe('Din dagbok: Måndag');
	});

	it('formats subject with weekday and date', () => {
		const result = buildEmailSubject('Måndag', '15 juni');
		expect(result).toBe('Din dagbok: Måndag, 15 juni');
	});

	it('handles empty date', () => {
		const result = buildEmailSubject('Fredag', '');
		expect(result).toBe('Din dagbok: Fredag');
	});

	it('handles undefined date', () => {
		const result = buildEmailSubject('Söndag', undefined);
		expect(result).toBe('Din dagbok: Söndag');
	});
});
