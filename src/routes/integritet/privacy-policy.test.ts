import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Integritetspolicyn ska beskriva den databehandling som faktiskt finns i koden.
// Testerna läser både policyn och koden den beskriver, så att en ändring i
// någon av dem utan den andra fångas här.

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const policy = read('./+page.svelte');
const providers = read('../cookies-och-leverantorer/+page.svelte');
const responsibleAi = read('../ansvarsfull-ai/+page.svelte');

// Brödtexten utan markup, för att kunna söka i löptext.
const policyText = policy
	.replace(/<script[\s\S]*?<\/script>/, '')
	.replace(/<[^>]+>/g, ' ')
	.replace(/\s+/g, ' ');

describe('integritetspolicyn speglar faktisk databehandling', () => {
	it('beskriver AI-minnet så som det är byggt', () => {
		const memory = read('../../lib/server/user-memory.ts');
		const exporter = read('../api/account/export/+server.ts');

		expect(policy).toContain('id="ai-minne"');
		expect(memory).toContain('MAX_USER_MEMORIES = 10');
		expect(policyText).toMatch(/högst tio (korta )?teman/);
		expect(memory).toContain('MEMORY_CONTENT_MAX_LENGTH = 240');
		expect(policyText).toContain('högst 240 tecken');
		expect(memory).toContain('MEMORY_CONTEXT_MESSAGES = 16');
		expect(policyText).toContain('högst 16 meddelanden');
		expect(policyText).toMatch(/Bara med konto\.\s*Gästchatten har inget minne/);
		expect(policyText).toContain('ingen bedömning, diagnos eller medicinsk profil');

		// Exporten innehåller minnet under namnet som policyn använder.
		expect(exporter).toContain("key: 'sparade_teman', table: 'user_memories'");
		expect(policyText).toContain('sparade teman');
		// Det finns ingen knapp för att radera enbart minnet, och policyn lovar ingen.
		expect(policyText).toContain('ingen knapp för att radera enbart minnet');
		expect(read('../dashboard/installningar/+page.svelte')).not.toMatch(/user_memories|raderaMinne|deleteMemor/i);
	});

	it('beskriver dikteringen försiktigt och utan att påstå en viss leverantör', () => {
		const voiceInput = read('../../lib/components/VoiceInput.svelte');

		expect(voiceInput).toMatch(/SpeechRecognition \?\? speechWindow\.webkitSpeechRecognition/);
		expect(voiceInput).not.toMatch(/fetch\(/);
		expect(policy).toContain('id="diktering"');
		expect(policyText).toContain('Web Speech API');
		expect(policyText).toContain('MittPsyke tar inte emot något ljud');
		expect(policyText).toMatch(/Beroende på webbläsare och enhet/);
		expect(policyText).toContain('skriver du i stället i textfältet');
		expect(policyText).not.toMatch(/(ljud|talet) skickas alltid till Google/i);
	});

	it('beskriver dataintrångskontrollen mot Have I Been Pwned', () => {
		const endpoint = read('../api/hibp/breaches/+server.ts');

		expect(endpoint).toContain('https://haveibeenpwned.com/api/v3/breachedaccount');
		// Policyn säger att adressen varken lagras eller loggas i databas.
		expect(endpoint).not.toMatch(/\.from\(|\.insert\(|console\.\w+\([^)]*email/);
		expect(policy).toContain('id="dataintrang"');
		expect(policyText).toContain('Have I Been Pwned');
		expect(policyText).toContain('MittPsyke sparar inte adressen eller resultatet');
		expect(policyText).toContain('din IP-adress inte till Have I Been Pwned');
		expect(policy).toContain('href="/dataintrang"');
	});

	it('namnger driftleverantörerna Render, Cloudflare och Supabase', () => {
		for (const provider of ['Render', 'Cloudflare', 'Supabase']) {
			expect(policyText).toContain(`${provider}:`);
			expect(providers).toContain(`aria-label="${provider}"`);
		}
		expect(policyText).not.toContain('Driftleverantör:');
		expect(policyText).not.toContain('Driftleverantör (se leverantörsavtal)');
	});

	it('beskriver serverside-händelserna som pseudonymiserade, inte anonyma', () => {
		const funnel = read('../../lib/server/funnel-events.ts');

		expect(funnel).toContain("FUNNEL_EVENT_NAMES = ['first_entry_saved', 'second_active_day']");
		expect(funnel).toContain("'first_meaningful_reflection'");
		expect(funnel).toContain("'w1_return'");
		expect(funnel).toContain("'w4_return'");
		expect(funnel).toContain("createHmac('sha256', salt)");
		expect(policy).toContain('id="handelser"');
		expect(policyText).toContain('servergenererad pseudonym');
		expect(policyText).toContain('hash av ditt användar-id med en hemlig nyckel på servern');
		expect(policyText).toContain('pseudonymisering, inte en anonymisering');
		expect(policyText).toMatch(
			/Dagbokstext, chattmeddelanden, kvällsincheckningens text, humörvärden, ämnen eller diagnoser, AI-svar, e-post och rått användar-id ingår aldrig/
		);
	});

	it('beskriver den prospektiva mätningen av meningsfull användning och återkomst', () => {
		expect(policyText).toContain('användare med konto som omfattas av mätningen');
		expect(policyText).toContain('ett dagboksinlägg');
		expect(policyText).toContain('ett verkligt användarmeddelande i en inloggad chatt');
		expect(policyText).toContain('en kvällsincheckning faktiskt har sparats');
		expect(policyText).toMatch(/börjar använda tjänsten och återkommer över tid/);
		expect(policyText).toMatch(/första meningsfulla användningen.*ungefär vecka 1 och vecka 4/);
		expect(policyText).toContain('Mätningen börjar när funktionen aktiveras');
		expect(policyText).toContain('Äldre användning analyseras inte bakåt');
		expect(policyText).not.toMatch(/registrerar servern två händelser/i);
		expect(policyText).not.toMatch(/två dagbokshändelser/i);
	});

	it('beskriver export och radering utan motsägelser', () => {
		const deletion = read('../../lib/server/account-deletion.ts');

		// Den gamla motsägelsen: självbetjänad nedladdning men "via e-post".
		expect(policyText).not.toContain('Vid export får du din data i JSON-format via e-post');
		expect(policy).toContain('href="/dashboard/installningar#din-data"');
		expect(policy).toContain('href="/dashboard/installningar#radera-konto"');
		expect(policyText).toContain('laddar du ner en JSON-fil direkt i webbläsaren');
		expect(policyText).toContain('sökvägar, inte själva filerna');

		// Radering av kontot tar bort chattar, bilder och videor. Det är sant
		// eftersom account-deletion raderar det som inte följer med i kaskad.
		expect(policyText).toMatch(
			/dagbok, bilder och videor, kvällsincheckningar, chattar, AI-minnet, inlägg och kommentarer i gemenskapen, trådar och svar i det tidigare forumet/
		);
		expect(deletion).toContain("from('conversations').delete()");
		expect(deletion).toContain("ACCOUNT_STORAGE_BUCKETS = ['diary-images', 'diary-videos']");
		expect(deletion).toContain("FORUM_TABLES = ['forum_replies', 'forum_threads']");

		// Exporten och policyn räknar upp samma forum- och gemenskapsdata.
		const exporter = read('../api/account/export/+server.ts');
		for (const table of ['community_posts', 'community_comments', 'forum_threads', 'forum_replies']) {
			expect(exporter).toContain(`table: '${table}'`);
		}
		expect(policyText).toMatch(/inlägg och kommentarer i gemenskapen, trådar\s+och svar från det tidigare forumet/);
	});

	it('har aktuellt datum', () => {
		expect(policyText).toContain('Senast uppdaterad: 21 september 2026');
		expect(policyText).not.toContain('13 september 2026');
		expect(policyText).not.toContain('10 juni 2026');
	});

	it('nämner inte Google Ads och gör inga absoluta påståenden', () => {
		expect(policyText).not.toMatch(/Google Ads|annonsering|remarketing/i);
		expect(policyText).not.toMatch(/GDPR-compliant|100\s*%\s*anonym|ingen data lämnar EU|ingen tredje part/i);
	});

	it('beskriver OpenAI-granskning och IP-hash för anonyma berättelser', () => {
		expect(policyText).toContain('Anonyma berättelser');
		expect(policyText).toContain('skicka texten till OpenAI för en första AI-granskning');
		expect(policyText).toContain('en hash av IP-adressen');
	});

	it('beskriver MittPsyke som skrivande och reflektion, inte som ett AI-baserat samtalsstöd', () => {
		expect(policyText).not.toContain('AI-baserat samtalsstöd');
	});

	it('alla interna ankarlänkar pekar på en sektion som finns', () => {
		const anchors = [...policy.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
		expect(anchors.length).toBeGreaterThan(5);
		for (const anchor of anchors) expect(policy).toContain(`id="${anchor}"`);
	});

	it('chattens samtycke nämner AI-minnet och länkar till policyn', () => {
		const chatWindow = read('../../lib/components/ChatWindow.svelte');
		const gate = read('../../lib/components/ConsentGate.svelte');

		expect(chatWindow).toContain('memoryHref="/integritet#ai-minne"');
		expect(chatWindow).toMatch(/confirmationLabel="[^"]*sparar ett kort AI-minne när jag är inloggad\."/);
		expect(gate).toMatch(/\{#if memoryHref\}[\s\S]*?högst tio teman[\s\S]*?href=\{memoryHref\}/);
		expect(policy).toContain('id="ai-minne"');
	});

	it('markerar att berättigat intresse inte är juridiskt verifierat', () => {
		// Markeringen ligger i källkoden, inte i den publicerade texten, tills en
		// jurist har granskat grunden för HIBP och användningshändelserna.
		expect(policy.match(/JURIDISKT EJ VERIFIERAT/g)?.length).toBeGreaterThanOrEqual(2);
		expect(policyText).not.toContain('JURIDISKT EJ VERIFIERAT');
	});

	it('Ansvarsfull AI och leverantörssidan pekar på samma sektioner', () => {
		expect(responsibleAi).toContain('href="/integritet#ai-minne"');
		expect(providers).toContain('href="/integritet#diktering"');
		expect(providers).toContain('href="/integritet#dataintrang"');
		for (const anchor of ['ai-minne', 'diktering', 'dataintrang']) {
			expect(policy).toContain(`id="${anchor}"`);
		}
	});
});
