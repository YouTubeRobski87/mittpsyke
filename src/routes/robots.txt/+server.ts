export function GET() {
	const body = `User-agent: *
Allow: /
Disallow: /guider-seo/

Sitemap: https://www.mittpsyke.se/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8'
		}
	});
}
