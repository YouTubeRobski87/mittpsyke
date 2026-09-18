import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Sidan var Storifys yta (AI-intervju → AI-skrivet dagboksinlägg) och är
// borttagen. Routen finns kvar enbart som redirect, så att gamla bokmärken
// landar i dagboken i stället för i en 404. Barnrouten /dagars-avtryck/checkin
// är den guidade incheckningen och berörs inte.
export const load: PageServerLoad = () => {
	redirect(307, '/dagbok/checkin');
};
