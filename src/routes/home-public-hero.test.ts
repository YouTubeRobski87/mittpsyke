import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const publicHome = page.slice(page.indexOf('{:else}'), page.lastIndexOf('</div>', page.indexOf('<style')));
const hero = publicHome.slice(0, publicHome.indexOf('<!-- 2.'));

describe('Den publika startsidans hero', () => {
	it('förklarar skrivande, kontinuitet och mönster direkt i den publika grenen', () => {
		expect(publicHome).toContain('Se vad som återkommer i det du skriver.');
		expect(publicHome).toContain('Skriv av dig och spara det du vill.');
		expect(publicHome).toContain('dina egna ord, i din egen takt.');
		expect(publicHome).toContain('Skriv → spara det du vill → se vad som återkommer');
	});

	// Eyebrown sa samma sak som H1 och låg raden ovanför. Hero-copy ska börja
	// direkt med nyttan, utan en extra etikett som skjuter ner huvudbudskapet.
	// Två rader, ett budskap, på den skärm där raderna är dyrast.
	it('upprepar inte H1 i en eyebrow ovanför den', () => {
		expect(hero).not.toContain('Skriv, reflektera och se mönster över tid');
		expect(hero).not.toContain('class="eyebrow"');
	});

	it('låter den primära CTA:n börja skriva utan konto', () => {
		expect(hero).toMatch(
			/class="cta-primary"\s+href=\{ANONYMOUS_WRITE_DESTINATION\}\s+onclick=\{\(\) => trackHomeCta\('hero', 'skriv_utan_konto', ANONYMOUS_WRITE_DESTINATION\)\}/
		);
		expect(hero).toContain('Börja skriva');
	});

	it('låter den andra direkta vägen öppna den riktiga chatten utan mellanvy', () => {
		expect(page).toContain("const ANONYMOUS_CHAT_DESTINATION = '/chat';");
		expect(hero).toMatch(
			/class="cta-secondary"\s+href=\{ANONYMOUS_CHAT_DESTINATION\}\s+onclick=\{\(\) => trackHomeCta\('hero', 'chatta', ANONYMOUS_CHAT_DESTINATION\)\}/
		);
		expect(hero).toContain('Chatta');
		expect(hero).not.toContain('Se hur platsen lever');
		expect(hero).not.toContain('/register');
	});

	// Registreringen hör hemma i avslutande CTA, efter att sidan förklarat vad
	// kontot ger - aldrig i heron, där den konkurrerade med den primära CTA:n.
	it('erbjuder konto först efter att produktvärdet förklarats, aldrig i heron', () => {
		expect(hero).not.toContain('/register');
		expect(hero).not.toContain('REGISTER_DESTINATION');
		expect(publicHome.match(/href=\{REGISTER_DESTINATION\}/g)).toHaveLength(2);
		const livingWorldStart = publicHome.indexOf('aria-labelledby="living-world-title"');
		const livingWorld = publicHome.slice(
			livingWorldStart,
			publicHome.indexOf('</section>', livingWorldStart)
		);
		expect(livingWorld).toContain('Utforska din värld');
		const closing = publicHome.slice(publicHome.indexOf('aria-labelledby="closing-title"'));
		expect(closing).toContain('href={REGISTER_DESTINATION}');
		expect(closing).toContain('Skapa konto och följ över tid');
		expect(closing).toContain(
			'Med konto kan du samla det du väljer att spara och se vad som återkommer eller förändras.'
		);
		expect(publicHome).not.toContain('Skapa en plats för att spara det du skriver');
	});

	it('behåller rubriken för den levande världen i sidans fortsatta berättelse', () => {
		expect(publicHome).toContain(
			'<h2 id="living-world-title" tabindex="-1">Din värld stannar inte här</h2>'
		);
	});

	// Formuleringen är kontrollerad mot diary-draft.ts: anonyma utkast skrivs
	// bara till localStorage och skickas aldrig till servern.
	it('förklarar diskret skillnaden mellan dagboksutkast och gästchatt', () => {
		expect(hero).toContain(
			'Skriv anonymt i din dagbok eller chatta direkt utan konto. Dagboksutkast sparas lokalt i'
		);
		expect(hero).toContain('din webbläsare.');
		// Gästchatten lämnar webbläsaren: texten går till OpenAI men sparas inte av MittPsyke.
		expect(hero).toContain('Din gästchatt sparas inte på MittPsyke.');
		expect(hero).toContain(
			'När du skickar ett meddelande överförs texten till OpenAI för att behandlas och generera ett svar.'
		);
		expect(hero).toContain('MittPsyke sparar inte innehållet i din gästchatt.');
		expect(hero).not.toContain('gästchatten sparas inte.');
		// Markup, inte fritext: rubrikens namn nämns i kommentaren som
		// dokumenterar varför sektionen togs bort.
		expect(publicHome).not.toContain('id="anonymous-title"');
		expect(publicHome).not.toContain('Skriv utan konto <span aria-hidden="true">→</span>');
	});

	// Stegkortet låg som överlägg i heron och doldes under 1120px, så varje
	// telefon fick landskapet utan produkt-UI. Heron bär nu bara scenen.
	it('låter heron bära scenen utan stegkortet ovanpå', () => {
		expect(hero).toContain('<CabinProof variant="scene" priority />');
		expect(hero).not.toContain('variant="hero"');
	});
});
