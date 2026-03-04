import { getGuiderSeoPaths } from '$lib/seo-kit/content';
import { canonical } from '$lib/seo-kit/seo';

export function GET() {
	const urls = getGuiderSeoPaths()
		.map((path) => `<url><loc>${canonical(path)}</loc></url>`)
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8'
		}
	});
}
