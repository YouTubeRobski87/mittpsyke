import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	server: {
		watch: {
			// _reference är ett fristående projekt med egen Vite-root och egna fonts.
			// Det får inte trigga HMR eller asset-requests i MittPsykes preview.
			ignored: ['**/_reference/**', '**/.claude/worktrees/**', '**/node_modules/**', '**/.git/**']
		}
	},
	test: {
		// Bara det här projektets egna tester, inte de i .claude/worktrees eller
		// _reference (fristående kopior med sin egen, obundna tsconfig).
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts']
	}
});
