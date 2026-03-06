import fetch from 'node-fetch';

export async function GET() {
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

	return new Response(JSON.stringify(data), {
		headers: { 'Content-Type': 'application/json' }
	});
}
