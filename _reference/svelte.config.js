import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Use node adapter for server deployments (Render, etc.)
const useNodeAdapter = process.env.USE_NODE_ADAPTER === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: useNodeAdapter
			? adapterNode()
			: adapterStatic({
					// Output directory for the static build (Capacitor will use this)
					pages: 'build',
					assets: 'build',
					fallback: 'index.html', // SPA fallback for client-side routing
					precompress: false,
					strict: true
				}),
		prerender: {
			entries: ['*', '/sitemap.xml'],
			handleUnseenRoutes: 'warn'
		}
	}
};

export default config;
