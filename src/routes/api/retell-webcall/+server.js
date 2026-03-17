import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { env } from '$env/dynamic/private';

export async function GET({ request }) {
	if (!hasSensitiveConsentHeader(request)) {
		return json({ error: 'Consent required for sensitive voice features.' }, { status: 403 });
	}

	if (!env.RETELL_API_KEY) {
		console.error('[retell-webcall] Missing RETELL_API_KEY');
		return json({ error: 'Voice service is not configured.' }, { status: 500 });
	}

	try {
		const response = await fetch('https://api.retellai.com/v1/create-web-call', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.RETELL_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				agent_id: 'agent_6f33e21ff2809e22978012faf6'
			})
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('[retell-webcall] create-web-call failed', response.status, data);
		}

		return json(data, { status: response.status });
	} catch (error) {
		console.error('[retell-webcall] request failed', error);
		return json({ error: 'Voice service request failed.' }, { status: 500 });
	}
}
