import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Regressionsskydd för ett fel som fanns i V3.3: felrutan låg inuti
// {#if hasSensitiveDataConsent}, men ett 403 på grund av saknat eller
// återkallat samtycke sätter samma flagga till false. Samma tillståndsändring
// som skulle visa meddelandet gömde alltså behållaren det bodde i, och
// CONSENT_REQUIRED_ERROR kunde aldrig renderas.
//
// Testet läser mallens blockstruktur i stället för att söka på text, så det
// håller även om klasser eller ordning ändras.

const source = readFileSync(new URL('./ChatWindow.svelte', import.meta.url), 'utf8');
const template = source.slice(source.lastIndexOf('</script>'));

/**
 * Öppna Svelte-block som omsluter en given position i mallen. Returnerar
 * villkoren i den ordning de öppnades, ytterst först.
 */
function enclosingBlocks(markup: string, targetIndex: number): string[] {
	const blockPattern = /\{#(if|each|key|await|snippet)\s([^}]*)\}|\{\/(if|each|key|await|snippet)\}/g;
	const stack: string[] = [];
	let match: RegExpExecArray | null;

	while ((match = blockPattern.exec(markup)) !== null) {
		if (match.index >= targetIndex) break;
		if (match[1]) stack.push(match[2].trim());
		else stack.pop();
	}

	return stack;
}

describe('felmeddelande vid återkallat samtycke', () => {
	const errorBlockIndex = template.indexOf('{#if chatError}');

	it('felrutan finns i mallen', () => {
		expect(errorBlockIndex).toBeGreaterThan(-1);
		expect(template).toContain('id="chat-error-text"');
	});

	it('felrutan omsluts inte av hasSensitiveDataConsent', () => {
		const blocks = enclosingBlocks(template, errorBlockIndex);

		// Det här är hela poängen: inget omslutande villkor får bero på
		// samtyckesflaggan, eftersom den är false just när felet ska visas.
		expect(blocks.some((condition) => condition.includes('hasSensitiveDataConsent'))).toBe(false);
	});

	it('felrutan ligger före samtyckesgrenen med inmatningsfältet', () => {
		const consentBranchIndex = template.indexOf('{#if hasSensitiveDataConsent}', errorBlockIndex);

		expect(consentBranchIndex).toBeGreaterThan(errorBlockIndex);
	});

	it('403 sätter både felet och återgången till samtyckesläget', () => {
		const handler = source.slice(
			source.indexOf('if (res.status === 403)'),
			source.indexOf('if (res.status === 403)') + 200
		);

		expect(handler).toContain('requireConsentAgain()');
		expect(handler).toContain('CONSENT_REQUIRED_ERROR');
	});

	it('requireConsentAgain rör bara samtyckesflaggan', () => {
		const body = source.slice(
			source.indexOf('function requireConsentAgain()'),
			source.indexOf('function requireConsentAgain()') + 120
		);

		expect(body).toContain('hasSensitiveDataConsent = false');
		// Ingen automatisk återutfärdning av samtycke.
		expect(body).not.toContain('fetch(');
	});

	it('samtyckesrutan visas när flaggan är false', () => {
		const gateIndex = template.indexOf('<ConsentGate');
		const blocks = enclosingBlocks(template, gateIndex);

		expect(gateIndex).toBeGreaterThan(-1);
		expect(blocks.some((condition) => condition.includes('!hasSensitiveDataConsent'))).toBe(true);
	});

	it('sändning är fortfarande spärrad utan samtycke', () => {
		expect(source).toContain('if (!hasSensitiveDataConsent || !text || sendInFlight) return;');
	});
});
