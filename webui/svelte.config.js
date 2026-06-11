import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		// Emit a static SPA bundle directly into the Python package so that
		// `mlx_lm.server` can serve it without any Node tooling at runtime.
		adapter: adapter({
			pages: '../mlx_lm/webui',
			assets: '../mlx_lm/webui',
			fallback: 'index.html',
			precompress: false,
			strict: true
		})
	}
};

export default config;
