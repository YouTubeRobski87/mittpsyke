export function GET() {
	const body = `User-agent: *
Allow: /

Sitemap: https://www.mittpsyke.se/sitemap.xml
`;

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8'
		}
	});
}
