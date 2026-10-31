import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regressionsskydd för mobilchatten med tangentbord uppe.
 *
 * Grundfelet: Android Chrome krymper som standard bara den visuella viewporten
 * när tangentbordet öppnas. Layoutviewporten - och därmed vh/dvh - behåller hela
 * skärmhöjden. Inmatningsytan hade taket min(48dvh, 25rem), alltså 48 % av HELA
 * skärmen, och krävde 384 px av de ~475 px som faktiskt syntes. Resten löste
 * webbläsaren genom att skrolla fram textfältet, vilket skar av innehållet ovanför,
 * och .chat-input-extras var dessutom en andra skrollruta som klippte texten mitt
 * i en rad.
 *
 * Testerna nedan låser de tre delarna av lösningen: rätt viewportbeteende, en
 * inmatningsyta utan viewportbaserat tak, och en enda tydlig skrollyta.
 */

const chatWindow = readFileSync(
	join(process.cwd(), 'src/lib/components/ChatWindow.svelte'),
	'utf8'
);
const voiceInput = readFileSync(
	join(process.cwd(), 'src/lib/components/VoiceInput.svelte'),
	'utf8'
);
const appHtml = readFileSync(join(process.cwd(), 'src/app.html'), 'utf8');

/**
 * Kommentarerna i filerna beskriver med flit vad som togs bort och varför, så
 * "får inte förekomma"-kontrollerna nedan måste titta på koden och inte på
 * prosan. Utan den här strippningen räcker det att nämna det gamla värdet i en
 * förklaring för att testet ska falla.
 */
