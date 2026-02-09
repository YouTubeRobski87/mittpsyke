import adapter from '@sveltejs/adapter-vercel';
import adapterNode from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const useNodeAdapterLocally =
	process.platform === 'win32' && !process.env.CI && !process.env.VERCEL;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: useNodeAdapterLocally
			? adapterNode()
			: adapter({ runtime: 'nodejs22.x' })
	}
};

export default config;
