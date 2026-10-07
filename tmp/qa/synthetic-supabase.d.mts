// Typer för den syntetiska QA-klienten (tmp/qa/synthetic-supabase.mjs).
// Avsiktligt lösa: formen följer Supabase så långt fixturen behöver.

export type QaMode = 'empty' | 'thin' | 'rich';
export type QaRow = Record<string, unknown>;

export declare const QA_MODES: readonly QaMode[];
export declare const DEFAULT_QA_MODE: QaMode;
export declare const QA_USER_ID: string;
export declare const QA_USER_IDS: Record<QaMode, string>;
export declare const QA_ACCESS_TOKEN: string;

export interface QaUser {
	id: string;
	email: string;
	created_at: string;
	is_anonymous: boolean;
	user_metadata: Record<string, unknown>;
	[key: string]: unknown;
}

export interface QaSession {
	access_token: string;
	refresh_token: string;
	token_type: string;
	expires_in: number;
	expires_at: number;
	user: QaUser;
}

export interface QaDataset {
	mode: QaMode;
	user: QaUser;
	tables: Record<string, QaRow[]>;
}

export interface QaResult<T> {
	data: T;
	error: { code?: string; message: string } | null;
	count?: number | null;
}

export interface QaQuery extends PromiseLike<QaResult<QaRow[] | null>> {
	select(columns?: string, options?: { count?: 'exact'; head?: boolean }): QaQuery;
	insert(payload: unknown): QaQuery;
	upsert(payload: unknown): QaQuery;
	update(payload: unknown): QaQuery;
	delete(): QaQuery;
	eq(column: string, value: unknown): QaQuery;
	neq(column: string, value: unknown): QaQuery;
	gt(column: string, value: unknown): QaQuery;
	gte(column: string, value: unknown): QaQuery;
	lt(column: string, value: unknown): QaQuery;
	lte(column: string, value: unknown): QaQuery;
	in(column: string, values: unknown[]): QaQuery;
	is(column: string, value: unknown): QaQuery;
	not(column: string, operator: string, value: unknown): QaQuery;
	order(column: string, options?: { ascending?: boolean }): QaQuery;
	limit(count: number): QaQuery;
	range(from: number, to: number): QaQuery;
	single(): Promise<QaResult<QaRow | null>>;
	maybeSingle(): Promise<QaResult<QaRow | null>>;
}

export interface QaMetadataStore {
	get(mode: QaMode, fallback: Record<string, unknown>): Record<string, unknown>;
	set(mode: QaMode, metadata: Record<string, unknown>): void;
	reset(): void;
}

export interface QaClient {
	mode: QaMode;
	auth: {
		getUser(): Promise<QaResult<{ user: QaUser | null }>>;
		getSession(): Promise<QaResult<{ session: QaSession | null }>>;
		onAuthStateChange(): { data: { subscription: { unsubscribe(): void } } };
		signOut(): Promise<{ error: null }>;
		updateUser(attributes?: { data?: Record<string, unknown> }): Promise<QaResult<{ user: QaUser | null }>>;
		refreshSession(): Promise<QaResult<{ session: QaSession | null; user: QaUser | null }>>;
	};
	from(table: string): QaQuery;
	rpc(name: string): Promise<QaResult<unknown>>;
}

export declare function resolveQaMode(value: unknown): QaMode;
export declare function buildSyntheticDataset(mode: unknown, now?: Date): QaDataset;
export declare function createMetadataStore(): QaMetadataStore;
export declare function createSyntheticSupabase(options?: {
	mode?: unknown;
	now?: Date;
	guest?: boolean;
	store?: QaMetadataStore;
}): QaClient;
