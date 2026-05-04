import { browser } from '$app/environment';
import DOMPurify, { type Config } from 'dompurify';
import { marked, type Tokens } from 'marked';

const renderer = new marked.Renderer();

renderer.heading = function ({ tokens, depth }: Tokens.Heading) {
	const level = depth <= 1 ? 2 : 3;
	return `<h${level}>${this.parser.parseInline(tokens)}</h${level}>\n`;
};

const sanitizeConfig: Config = {
	ALLOWED_TAGS: ['p', 'br', 'ul', 'ol', 'li', 'strong', 'em', 'h2', 'h3', 'blockquote', 'code', 'pre'],
	ALLOWED_ATTR: [],
	FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button']
};

function escapeHtml(value: string) {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function renderPlainText(value: string) {
	return escapeHtml(value).replace(/\r?\n/g, '<br>');
}

function sanitizeHtml(html: string) {
	const purifier = DOMPurify as unknown as {
		sanitize?: (dirty: string, config?: Config) => string;
	};

	if (!browser || typeof purifier.sanitize !== 'function') {
		return '';
	}

	return purifier.sanitize(html, sanitizeConfig);
}

export function renderDiaryMarkdown(value: string | null | undefined) {
	const markdown = value?.trim() ?? '';
	if (!markdown) return '';

	try {
		const html = marked.parse(markdown, {
			async: false,
			breaks: true,
			gfm: true,
			renderer
		});

		if (typeof html !== 'string') {
			return renderPlainText(markdown);
		}

		return sanitizeHtml(html) || renderPlainText(markdown);
	} catch {
		return renderPlainText(markdown);
	}
}
