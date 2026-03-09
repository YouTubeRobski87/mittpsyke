import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const payload = await request.json();
		console.log('[events]', payload);
		return json({ ok: true });
	} catch {
		return json({ ok: false }, { status: 400 });
	}
};
