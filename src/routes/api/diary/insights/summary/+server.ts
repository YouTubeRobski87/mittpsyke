import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { getLighterDaysSummaryView, getSummarySnapshotId, selectSummarySource } from '$lib/progress-summary-request';
import { resolveDeterministicRiskGuard } from '$lib/ai/crisis-guard';
import { generateAIText } from '$lib/server/ai/text-generation';
import { hasDiaryAiConsent } from '$lib/server/diary-ai-consent';
import { buildLighterDaysView } from '$lib/server/progress-lighter-days';
import {
	buildLighterDaysSummaryRequest,
	parseLighterDaysSummary
} from '$lib/server/progress-lighter-days-summary';
import { loadProgressRows, readThemeOverrides } from '$lib/server/progress-rows';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

// Reflektionsfrågan gäller ett valt utdrag från användarens aktuella tema.
// Servern återskapar underlaget och skickar bara det valda utdraget.

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
		? body as { period?: unknown; snapshotId?: unknown; themeId?: unknown; sourceRef?: unknown }
		: {};
	const { period, snapshotId, themeId, sourceRef } = input;
	if ((period !== 30 && period !== 90 && period !== 180) ||
		typeof themeId !== 'string' || !themeId || typeof sourceRef !== 'number' || !Number.isInteger(sourceRef) ||
		typeof snapshotId !== 'string' || !/^[a-f0-9]{64}$/.test(snapshotId)) {
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
	const selected = selectSummarySource(summaryView, sourceRef);
	if (!selected || await getSummarySnapshotId(selected) !== snapshotId) {
		return json({ error: 'Underlaget har ändrats. Ladda om återblicken och försök igen.' }, { status: 409 });
	}
	const { source, guardText } = selected;
	const aiRequest = buildLighterDaysSummaryRequest(source);
	const promptText = [guardText, ...aiRequest.messages.map(({ content }) => content)].join('\n');
	// Kontrollera även det valda utdraget innan något skickas till modellen.
	if (resolveDeterministicRiskGuard(promptText)) {
		return json({ question: null, reason: 'withheld' });
	}

	lastCallByUser.set(user.id, now);
	if (lastCallByUser.size > 1000) {
		for (const [key, time] of lastCallByUser) if (now - time > RATE_LIMIT_MS) lastCallByUser.delete(key);
	}

	try {
		const result = await generateAIText(aiRequest);
		const response = parseLighterDaysSummary(result.text, source);
		if (response?.questionOrigin === 'mittpsyke') {
			// Ett avstående får bara bli en standardfråga om det valda underlaget
			// fortfarande finns kvar efter väntan på modellen.
			const { data: { user: currentUser }, error: currentAuthError } = await supabase.auth.getUser();
			if (currentAuthError || currentUser?.id !== user.id) {
				return json({ error: 'Unauthorized' }, { status: 401 });
			}
			const current = await loadProgressRows(supabase, user.id, period);
			if (current.error) return json({ error: current.error }, { status: 500 });
			const currentView = buildLighterDaysView(current.rows, period, readThemeOverrides(currentUser));
			const currentSelection = selectSummarySource(
				getLighterDaysSummaryView(currentView, current.truncated, themeId), sourceRef
			);
			if (!currentSelection || await getSummarySnapshotId(currentSelection) !== snapshotId) {
				return json({ error: 'Underlaget har ändrats. Ladda om återblicken och försök igen.' }, { status: 409 });
			}
		}
		if (!(await hasDiaryAiConsent(serviceClient, user.id))) {
			return json({ error: 'Consent required for sensitive diary AI features.', reason: 'ai-consent' }, { status: 403 });
		}
		return json(response ?? {
			question: null, reason: 'invalid-response'
		}, { headers: { 'Cache-Control': 'no-store' } });
	} catch {
		return json({ error: 'Kunde inte ta fram en fråga just nu.' }, { status: 502 });
	}
};
