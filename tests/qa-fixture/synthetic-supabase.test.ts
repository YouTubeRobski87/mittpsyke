import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	QA_ACCESS_TOKEN,
	QA_USER_IDS,
	buildSyntheticDataset,
	createMetadataStore,
	createSyntheticSupabase,
	resolveQaMode
} from '../../tmp/qa/synthetic-supabase.mjs';
import { createQaServerClient, readQaMode, runWithQaContext } from '../../tmp/qa/qa-server.mjs';

// Tester för den lokala QA-fixturen (tmp/kvallsstugan-qa.mjs). Fixturen är
// testinfrastruktur, inte produkt, men måste vara deterministisk och får aldrig
// nå en riktig Supabase.

const NOW = new Date('2026-10-07T10:00:00.000Z');
const root = process.cwd();

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('auth-mocken', () => {
	it('updateUser slår ihop data i user_metadata och syns vid nästa getUser', async () => {
		const store = createMetadataStore();
		const client = createSyntheticSupabase({ mode: 'thin', now: NOW, store });

		const result = await client.auth.updateUser({ data: { world_progress: { stage: 2 } } });
		expect(result.error).toBeNull();
		expect(result.data.user?.user_metadata.world_progress).toEqual({ stage: 2 });
		// Befintlig metadata (bl.a. det syntetiska samtycket) ligger kvar.
		expect(result.data.user?.user_metadata.health_data_processing_consent).toMatchObject({ accepted: true });

		const again = createSyntheticSupabase({ mode: 'thin', now: NOW, store });
		const { data } = await again.auth.getUser();
		expect(data.user?.user_metadata.world_progress).toEqual({ stage: 2 });
	});

	it('updateUser i ett läge påverkar inte ett annat läge', async () => {
		const store = createMetadataStore();
		await createSyntheticSupabase({ mode: 'rich', now: NOW, store }).auth.updateUser({ data: { marker: 'rich' } });
		const { data } = await createSyntheticSupabase({ mode: 'empty', now: NOW, store }).auth.getUser();
		expect(data.user?.user_metadata.marker).toBeUndefined();
	});

	it('refreshSession returnerar en session med samma form som Supabase', async () => {
		const store = createMetadataStore();
		const client = createSyntheticSupabase({ mode: 'empty', now: NOW, store });
		await client.auth.updateUser({ data: { display_name: 'QA-ändrad' } });

		const { data, error } = await client.auth.refreshSession();
		expect(error).toBeNull();
		expect(data.session).toMatchObject({ access_token: QA_ACCESS_TOKEN, token_type: 'bearer' });
		expect(data.session?.user.user_metadata.display_name).toBe('QA-ändrad');
		expect(data.user?.id).toBe(QA_USER_IDS.empty);
	});

	it('gästläget har ingen användare och ingen session', async () => {
		const client = createSyntheticSupabase({ mode: 'rich', now: NOW, guest: true, store: createMetadataStore() });
		expect((await client.auth.getUser()).data.user).toBeNull();
		expect((await client.auth.refreshSession()).error).not.toBeNull();
	});
});

describe('datalägen', () => {
	it('empty, thin och rich har tydligt olika mängd underlag', () => {
		const empty = buildSyntheticDataset('empty', NOW).tables;
		const thin = buildSyntheticDataset('thin', NOW).tables;
		const rich = buildSyntheticDataset('rich', NOW).tables;

		expect(empty.diary).toHaveLength(0);
		expect(empty.evening_checkins).toHaveLength(0);
		expect(empty.creative_moments).toHaveLength(0);

		expect(thin.diary.length).toBeGreaterThan(0);
		expect(thin.diary.length).toBeLessThan(10);
		expect(thin.evening_checkins.length).toBeLessThan(5);
		expect(thin.creative_moments).toHaveLength(1);

		expect(rich.diary.length).toBeGreaterThanOrEqual(40);
		expect(rich.evening_checkins.length).toBeGreaterThanOrEqual(15);
		expect(rich.creative_moments.length).toBeGreaterThan(1);
	});

	it('är deterministiska för samma datum', () => {
		for (const mode of ['empty', 'thin', 'rich'] as const) {
			expect(buildSyntheticDataset(mode, NOW)).toEqual(buildSyntheticDataset(mode, NOW));
		}
	});

	it('innehåller bara tydligt syntetisk text och inga rader i framtiden', () => {
		for (const mode of ['thin', 'rich'] as const) {
			const { tables, user } = buildSyntheticDataset(mode, NOW);
			expect(tables.diary.every((row) => String(row.text).startsWith('QA-exempel'))).toBe(true);
			expect(tables.diary.every((row) => row.user_id === user.id)).toBe(true);
			const timestamps = [...tables.diary.map((row) => String(row.created_at)), ...tables.creative_moments.map((row) => String(row.occurred_at))];
			expect(timestamps.every((iso) => new Date(iso).getTime() <= NOW.getTime())).toBe(true);
			expect(user.email.endsWith('.invalid')).toBe(true);
		}
	});

	it('ger varje läge en egen syntetisk användare (endpoints cachar per user_id)', () => {
		expect(new Set(Object.values(QA_USER_IDS)).size).toBe(3);
	});

	it('okänt läge faller tillbaka på empty', () => {
		expect(resolveQaMode('production')).toBe('empty');
		expect(resolveQaMode(undefined)).toBe('empty');
	});
});

