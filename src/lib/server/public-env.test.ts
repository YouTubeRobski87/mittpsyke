import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
	ALLOWED_PUBLIC_ENV_KEYS,
	unexpectedPublicEnvKeys,
	warnAboutUnexpectedPublicEnv
} from './public-env';

const srcDir = fileURLToPath(new URL('../..', import.meta.url));

function sourceFiles(dir: string): string[] {
	return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
		const path = join(dir, entry.name);
		if (entry.isDirectory()) return sourceFiles(path);
		return /\.(ts|svelte)$/.test(entry.name) && !entry.name.includes('.test.') ? [path] : [];
	});
}

describe('PUBLIC_*-variabler som skickas med i HTML', () => {
	it('tillåter exakt de PUBLIC_*-variabler som koden läser ur miljön', () => {
		const read = new Set<string>();
		for (const path of sourceFiles(srcDir)) {
			for (const match of readFileSync(path, 'utf8').matchAll(/\b(?:env|publicEnv)\.(PUBLIC_[A-Z0-9_]+)/g)) {
				read.add(match[1]);
			}
		}
		expect([...read].sort()).toEqual([...ALLOWED_PUBLIC_ENV_KEYS].sort());
	});

	it('pekar ut okända PUBLIC_*-variabler men bryr sig inte om privata', () => {
		expect(
			unexpectedPublicEnvKeys({
				PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
				PUBLIC_TIKTOK_PIXEL_ID: 'x',
				PUBLIC_OLD_FEATURE: '',
				OPENAI_API_KEY: 'hemlig'
			})
		).toEqual(['PUBLIC_OLD_FEATURE', 'PUBLIC_TIKTOK_PIXEL_ID']);
	});

	it('loggar bara namnen, aldrig värdena, och är tyst när allt är känt', () => {
		const messages: string[] = [];
		warnAboutUnexpectedPublicEnv({ PUBLIC_TIKTOK_PIXEL_ID: 'VARDE-SOM-INTE-FAR-LOGGAS' }, (m) => messages.push(m));
		expect(messages).toHaveLength(1);
		expect(messages[0]).toContain('PUBLIC_TIKTOK_PIXEL_ID');
		expect(messages[0]).not.toContain('VARDE-SOM-INTE-FAR-LOGGAS');

		messages.length = 0;
		warnAboutUnexpectedPublicEnv({ PUBLIC_SUPABASE_URL: 'https://example.supabase.co' }, (m) => messages.push(m));
		expect(messages).toEqual([]);
	});
});
