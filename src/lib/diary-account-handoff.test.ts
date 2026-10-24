import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isRedirect } from '@sveltejs/kit';
import { actions as registerActions } from '../routes/register/+page.server';
import { GET as oauthCallback } from '../routes/auth/callback/+server';
import { CREATE_ACCOUNT_FROM_DIARY_HREF, DIARY_AFTER_SIGNUP_PATH } from '$lib/diary-account-handoff';
import {
	CURRENT_LOCAL_ENTRY_KEY,
	confirmLocalEntryImported,
	migrateDraftIntoLocalEntries,
	readLocalEntries,
	saveLocalEntry,
	writeCurrentLocalEntryId,
	type LocalDiaryEntry
} from '$lib/diary-local-history';
import { DIARY_DRAFT_KEY, LEGACY_DIARY_DRAFT_KEY } from '$lib/diary-draft';
import { describeLocalImportOutcome, importLocalEntries } from '$lib/diary-local-import';
import type { CreateDiaryRequestBody } from '$lib/types';

// Förslag 5 i värdegranskningen: gästen som skapar konto från Dagbokens
// skrivyta ska komma tillbaka till Dagboken, kunna spara sina lokala inlägg
// med ett aktivt val, och aldrig förlora en lokal anteckning på vägen.

const workspace = process.cwd();
const read = (path: string) => readFileSync(join(workspace, path), 'utf8');

function fakeStorage() {
	const store = new Map<string, string>();
	return {
		store,
		getItem: (key: string) => store.get(key) ?? null,
		setItem: (key: string, value: string) => void store.set(key, value),
		removeItem: (key: string) => void store.delete(key)
	};
}

/** Fångar SvelteKits redirect och returnerar destinationen. */
async function redirectLocation(run: () => unknown): Promise<string> {
	try {
		await run();
	} catch (error) {
		if (isRedirect(error)) return error.location;
		throw error;
	}
	throw new Error('Ingen redirect');
}

describe('redirect tillbaka till Dagboken', () => {
	it('kontoerbjudandet pekar på registreringen med Dagboken som mål', () => {
		expect(DIARY_AFTER_SIGNUP_PATH).toBe('/dagbok/checkin');
		expect(CREATE_ACCOUNT_FROM_DIARY_HREF).toBe('/register?redirect=%2Fdagbok%2Fcheckin');
		const guest = read('src/lib/components/GuestQuickEntry.svelte');
		expect(guest).toContain('href={CREATE_ACCOUNT_FROM_DIARY_HREF}');
	});

	it('vanlig registrering landar i Dagboken', async () => {
		const location = await redirectLocation(() =>
			registerActions.default({
				request: new Request('http://localhost/register', {
					method: 'POST',
					body: new URLSearchParams({ email: 'test@example.com', password: 'safe-password' })
				}),
				url: new URL(`http://localhost${CREATE_ACCOUNT_FROM_DIARY_HREF}`),
				locals: {
					supabase: {
						auth: {
							signUp: vi.fn().mockResolvedValue({
								data: { user: { identities: [{ provider: 'email' }] } },
								error: null
							}),
							signInWithPassword: vi.fn().mockResolvedValue({ error: null })
						}
					}
				},
				cookies: { set: vi.fn() }
			} as unknown as Parameters<typeof registerActions.default>[0])
		);
		expect(location).toBe('/dagbok/checkin');
	});
});

