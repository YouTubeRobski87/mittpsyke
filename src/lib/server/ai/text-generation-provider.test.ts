import { beforeEach, describe, expect, it, vi } from 'vitest';

const { env } = vi.hoisted(() => ({ env: {} as Record<string, string | undefined> }));
vi.mock('$env/dynamic/private', () => ({ env }));
vi.mock('./providers/openai-text-provider', () => ({
	createDefaultTextProvider: vi.fn(), hasOpenAITextProviderConfiguration: vi.fn()
}));

const cases = [
	['support-chat', 'OPENAI_SUPPORT_CHAT_MODEL', 25_000, 500],
	['diary-reflection', 'OPENAI_DIARY_REFLECTION_MODEL', 8_000, 150],
	['checkin-reflection', 'OPENAI_CHECKIN_REFLECTION_MODEL', 12_000, 260],
	['diary-narrative', 'OPENAI_DIARY_NARRATIVE_MODEL', 20_000, 900],
	['user-memory', 'OPENAI_USER_MEMORY_MODEL', 12_000, 400]
] as const;

async function configuration() {
	return (await import('./text-generation-provider')).getConfiguredAIModelConfiguration;
}

beforeEach(() => {
	for (const key of Object.keys(env)) delete env[key];
	vi.resetModules();
});

describe('frivilligt modellval per syfte', () => {
	it.each(cases)('%s behåller gemensamt modellval och budgetar', async (purpose, _, timeoutMs, maxOutputTokens) => {
		env.OPENAI_CHAT_MODEL = 'shared-test-model';
		expect((await configuration())(purpose)).toEqual({ model: 'shared-test-model', timeoutMs, maxOutputTokens });
	});
	it.each(cases)('%s behåller den befintliga standarden', async (purpose) => {
		expect((await configuration())(purpose).model).toBe('gpt-4o-mini');
	});
	it.each(cases)('%s syftesval påverkar bara det syftet', async (purpose, key, timeoutMs, maxOutputTokens) => {
		env.OPENAI_CHAT_MODEL = 'shared-test-model';
		env[key] = '  override-test-model  ';
		const get = await configuration();
		expect(get(purpose)).toEqual({ model: 'override-test-model', timeoutMs, maxOutputTokens });
		for (const [other] of cases) if (other !== purpose) expect(get(other).model).toBe('shared-test-model');
	});
	it.each(cases)('%s ignorerar syftesval med bara blanksteg', async (purpose, key) => {
		env.OPENAI_CHAT_MODEL = 'shared-test-model';
		env[key] = '   ';
		expect((await configuration())(purpose).model).toBe('shared-test-model');
	});
	it('behåller konfigurationsfelen', async () => {
		env.OPENAI_CHAT_MODEL = '   ';
		const get = await configuration();
		expect(() => get('support-chat')).toThrow('AI-modell saknas');
		expect(() => get('unknown')).toThrow('Okänt AI-syfte');
	});
});
