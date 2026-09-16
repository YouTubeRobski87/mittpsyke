import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	DAILY_QUESTION_STOP_WORDS,
	LOCAL_RETROSPECT_STOP_WORDS,
	SPEGELVATTNET_STOP_WORDS,
	SWEDISH_STOP_WORDS_CORE
} from '$lib/swedish-stop-words';

// Stopporden bor i en fil, men listorna är medvetet inte identiska: varje
// analys behöll exakt sin gamla uppsättning när de flyttades hit. Testerna
// vaktar både att kärnan finns kvar i alla tre och att ingen lista krymper
// oavsiktligt.

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

describe('den delade kärnan', () => {
	it('finns i alla tre listorna', () => {
		expect(SWEDISH_STOP_WORDS_CORE.length).toBe(24);
		for (const word of SWEDISH_STOP_WORDS_CORE) {
			expect(SPEGELVATTNET_STOP_WORDS.has(word), `spegelvattnet saknar ${word}`).toBe(true);
			expect(DAILY_QUESTION_STOP_WORDS.has(word), `dagsfrågan saknar ${word}`).toBe(true);
			expect(LOCAL_RETROSPECT_STOP_WORDS.has(word), `återblicken saknar ${word}`).toBe(true);
		}
	});

	it('innehåller inga dubbletter', () => {
		expect(new Set(SWEDISH_STOP_WORDS_CORE).size).toBe(SWEDISH_STOP_WORDS_CORE.length);
	});
});

describe('listorna har samma innehåll som före flytten', () => {
	// Storlekarna är de historiska. Ändras en lista ska det vara ett medvetet
	// beslut, och då faller det här testet först.
	it('spegelvattnet har kvar sina 95 ord', () => {
		expect(SPEGELVATTNET_STOP_WORDS.size).toBe(95);
		for (const word of ['av', 'på', 'jag', 'vecka', 'väl']) {
			expect(SPEGELVATTNET_STOP_WORDS.has(word), word).toBe(true);
		}
	});

	it('dagsfrågan har kvar sina 30 ord', () => {
		expect(DAILY_QUESTION_STOP_WORDS.size).toBe(30);
		for (const word of ['idag', 'känns', 'kände', 'känna', 'du', 'jag']) {
			expect(DAILY_QUESTION_STOP_WORDS.has(word), word).toBe(true);
		}
	});

	it('den lokala återblicken har den bredaste listan', () => {
		expect(LOCAL_RETROSPECT_STOP_WORDS.size).toBe(138);
		expect(LOCAL_RETROSPECT_STOP_WORDS.size).toBeGreaterThan(SPEGELVATTNET_STOP_WORDS.size);
	});

	it('täcker serverns ord för alla längder återblicken ens räknar', () => {
		// Återblicken filtrerar bort ord kortare än fyra tecken innan listan
		// används, så bara de längre orden behöver finnas med.
		const fromServers = [...SPEGELVATTNET_STOP_WORDS, ...DAILY_QUESTION_STOP_WORDS].filter(
			(word) => word.length >= 4
		);

		for (const word of fromServers) {
			expect(LOCAL_RETROSPECT_STOP_WORDS.has(word), `återblicken saknar ${word}`).toBe(true);
		}
	});
});

describe('ingen egen kopia ligger kvar', () => {
	const consumers = [
		'src/lib/server/spegelvattnet.ts',
		'src/lib/server/daily-question.ts',
		'src/lib/diary-local-retrospect.ts'
	];

	it('läser stopporden från den delade modulen', () => {
		for (const file of consumers) {
			const source = read(file);
			expect(source, file).toContain("from '$lib/swedish-stop-words'");
			// Ingen inlinelista med svenska stoppord kvar i konsumenterna.
			expect(source, file).not.toMatch(/STOP_WORDS\s*=\s*new Set\(\[\s*'/);
		}
	});

	// Kommentarerna nämner $lib/server, så koden granskas utan dem.
	const withoutComments = (source: string) =>
		source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|\s)\/\/[^\n]*/g, ' ');

	it('är browser-safe: den delade modulen importerar ingenting', () => {
		const code = withoutComments(read('src/lib/swedish-stop-words.ts'));
		expect(code).not.toMatch(/^import /m);
		expect(code).not.toContain('$lib/server');
		expect(code).not.toContain('$env');
	});

	it('importerar aldrig servermoduler i den lokala återblicken', () => {
		expect(withoutComments(read('src/lib/diary-local-retrospect.ts'))).not.toContain('$lib/server');
	});
});
