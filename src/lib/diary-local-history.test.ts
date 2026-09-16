import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
	CURRENT_LOCAL_ENTRY_KEY,
	LOCAL_ENTRIES_KEY,
	MAX_LOCAL_ENTRIES,
	clearAllLocalDiaryData,
	clearLocalEntries,
	deleteLocalEntry,
	localEntryPreview,
	migrateDraftIntoLocalEntries,
	readCurrentLocalEntryId,
	readLocalEntries,
	saveLocalEntry,
	writeCurrentLocalEntryId
} from '$lib/diary-local-history';
import { DIARY_DRAFT_KEY, DIARY_DRAFT_SAVED_AT_KEY, LEGACY_DIARY_DRAFT_KEY } from '$lib/diary-draft';

// Den anonyma historiken ska göra det möjligt att återkomma flera dagar utan
// konto. Allt ligger i webbläsaren: inget nätverk, ingen AI, inget konto.

function fakeStorage() {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value),
		removeItem: (key: string) => void store.delete(key),
		size: () => store.size,
		raw: store
	};
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
	storage = fakeStorage();
});

describe('flera lokala inlägg', () => {
	it('sparar flera inlägg och visar det senaste först', () => {
		saveLocalEntry({ text: 'Första kvällen', now: 1_000 }, storage);
		saveLocalEntry({ text: 'Andra kvällen', now: 2_000 }, storage);
		saveLocalEntry({ text: 'Tredje kvällen', now: 3_000 }, storage);

		const entries = readLocalEntries(storage);
		expect(entries).toHaveLength(3);
		expect(entries.map((entry) => entry.text)).toEqual([
			'Tredje kvällen',
			'Andra kvällen',
			'Första kvällen'
		]);
		expect(new Set(entries.map((entry) => entry.id)).size).toBe(3);
	});

	it('uppdaterar ett befintligt inlägg i stället för att skapa ett nytt', () => {
		const { entry: first } = saveLocalEntry({ text: 'Börjar skriva', now: 1_000 }, storage);
		const { entry: updated } = saveLocalEntry({ id: first?.id, text: 'Börjar skriva mer', now: 2_000 }, storage);

		expect(updated?.id).toBe(first?.id);
		expect(updated?.createdAt).toBe(1_000);
		expect(updated?.updatedAt).toBe(2_000);
		expect(readLocalEntries(storage)).toHaveLength(1);
		expect(readLocalEntries(storage)[0].text).toBe('Börjar skriva mer');
	});

	it('sparar inte tom text och tar bort ett tomrensat inlägg', () => {
		const { entry } = saveLocalEntry({ text: 'Något', now: 1_000 }, storage);
		expect(saveLocalEntry({ text: '   ', now: 2_000 }, storage).entry).toBeNull();
		expect(readLocalEntries(storage)).toHaveLength(1);

		saveLocalEntry({ id: entry?.id, text: '', now: 3_000 }, storage);
		expect(readLocalEntries(storage)).toHaveLength(0);
	});

	it('behåller de senaste inläggen när gränsen passeras', () => {
		for (let index = 0; index < MAX_LOCAL_ENTRIES + 5; index += 1) {
			saveLocalEntry({ text: `Inlägg ${index}`, now: 1_000 + index }, storage);
		}

		const entries = readLocalEntries(storage);
		expect(MAX_LOCAL_ENTRIES).toBeGreaterThanOrEqual(10);
		expect(MAX_LOCAL_ENTRIES).toBeLessThanOrEqual(14);
		expect(entries).toHaveLength(MAX_LOCAL_ENTRIES);
		expect(entries[0].text).toBe(`Inlägg ${MAX_LOCAL_ENTRIES + 4}`);
		expect(entries.some((entry) => entry.text === 'Inlägg 0')).toBe(false);
	});

	it('klarar trasig lagring utan att kasta', () => {
		storage.setItem(LOCAL_ENTRIES_KEY, '{inte json');
		expect(readLocalEntries(storage)).toEqual([]);

		storage.setItem(LOCAL_ENTRIES_KEY, JSON.stringify([{ id: 'x' }, null, 42]));
		expect(readLocalEntries(storage)).toEqual([]);
	});

	it('kommer ihåg vilket inlägg som är öppet', () => {
		const { entry } = saveLocalEntry({ text: 'Öppet', now: 1_000 }, storage);
		writeCurrentLocalEntryId(entry?.id ?? null, storage);
		expect(readCurrentLocalEntryId(storage)).toBe(entry?.id);

		writeCurrentLocalEntryId(null, storage);
		expect(readCurrentLocalEntryId(storage)).toBeNull();
	});
});

