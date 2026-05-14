import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		await request.json();
		return json({ ok: true });
	} catch {
		return json({ ok: false }, { status: 400 });
	}
};
