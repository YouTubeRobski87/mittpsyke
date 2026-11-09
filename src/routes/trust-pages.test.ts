import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const projectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

describe('trust pages', () => {
	it('keeps the homepage local-diary promise tied to verified dataflow copy', () => {
		const source = projectFile('./+page.svelte');
		expect(source).toContain('dataflowCopy.anonymousDiary.short');
	});

	it('does not show an unverified postal-address placeholder', () => {
		const source = projectFile('./kontakt-och-villkor/+page.svelte');
		expect(source).not.toMatch(/Kompletteras/i);
	});

	it('does not hardcode the support-chat model on the responsible-AI page', () => {
		const source = projectFile('./ansvarsfull-ai/+page.svelte');
		expect(source).toContain('data.supportChatModel');
		expect(source).not.toContain('gpt-4o-mini');
	});

	// Gästchatten lagras inte någonstans: /api/chat returnerar gästsvar utan
	// databasskrivning och med conversationId: null. Sidan påstod tidigare att
	// samtalet "sparas separat som ett gästsamtal", vilket beskrev en arkitektur
	// som tagits bort. Bind påståendet till den verifierade dataflödestexten.
	// Krisspärren skickar inte det träffade meddelandet till AI-modellen, men
	// ChatWindow skickar med upp till tio senaste meddelanden (CHAT_CONTEXT_LIMIT)
	// som sammanhang i nästa anrop. Sidan får inte påstå att meddelandet aldrig
	// når AI-modellen.
	it('describes crisis messages as possible AI context on the responsible-AI page', () => {
		const source = projectFile('./ansvarsfull-ai/+page.svelte');
		const text = source.replace(/\s+/g, ' ');
		expect(text).not.toMatch(/utan att skicka meddelandet vidare till AI-modellen/);
		expect(text).toContain('skickas meddelandet inte till AI-modellen för att skapa ett svar');
		expect(text).toContain('upp till tio av de senaste meddelandena som sammanhang');
		expect(text).toContain('krismeddelandet och säkerhetssvaret följa med till AI-modellen');
		expect(text).toContain('både gäster och inloggade');

		expect(projectFile('../lib/state/chat-memory.ts')).toMatch(/CHAT_CONTEXT_LIMIT = 10;/);
		expect(projectFile('../lib/components/ChatWindow.svelte')).toMatch(
			/sanitizeChatMessages\(\s*messages,\s*CHAT_CONTEXT_LIMIT\s*\)/
		);
	});

	// Snabböverblicken ska säga samma sak som avsnittet längre ner: det är en
	// fast regel på servern som avgör, före anropet till AI-modellen. Den
	// gamla meningen "innan någon AI kopplas in" kunde läsas som att AI aldrig
	// får se meddelandet, vilket inte stämmer när det följer med som sammanhang.
	it('describes the crisis check as a fixed server rule in the quick overview', () => {
		const source = projectFile('./ansvarsfull-ai/+page.svelte');
		const overview = source.slice(source.indexOf('class="ai-quick"'), source.indexOf('</section>'));
		expect(overview).not.toContain('innan någon AI kopplas in');
		expect(overview).toContain('fångas av en fast regel på servern innan AI-modellen anropas');
	});

	// Krissidan förklarar spärren och vad den inte fångar. Den ska gå att hitta
	// från varje sida, inte bara via en länk längre ner på /ansvarsfull-ai.
	it('links the crisis page from the site footer', () => {
		const layout = projectFile('./+layout.svelte');
		const footer = layout.slice(layout.indexOf('<footer class="site-footer'), layout.indexOf('</footer>'));
		expect(footer).toContain('<a href="/sa-hanterar-chatten-kriser" class="footer-link">Så hanterar chatten kriser</a>');
	});

	it('describes guest chat as unstored on the responsible-AI page', () => {
		const source = projectFile('./ansvarsfull-ai/+page.svelte');
		expect(source).toContain('dataflowCopy.guestChat.retention');
		expect(source).not.toMatch(/sparas samtalet\s*\n?\s*separat som ett gästsamtal/);
	});

	it('keeps the guest chat endpoint free of conversation storage', () => {
		const source = projectFile('./api/chat/+server.ts');
		const guestBranch = source.slice(
			source.indexOf('if (!token) {'),
			source.indexOf('const supabaseUrl = env.SUPABASE_URL')
		);
		expect(guestBranch.length).toBeGreaterThan(0);
		expect(guestBranch).toContain("conversationId: null");
		expect(guestBranch).not.toMatch(/\.from\((['"])(guest_)?(conversations|messages)\1\)/);
	});

	// Ahrefs laddas inuti den samtyckesgrindade initializern, så tabellens
	// rättsliga grund måste vara samtycke - inte berättigat intresse.
	it('lists consent as the legal basis for Ahrefs web analytics', () => {
		const source = projectFile('./integritet/+page.svelte');
		const ahrefsRow = source.slice(
			source.indexOf('Cookie-fri webbstatistik'),
			source.indexOf('Cookie-fri webbstatistik') + 400
		);
		expect(ahrefsRow).toContain('Ahrefs Web Analytics');
		expect(ahrefsRow).toContain('Samtycke');
		expect(ahrefsRow).not.toContain('Berättigat intresse');
	});

	// Punkt 6 i helhetsanalysen 2026-10-31. Bara bekräftade platser står med:
	// Render och Supabase i Frankfurt (Robbans skärmbilder från båda
	// tjänsterna). För AI-leverantörerna står bara att de har säte i USA och
	// att texten kan behandlas utanför EU, ingen överföringsgrund som inte är
	// bekräftad.
	it('names confirmed locations and says AI text may leave the EU', () => {
		const source = projectFile('./cookies-och-leverantorer/+page.svelte');
		const card = (name: string) => {
			const start = source.indexOf(`aria-label="${name}"`);
			return source.slice(start, source.indexOf('</section>', start));
		};
		expect(card('Render')).toContain('Servern körs inom EU (Frankfurt).');
		expect(card('Supabase')).toContain('Data lagras inom EU (Frankfurt).');
		for (const provider of ['OpenAI', 'Anthropic']) {
			expect(card(provider)).toContain('Företaget har sitt säte i USA, och texten kan behandlas utanför EU.');
		}
		expect(source).not.toMatch(/Data Privacy Framework|standardavtalsklausuler|nolllagring|Zero Data Retention/i);
	});

	// Publika förtroendesidor ska tala om användarens data, inte om hur
	// kodbasen granskats.
	it('keeps internal audit register off the public trust pages', () => {
		for (const path of [
			'./integritet/+page.svelte',
			'./cookies-och-leverantorer/+page.svelte',
			'./ansvarsfull-ai/+page.svelte'
		]) {
			expect(projectFile(path)).not.toMatch(/behöver bekräftas|programkod|kodbasen/i);
		}
	});
});
