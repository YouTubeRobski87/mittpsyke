import { describe, expect, it } from 'vitest';
import { collectSearchContent } from './search-index';
import { normalizeForSearch, rankResults } from './search-ranking';

function item(overrides: Partial<Parameters<typeof rankResults>[1][number]> = {}) {
	return {
		contentType: 'article' as const,
		refId: 'test/artikel',
		title: 'Titel',
		url: 'https://www.mittpsyke.se/blogg/amne/test/artikel',
		chunkText: '',
		summary: '',
		keywords: '',
		body: '',
		...overrides
	};
}

describe('normalizeForSearch', () => {
	// Kravet: en användare utan svenskt tangentbord ska hitta samma sak.
	it('faller ihop svenska diakriter så sjalvkansla och självkänsla möts', () => {
		expect(normalizeForSearch('självkänsla')).toBe(normalizeForSearch('sjalvkansla'));
		expect(normalizeForSearch('ÖVNING')).toBe(normalizeForSearch('ovning'));
		expect(normalizeForSearch('Ångest')).toBe('angest');
	});

	it('är skiftlägesokänslig och normaliserar blanksteg', () => {
		expect(normalizeForSearch('  Jämför   MIG  ')).toBe('jamfor mig');
	});
});

describe('rankResults', () => {
	it('ger inga resultat för en tom fråga, så söksidan aldrig visar hela indexet', () => {
		expect(rankResults('', [item({ title: 'Vad som helst' })])).toEqual([]);
		expect(rankResults('   ', [item({ title: 'Vad som helst' })])).toEqual([]);
	});

	it('ger inga resultat när ingenting matchar', () => {
		expect(rankResults('kvantfysik', [item({ title: 'Självkänsla', summary: 'Om värde' })])).toEqual([]);
	});

	// Kravet: title ska väga högst.
	it('rankar en titelträff över en träff som bara finns i brödtexten', () => {
		const results = rankResults('jämförelse', [
			item({ refId: 'a', url: 'https://x/brodtext', title: 'Något annat', body: 'här nämns jämförelse i förbifarten' }),
			item({ refId: 'b', url: 'https://x/titel', title: 'Jämförelse med andra' })
		]);

		expect(results[0].url).toBe('https://x/titel');
		expect(results[0].score).toBeGreaterThan(results[1].score);
	});

	// Invarianten som håller "title väger högst" sann även i värsta fallet:
	// summary + keywords + body måste väga mindre än title ensamt.
	it('låter en ren titelträff slå summan av alla svagare fält i ett annat resultat', () => {
		const results = rankResults('ångest', [
			item({ refId: 'a', url: 'https://x/svag', title: 'Orolig', summary: 'ångest', keywords: 'ångest', body: 'ångest' }),
			item({ refId: 'b', url: 'https://x/stark', title: 'Ångest' })
		]);

		expect(results[0].url).toBe('https://x/stark');
	});

	// Kravet: inga duplicerade resultat för samma URL. En FAQ ärver sin guides URL.
	it('lämnar högst ett resultat per URL och låter guiden representera sin egen FAQ', () => {
		const url = 'https://www.mittpsyke.se/guider/sjalvkansla/inre-kritikern';
		const results = rankResults('inre kritiker', [
			item({ contentType: 'guide', refId: 'g', url, title: 'Den inre kritikern' }),
			item({ contentType: 'faq', refId: 'f1', url, title: 'Vad är en inre kritiker?' }),
			item({ contentType: 'faq', refId: 'f2', url, title: 'Hur tystar jag min inre kritiker?' })
		]);

		expect(results).toHaveLength(1);
		expect(results[0].contentType).toBe('guide');
		expect(results[0].url).toBe(url);
	});

	it('behåller en FAQ som eget resultat när ingen annan innehållstyp delar dess URL', () => {
		const results = rankResults('kostar det något', [
			item({ contentType: 'faq', refId: 'f', url: 'https://www.mittpsyke.se/premium', title: 'Kostar det något?' })
		]);

		expect(results).toHaveLength(1);
		expect(results[0].contentType).toBe('faq');
	});

	// Sammansättningen går ofta åt andra hållet: användaren skriver det längre
	// ordet och innehållet heter det kortare.
	it('matchar när sökordet är längre än innehållets ord, via prefix', () => {
		const results = rankResults('andningsövning', [
			item({ contentType: 'tool', title: '4-7-8 andning', summary: 'En enkel andningsteknik.' })
		]);

		expect(results).toHaveLength(1);
	});

	it('ger inte prefixträff på för korta ordstammar', () => {
		expect(rankResults('anda', [item({ title: 'Andningsteknik' })])).toEqual([]);
	});

	it('rankar exakt ordträff över partiell prefixträff', () => {
		const results = rankResults('andningsövning', [
			item({ refId: 'a', url: 'https://x/prefix', title: '4-7-8 andning' }),
			item({ refId: 'b', url: 'https://x/exakt', title: 'Andningsövning för kvällen' })
		]);

		expect(results[0].url).toBe('https://x/exakt');
	});

	it('matchar svenska sammansättningar via delsträng, så jämför träffar jämförelse', () => {
		const results = rankResults('jämför mig med andra', [
			item({ title: 'Varför andra verkar ha det bättre än de har', keywords: 'jämförelse sociala medier' })
		]);

		expect(results).toHaveLength(1);
	});
});

// Kraven gäller det riktiga innehållet, inte bara syntetiska poster.
describe('det verkliga sökindexet', () => {
	const content = collectSearchContent();

	it('innehåller övningar, som tidigare saknades helt', () => {
		const tools = content.filter((entry) => entry.contentType === 'tool');

		expect(tools.length).toBeGreaterThan(0);
		for (const tool of tools) {
			expect(tool.url).toMatch(/\/ovningar\/[a-z0-9-]+$/);
			expect(tool.title).not.toBe('');
		}
	});

	it('innehåller både artiklar och guider', () => {
		const types = new Set(content.map((entry) => entry.contentType));

		expect(types.has('article')).toBe(true);
		expect(types.has('guide')).toBe(true);
	});

	it('har titel och url på varje post, så varje resultat går att visa och klicka på', () => {
		const broken = content.filter((entry) => !entry.title.trim() || !entry.url.trim());

		expect(broken.map((entry) => `${entry.contentType}:${entry.refId}`)).toEqual([]);
	});

	// UX-exemplet i uppdraget: en fråga om ett problem ska ge både artikel och
	// guide/övning, inte bara den ena sorten.
	it('ger både en artikel och minst en guide eller övning för "jämför mig med andra"', () => {
		const results = rankResults('jämför mig med andra', content);
		const types = new Set(results.slice(0, 10).map((result) => result.contentType));

		expect(results.length).toBeGreaterThan(0);
		expect(types.has('article')).toBe(true);
		expect(types.has('guide') || types.has('tool')).toBe(true);
	});

	it('hittar samma innehåll skrivet utan svenska tecken', () => {
		const withDiacritics = rankResults('självkänsla', content);
		const without = rankResults('sjalvkansla', content);

		expect(withDiacritics.length).toBeGreaterThan(0);
		expect(without.map((r) => r.url)).toEqual(withDiacritics.map((r) => r.url));
	});

	it('lämnar aldrig två resultat med samma URL', () => {
		for (const query of ['självkänsla', 'ångest', 'sömn', 'jämförelse']) {
			const urls = rankResults(query, content).map((result) => result.url);

			expect(urls.length, `dubbletter för "${query}"`).toBe(new Set(urls).size);
		}
	});
});
