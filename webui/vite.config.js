import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		// Proxy API calls to a locally running `mlx_lm.server` during development
		// so the dev UI behaves the same as the bundled production build.
		proxy: {
			'/v1': 'http://localhost:8080',
			'/health': 'http://localhost:8080'
		}
	}
});
