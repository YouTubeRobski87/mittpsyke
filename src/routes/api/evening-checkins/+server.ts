import { json } from '@sveltejs/kit';
import { hasSensitiveConsentHeader } from '$lib/consent';
import { validateEveningCheckinInput } from '$lib/evening-checkin';
import { loadEveningInteriorMemory, saveEveningCheckin } from '$lib/server/evening-checkin';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!hasSensitiveConsentHeader(request)) {
		return json({ error: 'Samtycke krävs för att spara Kvällslugn.' }, { status: 403 });
	}

	const {
		data: { user },
		error: authError
	} = await locals.supabase.auth.getUser();

	if (authError || !user || user.is_anonymous) {
		return json({ error: 'Unauthorized.' }, { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Ogiltigt underlag.' }, { status: 400 });
	}

	const validated = validateEveningCheckinInput(body);
	if (!validated.ok) {
		return json({ error: validated.error }, { status: 400 });
	}

	const result = await saveEveningCheckin(locals.supabase, user.id, validated.data);
	if (!result.ok) {
		return json({ error: 'Kunde inte spara Kvällslugn just nu.' }, { status: 500 });
	}

	const interiorMemory = await loadEveningInteriorMemory(locals.supabase, user.id);
	return json({ checkin: result.checkin, interiorMemory }, { status: 201 });
};
