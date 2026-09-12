import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('./+page.svelte', import.meta.url), 'utf8');
const publicHome = page.slice(page.indexOf('{:else}'), page.indexOf('</main>'));
const hero = publicHome.slice(0, publicHome.indexOf('<!-- 2.'));

describe('Den publika startsidans hero', () => {
	it('förklarar skrivande, kontinuitet och mönster direkt i den publika grenen', () => {
		expect(publicHome).toContain('Skriv av dig. Se mönster över tid.');
		expect(publicHome).toContain(
			'MittPsyke är ett digitalt stöd där du kan skriva, reflektera och följa hur du har det över'
		);
		expect(publicHome).toContain('Skriv → spara det du vill → se vad som återkommer');
	});

	// Eyebrown sa ordagrant samma sak som H1 ("Skriv, reflektera och se mönster
	// över tid" / "Skriv av dig. Se mönster över tid.") och låg raden ovanför.
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

	// Den sekundära var tidigare /register. Den kostar besökaren ett konto och
	// konkurrerade därmed med en primär CTA som inte kostar något - ett val
	// innan besökaren vet vad hon väljer mellan. Nu är den ett ankare som
	// stannar på sidan.
	it('har en sekundär som stannar på sidan i stället för att kräva konto', () => {
		expect(page).toContain("const PLACE_MAP_ANCHOR = '#map-title';");
		expect(hero).toMatch(
			/class="cta-secondary"\s+href=\{PLACE_MAP_ANCHOR\}\s+onclick=\{scrollToPlaceMap\}/
		);
		expect(hero).toContain('Se platsen');
		// href ligger kvar så hoppet fungerar utan JS, men scrollen sköts i JS:
		// webbläsarens hash-navigering gör inget alls vid ett andra klick på
		// samma hash, så länken blev död efter första användningen.
		expect(page).toContain("target.scrollIntoView({ block: 'start' })");
		expect(page).toContain("trackHomeCta('hero', 'se_platsen', PLACE_MAP_ANCHOR)");
		// app.css äger både offset och mjuk scroll. Sätts något av det här igen
		// adderas det ovanpå och rubriken hamnar dubbelt så långt ner.
		// Deklarationen, inte ordet - kommentaren intill förklarar varför den
		// inte ska finnas.
		expect(page).not.toMatch(/scroll-margin-top\s*:/);
		expect(page).not.toMatch(/behavior:\s*'smooth'/);
	});

	// Registreringen hör hemma i avslutande CTA, efter att sidan förklarat vad
	// kontot ger - aldrig i heron, där den konkurrerade med den primära CTA:n.
	it('erbjuder konto först i avslutande CTA, aldrig i heron', () => {
		expect(hero).not.toContain('/register');
		expect(hero).not.toContain('REGISTER_DESTINATION');
		expect(publicHome.match(/href=\{REGISTER_DESTINATION\}/g)).toHaveLength(1);
		const closing = publicHome.slice(publicHome.indexOf('aria-labelledby="closing-title"'));
		expect(closing).toContain('href={REGISTER_DESTINATION}');
		expect(publicHome).not.toContain('Skapa en plats för att spara det du skriver');
	});

	// Ankaret måste gå till en rubrik som finns, annars scrollar klicket
	// ingenstans. tabindex flyttar tangentbordsfokus med scrollen.
	it('har ett ankarmål som existerar och tar emot tangentbordsfokus', () => {
		expect(publicHome).toContain('<h2 id="map-title" tabindex="-1">');
	});

	// Länktexten lovade tidigare "Så fungerar det" men landade på rubriken
	// "Så ser platsen ut". Ankaret går fortfarande till platskartan (inte till
	// stegsektionen), så texten följer målet - inte tvärtom.
	it('lovar i länktexten det som målrubriken faktiskt säger', () => {
		expect(publicHome).toContain('<h2 id="map-title" tabindex="-1">Så ser platsen ut</h2>');

		// Bara länkens egen text. "Så fungerar det" finns kvar som aria-label
		// på pilraden längre ner i heron, vilket är en annan sak.
		const secondary = hero.slice(hero.indexOf('class="cta-secondary"'));
		const linkText = secondary.slice(0, secondary.indexOf('</a>'));
		expect(linkText).toContain('Se platsen');
		expect(linkText).not.toContain('Så fungerar det');
	});

	// Formuleringen är kontrollerad mot diary-draft.ts: anonyma utkast skrivs
	// bara till localStorage och skickas aldrig till servern.
	it('säger tröskeln direkt under CTA-raden i stället för i en egen sektion', () => {
		expect(hero).toContain('Inget konto behövs. Texten stannar i din webbläsare.');
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
