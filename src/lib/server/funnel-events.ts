// Product Funnel Analytics V1, Pass A.
//
// Mäter ATT en produktinteraktion skedde, aldrig VAD användaren skrev eller
// kände. Ingen dagbokstext, inget utdrag, ingen ordräkning, inget humörvärde,
// ingen e-post, inget rått user_id och ingen klientgenererad identifierare.
//
// Modulen är server-only. Den importerar $env/dynamic/private och skriver med
// service-role, och får därför aldrig importeras från en .svelte-fil eller
// annan klientkod.
//
// second_active_day är intern analytics. Det är avsiktligt frikopplat från
// streak, milestone, badge, XP och all användarsynlig copy - ingenting här får
// någonsin bli en prestation som visas för användaren.

import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient, isMissingTableError } from '$lib/server/supabase-admin';
import { toStockholmDateKey } from '$lib/stockholm-date';

export const FUNNEL_EVENT_NAMES = ['first_entry_saved', 'second_active_day'] as const;

export type FunnelEventName = (typeof FUNNEL_EVENT_NAMES)[number];

export type FunnelWriteStatus =
	| 'written'
	| 'duplicate'
	| 'skipped_no_salt'
	| 'skipped_no_service_client'
	| 'skipped_invalid_event'
	| 'skipped_missing_table'
	| 'failed';

export type FunnelWriteResult = {
	status: FunnelWriteStatus;
	eventName: FunnelEventName;
};

/**
 * Tillåtna properties per event. Båda listorna är avsiktligt tomma i Pass A:
 * varken "aktiverade användaren?" eller "kom hen tillbaka en andra dag?" kräver
 * någon extra metadata för att besvaras, och mindre data är alltid att föredra.
 *
 * Listan är den enda vägen in i properties-kolumnen. Allt som inte står här
 * tas bort innan skrivning, så en framtida anropare inte kan råka skicka in
 * dagbokstext, humör eller ordräkning genom att bara lägga till ett fält.
 */
const ALLOWED_PROPERTIES: Record<FunnelEventName, readonly string[]> = {
	first_entry_saved: [],
	second_active_day: []
};

/** Skalära värden är det enda properties någonsin får innehålla. */
type FunnelPropertyValue = string | number | boolean;

const MAX_PROPERTY_STRING_LENGTH = 64;

/**
 * Domänseparation. Samma hemlighet kan användas av annan serverkod (till
 * exempel anonymous-stories), och utan prefixet hade samma indata kunnat ge
 * samma hash på två ställen och därmed gå att korsreferera.
 */
const USER_REF_DOMAIN = 'product_funnel_events:v1';

/**
 * Serverhemlighet för pseudonymiseringen. Dedikerad, utan fallback-kedja.
 *
 * Konstruktionen (HMAC-SHA256 över en serverhemlighet) är densamma som i
 * anonymous-stories.ts, men hemligheten delas medvetet inte med något annat.
 * Två skäl, båda om livscykel snarare än kryptografi:
 *
 *   * Rotation. user_ref är inte bara en pseudonym utan också nyckeln i
 *     unique(user_ref, event_name), alltså det som gör eventen once-per-
 *     account. Roteras hemligheten byter varje användare user_ref: idempotensen
 *     nollställs så att samma person kan få first_entry_saved en gång till, och
 *     historiska rader går inte längre att koppla ihop med nya. Inget felar -
 *     siffrorna blir bara tyst fel. Att hänga det på SUPABASE_SERVICE_ROLE_KEY
 *     hade betytt att en helt rutinmässig - och vid en läcka obligatorisk -
 *     nyckelrotation tyst förstör funnel-datan.
 *   * Separation of concerns. Service-role-nyckeln är ett
 *     autentiseringsbevis, inte ett pseudonymiseringssalt. De två har olika
 *     ägare, olika rotationstakt och olika konsekvenser vid byte.
 *
 * Ingen hårdkodad fallback finns heller: en salt som ligger i ett publikt repo
 * hade gjort user_ref till en känd funktion av user_id och upphävt hela
 * poängen.
 *
 * Saknas hemligheten skrivs inget event alls (fail closed). Dagboken påverkas
 * inte - mätningen börjar först när FUNNEL_USER_REF_SALT är satt.
 */
function getUserRefSalt(): string | null {
	return env.FUNNEL_USER_REF_SALT || null;
}

/**
 * Deterministisk pseudonym för ett user-id. Samma id ger alltid samma user_ref,
 * och utan serverhemligheten går den inte att räkna tillbaka.
 *
 * Returnerar null när ingen hemlighet finns. Anroparen ska då hoppa över
 * skrivningen i stället för att falla tillbaka på något svagare.
 */
export function createUserRef(userId: string): string | null {
	const trimmed = userId?.trim();
	if (!trimmed) return null;

	const salt = getUserRefSalt();
	if (!salt) return null;

	return createHmac('sha256', salt).update(`${USER_REF_DOMAIN}:${trimmed}`).digest('hex');
}

