// Testfixtur, inte produktkod. Ligger i __fixtures__ eftersom vitest bara
// samlar in src/**/*.test.ts - den här filen körs alltså aldrig som en svit.
//
// Modellerar public.user_ai_consents så som tabellen faktiskt ser ut i
// produktion efter migrationen 20260905130000:
//
//   - user_ai_consents_scope_check med exakt fem tillåtna värden
//   - user_ai_consents_status_check ('granted' | 'revoked')
//   - user_ai_consents_status_timestamps_check
//   - granted_at DEFAULT now() vid INSERT
//   - upsert med onConflict (user_id, scope) skriver bara angivna kolumner
//   - update utan träff är inte ett fel, den skriver bara ingenting
//
// Syftet är att kunna köra hela samtyckeslivscykeln utan att röra en riktig
// användare eller en riktig databas.

import type { SupabaseClient } from '@supabase/supabase-js';

/** Speglar user_ai_consents_scope_check i produktion. */
export const ALLOWED_CONSENT_SCOPES = [
	'diary_ai_reflection',
	'chat_ai_support',
	'diary_ai_weekly_summary',
	'diary_ai_daily_question',
	'diary_ai_storify'
] as const;

export type ConsentRow = {
	user_id: string;
	scope: string;
	status: string;
	policy_version: string;
	granted_at: string;
	revoked_at: string | null;
	updated_at: string;
};

function assertConstraints(row: ConsentRow): string | null {
	if (!(ALLOWED_CONSENT_SCOPES as readonly string[]).includes(row.scope)) {
		return 'violates check constraint "user_ai_consents_scope_check"';
	}
	if (row.status !== 'granted' && row.status !== 'revoked') {
		return 'violates check constraint "user_ai_consents_status_check"';
	}
	const timestampsOk =
		(row.status === 'granted' && row.revoked_at === null) ||
		(row.status === 'revoked' && row.revoked_at !== null);
	if (!timestampsOk) {
		return 'violates check constraint "user_ai_consents_status_timestamps_check"';
	}
	return null;
}

export function createFakeConsentDb(seed: ConsentRow[] = []) {
	const rows: ConsentRow[] = seed.map((row) => ({ ...row }));
	let failNextRead = false;
	let failNextWrite = false;

	function applyWrite(values: Partial<ConsentRow>, existing: ConsentRow | undefined) {
		if (!existing) {
			const inserted: ConsentRow = {
				user_id: String(values.user_id),
				scope: String(values.scope),
				status: String(values.status),
				policy_version: String(values.policy_version),
				granted_at: values.granted_at ?? new Date().toISOString(),
				revoked_at: values.revoked_at ?? null,
				updated_at: values.updated_at ?? new Date().toISOString()
			};
			const violation = assertConstraints(inserted);
			if (violation) return { error: { message: violation } };
			rows.push(inserted);
			return { error: null };
		}

		const updated: ConsentRow = { ...existing };
		for (const [key, value] of Object.entries(values)) {
			(updated as unknown as Record<string, unknown>)[key] = value;
		}
		const violation = assertConstraints(updated);
		if (violation) return { error: { message: violation } };
		Object.assign(existing, updated);
		return { error: null };
	}

	const client = {
		from(table: string) {
			if (table !== 'user_ai_consents') throw new Error(`Oväntad tabell: ${table}`);
			return {
				select() {
					const filters: Record<string, string> = {};
					const builder = {
						eq(column: string, value: string) {
							filters[column] = value;
							return builder;
						},
						async maybeSingle() {
							if (failNextRead) {
								failNextRead = false;
								return { data: null, error: { message: 'read failed' } };
							}
							const match = rows.find(
								(row) => row.user_id === filters.user_id && row.scope === filters.scope
							);
							return { data: match ? { ...match } : null, error: null };
						}
					};
					return builder;
				},
				async upsert(values: Partial<ConsentRow>, options?: { onConflict?: string }) {
					if (failNextWrite) {
						failNextWrite = false;
						return { error: { message: 'write failed' } };
					}
					if (options?.onConflict !== 'user_id,scope') {
						return { error: { message: 'oväntad onConflict' } };
					}
					const existing = rows.find(
						(row) => row.user_id === values.user_id && row.scope === values.scope
					);
					return applyWrite(values, existing);
				},
				update(values: Partial<ConsentRow>) {
					const filters: Record<string, string> = {};
					const builder = {
						eq(column: string, value: string) {
							filters[column] = value;
							return builder;
						},
						// Terminerar som en thenable, precis som postgrest-js.
						then(resolve: (value: { error: { message: string } | null }) => unknown) {
							if (failNextWrite) {
								failNextWrite = false;
								return resolve({ error: { message: 'write failed' } });
							}
							const existing = rows.find(
								(row) => row.user_id === filters.user_id && row.scope === filters.scope
							);
							// Noll träffar är inget fel i postgrest - ingenting skrivs.
							if (!existing) return resolve({ error: null });
							return resolve(applyWrite(values, existing));
						}
					};
					return builder;
				}
			};
		}
	} as unknown as SupabaseClient;

	return {
		client,
		rows,
		failRead: () => {
			failNextRead = true;
		},
		failWrite: () => {
			failNextWrite = true;
		},
		find: (userId: string, scope: string) =>
			rows.find((row) => row.user_id === userId && row.scope === scope) ?? null,
		snapshotExcept: (scope: string) =>
			JSON.stringify(
				rows
					.filter((row) => row.scope !== scope)
					.sort((a, b) => `${a.user_id}${a.scope}`.localeCompare(`${b.user_id}${b.scope}`))
			)
	};
}
