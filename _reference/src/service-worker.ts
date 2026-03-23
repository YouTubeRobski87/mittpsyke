/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = `storify-cache-${version}`;

// Assets to cache: build files + static files
const ASSETS = [...build, ...files];

// Install: cache all static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => self.skipWaiting())
	);
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
			)
			.then(() => self.clients.claim())
	);
});

// Fetch: network-first for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	// Skip API routes and external requests - always fetch from network
	if (url.pathname.startsWith('/api') || url.origin !== self.location.origin) {
		return;
	}

	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE_NAME);

			// Try cache first for static assets
			const cachedResponse = await cache.match(event.request);
			if (cachedResponse) {
				return cachedResponse;
			}

			// Otherwise fetch from network
			try {
				const response = await fetch(event.request);

				// Cache successful responses for static assets
				if (response.ok && !url.pathname.startsWith('/api')) {
					cache.put(event.request, response.clone());
				}

				return response;
			} catch {
				// If offline and not in cache, return a fallback for navigation requests
				if (event.request.mode === 'navigate') {
					const fallback = await cache.match('/index.html');
					if (fallback) return fallback;
				}

				throw new Error('Network request failed and no cache available');
			}
		})()
	);
});
