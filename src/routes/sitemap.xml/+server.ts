import { getGuiderSeoPaths } from '$lib/seo-kit/content';
import { canonical } from '$lib/seo-kit/seo';

const staticPages = [
	'',
	'trauma',
	'dagbok',
	'psykiskt-stod-online',
	'anonymt-samtalsstod-online',
	'hjalp-vid-angest-online',
	'angest',
	'depression',
	'stress',
	'oro',
	'nedstamdhet',
	'ensamhet',
	'panikattack',
	'om-mittpsyke',
];

export function GET() {
	const dynamicUrls = getGuiderSeoPaths()
		.map((path) => `<url><loc>${canonical(path)}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`)
		.join('');

	const staticUrls = staticPages
		.map((page) => {
			const loc = `https://mittpsyke.se/${page}`;
			const priority = page === '' ? '1.0' : '0.8';
			return `<url><loc>${loc}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
		})
		.join('');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${dynamicUrls}</urlset>`;

	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8'
		}
	});
}