function withoutComments(source: string): string {
	return source
		.replace(/\/\*[\s\S]*?\*\//g, '')
		.replace(/^\s*\/\/.*$/gm, '')
		.replace(/<!--[\s\S]*?-->/g, '');
}

const chatWindowCode = withoutComments(chatWindow);

describe('viewporten känner av tangentbordet', () => {
	it('ber Android Chrome krympa layouten, inte bara den visuella viewporten', () => {
		const viewport = appHtml.match(/<meta\s+name="viewport"[\s\S]*?\/>/)?.[0] ?? '';
		expect(viewport).toContain('width=device-width');
		expect(viewport).toContain('interactive-widget=resizes-content');
	});

	it('bevakar tangentbordet via VisualViewport och städar upp efter sig', () => {
		expect(chatWindow).toContain("import { observeKeyboardViewport } from '$lib/keyboardViewport'");
		expect(chatWindow).toContain('const stopKeyboardViewport = observeKeyboardViewport()');
		// Utan städning ärver andra routes ett data-keyboard-open som aldrig stängs.
		expect(chatWindow).toContain('stopKeyboardViewport()');
	});
});

describe('inmatningsytan har inget viewportbaserat höjdtak', () => {
	it('har inte kvar taket som räknades mot hela skärmhöjden', () => {
		expect(chatWindowCode).not.toContain('max-height: min(48dvh, 25rem)');
		expect(chatWindowCode).not.toContain('max-height: min(82dvh, 42rem)');
		expect(chatWindowCode).not.toContain('chat-input-area--consent');
	});

	it('låter meddelandelistan ge efter i stället för inmatningsytan', () => {
		// flex-basis 0: listan tar det som blir över, inte sin egen innehållshöjd.
		expect(chatWindowCode).toMatch(/\.chat-messages\s*\{[^}]*flex:\s*1 1 0/);
		expect(chatWindowCode).toMatch(/\.chat-input-area\s*\{[^}]*flex:\s*0 1 auto/);
	});

	it('krymper aldrig bort textfältet eller skicka-knappen', () => {
		expect(chatWindowCode).toMatch(/\.composer-row\s*\{\s*flex:\s*0 0 auto/);
	});

	it('använder inte 100vh för chatthöjden på mobil', () => {
		// vh krymper inte när tangentbordet öppnas i Android Chrome.
		const mobileBlock = chatWindowCode.slice(chatWindowCode.indexOf('@media (max-width: 768px)'));
		expect(mobileBlock).not.toContain('100vh');
	});
});

describe('en tydlig skrollyta för meddelanden', () => {
	it('låter meddelandelistan vara den skrollande ytan', () => {
		expect(chatWindowCode).toMatch(/\.chat-messages\s*\{[^}]*overflow-y:\s*auto/);
	});

	it('behåller extras-rutan som sista utväg, inte som normalläge', () => {
		// Den skrollar bara när innehållet omöjligt får plats, t.ex. samtyckesvyn
		// på en riktigt kort viewport. Utan den hamnar samtyckesknappen utanför.
		expect(chatWindowCode).toMatch(/\.chat-input-extras\s*\{[^}]*flex:\s*0 1 auto/);
		expect(chatWindowCode).toMatch(/\.chat-input-extras\s*\{[^}]*overflow-y:\s*auto/);
	});

	it('skapar ingen konkurrerande sidskroll via body-hack', () => {
		expect(chatWindowCode).not.toMatch(/body\s*\{[^}]*overflow/);
	});
});

describe('sekundärt UI konkurrerar inte om höjden med tangentbord uppe', () => {
	it('döljer verktygsraden medan användaren skriver', () => {
		expect(chatWindow).toContain(
			":global(html[data-keyboard-open='true']) .chat-toolbar"
		);
	});

	it('komprimerar röstpanelen utan att ta bort någon kontroll', () => {
		expect(voiceInput).toContain(":global(html[data-keyboard-open='true']) .voice-card");
		// Mikrofon, avbryt och status ska finnas kvar i markupen oavsett läge.
		expect(voiceInput).toContain('class="microphone-button"');
		expect(voiceInput).toContain('class="status-row"');
		// Bara den inledande hjälptexten viks undan, och bara medan man skriver.
		expect(voiceInput).toContain(
			":global(html[data-keyboard-open='true']) .first-time-help"
		);
	});
});

describe('snabbvalen skapar ingen horisontell overflow', () => {
	it('skrollar i egen container i stället för att bryta raden', () => {
		const mobileBlock = chatWindowCode.slice(chatWindowCode.indexOf('@media (max-width: 768px)'));
		expect(mobileBlock).toMatch(/\.chips-row\s*\{[^}]*overflow-x:\s*auto/);
		expect(mobileBlock).toMatch(/\.chips-row\s*\{[^}]*overscroll-behavior-x:\s*contain/);
	});

	it('snappar så att raden aldrig stannar mitt i ett chip', () => {
		expect(chatWindowCode).toMatch(/\.chips-row\s*\{[^}]*scroll-snap-type:\s*x proximity/);
		expect(chatWindowCode).toMatch(/\.starter-chip\s*\{[^}]*scroll-snap-align:\s*start/);
	});
});

/**
 * Samtyckesvyn på mobil. Meddelandelistan har flex-basis 0 och krympte till
 * ~27 px bredvid samtyckesrutan, så introtexten ("AI-stödet kan hjälpa dig …")
 * klipptes mitt i en rad. I samtyckesvyn utan meddelanden tar listan sin
 * innehållshöjd och hela chattytan blir en enda skrollyta.
 */
describe('introtexten syns helt ovanför samtyckesrutan på mobil', () => {
	const mobileBlock = chatWindowCode.slice(chatWindowCode.indexOf('@media (max-width: 768px)'));

	it('markerar samtyckesvyn med samma villkor som visar ConsentGate', () => {
		expect(chatWindowCode).toContain(
			'const consentGateVisible = $derived(consentStatusKnown && !hasSensitiveDataConsent)'
		);
		expect(chatWindowCode).toContain(
			'class:consent-intro-view={consentGateVisible && messages.length === 0}'
		);
		// Mallen visar rutan när status är känd och samtycke saknas.
		expect(chatWindowCode).toMatch(
			/\{#if !hasSensitiveDataConsent && !consentStatusKnown\}[\s\S]*?\{:else if !hasSensitiveDataConsent\}[\s\S]*?<ConsentGate/
		);
	});

	it('låter listan ta sin innehållshöjd i stället för att klippa texten', () => {
		expect(mobileBlock).toMatch(
			/\.consent-intro-view \.chat-messages,\s*\.consent-intro-view \.chat-input-area,\s*\.consent-intro-view \.chat-input-extras\s*\{[^}]*flex:\s*0 0 auto;[^}]*overflow:\s*visible/
		);
	});

	it('gör chattytan till enda skrollytan i samtyckesvyn', () => {
		expect(mobileBlock).toMatch(/\.consent-intro-view\s*\{[^}]*overflow-y:\s*auto/);
	});

	it('håller AI-raden synlig ovanför inmatningsytan när vyn skrollar', () => {
		// .chat-input-area har z-index: 30 i app.css.
		expect(mobileBlock).toMatch(
			/\.consent-intro-view \.ai-notice\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*z-index:\s*31;[^}]*background:\s*hsl\(var\(--background\)\)/
		);
		expect(readFileSync(join(process.cwd(), 'src/app.css'), 'utf8')).toMatch(
			/\.chat-input-area\s*\{[^}]*z-index:\s*30;/
		);
	});

	it('behåller kryssrutan och knappen fasta i botten av samtyckesrutan', () => {
		const consentGate = readFileSync(
			join(process.cwd(), 'src/lib/components/ConsentGate.svelte'),
			'utf8'
		);
		expect(consentGate).toMatch(/\.consent-actions\s*\{[^}]*position:\s*sticky;[^}]*bottom:\s*0/);
	});
});

