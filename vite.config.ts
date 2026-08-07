import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	test: {
		// Bara det här projektets egna tester, inte de i .claude/worktrees eller
		// _reference (fristående kopior med sin egen, obundna tsconfig).
		include: ['src/**/*.test.ts', 'tests/**/*.test.ts']
	}
});
