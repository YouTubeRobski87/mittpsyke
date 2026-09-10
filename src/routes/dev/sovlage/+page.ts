import { error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { PageLoad } from './$types';

// QA-harness för Sovlägets panel. Kvällsstugan ligger bakom inloggning, så
// panelen går inte att driva i webbläsaren via den riktiga routen utan ett
// konto. Den här sidan monterar samma komponent utan scen och utan data.
//
// Den finns bara i utvecklingsläge: i ett produktionsbygge är `dev` falskt och
// sidan svarar 404 innan något renderas.
export const load: PageLoad = () => {
	if (!dev) throw error(404, 'Not found');
	return {};
};
