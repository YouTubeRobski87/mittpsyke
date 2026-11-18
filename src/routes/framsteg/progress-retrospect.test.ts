import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Källkodstester för Framstegs återblick: var AI får köras, hur kortet
// kopplas in och att förhandsvisningen för utloggade är ett märkt exempel.

const read = (path: string) => readFileSync(path, 'utf8');
const route = read('src/routes/framsteg/+page.svelte');
const card = read('src/lib/components/progress/LighterDaysCard.svelte');
const insightsEndpoint = read('src/routes/api/diary/insights/+server.ts');
const summaryEndpoint = read('src/routes/api/diary/insights/summary/+server.ts');

describe('AI-sammanfattningen körs bara efter aktivt val', () => {
	it('analysendpointen som laddas med sidan anropar ingen språkmodell', () => {
		expect(insightsEndpoint).not.toMatch(/generateAIText|createAITextGenerator|openai|anthropic/i);
		expect(insightsEndpoint).not.toContain('summary');
	});

	it('sammanfattningen är ett eget POST-anrop bakom både analys- och AI-samtycke', () => {
		expect(summaryEndpoint).toContain('export const POST');
		expect(summaryEndpoint).not.toContain('export const GET');
		const consent = summaryEndpoint.indexOf('hasSensitiveConsentHeader(request)');
		const aiConsent = summaryEndpoint.indexOf('hasDiaryAiConsent(serviceClient, user.id)');
		const generate = summaryEndpoint.indexOf('generateAIText(aiRequest)');
		expect(consent).toBeGreaterThan(-1);
		expect(aiConsent).toBeGreaterThan(consent);
		expect(generate).toBeGreaterThan(aiConsent);
	});

	it('anropas bara från knappens klickhanterare, aldrig vid laddning', () => {
		const calls = card.match(/fetch\('\/api\/diary\/insights\/summary'/g) ?? [];
		expect(calls).toHaveLength(1);
		const runSummary = card.slice(card.indexOf('async function runSummary('), card.indexOf('async function grantAiConsentAndAsk()'));
		expect(runSummary).toContain("fetch('/api/diary/insights/summary'");
		expect(card).toContain('onclick={() => runSummary()}');
		// Ingen effekt eller mount-hook startar sammanfattningen.
		expect(card).not.toMatch(/onMount/);
		const effects = card.match(/\$effect\(\(\) => \{[\s\S]*?\n\t\}\);/g) ?? [];
		for (const effect of effects) expect(effect).not.toContain('runSummary');
		expect(route).not.toContain('/api/diary/insights/summary');
	});

	it('märker förhandsvisade källor och länkar frågan till dess utdrag', () => {
		expect(card).toContain('<legend>Välj ett utdrag</legend>');
		expect(card).toContain('diaryEntryHref(item.entryId)');
		expect(card).toContain("'#ai-question-source-' + summary.sourceRef");
		expect(card).toContain('{summary.question}');
	});
});

describe('kortet "Det här verkar hjälpa mig"', () => {
	it('samlar utdragsval och frågeknapp i det personliga reflektionskortet', () => {
		const reflection = card.slice(card.indexOf('<section class="card personal-reflection-card"'), card.indexOf('<section class="card lighter-days"'));
		expect(reflection).toContain('Din personliga reflektion');
		expect(reflection).toContain('{#if selectedSnapshot}');
		expect(reflection).toContain('Skapa min reflektionsfråga');
		expect(card.match(/data-testid="lighter-days-ai-button"/g)).toHaveLength(1);
		expect(card.slice(card.indexOf('class="lighter-days-evidence"'))).not.toContain('type="radio"');
	});

	it('har den nya rubriken och ingen gammal', () => {
		expect(card).toContain('<h2 id="lighter-days-heading">Det här verkar hjälpa mig</h2>');
		for (const source of [card, route]) expect(source).not.toContain('Det som verkar hjälpa');
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
