import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { THEMES } from '$lib/theme';

/**
 * Regressionsskydd för läsbarheten i mobilchatten.
 *
 * Grundfelen som rättades: inmatningsytan låg på en nästan svart platta
 * (#0f0f0f) i stället för sidans navy, hjälptexter och länkar hade 40-60 %
 * opacitet, och vit text låg direkt på användarens temafärg - som i de
 * ljusare temana inte ger 4,5:1.
 */

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');
const chatWindow = read('src/lib/components/ChatWindow.svelte');
const appCss = read('src/app.css');

const withoutComments = (source: string) =>
	source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');
const code = withoutComments(chatWindow);
const mobileBlock = code.slice(code.indexOf('@media (max-width: 768px)'));

function luminance(hex: string): number {
	const channel = (index: number) => {
		const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
		return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * channel(0) + 0.7152 * channel(1) + 0.0722 * channel(2);
}

/** Samma blandning som --chat-accent-fill: 62 % accent, 38 % #0b1220. */
function mixWithNavy(hex: string): string {
	const navy = [0x0b, 0x12, 0x20];
	return (
		'#' +
		[0, 1, 2]
			.map((index) => {
				const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16);
				return Math.round(value * 0.62 + navy[index] * 0.38)
					.toString(16)
					.padStart(2, '0');
			})
			.join('')
	);
}

describe('inmatningsytan följer sidans navy', () => {
	it('har ingen svart platta bakom skrivfältet', () => {
		expect(withoutComments(appCss)).not.toContain('--chat-input-bg-dark: #0f0f0f');
		expect(withoutComments(appCss)).toContain('--chat-input-bg-dark: hsl(var(--background))');
	});
});

describe('vit text på temafärgen håller kontrasten i alla teman', () => {
	it('mörkar accenten i stället för att lägga vit text direkt på den', () => {
		expect(code).toContain('--chat-accent-fill: color-mix(in srgb, var(--primary) 62%, #0b1220)');
		expect(code).not.toContain('bg-[var(--primary)] text-white');
	});

	it.each(Object.entries(THEMES))('ger minst 4,5:1 i temat %s', (_key, theme) => {
		const fill = luminance(mixWithNavy(theme.accent));
		expect((1 + 0.05) / (fill + 0.05)).toBeGreaterThanOrEqual(4.5);
	});
});

describe('aktiv och inaktiv skicka-knapp skiljs åt utan att texten försvinner', () => {
	it('sänker inte opaciteten på den inaktiva knappen', () => {
		expect(code).not.toContain('disabled:opacity-40');
		expect(code).toMatch(/\.send-button:disabled\s*\{[^}]*background:\s*transparent/);
	});
});

describe('texten är läsbar på mobil', () => {
	it('har minst 1rem i bubblor och skrivfält', () => {
		expect(mobileBlock).toMatch(/:global\(\.message-bubble\)\s*\{[^}]*font-size:\s*1rem/);
		expect(mobileBlock).toMatch(/\.composer-row textarea\s*\{[^}]*font-size:\s*1rem/);
	});

	it('dämpar inte hjälptexter och länkar med opacitet', () => {
		for (const selector of ['.char-count', '.privacy-note-inline', '.settings-toggle', '.settings-link']) {
			const rule = code.match(new RegExp(`${selector.replace('.', '\\.')}[^{]*\\{[^}]*\\}`))?.[0] ?? '';
			expect(rule, selector).not.toMatch(/opacity:\s*0\.[0-5]/);
		}
	});
});

describe('integritetsinformationen är kort först och fullständig vid behov', () => {
	it('visar ett besked i klartext och har detaljerna i en utfällbar del', () => {
		expect(chatWindow).toContain('<details class="privacy-details">');
		expect(chatWindow).toContain('<summary>Så hanteras dina meddelanden</summary>');
		// Den fullständiga texten kommer fortfarande från den delade källan.
		expect(chatWindow).toContain('dataflowCopy.guestChat.retention');
		expect(chatWindow).toContain('dataflowCopy.accountChat.storage');
	});

	it('behåller länkarna till stödlinjer och kontakt utanför den utfällbara delen', () => {
		const panel = chatWindow.slice(chatWindow.indexOf('class="settings-links"'));
		const links = panel.slice(0, panel.indexOf('<details'));
		expect(links).toContain('Se stödlinjer');
		expect(links).toContain('Kontakta oss');
	});
});