export function isFunnelEventName(value: unknown): value is FunnelEventName {
	return typeof value === 'string' && FUNNEL_EVENT_NAMES.includes(value as FunnelEventName);
}

/**
 * Släpper bara igenom nycklar som står i eventets allowlist, och bara skalära
 * värden. Objekt, arrayer och långa strängar avvisas även om nyckeln skulle
 * vara tillåten, så ett framtida tillägg i listan inte kan öppna för fritext.
 */
export function sanitizeFunnelProperties(
	eventName: FunnelEventName,
	input: Record<string, unknown> | undefined
): Record<string, FunnelPropertyValue> {
	const allowed = ALLOWED_PROPERTIES[eventName];
	const result: Record<string, FunnelPropertyValue> = {};

	if (!input || allowed.length === 0) return result;

	for (const key of allowed) {
		const value = input[key];

		if (typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value))) {
			result[key] = value;
			continue;
		}

		if (typeof value === 'string' && value.length > 0 && value.length <= MAX_PROPERTY_STRING_LENGTH) {
			result[key] = value;
		}
	}

	return result;
}

type DiaryFunnelInput = {
	/** Raden som just sparades. */
	insertedId: string;
	insertedCreatedAt: string;
	/** Användarens tidigaste kvarvarande rad enligt serverns data. */
	earliestId: string;
	earliestCreatedAt: string;
	/**
	 * Tidpunkten för användarens senaste rad STRIKT FÖRE den sparade raden,
	 * eller null om ingen sådan finns. Det är den här raden som avgör om
	 * sparningen faktiskt etablerar det andra dygnet eller bara är ännu en
	 * sparning för någon som redan varit aktiv flera dygn.
	 */
	previousCreatedAt: string | null;
};

/**
 * Ren beslutslogik, utan databas. Avgör vilka event den just sparade raden ska
 * utlösa.
 *
 * first_entry_saved: den sparade raden ÄR användarens tidigaste kvarvarande
 * rad. Identitetsjämförelse, inte en räkning - två samtidiga första sparningar
 * kan båda räkna fram "2" och då hade eventet tappats helt.
 *
 * second_active_day: den sparade raden är den som ETABLERAR användarens andra
 * distinkta Stockholm-dygn. Alltså inte "systemet upptäckte att användaren
 * historiskt varit aktiv två dygn".
 *
 * Det räcker inte att jämföra inserted-dygnet mot det tidigaste dygnet. En
 * användare med historiska rader på dag 1 och dag 2 hade då fått ett event vid
 * varje senare sparning, med ett occurred_at som pekar på fel dag.
 *
 * I stället jämförs mot raden STRIKT FÖRE den sparade. Eftersom dygnsnyckeln
 * är monoton i created_at gäller: ligger den föregående raden på dag 1, så
 * ligger samtliga tidigare rader på dag 1, och den här sparningen är den
 * första på ett nytt dygn. Ligger den på ett senare dygn hade användaren redan
 * minst två distinkta dygn.
 *
 * Jämförelsen görs mot created_at, inte mot id, just för att den ska vara
 * säker vid samtidighet - se recordDiaryFunnelEvents.
 */
export function resolveDiaryFunnelEvents(input: DiaryFunnelInput): FunnelEventName[] {
	if (input.insertedId && input.insertedId === input.earliestId) {
		// Ett enda inlägg kan aldrig ligga på två dygn.
		return ['first_entry_saved'];
	}

	const insertedDay = toStockholmDateKey(input.insertedCreatedAt);
	const earliestDay = toStockholmDateKey(input.earliestCreatedAt);

	if (!insertedDay || !earliestDay) return [];

	// Fortfarande samma dygn som det första inlägget.
	if (insertedDay === earliestDay) return [];

	// Saknas föregående rad är den sparade raden den enda, och då hade
	// identitetsjämförelsen ovan redan slagit till. Defensiv gren.
	if (!input.previousCreatedAt) return [];

	const previousDay = toStockholmDateKey(input.previousCreatedAt);
	if (!previousDay) return [];

	// Föregående rad ligger efter dag 1, alltså hade användaren redan minst
	// två distinkta dygn innan den här sparningen.
	if (previousDay !== earliestDay) return [];

	return ['second_active_day'];
}

/**
 * Avgör om kontot är ett internt test-/utvecklarkonto.
 *
 * Ingen serverkontrollerad mekanism för detta finns ännu. ADMIN_USER_IDS duger
 * inte: admin och intern testare är olika begrepp, och en admin som använder
 * produkten på riktigt ska räknas som en vanlig användare. E-postadress,
 * e-postdomän, user_metadata och klientflaggor är uteslutna - de två första
 * hör inte hemma i produktkod, de två sista kan användaren själv skriva.
 *
 * Fram till dess är alla rader is_internal = false. Att införa
 * INTERNAL_USER_IDS kräver deploymentkonfiguration och hör till ett senare pass.
 *
 * Läs alltså inte false som "extern användare". Det betyder bara att frågan
 * inte ställs ännu, och funnel-siffrorna innehåller därmed intern trafik.
 */
function resolveIsInternal(): boolean {
	return false;
}

