import { describe, expect, it, vi } from 'vitest';
import {
	createAITextGenerator,
	getAIModelConfiguration,
	normalizeAIError,
	OpenAITextProvider,
	type AITextProvider
} from './text-generation';

describe('AI:s textgenereringslager', () => {
	it('väljer centralt konfigurerad modell och timeout för ett känt syfte', async () => {
		const provider: AITextProvider = { generate: vi.fn().mockResolvedValue('Ett lugnt svar.') };
		const generate = createAITextGenerator(provider);

		const result = await generate({
			purpose: 'support-chat',
			messages: [{ role: 'user', content: 'Hej' }],
			temperature: 0.75
		});

		expect(result).toMatchObject({
			text: 'Ett lugnt svar.',
			provider: 'openai',
			model: getAIModelConfiguration('support-chat').model
		});
		expect(provider.generate).toHaveBeenCalledWith(
			expect.objectContaining({ purpose: 'support-chat', timeoutMs: 25_000, maxOutputTokens: 500 })
		);
	});

	it('avvisar okända AI-syften i stället för att välja en godtycklig modell', () => {
		expect(() => getAIModelConfiguration('okänt-syfte')).toThrow('Okänt AI-syfte');
	});

	it('översätter det generiska kontraktet till OpenAI-adaptern med central timeout', async () => {
		const create = vi.fn().mockResolvedValue({ choices: [{ message: { content: 'Adapter-svar' } }] });
		const provider = new OpenAITextProvider({ chat: { completions: { create } } } as never);

		const text = await provider.generate({
			...getAIModelConfiguration('weekly-summary'),
			purpose: 'weekly-summary',
			systemInstructions: ['Säkerhet först.'],
			messages: [{ role: 'user', content: 'Underlag' }],
			temperature: 0.7
		});

		expect(text).toBe('Adapter-svar');
		expect(create).toHaveBeenCalledWith(
			expect.objectContaining({ model: getAIModelConfiguration('weekly-summary').model, max_tokens: 200 }),
			{ timeout: 20_000 }
		);
	});

	it('normaliserar timeout och providerfel utan att bära vidare rått felinnehåll', () => {
		expect(normalizeAIError(Object.assign(new Error('intern detalj'), { name: 'APIConnectionTimeoutError' }))).toMatchObject({ code: 'timeout' });
		expect(normalizeAIError(new Error('intern detalj'))).toMatchObject({ code: 'provider' });
	});
});
