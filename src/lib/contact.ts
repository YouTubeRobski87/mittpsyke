import { env } from '$env/dynamic/public';

const CONTACT_EMAIL_FALLBACK = 'mittpsyke@ownit.nu';
const configuredContactEmail = (env.PUBLIC_CONTACT_EMAIL ?? '').trim();

// TODO: Sätt PUBLIC_CONTACT_EMAIL till en riktig @mittpsyke.se-adress (t.ex. kontakt@mittpsyke.se) när mailboxen är verifierad.
export const PUBLIC_CONTACT_EMAIL = configuredContactEmail.includes('@')
	? configuredContactEmail
	: CONTACT_EMAIL_FALLBACK;
export const PUBLIC_CONTACT_MAILTO = `mailto:${PUBLIC_CONTACT_EMAIL}`;