describe('migrering av det gamla enskilda utkastet', () => {
	it('lyfter in utkastet som ett inlägg och behåller tidpunkten', () => {
		storage.setItem(DIARY_DRAFT_KEY, 'Text från tiden före historiken');
		storage.setItem(DIARY_DRAFT_SAVED_AT_KEY, '1700000000000');

		const migrated = migrateDraftIntoLocalEntries(storage, 1800000000000);

		expect(migrated?.text).toBe('Text från tiden före historiken');
		expect(migrated?.createdAt).toBe(1700000000000);
		expect(readLocalEntries(storage)).toHaveLength(1);
		expect(readCurrentLocalEntryId(storage)).toBe(migrated?.id);
	});

	it('läser även den äldre nyckeln och JSON-formatet', () => {
		storage.setItem(LEGACY_DIARY_DRAFT_KEY, JSON.stringify({ content: 'Från chatten' }));
		expect(migrateDraftIntoLocalEntries(storage, 2_000)?.text).toBe('Från chatten');
	});

	it('rör aldrig utkastnyckeln, så registrering och inloggad dagbok behåller texten', () => {
		storage.setItem(DIARY_DRAFT_KEY, 'Kvar efter migrering');
		migrateDraftIntoLocalEntries(storage, 2_000);

		expect(storage.getItem(DIARY_DRAFT_KEY)).toBe('Kvar efter migrering');
	});

	it('skapar ingen dubblett om den körs igen eller om historik redan finns', () => {
		storage.setItem(DIARY_DRAFT_KEY, 'Bara en gång');
		migrateDraftIntoLocalEntries(storage, 2_000);
		migrateDraftIntoLocalEntries(storage, 3_000);

		expect(readLocalEntries(storage)).toHaveLength(1);
		expect(migrateDraftIntoLocalEntries(storage, 4_000)).toBeNull();
	});

	it('gör ingenting när det inte finns något utkast', () => {
		expect(migrateDraftIntoLocalEntries(storage, 1_000)).toBeNull();
		expect(readLocalEntries(storage)).toEqual([]);
	});
});

