import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { RequestHandler } from './$types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REPORT_REASONS = ['Olämpligt innehåll', 'Skadligt eller störande', 'Annat'] as const;
const CONTENT_TYPES = ['post', 'comment'] as const;

type ReportReason = (typeof REPORT_REASONS)[number];
type ReportContentType = (typeof CONTENT_TYPES)[number];

type ReportBody = {
	contentId: string;
	contentType: ReportContentType;
	reason: ReportReason;
};

function errorResponse(message: string, status: number) {
	return json({ success: false, error: message }, { status });
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

function getReporterIp(request: Request): string | null {
	const forwardedFor = request.headers.get('x-forwarded-for');
	const realIp = request.headers.get('x-real-ip');
	const connectingIp = request.headers.get('cf-connecting-ip');
	const raw = forwardedFor || realIp || connectingIp;
	if (!raw) return null;
	const firstIp = raw.split(',')[0]?.trim() ?? '';
	return firstIp.length > 0 ? firstIp.slice(0, 120) : null;
}

function validateBody(input: unknown): { ok: true; data: ReportBody } | { ok: false; error: string } {
	if (!input || typeof input !== 'object' || Array.isArray(input)) {
		return { ok: false, error: 'Invalid request body.' };
	}

	const body = input as Partial<ReportBody>;
	const contentId = typeof body.contentId === 'string' ? body.contentId.trim() : '';
	const contentType = typeof body.contentType === 'string' ? body.contentType.trim() : '';
	const reason = typeof body.reason === 'string' ? body.reason.trim() : '';

	if (!contentId || !UUID_REGEX.test(contentId)) {
		return { ok: false, error: 'contentId måste vara ett giltigt id.' };
	}

	if (!CONTENT_TYPES.includes(contentType as ReportContentType)) {
		return { ok: false, error: 'contentType måste vara post eller comment.' };
	}

	if (!REPORT_REASONS.includes(reason as ReportReason)) {
		return { ok: false, error: 'Välj en giltig rapportorsak.' };
	}

	return {
		ok: true,
		data: {
			contentId,
			contentType: contentType as ReportContentType,
			reason: reason as ReportReason
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

	const supabaseUrl = env.SUPABASE_URL || publicEnv.PUBLIC_SUPABASE_URL;
	const supabaseKey =
		env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || publicEnv.PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseKey) {
		console.error('Missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY.');
		return errorResponse('Server configuration error.', 500);
	}

	const supabase = createClient(supabaseUrl, supabaseKey, {
		auth: { autoRefreshToken: false, persistSession: false }
	});

	const reporterIp = getReporterIp(request);
	const { error } = await supabase.from('reports').insert({
		content_id: validated.data.contentId,
		content_type: validated.data.contentType,
		reason: validated.data.reason,
		created_at: new Date().toISOString(),
		reporter_ip: reporterIp
	});

	if (isMissingTableError(error, 'reports')) {
		return errorResponse(
			'Rapporttabellen saknas. Skapa tabellen "reports" i Supabase och försök igen.',
			500
		);
	}

	if (error) {
		console.error('Failed to save community report:', error);
		return errorResponse(error.message ?? 'Kunde inte skicka rapporten just nu.', 500);
	}

	return json({ success: true }, { status: 200 });
};
