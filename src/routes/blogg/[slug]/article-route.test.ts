import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';

const article = (slug: string) => ({
	id: 'article-1',
	title: 'Är textstöd lika hjälpsamt som samtal?',
	slug,
	excerpt: 'En testartikel.',
	date: '2026-08-01',
	isoDate: '2026-08-01'
});

const listResponse = (articles: unknown[], status = 200) =>
	new Response(`var SORO_ARTICLES = ${JSON.stringify(articles)};`, { status });

type RouteLoadEvent = Parameters<typeof load>[0];

function createEvent(slug: string, fetcher: typeof fetch, setHeaders = vi.fn()): RouteLoadEvent {
	return {
		params: { slug },
		fetch: fetcher,
		setHeaders
	} as unknown as RouteLoadEvent;
}

async function thrownStatus(promise: Promise<unknown>) {
	try {
		await promise;
		return null;
	} catch (error) {
		return (error as { status?: number }).status ?? null;
	}
}

describe('/blogg/[slug]', () => {
	it('renders the known previous 404 article after the corrected slug mapping', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(listResponse([article('ar-textstod-lika-hjalpsamt-som-samtal')]))
			.mockResolvedValueOnce(new Response(JSON.stringify({ content: '<p>Innehåll</p>' }), { status: 200 })) as unknown as typeof fetch;

		const result = (await load(createEvent('ar-textstod-lika-hjalpsamt-som-samtal', fetcher))) as {
			article: { slug: string };
		};

		expect(result.article.slug).toBe('ar-textstod-lika-hjalpsamt-som-samtal');
	});

	it('returns 404 when the article is absent from a valid source', async () => {
		const fetcher = vi
			.fn()
			.mockImplementation(() => Promise.resolve(listResponse([article('annan-artikel')]))) as unknown as typeof fetch;

		expect(await thrownStatus(Promise.resolve(load(createEvent('saknas', fetcher))))).toBe(404);
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('returns 502 after an upstream article-list 5xx retry is exhausted', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 503 })) as unknown as typeof fetch;

		expect(await thrownStatus(Promise.resolve(load(createEvent('artikel', fetcher))))).toBe(502);
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('keeps unrelated valid content working when one manifest record is malformed', async () => {
		vi.spyOn(console, 'warn').mockImplementation(() => {});
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(listResponse([article('valid-artikel'), { id: 'bad', slug: 'saknar-titel' }]))
			.mockResolvedValueOnce(new Response(JSON.stringify({ content: '<p>Innehåll</p>' }), { status: 200 })) as unknown as typeof fetch;

		const result = (await load(createEvent('valid-artikel', fetcher))) as {
			article: { slug: string };
		};

		expect(result.article.slug).toBe('valid-artikel');
	});

	it('returns 502 for malformed article content instead of misleading 404', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => {});
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(listResponse([article('artikel')]))
			.mockResolvedValueOnce(new Response(JSON.stringify({ content: '' }), { status: 200 })) as unknown as typeof fetch;

		expect(await thrownStatus(Promise.resolve(load(createEvent('artikel', fetcher))))).toBe(502);
	});
});
