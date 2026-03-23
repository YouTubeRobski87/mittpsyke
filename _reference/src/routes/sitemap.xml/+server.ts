const SITE_URL = 'https://mystorify.se';

const pages = [
	{ path: '/', priority: 1.0, changefreq: 'weekly' },
	{ path: '/about', priority: 0.8, changefreq: 'monthly' },
	{ path: '/guide', priority: 0.8, changefreq: 'monthly' },
	{ path: '/contact', priority: 0.5, changefreq: 'monthly' },
	{ path: '/privacy', priority: 0.3, changefreq: 'yearly' },
	{ path: '/terms', priority: 0.3, changefreq: 'yearly' },
	{ path: '/cookies', priority: 0.3, changefreq: 'yearly' }
];

export function GET() {
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		(page) => `  <url>
    <loc>${SITE_URL}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
}
