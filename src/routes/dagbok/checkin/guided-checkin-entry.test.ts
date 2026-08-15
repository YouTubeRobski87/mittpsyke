import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// Guidad incheckning ligger på /dagars-avtryck/checkin. Den inloggade dagboken
// är den enda naturliga vägen dit, så ingången testas här. Vitest kör i
// nodemiljö utan DOM, därför läses källan som text i stället för att renderas
// (samma mönster som src/lib/chat-handoff.test.ts).
const source = readFileSync(
	join(process.cwd(), 'src/routes/dagbok/checkin/+page.svelte'),
	'utf8'
);

const GUIDED_HREF = '/dagars-avtryck/checkin';

describe('inloggad dagbok: ingång till guidad incheckning', () => {
	it('länkar till den befintliga routen', () => {
		expect(source).toContain(`href="${GUIDED_HREF}"`);
	});

	it('använder en riktig länk, inte en klickbar div', () => {
		const anchor = source.match(/<a[^>]*href="\/dagars-avtryck\/checkin"[^>]*>([\s\S]*?)<\/a>/);

		expect(anchor).not.toBeNull();
		expect(anchor?.[1].trim()).toBe('Starta incheckning');
		expect(source).not.toMatch(/<div[^>]*onclick[^>]*>[\s\S]{0,400}dagars-avtryck\/checkin/);
	});

	it('visas bara i den inloggade grenen', () => {
		const signedOutBranch = source.slice(
			source.indexOf('{:else if !isLoggedIn}'),
			source.indexOf('<!-- Inloggad dagboksvy -->')
		);

		expect(signedOutBranch).not.toContain(GUIDED_HREF);
	});

	it('ligger i startpanelen, före historik och statistik', () => {
		const entryIndex = source.indexOf(`href="${GUIDED_HREF}"`);
		const startPanelIndex = source.indexOf('diary-paths--signed-in');
		const dailyQuestionIndex = source.indexOf('daily-question-panel');

		expect(startPanelIndex).toBeGreaterThan(-1);
		expect(entryIndex).toBeGreaterThan(startPanelIndex);
		expect(entryIndex).toBeLessThan(dailyQuestionIndex);
	});

	it('marknadsför inte AI i ingången', () => {
		const card = source.slice(
			source.indexOf('<div class="diary-start-primary diary-start-guided">'),
			source.indexOf(`href="${GUIDED_HREF}"`) + 200
		);

		expect(card).not.toMatch(/\bAI\b|analys|reflektion/i);
	});

	it('behåller "Börja skriva" som primär handling', () => {
		expect(source.indexOf('Börja skriva')).toBeLessThan(
			source.indexOf(`href="${GUIDED_HREF}"`)
		);
	});
});
