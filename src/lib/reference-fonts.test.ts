import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('_reference-fonts', () => {
	it('lämnar det fristående referensprojektet utanför MittPsykes preview-watcher', () => {
		const viteConfig = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8');

		expect(viteConfig).toMatch(/ignored:\s*\[\s*'\*\*\/_reference\/\*\*'/);
	});
});
