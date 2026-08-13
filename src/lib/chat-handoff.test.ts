import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	consumeHeroChatHandoff,
	HERO_CHAT_HANDOFF_STORAGE_KEY,
	storeHeroChatHandoff,
	type StorageLike
} from './chat-handoff';

class MemoryStorage implements StorageLike {
	readonly values = new Map<string, string>();

	getItem(key: string) {
		return this.values.get(key) ?? null;
	}

	setItem(key: string, value: string) {
		this.values.set(key, value);
	}

	removeItem(key: string) {
		this.values.delete(key);
	}
}

describe('hero → chatt-handoff', () => {
	it('lagrar inte tom eller blank text', () => {
		const storage = new MemoryStorage();

		expect(storeHeroChatHandoff('', storage)).toBe(false);
		expect(storeHeroChatHandoff('   ', storage)).toBe(false);
		expect(storage.values.has(HERO_CHAT_HANDOFF_STORAGE_KEY)).toBe(false);
	});

	it('trimmar text innan den lagras', () => {
		const storage = new MemoryStorage();

		expect(storeHeroChatHandoff('  En tanke  ', storage)).toBe(true);
		expect(storage.getItem(HERO_CHAT_HANDOFF_STORAGE_KEY)).toBe('En tanke');
	});

	it('konsumerar text exakt en gång och tar bort nyckeln', () => {
		const storage = new MemoryStorage();
		storeHeroChatHandoff('En tanke', storage);

		expect(consumeHeroChatHandoff(storage)).toBe('En tanke');
		expect(storage.getItem(HERO_CHAT_HANDOFF_STORAGE_KEY)).toBeNull();
		expect(consumeHeroChatHandoff(storage)).toBeNull();
	});

	it('fångar setItem-fel', () => {
		const storage: StorageLike = {
			getItem: () => null,
			setItem: () => {
				throw new Error('blocked');
			},
			removeItem: () => undefined
		};

		expect(storeHeroChatHandoff('En tanke', storage)).toBe(false);
	});

	it('fångar getItem-fel', () => {
		const storage: StorageLike = {
			getItem: () => {
				throw new Error('blocked');
			},
			setItem: () => undefined,
			removeItem: () => undefined
		};

		expect(consumeHeroChatHandoff(storage)).toBeNull();
	});

	it('fångar removeItem-fel utan att kasta eller förlora läst text', () => {
		const storage: StorageLike = {
			getItem: () => ' En tanke ',
			setItem: () => undefined,
			removeItem: () => {
				throw new Error('blocked');
			}
		};

		expect(consumeHeroChatHandoff(storage)).toBe('En tanke');
	});

	it('har inga förbjudna produktberoenden', () => {
		const source = readFileSync(new URL('./chat-handoff.ts', import.meta.url), 'utf8');

		expect(source).not.toMatch(/\$app|\$lib\/(?!chat-handoff)|supabase|fetch\(|track[A-Z]|analytics/i);
	});

	// Startsidan hade tidigare en hero-textarea som lämnade över texten till
	// chatten. Den ytan togs bort när / blev en platspositionering, så
	// överlämningen har numera bara en konsument: ChatWindow.
	it('konsumeras av ChatWindow', () => {
		const workspace = process.cwd();
		const chatSource = readFileSync(join(workspace, 'src/lib/components/ChatWindow.svelte'), 'utf8');

		expect(chatSource).toContain("from '$lib/chat-handoff'");
		expect(chatSource).toContain('consumeHeroChatHandoff()');
	});
});
