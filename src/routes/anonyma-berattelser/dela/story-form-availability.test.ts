import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockEnv: Record<string, string | undefined> = {};

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));

const { load } = await import('./+page.server');
type StoryFormLoad = import('./+page.server').StoryFormLoad;
const sharePage = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');

const VALID_SALT = 'test-secret-story-rate-limit-salt-32-plus';
const UNAVAILABLE_MESSAGE =
	'Berättelsefunktionen är tillfälligt otillgänglig. Försök gärna igen senare.';

// Loadern tar inga argument, men typen kräver SvelteKits event-objekt.
const runLoad = async (): Promise<StoryFormLoad> =>
	(await load({} as Parameters<typeof load>[0])) as StoryFormLoad;

// Markup i den yttre {:else}-grenen - det är allt användaren ser utan giltig konfiguration.
const elseIndex = sharePage.lastIndexOf('{:else}');
const unavailableBranch = sharePage.slice(elseIndex, sharePage.indexOf('</main>', elseIndex));

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
	for (const key of Object.keys(mockEnv)) delete mockEnv[key];
	mockEnv.STORY_RATE_LIMIT_SALT = VALID_SALT;
	errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
	errorSpy.mockRestore();
});

describe('formuläret för anonyma berättelser', () => {
	it('ger token och formulärdata när konfigurationen är giltig', async () => {
		const data = await runLoad();

		expect(data).toMatchObject({ formAvailable: true });
		expect(typeof data.loadedAt).toBe('number');
		expect(data.loadToken).toMatch(/^[a-f0-9]{64}$/);
	});

	it.each([
		['saknad', undefined],
		['för kort', 'too-short'],
		['tom', '   ']
	])('skapar ingen token när konfigurationen är %s', async (_label, salt) => {
		mockEnv.STORY_RATE_LIMIT_SALT = salt;

		const data = await runLoad();

		expect(data).toEqual({ formAvailable: false, loadedAt: null, loadToken: null });
		expect(data.loadToken).toBeNull();
	});

	it('renderar varken formulär eller token-fält utan giltig konfiguration', () => {
		expect(sharePage).toContain('{#if data.formAvailable}');
		expect(sharePage.indexOf('<form')).toBeLessThan(sharePage.lastIndexOf('{:else}'));
		expect(unavailableBranch).not.toContain('<form');
		expect(unavailableBranch).not.toContain('type="submit"');
		expect(unavailableBranch).not.toContain('story_load_token');
		expect(unavailableBranch).not.toContain('story_loaded_at');
	});

	it('visar ett lugnt och begripligt meddelande i stället', () => {
		expect(sharePage).toContain(UNAVAILABLE_MESSAGE);
		expect(unavailableBranch).toContain('FORM_UNAVAILABLE_MESSAGE');
		expect(unavailableBranch).toContain('class="empty"');
	});

	it('exponerar inga interna konfigurationsdetaljer', async () => {
		mockEnv.STORY_RATE_LIMIT_SALT = VALID_SALT;
		const forbidden = [VALID_SALT, 'STORY_RATE_LIMIT_SALT', 'salt', 'env', 'hash', 'token', 'IP'];

		for (const term of forbidden) {
			expect(UNAVAILABLE_MESSAGE).not.toContain(term);
			expect(unavailableBranch).not.toContain(term);
		}

		mockEnv.STORY_RATE_LIMIT_SALT = undefined;
		const data = await runLoad();

		expect(JSON.stringify(data)).not.toContain(VALID_SALT);
		const logged = errorSpy.mock.calls.flat().join(' ');
		expect(logged).not.toContain(VALID_SALT);
	});
});
