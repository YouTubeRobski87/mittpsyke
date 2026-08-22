import { canonical } from '$lib/seo';

export function GET() {
	const body = `User-agent: *
Allow: /

Sitemap: ${canonical('/sitemap.xml')}
`;

	return new Response(body, {
		headers: {
			'content-type': 'text/plain; charset=utf-8'
		}
	});
}