describe('frågebyggaren', () => {
	it('stöder filtrering, sortering, limit och head-count som endpoints använder', async () => {
		const client = createSyntheticSupabase({ mode: 'rich', now: NOW, store: createMetadataStore() });
		const userId = QA_USER_IDS.rich;

		const head = await client.from('diary').select('id', { count: 'exact', head: true }).eq('user_id', userId);
		expect(head.data).toBeNull();
		expect(head.count).toBe(buildSyntheticDataset('rich', NOW).tables.diary.length);

		const latest = await client
			.from('diary')
			.select('created_at, mood')
			.eq('user_id', userId)
			.not('mood', 'is', null)
			.order('created_at', { ascending: false })
			.limit(3);
		expect(latest.data).toHaveLength(3);
		expect(Object.keys(latest.data?.[0] ?? {})).toEqual(['created_at', 'mood']);
		expect(String(latest.data?.[0].created_at) >= String(latest.data?.[1].created_at)).toBe(true);

		const otherUser = await client.from('diary').select('id').eq('user_id', QA_USER_IDS.thin);
		expect(otherUser.data).toEqual([]);
	});

	it('godtar skrivningar men ändrar inte läget', async () => {
		const client = createSyntheticSupabase({ mode: 'thin', now: NOW, store: createMetadataStore() });
		const before = (await client.from('diary').select('id')).data?.length;
		const inserted = await client.from('diary').insert({ text: 'QA' }).select('id').single();
		expect(inserted.error).toBeNull();
		const after = (await createSyntheticSupabase({ mode: 'thin', now: NOW }).from('diary').select('id')).data?.length;
		expect(after).toBe(before);
	});
});

describe('ingen kontakt med produktion', () => {
	it('gör inga nätverksanrop', async () => {
		const fetchSpy = vi.fn(() => {
			throw new Error('QA-fixturen får inte göra nätverksanrop');
		});
		vi.stubGlobal('fetch', fetchSpy);

		const client = createSyntheticSupabase({ mode: 'rich', now: NOW, store: createMetadataStore() });
		await client.auth.getUser();
		await client.auth.getSession();
		await client.auth.updateUser({ data: { x: 1 } });
		await client.auth.refreshSession();
		await client.from('diary').select('*').eq('user_id', QA_USER_IDS.rich);
		await client.rpc('record_companion_presence_week');

		expect(fetchSpy).not.toHaveBeenCalled();
	});

	it('den syntetiska klienten importerar ingenting och innehåller inga adresser', () => {
		const source = readFileSync(join(root, 'tmp/qa/synthetic-supabase.mjs'), 'utf8');
		expect(source).not.toMatch(/^\s*import\s/m);
		expect(source).not.toMatch(/fetch\(|XMLHttpRequest|https?:\/\//);
	});

	it('QA-servern tvingar alla Supabase-adresser till en domän som inte går att nå', () => {
		const fixture = readFileSync(join(root, 'tmp/kvallsstugan-qa.mjs'), 'utf8');
		for (const key of ['PUBLIC_SUPABASE_URL', 'SUPABASE_URL']) {
			expect(fixture).toMatch(new RegExp(`${key}: 'https://qa\\.invalid'`));
		}
		// createClient byts mot den syntetiska klienten i serverkod.
		expect(fixture).toContain('createQaServerClient as createClient');
	});
});

describe('val av läge per request', () => {
	it('query-param går före cookie, som går före standardläget', () => {
		const url = (query: string) => new URL(`http://127.0.0.1:5176/framsteg${query}`);
		expect(readQaMode(url('?qa-mode=rich'), 'thin', 'empty')).toBe('rich');
		expect(readQaMode(url(''), 'thin', 'empty')).toBe('thin');
		expect(readQaMode(url(''), undefined, 'rich')).toBe('rich');
		expect(readQaMode(url('?qa-mode=okänt'), undefined, undefined)).toBe('empty');
	});

	it('klienter som skapas inne i en request får requestens läge', async () => {
		await runWithQaContext({ mode: 'rich', guest: false }, async () => {
			const client = createQaServerClient();
			const { data } = await client.auth.getUser();
			expect(data.user?.id).toBe(QA_USER_IDS.rich);
		});
		await runWithQaContext({ mode: 'thin', guest: true }, async () => {
			const { data } = await createQaServerClient().auth.getUser();
			expect(data.user).toBeNull();
		});
	});
});
