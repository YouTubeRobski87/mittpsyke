import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { resolveDeterministicRiskGuard } from '$lib/ai/crisis-guard';
import { generateAIText } from '$lib/server/ai/text-generation';
import { hasDiaryAiConsent } from '$lib/server/diary-ai-consent';
import { buildLighterDaysView } from '$lib/server/progress-lighter-days';
import {
	buildLighterDaysSummaryRequest,
	collectSummarySources,
	parseLighterDaysSummary
} from '$lib/server/progress-lighter-days-summary';
import { loadProgressRows, parseProgressPeriod, readThemeOverrides } from '$lib/server/progress-rows';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

// AI-sammanfattningen av återblicken. Den här endpointen anropas bara när
// användaren själv trycker på "Sammanfatta underlaget med AI" - aldrig vid
// sidladdning. Modellen får bara redan framräknade siffror och ordagranna
// utdrag, och varje påstående i svaret måste gå att spåra till ett utdrag.

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
	const period = parseProgressPeriod(
		body && typeof body === 'object' && !Array.isArray(body) ? (body as { period?: unknown }).period : undefined
	);

	const now = Date.now();
	if (now - (lastCallByUser.get(user.id) ?? 0) < RATE_LIMIT_MS) {
		return json({ error: 'Vänta en liten stund innan du sammanfattar igen.', reason: 'rate-limit' }, { status: 429 });
	}

	const { rows, error } = await loadProgressRows(supabase, user.id, period);
	if (error) return json({ error }, { status: 500 });

	const view = buildLighterDaysView(rows, period, readThemeOverrides(user));
	const sources = collectSummarySources(view);
	if (sources.length === 0) {
		return json({ statements: [], reason: 'no-sources' });
	}

	const aiRequest = buildLighterDaysSummaryRequest(view, sources);
	const promptText = aiRequest.messages.map((message) => message.content).join('\n');
	// Utdragen är redan rensade från krisinnehåll, men spärren körs ändå på
	// hela underlaget innan något skickas till en modell.
	if (resolveDeterministicRiskGuard(promptText)) {
		return json({ statements: [], reason: 'withheld' });
	}

	lastCallByUser.set(user.id, now);
	if (lastCallByUser.size > 1000) {
		for (const [key, time] of lastCallByUser) if (now - time > RATE_LIMIT_MS) lastCallByUser.delete(key);
	}

	try {
		const result = await generateAIText(aiRequest);
		const statements = parseLighterDaysSummary(result.text, sources);
		return json({ statements, reason: statements.length === 0 ? 'no-traceable-statements' : null });
	} catch (err) {
		console.error('Progress summary error:', err);
		return json({ error: 'Kunde inte skapa en sammanfattning just nu.' }, { status: 502 });
	}
};
