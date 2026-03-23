import { marked, type MarkedOptions } from 'marked';

// Configure marked for safe email HTML output
const markedOptions: MarkedOptions = {
	async: false,
	gfm: true,
	breaks: true
};

// Remove potential XSS vectors and clean user input
export function sanitizeString(input: string): string {
	if (!input) return '';

	return (
		input
			.trim()
			// Remove HTML tags
			.replace(/<[^>]*>/g, '')
			// Remove javascript: protocol
			.replace(/javascript:/gi, '')
			// Remove event handlers
			.replace(/on\w+\s*=/gi, '')
			// Normalize whitespace
			.replace(/\s+/g, ' ')
	);
}

export function sanitizeArray(items: string[]): string[] {
	if (!items) return [];

	return items.map(sanitizeString).filter((item) => item.length > 0);
}

// Escape HTML for safe insertion in email templates
export function escapeHtml(unsafe: string): string {
	if (!unsafe) return '';

	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

// Markdown-to-HTML conversion for emails using marked
// Escapes raw HTML in input before parsing markdown, so only markdown-generated
// HTML tags appear in the output – any HTML in the source becomes inert text.
export function safeMarkdownToHtml(text: string): string {
	if (!text) return '';

	const escaped = escapeHtml(text);
	const html = marked.parse(escaped, markedOptions) as string;
	return html.trim();
}
