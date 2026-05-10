import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import type {
	SmsPreferenceErrorResponse,
	SmsPreferenceRecord,
	SmsPreferenceSuccessResponse
} from '$lib/types';

type SmsPreferenceRow = {
	phone_number: string | null;
	sms_opt_in: boolean | null;
	sms_opt_in_at: string | null;
	sms_opt_out_at: string | null;
	phone_verified: boolean | null;
};

const defaultPreference: SmsPreferenceRecord = {
	phone_number: null,
	sms_opt_in: false,
	sms_opt_in_at: null,
	sms_opt_out_at: null,
	phone_verified: false
};

const errorResponse = (message: string, status: number) => {
	const body: SmsPreferenceErrorResponse = { success: false, error: message };
	return json(body, { status });
};

function normalizeSwedishMobileNumber(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const compact = value.trim().replace(/[\s().-]/g, '');
	if (!compact) return null;

	const international = compact.startsWith('00') ? `+${compact.slice(2)}` : compact;
	if (/^07\d{8}$/.test(international)) return `+46${international.slice(1)}`;
	if (/^\+467\d{8}$/.test(international)) return international;

	return null;
}

function toPreference(row: SmsPreferenceRow | null): SmsPreferenceRecord {
	if (!row) return defaultPreference;

	return {
		phone_number: row.phone_number,
		sms_opt_in: row.sms_opt_in === true,
		sms_opt_in_at: row.sms_opt_in_at,
		sms_opt_out_at: row.sms_opt_out_at,
		phone_verified: row.phone_verified === true
	};
}

async function getAuthenticatedUser(locals: App.Locals) {
	const {
		data: { user },
		error
	} = await locals.supabase.auth.getUser();

	if (error || !user) return null;
	return user;
}

export const GET: RequestHandler = async ({ locals }) => {
	const user = await getAuthenticatedUser(locals);
	if (!user) return errorResponse('Du behöver vara inloggad.', 401);

	const { data, error } = await locals.supabase
		.from('user_sms_preferences')
		.select('phone_number, sms_opt_in, sms_opt_in_at, sms_opt_out_at, phone_verified')
		.eq('user_id', user.id)
		.maybeSingle<SmsPreferenceRow>();

	if (error) {
		console.error('Failed to load SMS preference', error);
		return errorResponse('Kunde inte hämta SMS-inställningen just nu.', 500);
	}

	const body: SmsPreferenceSuccessResponse = { success: true, preference: toPreference(data) };
	return json(body);
};

export const PUT: RequestHandler = async ({ request, locals }) => {
	const user = await getAuthenticatedUser(locals);
	if (!user) return errorResponse('Du behöver vara inloggad.', 401);

	let payload: { phoneNumber?: unknown; smsOptIn?: unknown };
	try {
		payload = await request.json();
	} catch {
		return errorResponse('Kunde inte läsa inställningen.', 400);
	}

	const smsOptIn = payload.smsOptIn === true;
	const normalizedPhone = normalizeSwedishMobileNumber(payload.phoneNumber);

	if (smsOptIn && !normalizedPhone) {
		return errorResponse('Ange ett svenskt mobilnummer, till exempel 0701234567.', 400);
	}

	const { data: existing, error: existingError } = await locals.supabase
		.from('user_sms_preferences')
		.select('sms_opt_in_at')
		.eq('user_id', user.id)
		.maybeSingle<{ sms_opt_in_at: string | null }>();

	if (existingError) {
		console.error('Failed to load current SMS preference', existingError);
		return errorResponse('Kunde inte hämta SMS-inställningen just nu.', 500);
	}

	const now = new Date().toISOString();
	const upsertPayload = {
		user_id: user.id,
		phone_number: smsOptIn ? normalizedPhone : null,
		sms_opt_in: smsOptIn,
		sms_opt_in_at: smsOptIn ? (existing?.sms_opt_in_at ?? now) : (existing?.sms_opt_in_at ?? null),
		sms_opt_out_at: smsOptIn ? null : now,
		phone_verified: false,
		updated_at: now
	};

	const { data, error } = await locals.supabase
		.from('user_sms_preferences')
		.upsert(upsertPayload, { onConflict: 'user_id' })
		.select('phone_number, sms_opt_in, sms_opt_in_at, sms_opt_out_at, phone_verified')
		.single<SmsPreferenceRow>();

	if (error) {
		console.error('Failed to save SMS preference', error);
		return errorResponse('Kunde inte spara SMS-inställningen just nu.', 500);
	}

	const body: SmsPreferenceSuccessResponse = { success: true, preference: toPreference(data) };
	return json(body);
};
