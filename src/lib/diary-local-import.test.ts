import { beforeEach, describe, expect, it } from 'vitest';
import { deleteLocalEntry, readLocalEntries, saveLocalEntry } from '$lib/diary-local-history';
import { buildLocalImportRequestBody, partitionLocalEntriesForImport } from '$lib/diary-local-import';

// Övergången från lokal historik till konto: användaren väljer själv vilka
// inlägg som sparas, och bara de som faktiskt importerades tas bort lokalt.

function fakeStorage() {
	const store = new Map<string, string>();
	return {
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value),
		removeItem: (key: string) => void store.delete(key)
	};
}

let storage: ReturnType<typeof fakeStorage>;

beforeEach(() => {
	storage = fakeStorage();
});

describe('partitionLocalEntriesForImport', () => {
	it('flera lokala inlägg kan väljas för import', () => {
		saveLocalEntry({ text: 'Första kvällen', now: 1_000 }, storage);
		saveLocalEntry({ text: 'Andra kvällen', now: 2_000 }, storage);
		saveLocalEntry({ text: 'Tredje kvällen', now: 3_000 }, storage);
		const entries = readLocalEntries(storage);
		const [first, second] = entries;

		const { toImport, toKeep } = partitionLocalEntriesForImport(
			entries,
			new Set([first.id, second.id])
		);

		expect(toImport.map((entry) => entry.text)).toEqual([first.text, second.text]);
		expect(toKeep).toHaveLength(1);
	});

	it('inget importeras utan aktivt val', () => {
		saveLocalEntry({ text: 'Ett inlägg', now: 1_000 }, storage);
		const entries = readLocalEntries(storage);

		const { toImport, toKeep } = partitionLocalEntriesForImport(entries, new Set());

		expect(toImport).toEqual([]);
		expect(toKeep).toEqual(entries);
	});

	it('lämnar avvalda inlägg helt orörda', () => {
		saveLocalEntry({ text: 'Ska sparas', now: 1_000 }, storage);
		saveLocalEntry({ text: 'Ska vara kvar', now: 2_000 }, storage);
		const entries = readLocalEntries(storage);
		const toSave = entries.find((entry) => entry.text === 'Ska sparas')!;

		const { toKeep } = partitionLocalEntriesForImport(entries, new Set([toSave.id]));

		expect(toKeep.map((entry) => entry.text)).toEqual(['Ska vara kvar']);
	});
});

describe('buildLocalImportRequestBody', () => {
	it('bär bara texten och det lokala id:t - inget humör, ingen tagg, ingen fråga ärvs', () => {
		saveLocalEntry({ text: 'Bara text', now: 1_000 }, storage);
		const [entry] = readLocalEntries(storage);

		expect(buildLocalImportRequestBody(entry)).toEqual({
			text: 'Bara text',
			local_import_id: entry.id
		});
	});
});

describe('lokal borttagning efter import', () => {
	it('endast de inlägg som faktiskt importerades raderas lokalt', () => {
		saveLocalEntry({ text: 'Importeras', now: 1_000 }, storage);
		saveLocalEntry({ text: 'Lämnas kvar', now: 2_000 }, storage);
		const entries = readLocalEntries(storage);
		const imported = entries.find((entry) => entry.text === 'Importeras')!;

		// Simulerar vad komponenten gör: radera bara det som lyckades sparas.
		deleteLocalEntry(imported.id, storage);

		const remaining = readLocalEntries(storage);
		expect(remaining).toHaveLength(1);
		expect(remaining[0].text).toBe('Lämnas kvar');
	});

	it('import kan köras om utan dubbletter - redan importerade inlägg finns inte kvar att välja', () => {
		saveLocalEntry({ text: 'Kväll ett', now: 1_000 }, storage);
		saveLocalEntry({ text: 'Kväll två', now: 2_000 }, storage);
		const firstRun = readLocalEntries(storage);
		// Nyast först - "Kväll två" ligger på index 0.
		const chosen = firstRun.find((entry) => entry.text === 'Kväll två')!;
		const selection = new Set([chosen.id]);

		const { toImport } = partitionLocalEntriesForImport(firstRun, selection);
		for (const entry of toImport) deleteLocalEntry(entry.id, storage);

		// Flödet körs om, t.ex. efter en sidladdning. Samma val ger nu inget
		// att importera, eftersom det redan importerade inlägget är borta.
		const secondRun = readLocalEntries(storage);
		const { toImport: secondImport } = partitionLocalEntriesForImport(secondRun, selection);

		expect(secondRun).toHaveLength(1);
		expect(secondRun[0].text).toBe('Kväll ett');
		expect(secondImport).toEqual([]);
	});

	it('rensad lokalhistorik lämnar inget att importera', () => {
		saveLocalEntry({ text: 'Ett inlägg', now: 1_000 }, storage);
		deleteLocalEntry(readLocalEntries(storage)[0].id, storage);

		expect(readLocalEntries(storage)).toEqual([]);
	});
});
