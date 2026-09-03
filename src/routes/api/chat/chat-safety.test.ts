import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SENSITIVE_CONSENT_HEADER, SENSITIVE_CONSENT_VERSION } from '$lib/consent';
import { CRISIS_RESPONSE } from '$lib/ai/crisis-responses';
import { buildSupportChatSafetyInstructions } from '$lib/server/ai/safety-instructions';
import { buildTopicHintInstruction } from '$lib/ai/chat-topics';
import { buildReassurancePatternInstruction, detectReassurancePattern } from '$lib/ai/reassurance-pattern';
import { formatMemoriesForPrompt } from '$lib/server/user-memory';

const mocks = vi.hoisted(() => ({
	createClient: vi.fn(),
	generateAIText: vi.fn()
}));

// Gästchatt kräver sedan V3.3 en signerad samtyckescookie, som i sin tur
// kräver signeringsnyckeln. Testet handlar fortfarande om gästbeteendet, inte
// om samtycket - det täcks av anonymous-chat-consent.test.ts.
vi.mock('$env/dynamic/private', () => ({
	env: { OPENAI_API_KEY: 'test-openai-key', CHAT_ANON_CONSENT_SECRET: 'a'.repeat(48) }
}));

vi.mock('$env/dynamic/public', () => ({ env: {} }));

vi.mock('@supabase/supabase-js', () => ({ createClient: mocks.createClient }));

vi.mock('$lib/server/ai/text-generation', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/server/ai/text-generation')>();
	return { ...actual, generateAIText: mocks.generateAIText };
});

import { POST, _buildSupportChatRequest } from './+server';
import {
	ANONYMOUS_CHAT_CONSENT_COOKIE,
	issueAnonymousChatConsentToken
} from '$lib/server/anonymous-chat-consent';

describe('den slutliga systemprompten för AI-chatten', () => {
	const categories = [
		['G', 'Användaren har inte valt något ämne'],
		['A', 'ångest och oro med stabiliserande, jordande språk'],
		['B', 'hoppfull men realistisk ton, utan att bagatellisera'],
		['E', 'undvik detaljer som kan återaktivera stark stress']
	] as const;
	const cases = categories.flatMap(([category, categoryInstruction]) =>
		[0, 1, 2, 3, 4, 8].map((userTurns) => ({ category, categoryInstruction, userTurns }))
	);

	it.each(cases)('bevarar stil och säkerhet i kategori $category efter $userTurns användarturer', ({ category, categoryInstruction, userTurns }) => {
		const history = Array.from({ length: userTurns }, () => [
			{ role: 'user' as const, content: 'Jag tog en promenad.' },
			{ role: 'assistant' as const, content: 'Hoppas du hade en fin stund ute.' }
		]).flat();
		const request = _buildSupportChatRequest({ category, history, message: 'Det var soligt.' });
		const instructions = request.systemInstructions ?? [];
		const prompt = instructions.join('\n');

		// Kontrollera den färdigbyggda requesten, inklusive tilläggen för senare turer.
		for (const rule of [
			/Svara kort, konkret och naturligt/,
			/Ett kort svar räcker ofta, även efter ett långt meddelande/,
			/Svara direkt på innehållet i användarens senaste meddelande/,
			/Upprepa inte användarens ord och sammanfatta inte meddelandet eller känslorna tillbaka/,
			/om det inte behövs för att undvika missförstånd/,
			/Undvik onödigt metaprat[^\n]+"vi kan hålla det kort"[^\n]+"vi kan fortsätta chatta i text"[^\n]+"jag förstår"[^\n]+"jag hör dig"[^\n]+när det inte tillför något/,
			/Kommentera inte samtalsformen, röstinmatningen eller hur chatten fungerar om användaren inte uttryckligen frågar/,
			/Var varm och mänsklig utan överdriven bekräftelse/,
			/Bekräfta inte varje meddelande av rutin/,
			/Ställ högst en följdfråga åt gången, och bara när den behövs/,
			/Avsluta inte varje svar med en fråga/,
			/Förstå mindre fel från taligenkänning genom sammanhanget utan att upprepa eller rätta allt/,
			/oklarhet påverkar betydelsen eller säkerheten, fråga kort i stället för att gissa/,
			/prioritera naturligt samtalsflyt framför onödiga förklaringar/,
			/Säkerhetsregler, akut vägledning och skyddet mot upprepat bekräftelsesökande har alltid företräde/,
			/Utelämna aldrig nödvändig säkerhetsinformation/,
			/Minnesregler och övriga produktregler gäller fortsatt/
		]) expect(prompt).toMatch(rule);

		for (const conflict of [
			'Spegla både känslan och kroppens upplevelse.',
			'Återanvänd ibland 1–3 av användarens egna ord',
			'Spegla känslan bakom orden',
			'Spegla kort det du hör.',
			'Bekräfta utan att förstärka hopplöshet.',
			'Spegla riktningen kort.',
			'Spegla och validera.',
			'Bekräfta kommentaren kort',
			'Erbjud att fortsätta mer direkt',
			'Vi kan fortsätta i det här i din takt.',
			'Vi kan ta en del i taget om du vill.',
			'Välkomna dem varmt.',
			'fråga vad som känns tyngst just nu',
			'dela upp i max 3 korta delar och fråga om ni ska ta en del först'
		]) expect(prompt).not.toContain(conflict);

		const safety = buildSupportChatSafetyInstructions();
		expect(instructions.slice(0, safety.length)).toEqual(safety);
		expect(prompt).toContain('ersätter inte vård, terapi eller akuthjälp');
		expect(prompt).toContain('oskickad historik');
		expect(prompt).toContain('falsk garanti');
		expect(prompt).toContain('Anta aldrig orsaker som användaren inte själv har nämnt');
		expect(prompt).toContain('112 eller Mind Självmordslinjen (90101)');
		expect(prompt).toContain(categoryInstruction);
		expect(prompt).toContain(`Aktuell fas: FAS ${userTurns < 2 ? 1 : userTurns < 4 ? 2 : 3}.`);
		if (userTurns >= 4) expect(prompt).toContain('ingen annan följdfråga behövs');
		expect(request.messages).toEqual([...history, { role: 'user', content: 'Det var soligt.' }]);
	});

	it('behåller ämneskontext, minnesregler och det aktiva skyddet mot upprepat bekräftelsesökande', () => {
		const history = [
			{ role: 'user' as const, content: 'Är jag säker?' },
			{ role: 'assistant' as const, content: 'Jag kan inte lova det.' },
			{ role: 'user' as const, content: 'Kan du säga att jag verkligen är säker?' },
			{ role: 'assistant' as const, content: 'Jag kan inte ge en garanti.' }
		];
		const message = 'Är du säker på att jag är säker?';
		const pattern = detectReassurancePattern(message, history);
		expect(pattern.detected).toBe(true);
		const memoryBlock = formatMemoriesForPrompt([
			{ id: 'test-memory', content: 'Oroar sig ibland inför jobbet.', created_at: '2026-01-01T00:00:00.000Z' }
		]);
		const request = _buildSupportChatRequest({
			category: 'G', history, message, topicHintId: 'stress', contextBlocks: [memoryBlock]
		});
		const prompt = request.systemInstructions?.join('\n') ?? '';

		expect(prompt).toContain(buildTopicHintInstruction('stress'));
		expect(prompt).toContain(memoryBlock);
		expect(prompt).toContain('ställ inga ledande frågor utifrån det');
		expect(prompt).toContain(buildReassurancePatternInstruction(pattern));
		expect(prompt).toContain('Bekräfta inte samma garanti eller lugnande besked igen');
		expect(prompt).toContain('har alltid företräde framför korthet, samtalsflyt och fasregler');
	});
});

