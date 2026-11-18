import { json } from '@sveltejs/kit';
import { hasHealthConsentRecord, hasSensitiveConsentHeader } from '$lib/consent';
import { isRetrospectPeriod, retrospectSnapshotId } from '$lib/progress-retrospect';
import { generateAIText } from '$lib/server/ai/text-generation';
import { hasDiaryAiConsent } from '$lib/server/diary-ai-consent';
import { buildRetrospectSources, selectRetrospectSources } from '$lib/server/progress-retrospect';
import { buildRetrospectRequest, parseRetrospect } from '$lib/server/progress-retrospect-observations';
import { loadProgressRows } from '$lib/server/progress-rows';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

const RATE_LIMIT_MS = 60_000;
const lastCallByUser = new Map<string, number>();

function respond(body: object, status = 200) {
	return json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

function healthConsentRequired() {
	return respond({ reason: 'health-consent' }, 403);
}

function consentRequired() {
	return respond({ reason: 'ai-consent' }, 403);
}

const handle: RequestHandler = async ({ request, url }) => {
	if (!hasSensitiveConsentHeader(request)) return healthConsentRequired();
	const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
	if (!token) return respond({}, 401);
	const supabase = createTokenClient(token);
	if (!supabase) return respond({}, 503);

	const { data: { user }, error: authError } = await supabase.auth.getUser();
	if (authError || !user || user.is_anonymous) return respond({}, 401);
	// Read the current self-consent from Auth, never from a session claim or header.
	const healthConsent = user.user_metadata?.health_data_processing_consent;
	if (!hasHealthConsentRecord(healthConsent)) return healthConsentRequired();

	const hasCurrentHealthConsent = async () => {
		const { data: { user: current }, error } = await supabase.auth.getUser();
		const record = current?.user_metadata?.health_data_processing_consent;
		return !error && current?.id === user.id && !current.is_anonymous &&
			hasHealthConsentRecord(record) && record.timestamp === healthConsent.timestamp;
	};

	const preview = request.method === 'GET';
	const input = preview ? { period: Number(url.searchParams.get('period')) } :
		await request.json().catch(() => null);
	const period = input?.period;
	if (!isRetrospectPeriod(period) ||
		(!preview && (input.confirmed !== true || typeof input.snapshotId !== 'string' || !/^[a-f0-9]{64}$/.test(input.snapshotId)))) {
		return respond({}, 400);
	}

	const service = preview ? null : createServiceClient();
	if (!preview && !service) return respond({}, 503);
	if (service && !(await hasDiaryAiConsent(service, user.id))) return consentRequired();

	const readSources = async () => {
		const { rows, truncated, error } = await loadProgressRows(supabase, user.id, period);
		if (error) return null;
		return truncated ? { sources: [], candidates: [] } : buildRetrospectSources(rows, period);
	};
	const available = await readSources();
	if (!available) return respond({}, 503);
	if (preview) {
		if (available.sources.length < 2) return respond({ reason: 'insufficient-data' }, 422);
		const snapshotId = await retrospectSnapshotId(user.id, period, available.sources);
		return respond({ ...available, snapshotId });
	}
	const selection = selectRetrospectSources(available.candidates, input.refs);
	if (!service || !selection || input.snapshotId !== await retrospectSnapshotId(user.id, period, selection)) {
		return respond({ reason: 'changed' }, 409);
	}
	const snapshotId = input.snapshotId;

	// Check again after reading the source rows, before the provider sees them.
	if (!(await hasDiaryAiConsent(service, user.id))) return consentRequired();
	if (!(await hasCurrentHealthConsent())) return healthConsentRequired();
	const now = Date.now();
	for (const [id, previous] of lastCallByUser) {
		if (now - previous >= RATE_LIMIT_MS) lastCallByUser.delete(id);
	}
	if (lastCallByUser.has(user.id)) return respond({ reason: 'rate-limit' }, 429);
	if (request.signal.aborted) return respond({}, 408);
	lastCallByUser.set(user.id, now);

	try {
		const { text } = await generateAIText(buildRetrospectRequest(selection));
		if (request.signal.aborted) return respond({}, 408);
		const current = await readSources();
		const currentSelection = current && selectRetrospectSources(current.candidates, input.refs);
		if (!currentSelection || await retrospectSnapshotId(user.id, period, currentSelection) !== snapshotId) {
			return respond({ reason: 'changed' }, 409);
		}
		if (!(await hasDiaryAiConsent(service, user.id))) return consentRequired();
		if (!(await hasCurrentHealthConsent())) return healthConsentRequired();
		if (request.signal.aborted) return respond({}, 408);
		const result = parseRetrospect(text, currentSelection);
		return result ? respond(result) : respond({ reason: 'invalid-response' }, 422);
	} catch {
		return respond({}, 502);
	}
};

export const GET = handle;
export const POST = handle;
