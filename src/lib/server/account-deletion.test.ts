import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';

vi.mock('$env/dynamic/private', () => ({ env: {} }));
vi.mock('$env/dynamic/public', () => ({ env: {} }));

const { deleteAccountContent, ACCOUNT_STORAGE_BUCKETS, FORUM_TABLES } = await import('./account-deletion');

type Call = { kind: string; target: string; detail?: unknown };
type FileEntry = { id: string | null; name: string };

function fakeClient(options: {
	files?: Record<string, FileEntry[]>;
	failOn?: string;
	missingJournalTable?: boolean;
}) {
	const calls: Call[] = [];
	const fail = (target: string) => (options.failOn === target ? { message: `fel i ${target}` } : null);

	const client = {
		storage: {
			from(bucket: string) {
				return {
					async list(prefix: string, { offset }: { limit: number; offset: number }) {
						calls.push({ kind: 'list', target: bucket, detail: prefix });
						const all = options.files?.[bucket] ?? [];
						return { data: offset === 0 ? all : [], error: fail(`list:${bucket}`) };
					},
					async remove(paths: string[]) {
						calls.push({ kind: 'remove', target: bucket, detail: paths });
						return { data: null, error: fail(`remove:${bucket}`) };
					}
				};
			}
		},
		from(table: string) {
			return {
				delete() {
					return {
						async eq(column: string, value: string) {
							calls.push({ kind: 'delete', target: table, detail: { column, value } });
							if (table === 'journal_entries' && options.missingJournalTable) {
								return { error: { code: '42P01', message: 'relation does not exist' } };
							}
							return { error: fail(`delete:${table}`) };
						}
					};
				}
			};
		}
	};

	return { client: client as unknown as SupabaseClient, calls };
}

const USER = '11111111-2222-4333-8444-555555555555';

describe('deleteAccountContent', () => {
	it('raderar sparade chattar, som annars blev kvar efter kontoradering', async () => {
		const { client, calls } = fakeClient({});
		await deleteAccountContent(client, USER);

		expect(calls).toContainEqual({
			kind: 'delete',
			target: 'conversations',
			detail: { column: 'user_id', value: USER }
		});
	});

	it('raderar dagbokens bilder och videor, bara under användarens egen mapp', async () => {
		const { client, calls } = fakeClient({
			files: {
				'diary-images': [
					{ id: 'a', name: '1700000000-bild.jpg' },
					{ id: null, name: 'undermapp' }
				],
				'diary-videos': [{ id: 'b', name: 'klipp.webm' }]
			}
		});
		await deleteAccountContent(client, USER);

		expect(ACCOUNT_STORAGE_BUCKETS).toEqual(['diary-images', 'diary-videos']);
		for (const bucket of ACCOUNT_STORAGE_BUCKETS) {
			expect(calls).toContainEqual({ kind: 'list', target: bucket, detail: USER });
		}
		expect(calls).toContainEqual({
			kind: 'remove',
			target: 'diary-images',
			detail: [`${USER}/1700000000-bild.jpg`]
		});
		expect(calls).toContainEqual({ kind: 'remove', target: 'diary-videos', detail: [`${USER}/klipp.webm`] });
		for (const call of calls.filter((c) => c.kind === 'remove')) {
			for (const path of call.detail as string[]) expect(path.startsWith(`${USER}/`)).toBe(true);
		}
	});

	it('raderar egna foruminlägg, svar före trådar, som annars blev kvar utan ägare', async () => {
		const { client, calls } = fakeClient({});
		await deleteAccountContent(client, USER);

		expect(FORUM_TABLES).toEqual(['forum_replies', 'forum_threads']);
		const deletes = calls.filter((call) => call.kind === 'delete').map((call) => call.target);
		expect(deletes.indexOf('forum_replies')).toBeGreaterThan(-1);
		expect(deletes.indexOf('forum_threads')).toBeGreaterThan(deletes.indexOf('forum_replies'));
		for (const table of FORUM_TABLES) {
			expect(calls).toContainEqual({ kind: 'delete', target: table, detail: { column: 'user_id', value: USER } });
		}
	});

	it('stoppar raderingen om forumdata inte kan tas bort', async () => {
		const { client } = fakeClient({ failOn: 'delete:forum_threads' });
		await expect(deleteAccountContent(client, USER)).rejects.toThrow(/forum/);
	});

	it('tar bort äldre dagboksinlägg, men tål att den äldre tabellen saknas', async () => {
		const withTable = fakeClient({});
		await deleteAccountContent(withTable.client, USER);
		expect(withTable.calls).toContainEqual({
			kind: 'delete',
			target: 'journal_entries',
			detail: { column: 'user_id', value: USER }
		});

		const withoutTable = fakeClient({ missingJournalTable: true });
		await expect(deleteAccountContent(withoutTable.client, USER)).resolves.toBeUndefined();
	});

	it('kastar vid fel, så att kontot inte raderas med innehållet kvar', async () => {
		for (const failOn of ['delete:conversations', 'remove:diary-images', 'list:diary-videos']) {
			const { client } = fakeClient({ failOn, files: { 'diary-images': [{ id: 'a', name: 'x.jpg' }] } });
			await expect(deleteAccountContent(client, USER)).rejects.toThrow();
		}
		await expect(deleteAccountContent(fakeClient({}).client, '  ')).rejects.toThrow();
	});

	it('endpointen raderar innehållet före auth-användaren och avbryter vid fel', () => {
		const endpoint = readFileSync(new URL('../../routes/api/account/delete/+server.ts', import.meta.url), 'utf8');
		const content = endpoint.indexOf('await deleteAccountContent(serviceClient, user.id)');
		const authUser = endpoint.indexOf('serviceClient.auth.admin.deleteUser(user.id)');
		expect(content).toBeGreaterThan(-1);
		expect(authUser).toBeGreaterThan(content);
		expect(endpoint.slice(content, authUser)).toMatch(/catch[\s\S]*?return errorResponse\(/);
	});
});
