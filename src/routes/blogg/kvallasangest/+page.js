import { redirect } from '@sveltejs/kit';

export function load() {
	throw redirect(301, '/blogg/amne/oro-och-stress/kvallsangest-och-nattangest');
}
