// src/routes/journey/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Kontrollera att användaren är inloggad
	const {
		data: { session }
	} = await locals.supabase.auth.getSession();

	if (!session) {
		throw redirect(303, '/auth');
	}

	// Vi behöver inte förhämta data här eftersom komponenten gör det via API
	// Men vi kan lägga till användardata om det behövs senare

	return {
		session
	};
};
