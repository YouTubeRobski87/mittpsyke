// Tester för rensning av inloggade användares chatthistorik i webbläsaren.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clearAccountChatHistory, getChatHistoryStorageKey } from './chat-memory';

const USER_A = '11111111-1111-4111-8111-111111111111';
const USER_B = '22222222-2222-4222-8222-222222222222';

/** Enkel Storage-ersättare som beter sig som localStorage (index flyttas vid radering). */
class MemoryStorage {
	private map = new Map<string, string>();
	get length() {
		return this.map.size;
	}
	key(index: number) {
		return [...this.map.keys()][index] ?? null;
	}
	getItem(key: string) {
		return this.map.get(key) ?? null;
	}
	setItem(key: string, value: string) {
		this.map.set(key, value);
	}
	removeItem(key: string) {
		this.map.delete(key);
	}
	keys() {
		return [...this.map.keys()].sort();
	}
}

// Orelaterad lagring som aldrig får röras: gästdagbok, tillgänglighet, tema,
// samtycken och chattinställningar.
const UNRELATED = {
	mittpsyke_guest_entry: 'Min gästdagbok',
	mittpsyke_guest_entry_saved_at: '2026-11-26T10:00:00Z',
	'mittpsyke:accessibility': '{"fontScale":1.2}',
	'mittpsyke-theme': 'dark',
	'mittpsyke:last-chat-category': 'a',
	chat_auto_read: 'true',
	chat_history_angest: '[{"role":"user","content":"äldre gästnyckel"}]'
};

function seededStorage() {
	const storage = new MemoryStorage();
	for (const [key, value] of Object.entries(UNRELATED)) storage.setItem(key, value);
	for (const topic of ['angest', 'nedstamdhet', 'stress-oro', 'allmant'] as const) {
		storage.setItem(getChatHistoryStorageKey(topic, USER_A), '[{"role":"user","content":"A"}]');
	}
	storage.setItem(getChatHistoryStorageKey('angest', USER_B), '[{"role":"user","content":"B"}]');
	return storage;
}

function unrelatedIntact(storage: MemoryStorage) {
	for (const [key, value] of Object.entries(UNRELATED)) expect(storage.getItem(key), key).toBe(value);
}

describe('clearAccountChatHistory', () => {
	it('vanlig utloggning: tar bort alla kontons chatthistorik och inget annat', () => {
		const storage = seededStorage();
		const removed = clearAccountChatHistory(storage);

		expect(removed).toHaveLength(5);
		expect(storage.keys().filter((key) => key.startsWith('chat_history_') && key.includes('-4'))).toEqual([]);
		unrelatedIntact(storage);
	});

	it('kontobyte: tar bort det förra kontots historik men behåller den nya användarens', () => {
		const storage = seededStorage();
		clearAccountChatHistory(storage, USER_B);

		expect(storage.getItem(getChatHistoryStorageKey('angest', USER_B))).not.toBeNull();
		for (const topic of ['angest', 'nedstamdhet', 'stress-oro', 'allmant'] as const) {
			expect(storage.getItem(getChatHistoryStorageKey(topic, USER_A))).toBeNull();
		}
		unrelatedIntact(storage);
	});

	it('återinloggning med samma konto: den egna historiken ligger kvar', () => {
		const storage = seededStorage();
		clearAccountChatHistory(storage, USER_A);

		expect(storage.getItem(getChatHistoryStorageKey('allmant', USER_A))).not.toBeNull();
		expect(storage.getItem(getChatHistoryStorageKey('angest', USER_B))).toBeNull();
	});

	it('utgången session (ingen användare vid start): ingen kontohistorik får ligga kvar', () => {
		const storage = seededStorage();
		clearAccountChatHistory(storage, null);

		expect(storage.keys().some((key) => key.includes(USER_A) || key.includes(USER_B))).toBe(false);
		unrelatedIntact(storage);
	});

	it('flera flikar: en andra rensning är ofarlig och ger inga fel', () => {
		const storage = seededStorage();
		clearAccountChatHistory(storage);
		expect(clearAccountChatHistory(storage)).toEqual([]);
		unrelatedIntact(storage);
	});

	it('rör inte nycklar som bara liknar chatthistorik', () => {
		const storage = new MemoryStorage();
		storage.setItem('chat_history_okant_amne_x', 'behåll');
		storage.setItem('my_chat_history_angest_x', 'behåll');
		storage.setItem('chat_history_angest_', 'behåll');
		clearAccountChatHistory(storage);
		expect(storage.keys()).toHaveLength(3);
	});

	it('klarar saknad eller blockerad lagring utan att kasta fel', () => {
		expect(clearAccountChatHistory(null)).toEqual([]);
		const blocked = {
			get length(): number {
				throw new Error('SecurityError');
			},
			key: () => null,
			removeItem: () => undefined
		};
		expect(clearAccountChatHistory(blocked)).toEqual([]);
	});
});

describe('rensningen är inkopplad i flödena', () => {
	const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

	it('layouten rensar vid varje auth-ändring och vid utloggning', () => {
		const layout = read('../../routes/+layout.svelte');
		// syncUser körs vid start, inloggning, utloggning, kontobyte och i andra flikar
		expect(layout).toMatch(
			/async function syncUser\(sessionUser: User \| null\) \{[\s\S]{0,600}clearAccountChatHistory\(getLocalStorageSafely\(\), sessionUser\?\.id \?\? null\)/
		);
		expect(layout).toMatch(/auth\.signOut\(\);[\s\S]{0,300}clearAccountChatHistory\(getLocalStorageSafely\(\)\);[\s\S]{0,60}window\.location\.href = '\/login'/);
	});

	it('kontoraderingen rensar innan utloggningen', () => {
		const settings = read('../../routes/dashboard/installningar/+page.svelte');
		expect(settings).toMatch(/clearAccountChatHistory\(getLocalStorageSafely\(\)\);\s*await supabase\.auth\.signOut\(\);/);
	});

	it('chatten skriver inte tillbaka historik för ett konto som inte längre är inloggat', () => {
		const chat = read('../components/ChatWindow.svelte');
		expect(chat).toContain('if (persistenceUserId !== userId) return;');
		expect(chat).toContain('if (persistenceUserId === userId) writeLocalHistory(normalized, userId);');
	});

	it('gästdagbokens rensning anropas inte från utloggningen', () => {
		const layout = read('../../routes/+layout.svelte');
		expect(layout).not.toContain('clearAllLocalDiaryData');
	});
});
