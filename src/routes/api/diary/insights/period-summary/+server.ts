import { json } from '@sveltejs/kit';
import { hasHealthConsentRecord, hasSensitiveConsentHeader } from '$lib/consent';
import { isPeriodSummaryPeriod, MIN_PERIOD_SUMMARY_ENTRIES } from '$lib/progress-period-summary';
import { generateAIText } from '$lib/server/ai/text-generation';
import { hasDiaryAiConsent } from '$lib/server/diary-ai-consent';
import {
	buildPeriodSummaryRequest,
	parsePeriodSummary,
	periodSummarySnapshotId,
	selectPeriodSummaryEntries
} from '$lib/server/progress-period-summary';
import { loadProgressRows } from '$lib/server/progress-rows';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import { stockholmTodayKey } from '$lib/stockholm-date';
import type { RequestHandler } from './$types';

// "Sammanfatta mina anteckningar" i Framsteg.
//
// GET visar urvalet för granskning: omfånget, exakt de texter som skulle
// skickas och en ögonblicksbild. Ingen AI-tjänst anropas.
// POST skickar urvalet till AI efter ett uttryckligt val, och bara när både
// hälsodatasamtycket och dagboks-AI-samtycket finns. Båda kontrolleras igen
// precis före och direkt efter anropet. Sammanfattningen sparas inte.

const RATE_LIMIT_MS = 60_000;
const DAILY_LIMIT = 5;
const lastCallByUser = new Map<string, number>();
const dailyCallsByUser = new Map<string, { day: string; count: number }>();

function respond(body: object, status = 200) {
	return json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
}

const healthConsentRequired = () => respond({ reason: 'health-consent' }, 403);
const aiConsentRequired = () => respond({ reason: 'ai-consent' }, 403);

/** Ett anrop per minut och högst DAILY_LIMIT per dygn och konto. Räknas bara för anrop som når AI. */
function takeRateLimit(userId: string, now: number): 'ok' | 'rate-limit' | 'daily-limit' {
	for (const [id, previous] of lastCallByUser) {
		if (now - previous >= RATE_LIMIT_MS) lastCallByUser.delete(id);
	}
	const today = stockholmTodayKey(new Date(now));
	for (const [id, entry] of dailyCallsByUser) {
		if (entry.day !== today) dailyCallsByUser.delete(id);
	}
	if (lastCallByUser.has(userId)) return 'rate-limit';
	const daily = dailyCallsByUser.get(userId) ?? { day: today, count: 0 };
	if (daily.count >= DAILY_LIMIT) return 'daily-limit';
	lastCallByUser.set(userId, now);
	dailyCallsByUser.set(userId, { day: today, count: daily.count + 1 });
	return 'ok';
}

const handle: RequestHandler = async ({ request, url }) => {
	if (!hasSensitiveConsentHeader(request)) return healthConsentRequired();
	const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
	if (!token) return respond({}, 401);
	const supabase = createTokenClient(token);
	if (!supabase) return respond({}, 503);

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();
	if (authError || !user || user.is_anonymous) return respond({}, 401);
	// Samtycket läses från Auth, aldrig från en header eller ett sessionsanspråk.
	const healthConsent = user.user_metadata?.health_data_processing_consent;
	if (!hasHealthConsentRecord(healthConsent)) return healthConsentRequired();

	const hasCurrentHealthConsent = async () => {
		const {
			data: { user: current },
			error
		} = await supabase.auth.getUser();
		const record = current?.user_metadata?.health_data_processing_consent;
		return (
			!error &&
			current?.id === user.id &&
			!current.is_anonymous &&
			hasHealthConsentRecord(record) &&
			record.timestamp === healthConsent.timestamp
		);
	};

	const preview = request.method === 'GET';
	const input = preview
		? { period: Number(url.searchParams.get('period')) }
		: ((await request.json().catch(() => null)) as Record<string, unknown> | null);
	const period = input?.period;
	if (
		!isPeriodSummaryPeriod(period) ||
		(!preview &&
			(input?.confirmed !== true ||
				typeof input.snapshotId !== 'string' ||
				!/^[a-f0-9]{64}$/.test(input.snapshotId)))
	) {
		return respond({}, 400);
	}

	const service = preview ? null : createServiceClient();
	if (!preview && !service) return respond({}, 503);
	if (service && !(await hasDiaryAiConsent(service, user.id))) return aiConsentRequired();

	const readSelection = async () => {
		const { rows, truncated, error } = await loadProgressRows(supabase, user.id, period);
		return error ? null : selectPeriodSummaryEntries(rows, period, new Date(), { truncated });
	};
	const selection = await readSelection();
	if (!selection) return respond({}, 503);
	if (selection.entries.length < MIN_PERIOD_SUMMARY_ENTRIES) {
		return respond({ reason: 'insufficient-data', basis: selection.basis }, 422);
	}
	const snapshotId = await periodSummarySnapshotId(user.id, selection);
	// Användaren får se exakt de texter som skulle skickas, för att kunna granska
	// och godkänna urvalet. Det är kontots egna anteckningar; inget skickas vidare.
	if (preview) return respond({ ...selection.basis, snapshotId, entries: selection.entries });
	if (!service || input?.snapshotId !== snapshotId) return respond({ reason: 'changed' }, 409);

	// Kontrolleras igen efter läsningen, innan AI-tjänsten ser något.
	if (!(await hasDiaryAiConsent(service, user.id))) return aiConsentRequired();
	if (!(await hasCurrentHealthConsent())) return healthConsentRequired();
	if (request.signal.aborted) return respond({}, 408);
	const limit = takeRateLimit(user.id, Date.now());
	if (limit !== 'ok') return respond({ reason: limit }, 429);

	try {
		const { text } = await generateAIText(buildPeriodSummaryRequest(selection.entries));
		if (request.signal.aborted) return respond({}, 408);
		// Underlaget får inte ha ändrats medan modellen arbetade.
		const current = await readSelection();
		if (!current || (await periodSummarySnapshotId(user.id, current)) !== snapshotId) {
			return respond({ reason: 'changed' }, 409);
		}
		if (!(await hasDiaryAiConsent(service, user.id))) return aiConsentRequired();
		if (!(await hasCurrentHealthConsent())) return healthConsentRequired();
		if (request.signal.aborted) return respond({}, 408);

		const parsed = parsePeriodSummary(text, current);
		if (parsed.status === 'ok') return respond(parsed.result);
		return parsed.status === 'withheld'
			? respond({ reason: 'withheld' }, 422)
			: respond({ reason: 'invalid-response' }, 422);
	} catch {
		return respond({}, 502);
	}
};

export const GET = handle;
export const POST = handle;
