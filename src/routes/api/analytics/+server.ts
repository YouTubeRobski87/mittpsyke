import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	AB_VARIANTS,
	LANDING_EVENT_TYPES,
	isMissingSupabaseResourceError
} from '$lib/server/admin-system';
import {
	createServiceClient,
	isMissingTableError,
	isUuid
} from '$lib/server/supabase-admin';

type JsonRecord = Record<string, unknown>;

function isJsonRecord(value: unknown): value is JsonRecord {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asTrimmedString(value: unknown) {
	return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

async function resolveLandingPageId(identifier: string) {
	if (isUuid(identifier)) {
		return { id: identifier, missingSchema: false, missingPage: false };
	}

	const admin = createServiceClient();
	if (!admin) {
		return { id: null, missingSchema: false, missingPage: true };
	}

	const byPageId = await admin
		.from('landing_pages')
		.select('id')
		.eq('page_id', identifier)
		.maybeSingle<{ id: string }>();

	if (byPageId.error) {
		if (isMissingTableError(byPageId.error, 'landing_pages')) {
			return { id: null, missingSchema: true, missingPage: false };
		}

		console.error('Analytics landing page lookup error:', byPageId.error);
		return { id: null, missingSchema: false, missingPage: true };
	}

	if (byPageId.data?.id) {
		return { id: byPageId.data.id, missingSchema: false, missingPage: false };
	}

	const slug = identifier.startsWith('/') ? identifier : `/${identifier}`;
	const bySlug = await admin
		.from('landing_pages')
		.select('id')
		.eq('slug', slug)
		.maybeSingle<{ id: string }>();

	if (bySlug.error) {
		if (isMissingTableError(bySlug.error, 'landing_pages')) {
			return { id: null, missingSchema: true, missingPage: false };
		}

		console.error('Analytics landing page slug lookup error:', bySlug.error);
		return { id: null, missingSchema: false, missingPage: true };
	}

	return {
		id: bySlug.data?.id ?? null,
		missingSchema: false,
		missingPage: !bySlug.data?.id
	};
}

export const POST: RequestHandler = async ({ request, locals }) => {
	let body: unknown;

	try {
		body = await request.json();
	} catch {
		return json({ ok: false, error: 'Ogiltig JSON.' }, { status: 400 });
	}

	if (!isJsonRecord(body)) {
		return json({ ok: false, error: 'Body måste vara ett objekt.' }, { status: 400 });
	}

	const landingPageId = asTrimmedString(body.landingPageId);
	const abTestId = asTrimmedString(body.abTestId);
	const eventType = asTrimmedString(body.eventType);
	const variant = asTrimmedString(body.variant);
	const sessionId = asTrimmedString(body.sessionId);
	const metadata = isJsonRecord(body.metadata) ? body.metadata : {};

	if (!landingPageId) {
		return json({ ok: false, error: 'landingPageId krävs.' }, { status: 400 });
	}

	if (!eventType || !LANDING_EVENT_TYPES.includes(eventType as (typeof LANDING_EVENT_TYPES)[number])) {
		return json({ ok: false, error: 'Ogiltig eventType.' }, { status: 400 });
	}

	if (variant && !AB_VARIANTS.includes(variant as (typeof AB_VARIANTS)[number])) {
		return json({ ok: false, error: 'Ogiltig variant.' }, { status: 400 });
	}

	const resolvedLandingPage = await resolveLandingPageId(landingPageId);

	if (resolvedLandingPage.missingSchema) {
		return json(
			{
				ok: true,
				countersUpdated: false,
				skipped: true,
				message: 'Analytics-schemat saknas ännu. Kör `supabase/admin_system.sql` för att aktivera lagring.'
			},
			{ status: 202 }
		);
	}

	if (!resolvedLandingPage.id || resolvedLandingPage.missingPage) {
		return json({ ok: false, error: 'Landningssidan kunde inte hittas.' }, { status: 404 });
	}

	const {
		data: { user }
	} = await locals.supabase.auth.getUser();
	// An optional analytics user_id must come from the verified Auth response.
	const userId = user?.id ?? null;

	const rpcPayload = {
		p_landing_page_id: resolvedLandingPage.id,
		p_event_type: eventType,
		p_variant: variant,
		p_ab_test_id: abTestId,
		p_user_id: userId,
		p_session_id: sessionId,
		p_metadata: metadata
	};

	const { data: rpcData, error: rpcError } = await locals.supabase.rpc('record_landing_page_event', rpcPayload);

	if (!rpcError) {
		return json({ ok: true, eventId: rpcData, countersUpdated: true });
	}

	if (!isMissingSupabaseResourceError(rpcError, 'record_landing_page_event')) {
		console.error('Analytics RPC error:', rpcError);

		if (rpcError.code === '23503') {
			return json({ ok: false, error: 'Landningssidan kunde inte hittas.' }, { status: 404 });
		}

		return json({ ok: false, error: 'Kunde inte spara analytics-eventet.' }, { status: 500 });
	}

	const admin = createServiceClient();
	const insertClient = admin ?? locals.supabase;
	const { error: insertError } = await insertClient.from('analytics_events').insert({
		landing_page_id: resolvedLandingPage.id,
		ab_test_id: abTestId,
		event_type: eventType,
		variant,
		user_id: userId,
		session_id: sessionId,
		metadata
	});

	if (insertError) {
		if (
			isMissingSupabaseResourceError(insertError, 'analytics_events') ||
			isMissingTableError(insertError, 'analytics_events')
		) {
			return json(
				{
					ok: true,
					countersUpdated: false,
					skipped: true,
					message: 'Analytics-schemat saknas ännu. Kör `supabase/admin_system.sql` för att aktivera lagring.'
				},
				{ status: 202 }
			);
		}

		if (insertError.code === '23503') {
			return json({ ok: false, error: 'Landningssidan kunde inte hittas.' }, { status: 404 });
		}

		console.error('Analytics insert error:', insertError);
		return json({ ok: false, error: 'Kunde inte spara analytics-eventet.' }, { status: 500 });
	}

	return json({
		ok: true,
		countersUpdated: false,
		message: 'Eventet sparades men räknarna kräver SQL-funktionen `record_landing_page_event`.'
	});
};
