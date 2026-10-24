// Chattens hantering av 403-svar.
//
// Regressionen: alla 403 tolkades som saknat samtycke, även "Conversation not
// found for this user.". En inloggad användare med ett gammalt samtals-id fick
// då samtyckesrutan, samtyckte, skickade igen och fick samma 403 i en slinga.
//
// Samtalets 403-svar bär nu en egen kod. Samtyckets 403-svar ändras inte, och
// varje 403 utan koden visar fortfarande samtyckesrutan (fail-closed).

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CONVERSATION_UNAVAILABLE_CODE } from './chat-error-codes';

const server = readFileSync(join(process.cwd(), 'src/routes/api/chat/+server.ts'), 'utf8');
const chatWindow = readFileSync(join(process.cwd(), 'src/lib/components/ChatWindow.svelte'), 'utf8');

/** Varje errorResponse(..., 403 ...) med sitt eventuella detaljobjekt. */
function forbiddenResponses(): string[] {
	const matches = server.matchAll(/errorResponse\(\s*'([^']*)',\s*403(?:,\s*\{([^}]*)\})?\s*\)/g);
	return [...matches].map((match) => `${match[1]}|${match[2] ?? ''}`);
}

describe('servern', () => {
	const responses = forbiddenResponses();

	it('hittar alla 403-svar', () => {
		expect(responses.length).toBe(9);
	});

	it('samtyckets 403-svar saknar samtalskoden', () => {
		const consent = responses.filter((row) => row.startsWith('Consent required'));
		expect(consent.length).toBe(3);
		for (const row of consent) expect(row).not.toContain('CONVERSATION_UNAVAILABLE_CODE');
	});

	it('samtalets 403-svar har samtalskoden', () => {
		const conversation = responses.filter((row) => !row.startsWith('Consent required'));
		expect(conversation.length).toBe(6);
		for (const row of conversation) expect(row).toContain('code: CONVERSATION_UNAVAILABLE_CODE');
	});

	it('koden har ett stabilt värde', () => {
		expect(CONVERSATION_UNAVAILABLE_CODE).toBe('CONVERSATION_UNAVAILABLE');
	});
});

describe('klienten', () => {
	const codeBranch = chatWindow.indexOf(
		'if (res.status === 403 && data?.code === CONVERSATION_UNAVAILABLE_CODE)'
	);
	const consentBranch = chatWindow.indexOf('if (res.status === 403) {');

	it('samtalsgrenen prövas före samtyckesgrenen', () => {
		expect(codeBranch).toBeGreaterThan(-1);
		expect(consentBranch).toBeGreaterThan(codeBranch);
	});

	it('samtalsgrenen nollställer samtalet utan att visa samtyckesrutan', () => {
		const branch = chatWindow.slice(codeBranch, consentBranch);
		expect(branch).toContain('conversationId = null;');
		expect(branch).toContain('throw new Error(CONVERSATION_UNAVAILABLE_ERROR);');
		expect(branch).not.toContain('requireConsentAgain');
	});

	it('varje annat 403 kräver fortfarande samtycke', () => {
		const branch = chatWindow.slice(consentBranch, consentBranch + 200);
		expect(branch).toContain('requireConsentAgain();');
	});
});