describe('Google-inloggning följer samma säkra redirect', () => {
	it('registreringssidan skickar med samma validerade ?redirect= till Google', () => {
		const register = read('src/routes/register/+page.svelte');
		expect(register).toContain(
			"getStableOAuthCallbackUrl(\n\t\t\t\t\tsafeInternalRedirect(page.url.searchParams.get('redirect'))\n\t\t\t\t)"
		);
		expect(register).not.toContain("getStableOAuthCallbackUrl('/dashboard/kvallsstugan')");
	});

	function callbackEvent(next: string) {
		const params = new URLSearchParams({ code: 'kod', next });
		return {
			url: new URL(`http://localhost/auth/callback?${params.toString()}`),
			locals: {
				supabase: { auth: { exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }) } }
			}
		} as unknown as Parameters<typeof oauthCallback>[0];
	}

	it('callbacken landar i Dagboken, precis som registreringen', async () => {
		expect(await redirectLocation(() => oauthCallback(callbackEvent('/dagbok/checkin')))).toBe(
			'/dagbok/checkin'
		);
	});

	it('callbacken avvisar externa mål med samma regler som inloggningen', async () => {
		for (const next of ['https://evil.example', '//evil.example', '/\\evil.example']) {
			expect(await redirectLocation(() => oauthCallback(callbackEvent(next)))).toBe(
				'/dashboard/kvallsstugan'
			);
		}
	});

	it('Dagboken visar importrutan oavsett hur kontot skapades', () => {
		const diary = read('src/routes/dagbok/checkin/+page.svelte');
		expect(diary).toContain('<LocalEntriesImportPrompt onImported={handleLocalEntriesImported} />');
		expect(diary).toContain('{#if sessionUser && !sessionUser.is_anonymous}');
		// Rutan har sitt eget samtycke och en aktiv knapp, inget sparas automatiskt.
		const prompt = read('src/lib/components/LocalEntriesImportPrompt.svelte');
		expect(prompt).toContain('{#if !hasConsent}');
		expect(prompt).toContain('onclick={importSelected}');
	});
});

