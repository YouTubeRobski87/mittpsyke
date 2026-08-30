// Serverägt samtycke för dagens fråga.
//
// Samma form som /api/consent/diary-ai, men ett annat scope och en annan
// policyversion. Klienten skickar aldrig scope eller policy - båda är
// serverkonstanter, så den här routen kan bara röra sitt eget samtycke.
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import {
	DAILY_QUESTION_AI_CONSENT_POLICY_VERSION,
	grantDailyQuestionAiConsent,
	hasDailyQuestionAiConsent,
	revokeDailyQuestionAiConsent
} from '$lib/server/daily-question-ai-consent';

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) return null;
	return token.trim();
}

async function getAuthenticatedUser(
	request: Request,
	locals: App.Locals
): Promise<{ id: string } | null> {
	const accessToken = getAccessToken(request.headers.get('authorization'));
	const authClient = accessToken ? createTokenClient(accessToken) : locals.supabase;
	if (!authClient) return null;

	const {
		data: { user },
		error
	} = await authClient.auth.getUser();

	if (error || !user) return null;
	return { id: user.id };
}

function serviceUnavailable() {
	return json({ error: 'Server configuration error.' }, { status: 500 });
}

export const GET: RequestHandler = async ({ request, locals }) => {
	const user = await getAuthenticatedUser(request, locals);
	if (!user) return json({ error: 'Unauthorized.' }, { status: 401 });

	const serviceClient = createServiceClient();
	if (!serviceClient) return serviceUnavailable();

	const granted = await hasDailyQuestionAiConsent(serviceClient, user.id);
	return json({ status: granted ? 'granted' : 'missing', policyVersion: DAILY_QUESTION_AI_CONSENT_POLICY_VERSION });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await getAuthenticatedUser(request, locals);
	if (!user) return json({ error: 'Unauthorized.' }, { status: 401 });

	const serviceClient = createServiceClient();
	if (!serviceClient) return serviceUnavailable();

	const granted = await grantDailyQuestionAiConsent(serviceClient, user.id);
	if (!granted) return json({ error: 'Kunde inte spara samtycket just nu.' }, { status: 500 });

	return json({ status: 'granted', policyVersion: DAILY_QUESTION_AI_CONSENT_POLICY_VERSION });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const user = await getAuthenticatedUser(request, locals);
	if (!user) return json({ error: 'Unauthorized.' }, { status: 401 });

	const serviceClient = createServiceClient();
	if (!serviceClient) return serviceUnavailable();

	const revoked = await revokeDailyQuestionAiConsent(serviceClient, user.id);
	if (!revoked) return json({ error: 'Kunde inte återkalla samtycket just nu.' }, { status: 500 });

	return json({ status: 'revoked', policyVersion: DAILY_QUESTION_AI_CONSENT_POLICY_VERSION });
};
