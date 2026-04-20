import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

type DailyMovementRequestBody = {
	entryDate?: unknown;
	stepCount?: unknown;
	cycledToday?: unknown;
	cycledKm?: unknown;
};

type DailyMovementResponse = {
	success: true;
	entry: {
		entryDate: string;
		stepCount: number | null;
		cycledToday: boolean;
		cycledKm: number | null;
		updatedAt: string | null;
	};
};

function errorResponse(message: string, status: number) {
	return json({ success: false, error: message }, { status });
}

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

function isDateKey(value: string) {
	return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function parseIntOrNull(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return null;
	return Math.round(parsed);
}

function parseDecimalOrNull(value: unknown): number | null {
	if (value === null || value === undefined || value === '') return null;
	const parsed = Number(value);
	if (!Number.isFinite(parsed)) return null;
	return Math.round(parsed * 10) / 10;
}

function isMissingTableError(
	error: { code?: string | null; message?: string | null } | null | undefined,
	tableName: string
) {
	if (!error) return false;
	return (
		error.code === 'PGRST205' ||
		error.code === '42P01' ||
		(error.message ?? '').includes(`Could not find the table 'public.${tableName}'`)
	);
}

function validateBody(
	input: unknown
):
	| {
			ok: true;
			data: {
				entryDate: string;
				stepCount: number | null;
				cycledToday: boolean;
				cycledKm: number | null;
			};
	  }
	| { ok: false; error: string } {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return { ok: false, error: 'Invalid request body.' };
	}

	const body = input as DailyMovementRequestBody;
	const entryDate = typeof body.entryDate === 'string' ? body.entryDate.trim() : '';
	if (!isDateKey(entryDate)) {
		return { ok: false, error: 'Field "entryDate" must be a date key (YYYY-MM-DD).' };
	}

	const stepCount = parseIntOrNull(body.stepCount);
	if (body.stepCount !== null && body.stepCount !== undefined && body.stepCount !== '' && stepCount === null) {
		return { ok: false, error: 'Field "stepCount" must be a number or null.' };
	}
	if (stepCount !== null && (stepCount < 0 || stepCount > 200000)) {
		return { ok: false, error: 'Field "stepCount" must be between 0 and 200000.' };
	}

	if (typeof body.cycledToday !== 'boolean') {
		return { ok: false, error: 'Field "cycledToday" must be a boolean.' };
	}
	const cycledToday = body.cycledToday;

	let cycledKm = parseDecimalOrNull(body.cycledKm);
	if (body.cycledKm !== null && body.cycledKm !== undefined && body.cycledKm !== '' && cycledKm === null) {
		return { ok: false, error: 'Field "cycledKm" must be a number or null.' };
	}
	if (!cycledToday) {
		cycledKm = null;
	}
	if (cycledKm !== null && (cycledKm < 0 || cycledKm > 500)) {
		return { ok: false, error: 'Field "cycledKm" must be between 0 and 500.' };
	}
	if (stepCount === null && !cycledToday) {
		return { ok: false, error: 'At least one movement field is required.' };
	}

	return {
		ok: true,
		data: {
			entryDate,
			stepCount,
			cycledToday,
			cycledKm
		}
	};
}

export const POST: RequestHandler = async ({ request }) => {
	let parsedBody: unknown;
	try {
		parsedBody = await request.json();
	} catch {
		return errorResponse('Invalid JSON body.', 400);
	}

	const validated = validateBody(parsedBody);
	if (!validated.ok) {
		return errorResponse(validated.error, 400);
	}

	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) {
		return errorResponse('Missing or invalid Authorization header.', 401);
	}

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;
	if (!supabaseUrl || !supabaseAnonKey) {
		console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
		return errorResponse('Server configuration error.', 500);
	}

	const supabase = createClient(supabaseUrl, supabaseAnonKey, {
		auth: { autoRefreshToken: false, persistSession: false },
		global: { headers: { Authorization: `Bearer ${token}` } }
	});

	const {
		data: { user },
		error: userError
	} = await supabase.auth.getUser();

	if (userError || !user) {
		return errorResponse('Unauthorized.', 401);
	}

	const { data: upserted, error: upsertError } = await supabase
		.from('daily_movement')
		.upsert(
			{
				user_id: user.id,
				entry_date: validated.data.entryDate,
				step_count: validated.data.stepCount,
				cycled_today: validated.data.cycledToday,
				cycled_km: validated.data.cycledKm
			},
			{ onConflict: 'user_id,entry_date' }
		)
		.select('entry_date, step_count, cycled_today, cycled_km, updated_at')
		.single();

	if (upsertError || !upserted) {
		console.error('Failed to save daily movement:', upsertError);
		if (isMissingTableError(upsertError, 'daily_movement')) {
			return errorResponse(
				'Tabellen "daily_movement" saknas i Supabase. Kör SQL-filen supabase/daily_movement.sql i databasen först.',
				500
			);
		}
		if (upsertError?.code === '42501') {
			return errorResponse('Not allowed to save daily movement.', 403);
		}
		return errorResponse(upsertError?.message ?? 'Could not save daily movement.', 500);
	}

	const response: DailyMovementResponse = {
		success: true,
		entry: {
			entryDate: typeof upserted.entry_date === 'string' ? upserted.entry_date : validated.data.entryDate,
			stepCount: typeof upserted.step_count === 'number' ? upserted.step_count : null,
			cycledToday: upserted.cycled_today === true,
			cycledKm: typeof upserted.cycled_km === 'number' ? upserted.cycled_km : null,
			updatedAt: typeof upserted.updated_at === 'string' ? upserted.updated_at : null
		}
	};

	return json(response, { status: 200 });
};
