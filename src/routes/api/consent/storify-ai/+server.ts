import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createServiceClient, createTokenClient } from '$lib/server/supabase-admin';
import {
	STORIFY_AI_CONSENT_POLICY_VERSION,
	grantStorifyAiConsent,
	hasStorifyAiConsent,
	revokeStorifyAiConsent
} from '$lib/server/storify-ai-consent';

function getAccessToken(authorizationHeader: string | null): string | null {
	if (!authorizationHeader) return null;
	const [scheme, token] = authorizationHeader.split(' ');
	return scheme?.toLowerCase() === 'bearer' && token?.trim() ? token.trim() : null;
}

async function getAuthenticatedUser(request: Request, locals: App.Locals): Promise<{ id: string } | null> {
	const token = getAccessToken(request.headers.get('authorization'));
	const client = token ? createTokenClient(token) : locals.supabase;
	if (!client) return null;
	const { data: { user }, error } = await client.auth.getUser();
	return error || !user ? null : { id: user.id };
}

function serviceUnavailable() {
	return json({ error: 'Server configuration error.' }, { status: 500 });
}

export const GET: RequestHandler = async ({ request, locals }) => {
	const user = await getAuthenticatedUser(request, locals);
	if (!user) return json({ error: 'Unauthorized.' }, { status: 401 });
	const serviceClient = createServiceClient();
	if (!serviceClient) return serviceUnavailable();
	const granted = await hasStorifyAiConsent(serviceClient, user.id);
	return json({ status: granted ? 'granted' : 'missing', policyVersion: STORIFY_AI_CONSENT_POLICY_VERSION });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = await getAuthenticatedUser(request, locals);
	if (!user) return json({ error: 'Unauthorized.' }, { status: 401 });
	const serviceClient = createServiceClient();
	if (!serviceClient) return serviceUnavailable();
	if (!(await grantStorifyAiConsent(serviceClient, user.id))) {
		return json({ error: 'Kunde inte spara samtycket just nu.' }, { status: 500 });
	}
	return json({ status: 'granted', policyVersion: STORIFY_AI_CONSENT_POLICY_VERSION });
};

export const DELETE: RequestHandler = async ({ request, locals }) => {
	const user = await getAuthenticatedUser(request, locals);
	if (!user) return json({ error: 'Unauthorized.' }, { status: 401 });
	const serviceClient = createServiceClient();
	if (!serviceClient) return serviceUnavailable();
	if (!(await revokeStorifyAiConsent(serviceClient, user.id))) {
		return json({ error: 'Kunde inte återkalla samtycket just nu.' }, { status: 500 });
	}
	return json({ status: 'revoked', policyVersion: STORIFY_AI_CONSENT_POLICY_VERSION });
};
