import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

// Server-only DOM: never enable script execution or subresource loading.
// Reuse the parser, but sanitize each string independently (no global DOM).
const purifier = createDOMPurify(new JSDOM('').window);
const linkProtocols = new Set(['http:', 'https:', 'mailto:', 'tel:']);

purifier.addHook('uponSanitizeAttribute', (_node, attribute) => {
	if (attribute.attrName !== 'href' && attribute.attrName !== 'src') return;
	try {
		const protocol = new URL(attribute.attrValue, 'https://mittpsyke.se').protocol;
		attribute.keepAttr = attribute.attrName === 'src'
			? protocol === 'http:' || protocol === 'https:'
			: linkProtocols.has(protocol);
	} catch {
		attribute.keepAttr = false;
	}
});

/** Last transformation before CMS HTML leaves the server for SSR/client rendering. */
export function sanitizeCmsHtml(html: string | null | undefined): string {
	return purifier.sanitize(html ?? '', {
		ALLOWED_TAGS: [
			'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
			'ul', 'ol', 'li', 'strong', 'b', 'em', 'i', 's', 'del', 'u',
			'blockquote', 'pre', 'code', 'a', 'img', 'figure', 'figcaption',
			'div', 'span', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption'
		],
		ALLOWED_ATTR: [
			'href', 'title', 'class', 'id', 'src', 'alt', 'width', 'height',
			'colspan', 'rowspan', 'scope', 'start', 'reversed'
		],
		ALLOW_DATA_ATTR: false,
		RETURN_TRUSTED_TYPE: false
	});
}
