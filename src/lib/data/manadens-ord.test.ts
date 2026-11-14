import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	MONTHLY_WORDS,
	formatMonthLabel,
	getCurrentMonthlyWord,
	getStockholmMonthKey,
	type MonthlyWord
} from '$lib/data/manadens-ord';
import { getPublishedArticles } from '$lib/server/article-content';

// Månadens ord är redaktionellt innehåll i en fil. Testerna är det som står i
// stället för ett CMS: de stoppar en post som pekar på en artikel som inte
// finns, och en text som bryter mot de redaktionella reglerna.

const read = (path: string) => readFileSync(join(process.cwd(), path), 'utf8');

function entry(month: string, published = true): MonthlyWord {
	return {
		month,
		word: `Ord ${month}`,
		reflection: 'En kort text.',
		question: 'En fråga?',
		articlePath: '/blogg/amne/x/y',
		published
	};
}

describe('innehållet i varje post', () => {
	it('har en post per månad, i formatet ÅÅÅÅ-MM', () => {
		const months = MONTHLY_WORDS.map((item) => item.month);
		expect(new Set(months).size).toBe(months.length);
		for (const month of months) expect(month).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
	});

	it.each(MONTHLY_WORDS)('$word pekar på en publicerad artikel', (item) => {
		const urls = getPublishedArticles().map((article) => article.url);
		expect(urls).toContain(item.articlePath);
	});

	it.each(MONTHLY_WORDS)('$word har exakt en fråga och en kort reflektion', (item) => {
		expect(item.word.trim().length).toBeGreaterThan(0);
		expect(item.question.trim().endsWith('?')).toBe(true);
		expect(item.question.match(/\?/g)).toHaveLength(1);
		// Reflektionen frågar ingenting - frågan är en, och den står för sig.
		expect(item.reflection).not.toContain('?');
		expect(item.reflection.length).toBeLessThanOrEqual(320);
	});

	it.each(MONTHLY_WORDS)('$word håller sig till de redaktionella reglerna', (item) => {
		const text = `${item.word} ${item.reflection} ${item.question}`.toLocaleLowerCase('sv-SE');
		// Inga diagnoser eller behandlingslöften, ingen press och inga
		// påståenden om hur läsaren mår.
		const forbidden = [
			/diagnos/,
			/behandl/,
			/\bbota/,
			/\bdu (måste|borde|ska|behöver)\b/,
			/\bdu (känner|mår) /,
			/glöm inte/,
			/kom ihåg att/,
			/varje dag/,
			/missa(t|de)?\b/
		];
		for (const pattern of forbidden) expect(text, String(pattern)).not.toMatch(pattern);
	});
});

describe('vilket ord som visas', () => {
	it('räknar månaden i svensk tid', () => {
		// 23:30 UTC den 31 oktober är redan november i Stockholm.
		expect(getStockholmMonthKey(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11');
		expect(getStockholmMonthKey(new Date('2026-10-31T21:30:00Z'))).toBe('2026-10');
	});

	it('visar innevarande månads post', () => {
		const words = [entry('2026-10'), entry('2026-11'), entry('2026-12')];
		expect(getCurrentMonthlyWord(new Date('2026-11-13T12:00:00Z'), words)?.month).toBe('2026-11');
	});

	it('visar aldrig en opublicerad post, även om månaden har börjat', () => {
		const words = [entry('2026-11'), entry('2026-12', false)];
		expect(getCurrentMonthlyWord(new Date('2026-12-05T12:00:00Z'), words)?.month).toBe('2026-11');
	});

	it('visar aldrig en kommande månad i förväg', () => {
		const words = [entry('2026-11'), entry('2026-12')];
		expect(getCurrentMonthlyWord(new Date('2026-11-30T12:00:00Z'), words)?.month).toBe('2026-11');
	});

	it('ger null när ingenting är publicerat', () => {
		expect(getCurrentMonthlyWord(new Date('2026-11-13T12:00:00Z'), [entry('2026-11', false)])).toBeNull();
	});

	it('har ett publicerat ord för lanseringsmånaden', () => {
		expect(getCurrentMonthlyWord(new Date('2026-11-13T12:00:00Z'))?.word).toBe('Återhämtning');
	});

	it('byter till de godkända orden när deras månad börjar, inte tidigare', () => {
		expect(getCurrentMonthlyWord(new Date('2026-11-30T20:00:00Z'))?.word).toBe('Återhämtning');
		expect(getCurrentMonthlyWord(new Date('2026-12-01T08:00:00Z'))?.word).toBe('Gränser');
		expect(getCurrentMonthlyWord(new Date('2027-01-01T08:00:00Z'))?.word).toBe('Tålamod');
		// Efter januari finns inget nytt ord än: det senaste ligger kvar.
		expect(getCurrentMonthlyWord(new Date('2027-02-10T08:00:00Z'))?.word).toBe('Tålamod');
	});

	it('skriver månaden på svenska', () => {
		expect(formatMonthLabel('2026-11')).toBe('november 2026');
		expect(formatMonthLabel('2027-01')).toBe('januari 2027');
	});
});

describe('sidan och vägen till dagboken', () => {
	const route = read('src/routes/manadens-ord/+page.svelte');
	const server = read('src/routes/manadens-ord/+page.server.ts');
	const guestEntry = read('src/lib/components/GuestQuickEntry.svelte');

	it('går att hitta från sidfoten på alla sidor', () => {
		expect(read('src/routes/+layout.svelte')).toContain(
			'<a href="/manadens-ord" class="footer-link">Månadens ord</a>'
		);
	});

	it('lämnar över frågan via sessionStorage, aldrig i URL:en', () => {
		expect(route).toContain('writeDiaryPromptHandoff(data.entry.question)');
		expect(route).toContain("'/dagbok?action=new'");
		expect(route).not.toMatch(/[?&](prompt|fraga|question)=/);
	});

	it('lämnar inte över frågan till inloggad som har ett utkast kvar', () => {
		expect(route).toContain('if (isSignedIn && readDiaryDraft().trim().length > 0) return;');
	});

	it('läser inloggningen från det fält rotlayouten faktiskt lämnar', () => {
		// Sidan läste först `page.data.session`, som inte finns. Alla behandlades
		// då som utloggade: fel länk, fel text och ingen utkastkontroll.
		const layoutServer = read('src/routes/+layout.server.ts');
		expect(layoutServer).toContain('authenticatedUser:');
		expect(route).toContain('Boolean(page.data.authenticatedUser)');
		expect(route).not.toContain('page.data.session');
	});

	it('kräver varken konto, spårning eller AI', () => {
		for (const source of [route, server]) {
			expect(source).not.toMatch(/\$lib\/analytics|track[A-Z]\w+\(/);
			expect(source).not.toMatch(/\/api\/|fetch\(|supabase/i);
		}
	});

	it('visar frågan i gästdagboken som en egen rad som går att dölja', () => {
		expect(guestEntry).toContain('promptQuestion = consumeDiaryPromptHandoff();');
		expect(guestEntry).toContain('Dölj frågan');
		// Frågan får aldrig hamna i textfältet, där den kunde skriva över ett
		// utkast eller sparas som användarens egna ord.
		expect(guestEntry).not.toMatch(/entry\s*=\s*promptQuestion/);
		expect(guestEntry).not.toMatch(/applyStarter\(promptQuestion/);
	});
});
