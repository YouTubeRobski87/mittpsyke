import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageServerLoad } from './$types';

// Åtkomstspärren för QA-harnessen. Den ligger på servern eftersom +page.ts
// körs i webbläsaren och inte kan läsa adminlistan.
//
// I utvecklingsläge är sidan öppen. I produktion får bara admin se den, med
// samma serverkontrollerade källa som /admin (locals.getSession ->
// is_super_admin, se $lib/server/admin-auth). Alla andra - utloggade som
// inloggade - får 404, så sidans existens inte avslöjas för användare.
export const load: PageServerLoad = async ({ locals }) => {
	if (dev) return {};

	const user = await locals.getSession();
	if (!user?.is_super_admin) throw error(404, 'Not found');
	return {};
};
