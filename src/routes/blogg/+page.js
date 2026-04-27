// Datan hämtas i +page.server.ts. Denna fil låter server-laddningen passera
// igenom oförändrad till sidan.

/** @type {import('./$types').PageLoad} */
export const load = ({ data }) => data;
