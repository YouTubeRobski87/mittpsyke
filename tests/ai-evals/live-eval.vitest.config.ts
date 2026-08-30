import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vite.config';

// A dedicated include list prevents npm test from ever collecting the live run.
export default mergeConfig(
	baseConfig,
	defineConfig({
		test: {
			include: ['tests/ai-evals/live-eval.live.ts'],
			exclude: ['src/**/*.test.ts', 'tests/**/*.test.ts']
		}
	})
);
