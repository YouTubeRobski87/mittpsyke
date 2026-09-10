import { redirect } from '@sveltejs/kit';
import { resolveChatSlug } from '$lib/data/chat-slugs';
import { getPortalByKey } from '$lib/data/portals';
import type { PageServerLoad } from './$types';

// /portal/a, /portal/b och /portal/e var en tunn genomgångssida med en enda
// knapp till chatten. Gamla länkar och bokmärken går nu direkt till samma
// spår i chatten, utan mellansteg. Okända portaler landar i den neutrala chatten.
export const load: PageServerLoad = ({ params, url }) => {
	const portal = getPortalByKey(params.slug);
	const target = portal ? `/chat/${resolveChatSlug(portal.key)}` : '/chat';
	throw redirect(301, `${target}${url.search}`);
};
