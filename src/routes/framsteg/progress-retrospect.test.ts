import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Källkodstester för Framstegs återblick: var AI får köras, hur kortet
// kopplas in och att förhandsvisningen för utloggade är ett märkt exempel.

const read = (path: string) => readFileSync(path, 'utf8');
const route = read('src/routes/framsteg/+page.svelte');
const card = read('src/lib/components/progress/LighterDaysCard.svelte');
const insightsEndpoint = read('src/routes/api/diary/insights/+server.ts');

describe('Framstegs analys körs utan språkmodell', () => {
	it('analysendpointen som laddas med sidan anropar ingen språkmodell', () => {
		expect(insightsEndpoint).not.toMatch(/generateAIText|createAITextGenerator|openai|anthropic/i);
	});

	it('de gamla AI-korten är borttagna och ersatta av Det du har skrivit', () => {
		expect(card).not.toContain('/api/diary/insights/summary');
		expect(card).not.toContain('Skapa min reflektionsfråga');
		expect(route).not.toContain('PersonalRetrospect');
		expect(route).not.toContain('/api/diary/insights/retrospect');
		expect(existsSync('src/routes/api/diary/insights/summary/+server.ts')).toBe(false);
		expect(existsSync('src/routes/api/diary/insights/retrospect/+server.ts')).toBe(false);
	});
});

describe('kortet "Det som ofta fanns med under lättare dagar"', () => {
	it('har den nya rubriken och ingen gammal', () => {
		expect(card).toContain('<h2 id="lighter-days-heading">Det som ofta fanns med under lättare dagar</h2>');
		for (const source of [card, route]) {
			expect(source).not.toContain('Det som verkar hjälpa');
			expect(source).not.toContain('Det här verkar hjälpa mig');
		}
	});

	it('säger det i ord på kortet och lägger antal och andelar under "Visa underlaget"', () => {
		const cardBody = card.slice(card.indexOf('<h3>{theme.label}</h3>'), card.indexOf('{#if openThemeId === theme.id}'));
		const evidence = card.slice(card.indexOf('{#if openThemeId === theme.id}'));
		expect(cardBody).toContain('{sentenceStart(theme.label)} fanns oftare med på dina lättare dagar.');
		expect(cardBody).not.toContain('Andel');
		expect(evidence).toContain('{theme.note} Andel:');
		expect(evidence).toContain('{theme.comparison} Andel:');
	});

	it('visar serverns anteckning och underlag, inga egna formuleringar per position', () => {
		expect(card).toContain('{theme.note}');
		expect(card).toContain('{theme.comparison}');
		expect(card).toContain('{#each theme.evidence as item');
		expect(card).toContain('<blockquote>{item.excerpt}</blockquote>');
		expect(card).not.toMatch(/\{#each view\.themes as theme, index/);
	});

	it('märker låg säkerhet tydligt', () => {
		expect(card).toContain('<span class="low-confidence-badge" data-testid="low-confidence">Låg säkerhet</span>');
		expect(route).toContain('<strong>Låg säkerhet.</strong>');
	});

	it('låter användaren byta namn och ta bort temat utan att röra inläggen', () => {
		expect(card).toContain('Byt namn');
		expect(card).toContain('Det här stämmer inte');
		expect(card).toContain('supabase.auth.updateUser');
		expect(card).not.toMatch(/from\('diary'\)|\/api\/diary\/(delete|update)/);
	});

	it('renderas för inloggade med samtycke och räknas om efter en korrigering', () => {
		expect(route).toContain('<LighterDaysCard');
		expect(route).toContain('onChanged={loadInsights}');
	});
});

describe('förhandsvisningen för utloggade', () => {
	// Själva exemplet renderas och granskas i src/lib/progress-example.test.ts.
	it('ersätter de suddiga korten', () => {
		expect(route).toContain('<ProgressExamplePreview />');
		expect(route).not.toContain('account-preview-content');
		expect(route).not.toContain('mode="overlay"');
	});
});