/**
 * Tom chatt efter samtycke på låga skärmar (320×568 och lägre). Länk, snabbval
 * och röstpanel tog ~280 px och listan fick 27-47 px, så introtexten klipptes.
 * Medan chatten är tom blir chattytan en enda skrollyta med textfältet fast i
 * botten. Med tangentbordet uppe går textfältet före introtexten.
 */
describe('introtexten syns helt i en tom chatt efter samtycke på mobil', () => {
	const mobileBlock = chatWindowCode.slice(chatWindowCode.indexOf('@media (max-width: 768px)'));

	it('gäller bara tom chatt utan samtyckesruta', () => {
		expect(chatWindowCode).toContain(
			'class:empty-chat-view={!consentGateVisible && messages.length === 0}'
		);
	});

	it('låter listan ta minst sin innehållshöjd och chattytan skrolla', () => {
		expect(mobileBlock).toMatch(/\.empty-chat-view\s*\{[^}]*overflow-y:\s*auto/);
		expect(mobileBlock).toMatch(/\.empty-chat-view \.chat-messages\s*\{[^}]*flex:\s*1 0 auto/);
		expect(mobileBlock).toMatch(
			/\.empty-chat-view \.chat-input-area,\s*\.empty-chat-view \.chat-input-extras\s*\{[^}]*flex:\s*0 0 auto;[^}]*overflow:\s*visible/
		);
	});

	it('håller AI-raden överst och textfältet i botten', () => {
		expect(mobileBlock).toMatch(
			/\.empty-chat-view \.ai-notice\s*\{[^}]*position:\s*sticky;[^}]*top:\s*0;[^}]*z-index:\s*31/
		);
		expect(mobileBlock).toMatch(
			/\.empty-chat-view \.composer-row\s*\{[^}]*position:\s*sticky;[^}]*bottom:\s*0/
		);
	});

	it('låter textfältet gå före introtexten med tangentbordet uppe', () => {
		const kb = ":global(html[data-keyboard-open='true']) .empty-chat-view";
		expect(mobileBlock).toContain(`${kb} {\n\t\t\toverflow-y: hidden;`);
		expect(mobileBlock).toMatch(
			/html\[data-keyboard-open='true'\]\) \.empty-chat-view \.chat-messages\s*\{[^}]*flex:\s*1 1 auto;[^}]*min-height:\s*0;[^}]*overflow-y:\s*auto/
		);
		expect(mobileBlock).toMatch(
			/html\[data-keyboard-open='true'\]\) \.empty-chat-view \.chat-input-extras\s*\{[^}]*overflow-y:\s*auto/
		);
		expect(mobileBlock).toMatch(
			/html\[data-keyboard-open='true'\]\) \.empty-chat-view \.composer-row\s*\{[^}]*position:\s*static/
		);
	});
});
