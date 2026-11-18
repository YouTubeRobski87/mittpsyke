import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { getLighterDaysSummaryView, getSummarySnapshotId } from '$lib/progress-summary-request';
import { resolveDeterministicRiskGuard } from '$lib/ai/crisis-guard';
import { generateAIText } from '$lib/server/ai/text-generation';
import { hasDiaryAiConsent } from '$lib/server/diary-ai-consent';
import { buildLighterDaysView } from '$lib/server/progress-lighter-days';
import {
	buildLighterDaysSummaryRequest,
	parseLighterDaysSummary
} from '$lib/server/progress-lighter-days-summary';
import { loadProgressRows, parseProgressPeriod, readThemeOverrides } from '$lib/server/progress-rows';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

// Reflektionsfrågan begärs från ett öppet tema. Modellen får bara de
// markerade, lokalt numrerade utdragen och servern formulerar frågan.

const RATE_LIMIT_MS = 60 * 1000;
const lastCallByUser = new Map<string, number>();

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

export const POST: RequestHandler = async ({ request }) => {
	if (!hasSensitiveConsentHeader(request)) {
		return json({ error: 'Consent required for sensitive AI features.' }, { status: 403 });
	}

	const token = getAccessToken(request.headers.get('authorization'));
	if (!token) return json({ error: 'Unauthorized' }, { status: 401 });

	const supabase = createTokenClient(token);
	const serviceClient = createServiceClient();
	if (!supabase || !serviceClient) return json({ error: 'Server configuration error.' }, { status: 500 });

	const {
		data: { user },
		error: authError
	} = await supabase.auth.getUser();
	if (authError || !user) return json({ error: 'Unauthorized' }, { status: 401 });

	// Samma serverkontrollerade samtycke som dagbokens AI-reflektioner.
	if (!(await hasDiaryAiConsent(serviceClient, user.id))) {
		return json({ error: 'Consent required for sensitive diary AI features.', reason: 'ai-consent' }, { status: 403 });
	}

	let body: unknown = null;
	try {
		body = await request.json();
	} catch {
		body = null;
	}
	const input = body && typeof body === 'object' && !Array.isArray(body)
		? body as { period?: unknown; snapshotId?: unknown; themeId?: unknown }
		: {};
	const period = parseProgressPeriod(input.period);
	const { snapshotId, themeId } = input;
	if (typeof themeId !== 'string' || !themeId || typeof snapshotId !== 'string' || !/^[a-f0-9]{64}$/.test(snapshotId)) {
		return json({ error: 'Öppna underlaget för temat för att få en fråga.' }, { status: 400 });
	}

	const now = Date.now();
	if (now - (lastCallByUser.get(user.id) ?? 0) < RATE_LIMIT_MS) {
		return json({ error: 'Vänta en liten stund innan du ber om en ny fråga.', reason: 'rate-limit' }, { status: 429 });
	}

	const { rows, truncated, error } = await loadProgressRows(supabase, user.id, period);
	if (error) return json({ error }, { status: 500 });

	const view = buildLighterDaysView(rows, period, readThemeOverrides(user));
	if (truncated || view.lowConfidence) {
		return json({ question: null, reason: 'insufficient-data' });
	}
	const summaryView = getLighterDaysSummaryView(view, truncated, themeId);
	if (!summaryView) {
		return json({ question: null, reason: 'no-sources' });
	}
	if (await getSummarySnapshotId(summaryView) !== snapshotId) {
		return json({ error: 'Underlaget har ändrats. Ladda om återblicken och försök igen.' }, { status: 409 });
	}
	const { sources, guardText } = summaryView;
	const aiRequest = buildLighterDaysSummaryRequest(sources);
	const promptText = [guardText, ...aiRequest.messages.map(({ content }) => content)].join('\n');
	// Utdragen är redan rensade från krisinnehåll, men spärren körs ändå på
	// hela underlaget innan något skickas till en modell.
	if (resolveDeterministicRiskGuard(promptText)) {
		return json({ question: null, reason: 'withheld' });
	}

	lastCallByUser.set(user.id, now);
	if (lastCallByUser.size > 1000) {
		for (const [key, time] of lastCallByUser) if (now - time > RATE_LIMIT_MS) lastCallByUser.delete(key);
	}

	try {
		const result = await generateAIText(aiRequest);
		if (!(await hasDiaryAiConsent(serviceClient, user.id))) {
			return json({ error: 'Consent required for sensitive diary AI features.', reason: 'ai-consent' }, { status: 403 });
		}
		return json(parseLighterDaysSummary(result.text, sources) ?? {
			question: null, reason: 'invalid-response'
		}, { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		return json({ error: 'Kunde inte ta fram en fråga just nu.' }, { status: 502 });
	}
};
