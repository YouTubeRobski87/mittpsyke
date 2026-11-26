import { createServiceClient, isUuid } from '$lib/server/supabase-admin';

// Tillfällig, strikt avgränsad serverläsning för dataexporten.
//
// Två tabeller saknar SELECT-policy för den inloggade användaren:
// - user_ai_consents: authenticated saknar rättighet, så en läsning med
//   användarens token ger behörighetsfel.
// - forum_reports: rättighet finns men ingen policy, så en läsning med
//   användarens token ger tomt svar utan fel. Exporten skulle då se
//   fullständig ut fast den inte är det.
//
// Den långsiktiga lösningen är användarspecifika RLS-policyer (migration,
// blockerad tills backup och återställning är verifierade). Fram till dess
// läses de här, med service role, under följande regler:
// - Bara de två fasta frågorna nedan. Inga tabellnamn, kolumner eller filter
//   kommer utifrån.
// - userId ska komma från auth.getUser() i anroparen. Det kontrolleras som
//   UUID och används som enda filter.
// - Raderna kontrolleras igen efter läsningen. En rad med annan ägare kastar
//   fel i stället för att returneras.
// - Ägarkolumnen tas bort ur svaret.
// - Forumrapporter returneras utan modereringsfält (resolved_at) och utan id:n
//   för det rapporterade innehållet, som kan peka på andra personer.
// - Fel loggas aldrig här. Anroparen loggar bara delens namn och felkod.
// Modulen ligger under $lib/server och kan därför aldrig hamna i klientkoden.

export const AI_CONSENT_EXPORT_COLUMNS = ['scope', 'status', 'policy_version', 'granted_at', 'revoked_at', 'updated_at'] as const;
export const FORUM_REPORT_EXPORT_COLUMNS = ['id', 'reason', 'details', 'created_at'] as const;

type Row = Record<string, unknown>;

export class ExportServiceReadError extends Error {
	constructor(
		message: string,
		public readonly code?: string
	) {
		super(message);
		this.name = 'ExportServiceReadError';
	}
}

function requireClient() {
	const client = createServiceClient();
	if (!client) throw new ExportServiceReadError('service client saknas', 'no_service_client');
	return client;
}

function assertUserId(userId: string) {
	if (typeof userId !== 'string' || !isUuid(userId)) {
		throw new ExportServiceReadError('ogiltigt användar-id', 'invalid_user_id');
	}
}

/** Kontrollerar ägaren på varje rad och tar bort ägarkolumnen. */
function ownRowsOnly(rows: Row[] | null, ownerColumn: string, userId: string): Row[] {
	return (rows ?? []).map((row) => {
		if (row[ownerColumn] !== userId) {
			throw new ExportServiceReadError('rad med fel ägare', 'owner_mismatch');
		}
		const { [ownerColumn]: _owner, ...rest } = row;
		return rest;
	});
}

export async function readOwnAiConsents(userId: string): Promise<Row[]> {
	assertUserId(userId);
	const { data, error } = await requireClient()
		.from('user_ai_consents')
		.select('user_id, scope, status, policy_version, granted_at, revoked_at, updated_at')
		.eq('user_id', userId)
		.order('scope', { ascending: true });
	if (error) throw new ExportServiceReadError('läsfel', error.code);
	return ownRowsOnly(data as unknown as Row[] | null, 'user_id', userId);
}

export async function readOwnForumReports(userId: string): Promise<Row[]> {
	assertUserId(userId);
	const { data, error } = await requireClient()
		.from('forum_reports')
		.select('reporter_id, id, reason, details, created_at')
		.eq('reporter_id', userId)
		.order('created_at', { ascending: true });
	if (error) throw new ExportServiceReadError('läsfel', error.code);
	return ownRowsOnly(data as unknown as Row[] | null, 'reporter_id', userId);
}