describe('lagringsfel sväljs inte', () => {
	function blockedStorage() {
		const store = new Map<string, string>();
		return {
			getItem: (key: string) => store.get(key) ?? null,
			setItem: () => {
				throw new DOMException('QuotaExceededError');
			},
			removeItem: (key: string) => void store.delete(key)
		};
	}

	it('rapporterar att inlägget inte kunde sparas', () => {
		const result = saveLocalEntry({ text: 'Får inte plats', now: 1_000 }, blockedStorage());

		expect(result.stored).toBe(false);
		// Texten finns kvar i minnet, så skrivandet kan fortsätta.
		expect(result.entry?.text).toBe('Får inte plats');
	});

	it('rapporterar att det gick bra när lagringen fungerar', () => {
		expect(saveLocalEntry({ text: 'Får plats', now: 1_000 }, storage).stored).toBe(true);
	});

	it('visar en icke-blockerande varning i skrivytan', () => {
		const guestEntry = readFileSync(
			join(process.cwd(), 'src/lib/components/GuestQuickEntry.svelte'),
			'utf8'
		);

		expect(guestEntry).toContain(
			'Det gick inte att spara lokalt. Texten finns kvar här, men kan försvinna om sidan stängs.'
		);
		expect(guestEntry).toContain('storageFailed = !draftStored || !saved.stored;');
		expect(guestEntry).toMatch(/\{#if storageFailed\}[\s\S]{0,120}role="status"/);
		// Varningen får inte vara en dialog eller blockera textytan.
		expect(guestEntry).not.toMatch(/window\.alert|role="alertdialog"|disabled=\{storageFailed\}/);
	});
});

describe('rensa', () => {
	it('tar bort ett enskilt inlägg', () => {
		const { entry: first } = saveLocalEntry({ text: 'Ett', now: 1_000 }, storage);
		saveLocalEntry({ text: 'Två', now: 2_000 }, storage);

		deleteLocalEntry(first?.id ?? '', storage);
		expect(readLocalEntries(storage).map((entry) => entry.text)).toEqual(['Två']);
	});

	it('rensar allt lokalt, inklusive den äldre nyckeln mittpsyke_temp_entry', () => {
		saveLocalEntry({ text: 'Ett inlägg', now: 1_000 }, storage);
		writeCurrentLocalEntryId('någon-id', storage);
		storage.setItem(DIARY_DRAFT_KEY, 'Aktuellt utkast');
		storage.setItem(LEGACY_DIARY_DRAFT_KEY, 'Gammal text från chatten');
		storage.setItem(DIARY_DRAFT_SAVED_AT_KEY, '1700000000000');

		clearAllLocalDiaryData(storage);

		expect(storage.raw.size).toBe(0);
		for (const key of [
			LOCAL_ENTRIES_KEY,
			CURRENT_LOCAL_ENTRY_KEY,
			DIARY_DRAFT_KEY,
			LEGACY_DIARY_DRAFT_KEY,
			DIARY_DRAFT_SAVED_AT_KEY
		]) {
			expect(storage.getItem(key), key).toBeNull();
		}
	});

	it('låter inte rensad text komma tillbaka vid nästa sidladdning', () => {
		storage.setItem(LEGACY_DIARY_DRAFT_KEY, 'Text som ska bort');
		migrateDraftIntoLocalEntries(storage, 1_000);
		expect(readLocalEntries(storage)).toHaveLength(1);

		clearAllLocalDiaryData(storage);

		// Sidladdning nummer två: migreringen körs igen mot samma lagring.
		expect(migrateDraftIntoLocalEntries(storage, 2_000)).toBeNull();
		expect(readLocalEntries(storage)).toEqual([]);
		expect(readCurrentLocalEntryId(storage)).toBeNull();

		// Och en tredje gång, för säkerhets skull.
		migrateDraftIntoLocalEntries(storage, 3_000);
		expect(readLocalEntries(storage)).toEqual([]);
	});

	it('rensar hela historiken och vilket inlägg som var öppet', () => {
		const { entry } = saveLocalEntry({ text: 'Allt detta', now: 1_000 }, storage);
		writeCurrentLocalEntryId(entry?.id ?? null, storage);

		clearLocalEntries(storage);

		expect(readLocalEntries(storage)).toEqual([]);
		expect(readCurrentLocalEntryId(storage)).toBeNull();
		expect(storage.raw.has(LOCAL_ENTRIES_KEY)).toBe(false);
		expect(storage.raw.has(CURRENT_LOCAL_ENTRY_KEY)).toBe(false);
	});
});

describe('inget lämnar webbläsaren', () => {
	const source = readFileSync(join(process.cwd(), 'src/lib/diary-local-history.ts'), 'utf8');

	it('gör inga nätverksanrop och anropar ingen AI', () => {
		expect(source).not.toMatch(/fetch\(|XMLHttpRequest|WebSocket|supabase|\/api\//);
		expect(source).not.toMatch(/openai|reflection|ai-/i);
	});

	it('sparar och läser utan att något fetch anropas', () => {
		const fetchSpy = vi.fn();
		vi.stubGlobal('fetch', fetchSpy);

		saveLocalEntry({ text: 'Ingen request', now: 1_000 }, storage);
		readLocalEntries(storage);
		clearLocalEntries(storage);

		expect(fetchSpy).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it('kortar förhandsvisningen utan att tappa innehållet i lagringen', () => {
		const long = 'a'.repeat(200);
		saveLocalEntry({ text: long, now: 1_000 }, storage);

		expect(localEntryPreview(long).length).toBeLessThan(long.length);
		expect(localEntryPreview(long).endsWith('…')).toBe(true);
		expect(readLocalEntries(storage)[0].text).toBe(long);
	});
});

describe('skrivytan och den inloggade dagboken', () => {
	const guestEntry = readFileSync(
		join(process.cwd(), 'src/lib/components/GuestQuickEntry.svelte'),
		'utf8'
	);
	const diaryCheckin = readFileSync(
		join(process.cwd(), 'src/routes/dagbok/checkin/+page.svelte'),
		'utf8'
	);
	const registerPage = readFileSync(join(process.cwd(), 'src/routes/register/+page.svelte'), 'utf8');

	it('visar historiken, ett nytt inlägg och en bekräftad rensning', () => {
		expect(guestEntry).toContain('Dina senaste inlägg på den här enheten');
		expect(guestEntry).toMatch(/onclick=\{startNewEntry\}\s*>\s*Nytt inlägg\s*<\/button>/);
		expect(guestEntry).toContain('onclick={() => (confirmClearAll = true)}');
		expect(guestEntry).toContain('Ja, rensa allt');
		expect(guestEntry).toContain('onclick={clearAllLocalEntries}');
		expect(guestEntry).toContain('onclick={() => openLocalEntry(item)}');
	});

	it('säger i copyn hur många inlägg som sparas, hämtat ur konstanten', () => {
		expect(guestEntry).toContain('De {MAX_LOCAL_ENTRIES} senaste sparas, äldre faller bort.');
		expect(guestEntry).toContain('MAX_LOCAL_ENTRIES');
		expect(MAX_LOCAL_ENTRIES).toBe(12);
	});

	it('rensar allt via den gemensamma funktionen, inte bara historiken', () => {
		expect(guestEntry).toContain('clearAllLocalDiaryData();');
		expect(guestEntry).not.toContain('clearLocalEntries();');
	});

	it('säger var inläggen finns och vem som kan läsa dem', () => {
		expect(guestEntry).toContain(
			'De här inläggen finns bara i den här webbläsaren. Den som har tillgång till enheten kan'
		);
		expect(guestEntry).toContain('också kunna läsa dem.');
	});

	it('migrerar det gamla utkastet när skrivytan öppnas', () => {
		expect(guestEntry).toContain('migrateDraftIntoLocalEntries();');
		expect(guestEntry).toMatch(/onMount\(\(\) => \{[\s\S]{0,400}?migrateDraftIntoLocalEntries\(\);/);
	});

	it('lämnar den inloggade dagboken och registreringen orörda', () => {
		// Ingen automatisk migrering till konto: texten fylls i och användaren
		// väljer själv att spara, precis som före den lokala historiken.
		expect(diaryCheckin).not.toContain('diary-local-history');
		expect(registerPage).not.toContain('diary-local-history');
		expect(registerPage).toContain('const storedDraft = readDiaryDraft();');
		expect(diaryCheckin).toContain('draftText = readDiaryDraft();');
	});
});
