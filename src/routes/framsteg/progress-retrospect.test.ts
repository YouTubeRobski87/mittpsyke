import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Källkodstester för Framstegs återblick: var AI får köras, hur kortet
// kopplas in och att förhandsvisningen för utloggade är ett märkt exempel.

const read = (path: string) => readFileSync(path, 'utf8');
const route = read('src/routes/framsteg/+page.svelte');
const card = read('src/lib/components/progress/LighterDaysCard.svelte');
const preview = read('src/lib/components/progress/ProgressExamplePreview.svelte');
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
		const runSummary = card.slice(card.indexOf('async function runSummary()'), card.indexOf('async function grantAiConsentAndSummarize()'));
		expect(runSummary).toContain("fetch('/api/diary/insights/summary'");
		expect(card).toContain('onclick={runSummary}');
		// Ingen effekt eller mount-hook startar sammanfattningen.
		expect(card).not.toMatch(/onMount/);
		const effects = card.match(/\$effect\(\(\) => \{[\s\S]*?\n\t\}\);/g) ?? [];
		for (const effect of effects) expect(effect).not.toContain('runSummary');
		expect(route).not.toContain('/api/diary/insights/summary');
	});

	it('visar vilka inlägg varje mening bygger på', () => {
		expect(card).toContain('Underlag: {statement.sources.map((source) => source.dateLabel)');
	});
});

describe('kortet "Det som ofta fanns med under lättare dagar"', () => {
	it('har den nya rubriken och ingen gammal', () => {
		expect(card).toContain('<h2 id="lighter-days-heading">Det som ofta fanns med under lättare dagar</h2>');
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
	it('är ett tydligt märkt, påhittat exempel', () => {
		expect(preview).toContain('<h2 id="example-preview-heading">Så här kan det se ut efter en månad</h2>');
		expect(preview).toContain('<p class="example-badge">Exempel</p>');
		expect(preview).toContain('Påhittat exempel.');
		expect(preview).toContain('Exempeltext: {item.excerpt}');
		// Inga riktiga datum som kan misstas för användarens egna.
		expect(preview).not.toMatch(/20\d\d-\d\d-\d\d|\d{1,2} (januari|februari|mars|april|maj|juni|juli|augusti|september|oktober|november|december)/);
	});

	it('ersätter de suddiga korten', () => {
		expect(route).toContain('<ProgressExamplePreview />');
		expect(route).not.toContain('account-preview-content');
		expect(route).not.toContain('mode="overlay"');
	});
});