describe('lokala anteckningar försvinner aldrig', () => {
	let storage: ReturnType<typeof fakeStorage>;
	let first: LocalDiaryEntry;
	let second: LocalDiaryEntry;

	beforeEach(() => {
		storage = fakeStorage();
		first = saveLocalEntry({ text: 'Första kvällen', now: 1_000 }, storage).entry!;
		second = saveLocalEntry({ text: 'Andra kvällen', now: 2_000 }, storage).entry!;
	});

	const confirm = (entry: LocalDiaryEntry) => confirmLocalEntryImported(entry, storage);

	it('klicket på kontoerbjudandet sparar lokalt direkt, så en avbruten registrering inte tappar text', () => {
		const guest = read('src/lib/components/GuestQuickEntry.svelte');
		expect(guest).toMatch(/function saveAndCreateAccount\(\) \{\s*(?:\/\/[^\n]*\n\s*)*persistIfDirty\(\);/);
		// Registreringen själv rör inte den lokala historiken eller utkastet.
		const registerAction = read('src/routes/register/+page.server.ts');
		expect(registerAction).not.toMatch(/diary-local-history|clearDiaryDraft|localStorage/);
	});

	it('överlever en omladdning: allt ligger kvar i lagringen tills importen bekräftats', () => {
		expect(readLocalEntries(storage).map((entry) => entry.text)).toEqual([
			'Andra kvällen',
			'Första kvällen'
		]);
	});

	it('ett avvisat svar lämnar inlägget orört', async () => {
		const outcome = await importLocalEntries([first], async () => false, confirm);
		expect(outcome.failed).toEqual([first]);
		expect(readLocalEntries(storage).map((entry) => entry.id)).toContain(first.id);
	});

	it('ett nätverksfel lämnar inlägget orört och stoppar inte resten', async () => {
		const outcome = await importLocalEntries(
			[first, second],
			async (body) => {
				if (body.local_import_id === first.id) throw new Error('offline');
				return true;
			},
			confirm
		);
		expect(outcome.imported).toEqual([second]);
		expect(outcome.failed).toEqual([first]);
		expect(readLocalEntries(storage).map((entry) => entry.id)).toEqual([first.id]);
		expect(describeLocalImportOutcome(outcome)).toBe(
			'1 inlägg sparat till ditt konto. 1 inlägg kunde inte sparas och ligger kvar på den här enheten. Försök igen.'
		);
	});

	it('rensar ett inlägg lokalt först när servern bekräftat det', async () => {
		const order: string[] = [];
		await importLocalEntries(
			[first],
			async () => {
				order.push('svar');
				expect(readLocalEntries(storage).map((entry) => entry.id)).toContain(first.id);
				return true;
			},
			(entry) => {
				order.push('bekräftat');
				confirm(entry);
			}
		);
		expect(order).toEqual(['svar', 'bekräftat']);
		expect(readLocalEntries(storage).map((entry) => entry.id)).not.toContain(first.id);
	});
});

describe('återförsök skapar inga dubbletter', () => {
	/** En server som, likt /api/diary/create, känner igen local_import_id. */
	function dedupingServer() {
		const rows = new Map<string, string>();
		return {
			rows,
			save(body: CreateDiaryRequestBody) {
				const key = body.local_import_id ?? crypto.randomUUID();
				if (!rows.has(key)) rows.set(key, body.text);
			}
		};
	}

	it('ett svar som tappas efter att servern sparat ger en rad vid nästa försök', async () => {
		const storage = fakeStorage();
		const entry = saveLocalEntry({ text: 'Kvällen före', now: 1_000 }, storage).entry!;
		const server = dedupingServer();
		const confirm = (item: LocalDiaryEntry) => confirmLocalEntryImported(item, storage);

		// Första försöket: servern sparar, men svaret når aldrig klienten.
		await importLocalEntries(
			[entry],
			async (body) => {
				server.save(body);
				throw new Error('anslutningen bröts');
			},
			confirm
		);
		expect(readLocalEntries(storage)).toHaveLength(1);

		// Återförsök med samma lokala inlägg.
		const retry = await importLocalEntries(
			readLocalEntries(storage),
			async (body) => {
				server.save(body);
				return true;
			},
			confirm
		);
		expect(retry.imported).toHaveLength(1);
		expect(server.rows.size).toBe(1);
		expect(readLocalEntries(storage)).toHaveLength(0);
	});

	it('ett utkast med samma text kan inte lyftas in igen som ett nytt inlägg efter importen', () => {
		const storage = fakeStorage();
		const entry = saveLocalEntry({ text: 'Samma text', now: 1_000 }, storage).entry!;
		writeCurrentLocalEntryId(entry.id, storage);
		storage.setItem(DIARY_DRAFT_KEY, 'Samma text');
		storage.setItem(LEGACY_DIARY_DRAFT_KEY, 'Samma text');

		confirmLocalEntryImported(entry, storage);

		expect(storage.getItem(DIARY_DRAFT_KEY)).toBeNull();
		expect(storage.getItem(LEGACY_DIARY_DRAFT_KEY)).toBeNull();
		expect(storage.getItem(CURRENT_LOCAL_ENTRY_KEY)).toBeNull();
		// Utan kvarvarande utkast skapar migreringen inget nytt inlägg med nytt id.
		expect(migrateDraftIntoLocalEntries(storage, 5_000)).toBeNull();
		expect(readLocalEntries(storage)).toHaveLength(0);
	});

	it('ett utkast med annan text rörs inte', () => {
		const storage = fakeStorage();
		const entry = saveLocalEntry({ text: 'Importerad text', now: 1_000 }, storage).entry!;
		storage.setItem(DIARY_DRAFT_KEY, 'Något nytt jag skriver');

		confirmLocalEntryImported(entry, storage);

		expect(storage.getItem(DIARY_DRAFT_KEY)).toBe('Något nytt jag skriver');
	});

	it('Dagbokens skrivfält töms om det bär den text som just importerades', () => {
		const diary = read('src/routes/dagbok/checkin/+page.svelte');
		expect(diary).toContain('if (importedTexts.has(draftText.trim())) draftText = \'\';');
	});
});
