import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		watch: {
			// Arbetskopior får inte trigga HMR eller asset-requests i MittPsykes preview.
			ignored: ['**/.claude/worktrees/**', '**/node_modules/**', '**/.git/**']
		}
	},
	test: {
		// Bara det här projektets egna tester, inte de i .claude/worktrees
		// (fristående kopior med sin egen, obundna tsconfig).
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts']
	}
});