/** Postgres unique_violation. */
const UNIQUE_VIOLATION = '23505';

/**
 * Skriver ett trattevent. Kastar aldrig.
 *
 * Idempotent: unique-constraintet (user_ref, event_name) är sista
 * försvarslinjen, så en dubblett blir status 'duplicate' i stället för ett fel.
 */
export async function recordFunnelEvent(input: {
	eventName: FunnelEventName;
	userId: string;
	properties?: Record<string, unknown>;
}): Promise<FunnelWriteResult> {
	const { eventName } = input;

	if (!isFunnelEventName(eventName)) {
		return { status: 'skipped_invalid_event', eventName };
	}

	try {
		const userRef = createUserRef(input.userId);
		if (!userRef) {
			// Loggas en gång per anrop men utan id: utan hemlighet är detta ett
			// driftfel, inte ett användarfel.
			console.warn('[funnel-events] hoppar över skrivning: ingen user_ref-salt konfigurerad');
			return { status: 'skipped_no_salt', eventName };
		}

		const admin = createServiceClient();
		if (!admin) {
			console.warn('[funnel-events] hoppar över skrivning: service-klient saknas');
			return { status: 'skipped_no_service_client', eventName };
		}

		const { error } = await admin.from('product_funnel_events').insert({
			event_name: eventName,
			user_ref: userRef,
			is_internal: resolveIsInternal(),
			properties: sanitizeFunnelProperties(eventName, input.properties)
		});

		if (!error) {
			return { status: 'written', eventName };
		}

		if (error.code === UNIQUE_VIOLATION) {
			// Eventet fanns redan. Det är det förväntade utfallet vid en kapplöpning.
			return { status: 'duplicate', eventName };
		}

		if (isMissingTableError(error, 'product_funnel_events')) {
			// Koden är deployad före migrationen. Tyst utfall i stället för ett
			// fel per sparning: mätningen börjar när tabellen finns, och en
			// saknad tabell får inte fylla serverloggen.
			return { status: 'skipped_missing_table', eventName };
		}

		// Aldrig payload eller innehåll i loggen - bara vilket event och varför.
		console.error(`[funnel-events] kunde inte skriva ${eventName}:`, error.code ?? error.message);
		return { status: 'failed', eventName };
	} catch (error) {
		console.error(
			`[funnel-events] oväntat fel vid ${eventName}:`,
			error instanceof Error ? error.message : 'okänt fel'
		);
		return { status: 'failed', eventName };
	}
}

type SavedDiaryRow = {
	id: string;
	created_at: string;
};

/**
 * Kopplar en lyckad dagbokssparning till trattens event.
 *
 * Anropas EFTER att raden faktiskt ligger i databasen. Kastar aldrig och
 * returnerar aldrig något som anroparen behöver agera på - analytics får inte
 * kunna göra en lyckad dagbokssparning misslyckad.
 *
 * Läser användarens tidigaste rad med den RLS-begränsade klienten, alltså
 * användarens egen behörighet. Service-role används bara för själva
 * event-skrivningen.
 */
export async function recordDiaryFunnelEvents(
	supabase: SupabaseClient,
	userId: string,
	inserted: SavedDiaryRow
): Promise<FunnelWriteResult[]> {
	try {
		const { data: earliest, error } = await supabase
			.from('diary')
			.select('id, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: true })
			.order('id', { ascending: true })
			.limit(1)
			.maybeSingle<SavedDiaryRow>();

		if (error || !earliest) {
			if (error) {
				console.error('[funnel-events] kunde inte läsa tidigaste dagboksrad:', error.code ?? error.message);
			}
			return [];
		}

		// Raden strikt före den sparade. Avgränsningen görs på created_at och
		// inte på id, vilket är det som gör resultatet säkert vid samtidighet:
		// två sparningar som båda är först på ett nytt dygn utesluter varandra
		// och kan därför aldrig båda tystas. I värsta fall försöker båda skriva
		// och unique-constraintet gör den andra till en duplicate - eventet kan
		// tappas bort, men aldrig försvinna.
		const { data: previous, error: previousError } = await supabase
			.from('diary')
			.select('created_at')
			.eq('user_id', userId)
			.lt('created_at', inserted.created_at)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle<{ created_at: string }>();

		if (previousError) {
			console.error(
				'[funnel-events] kunde inte läsa föregående dagboksrad:',
				previousError.code ?? previousError.message
			);
			return [];
		}

		const events = resolveDiaryFunnelEvents({
			insertedId: inserted.id,
			insertedCreatedAt: inserted.created_at,
			earliestId: earliest.id,
			earliestCreatedAt: earliest.created_at,
			previousCreatedAt: previous?.created_at ?? null
		});

		const results: FunnelWriteResult[] = [];
		for (const eventName of events) {
			results.push(await recordFunnelEvent({ eventName, userId }));
		}

		return results;
	} catch (error) {
		console.error(
			'[funnel-events] oväntat fel vid dagbokshändelse:',
			error instanceof Error ? error.message : 'okänt fel'
		);
		return [];
	}
}
