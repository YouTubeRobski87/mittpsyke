import fetch from 'node-fetch';
import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';

export async function GET({ request }) {
	if (!hasSensitiveConsentHeader(request)) {
		return json({ error: 'Consent required for sensitive voice features.' }, { status: 403 });
	}

	const response = await fetch('https://api.retellai.com/v1/create-web-call', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${process.env.RETELL_API_KEY}`,
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			agent_id: 'agent_6f33e21ff2809e22978012faf6'
		})
	});

	const data = await response.json();

	return json(data, { status: response.status });
}
