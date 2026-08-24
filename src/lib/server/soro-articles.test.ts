import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	fetchSoroArticles,
	fetchSoroResponse,
	SORO_REQUEST_TIMEOUT_MS
} from './soro-articles';

const article = (overrides: Record<string, unknown> = {}) => ({
	id: 'article-1',
	title: 'Testartikel',
	slug: 'testartikel',
	excerpt: 'En testartikel.',
	date: '2026-08-01',
	isoDate: '2026-08-01',
	...overrides
});

const embed = (articles: unknown[]) =>
	new Response(`var SORO_ARTICLES = ${JSON.stringify(articles)};`, {
		status: 200,
		headers: { 'content-type': 'application/javascript' }
	});

function fetcherFor(response: Response): typeof fetch {
	return vi.fn().mockResolvedValue(response) as unknown as typeof fetch;
}

describe('Soro article source', () => {
	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it('returns valid articles and skips one malformed record', async () => {
		const result = await fetchSoroArticles(fetcherFor(embed([article(), { slug: 'saknar-fält' }])));

		expect(result).toMatchObject({ loadError: false });
		if (!result.loadError) expect(result.articles).toHaveLength(1);
	});

	it('rejects empty and invalid manifests deterministically', async () => {
		await expect(fetchSoroArticles(fetcherFor(embed([])))).resolves.toMatchObject({
			loadError: true,
			errorReason: 'empty_payload'
		});
		await expect(
			fetchSoroArticles(fetcherFor(new Response('var SORO_ARTICLES = invalid;', { status: 200 })))
		).resolves.toMatchObject({ loadError: true, errorReason: 'invalid_payload' });
	});

	it('retries one transient upstream 5xx and succeeds', async () => {
		const fetcher = vi
			.fn()
			.mockResolvedValueOnce(new Response('', { status: 503 }))
			.mockResolvedValueOnce(embed([article()])) as unknown as typeof fetch;

		const result = await fetchSoroArticles(fetcher);

		expect(result).toMatchObject({ loadError: false });
		expect(fetcher).toHaveBeenCalledTimes(2);
	});

	it('does not retry a permanent upstream 4xx', async () => {
		const fetcher = vi.fn().mockResolvedValue(new Response('', { status: 404 })) as unknown as typeof fetch;

		const result = await fetchSoroArticles(fetcher);

		expect(result).toMatchObject({ loadError: true, errorReason: 'upstream_4xx' });
		expect(fetcher).toHaveBeenCalledTimes(1);
	});

	it('classifies network and timeout failures after one retry', async () => {
		const networkFetcher = vi.fn().mockRejectedValue(new Error('socket closed')) as unknown as typeof fetch;
		await expect(fetchSoroArticles(networkFetcher)).resolves.toMatchObject({
			loadError: true,
			errorReason: 'network'
		});
		expect(networkFetcher).toHaveBeenCalledTimes(2);

		vi.useFakeTimers();
		const timeoutFetcher = vi.fn((_url: string, init?: RequestInit) =>
			new Promise<Response>((_resolve, reject) => {
				init?.signal?.addEventListener('abort', () => reject(new Error('aborted')));
			})
		) as unknown as typeof fetch;
		const pending = fetchSoroArticles(timeoutFetcher);
		await vi.advanceTimersByTimeAsync(SORO_REQUEST_TIMEOUT_MS * 2);
		await expect(pending).resolves.toMatchObject({ loadError: true, errorReason: 'timeout' });
		expect(timeoutFetcher).toHaveBeenCalledTimes(2);
	});

	it('returns status and classification for content requests', async () => {
		const result = await fetchSoroResponse(fetcherFor(new Response('', { status: 502 })), 'https://example.test', {});

		expect(result).toMatchObject({ failure: 'upstream_5xx', status: 502 });
	});
});