describe('POST /api/chat', () => {
	beforeEach(() => {
		mocks.createClient.mockReset();
		mocks.generateAIText.mockReset();
		mocks.generateAIText.mockResolvedValue({
			text: 'Tack för att du berättar.',
			model: 'test-model'
		});
	});

	it('returns the crisis response before any reassurance-pattern handling', async () => {
		const request = new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			},
			body: JSON.stringify({
				message: 'Jag vill inte leva. Kan du lova att jag är säker?',
				category: 'a',
				guestId: 'guest-session-1234',
				contextMessages: [
					{ role: 'user', content: 'Kan du lova att jag är säker?' },
					{ role: 'assistant', content: 'Jag hör att du är orolig.' },
					{ role: 'user', content: 'Är jag verkligen säker?' }
				]
			})
		});
		const response = await POST({ request, getClientAddress: () => '127.0.0.1' } as Parameters<typeof POST>[0]);
		const body = (await response.json()) as { reply: string; crisis: boolean };

		expect(response.status).toBe(200);
		expect(body).toEqual({
			reply: CRISIS_RESPONSE,
			crisis: true,
			conversationId: null,
			mode: 'guest'
		});
		expect(mocks.generateAIText).not.toHaveBeenCalled();
		expect(mocks.createClient).not.toHaveBeenCalled();
	});

	it('keeps guest chat in the request session without a Supabase client or guest identifier', async () => {
		const request = new Request('http://localhost/api/chat', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				[SENSITIVE_CONSENT_HEADER]: SENSITIVE_CONSENT_VERSION
			},
			body: JSON.stringify({
				message: 'Jag känner mig ensam i kväll.',
				category: 'G',
				contextMessages: [
					{ role: 'user', content: 'Jag har haft en tung dag.' },
					{ role: 'assistant', content: 'Jag hör att det varit mycket.' }
				]
			})
		});

		const { token } = issueAnonymousChatConsentToken();
		const response = await POST({
			request,
			getClientAddress: () => '127.0.0.2',
			cookies: { get: (name: string) => (name === ANONYMOUS_CHAT_CONSENT_COOKIE ? token : undefined) }
		} as unknown as Parameters<typeof POST>[0]);
		const body = (await response.json()) as { reply: string; conversationId: string | null; mode: string };

		expect(response.status).toBe(200);
		expect(body).toEqual({
			reply: 'Tack för att du berättar.',
			conversationId: null,
			mode: 'guest'
		});
		expect(mocks.createClient).not.toHaveBeenCalled();
		expect(mocks.generateAIText).toHaveBeenCalledWith(
			expect.objectContaining({
				purpose: 'support-chat',
				messages: [
					{ role: 'user', content: 'Jag har haft en tung dag.' },
					{ role: 'assistant', content: 'Jag hör att det varit mycket.' },
					{ role: 'user', content: 'Jag känner mig ensam i kväll.' }
				]
			})
		);
	});
});
