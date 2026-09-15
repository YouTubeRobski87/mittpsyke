// Påhittade exempel som visar vad Framstegs återblick kan visa efter en
// månad. Används på startsidan och i Framsteg för den som inte är inloggad.
//
// Allt här är fiktivt och märks som exempel där det visas: dagarna heter
// "Exempeldag" i stället för riktiga datum och citaten börjar med
// "Exempeltext:". Siffrorna följer samma form och samma trösklar som den
// riktiga analysen (minst 3 förekomster under minst 2 veckor), så exemplet
// aldrig lovar något produkten inte gör. Språket är observerande: något
// återkom, fanns med eller nämndes - aldrig varför, och aldrig vem någon är.

export const EXAMPLE_PREVIEW_HEADING = 'Så här kan det se ut efter en månad';

/** mood finns bara där exemplet visar humör, dvs. för lättare dagar. */
export type ExampleQuote = { day: string; text: string; mood?: string };

export const RECURRING_THEME_EXAMPLE = {
	label: 'Sömn',
	count: 6,
	total: 14,
	periodDays: 30,
	weekCount: 4,
	firstHalf: 2,
	secondHalf: 4,
	quotes: [
		{ day: 'Exempeldag 6', text: 'Somnade sent igen, tankarna fortsatte gå.' },
		{ day: 'Exempeldag 23', text: 'Sov längre i natt och vaknade innan väckarklockan.' }
	] satisfies ExampleQuote[]
} as const;

/** Huvudraden: tema, hur ofta och under vilken period. */
export const RECURRING_THEME_EXAMPLE_COUNT = `Återkom i ${RECURRING_THEME_EXAMPLE.count} av ${RECURRING_THEME_EXAMPLE.total} texter under ${RECURRING_THEME_EXAMPLE.periodDays} dagar, spritt över ${RECURRING_THEME_EXAMPLE.weekCount} veckor.`;

/** En kort, neutral observation om hur temat fördelade sig över månaden. */
export const RECURRING_THEME_EXAMPLE_OBSERVATION = `Nämndes ${RECURRING_THEME_EXAMPLE.firstHalf} gånger under första halvan av månaden och ${RECURRING_THEME_EXAMPLE.secondHalf} gånger under andra halvan.`;

export const LIGHTER_DAYS_EXAMPLE = {
	label: 'Promenad',
	note: 'Promenad fanns med i 4 av 6 inlägg med högre humör (30 dagar).',
	comparison: 'I övriga inlägg: 1 av 8. Spritt över 3 veckor.',
	quotes: [
		{ day: 'Exempeldag 4', mood: '7,0', text: 'Tog en promenad runt sjön efter middagen.' },
		{ day: 'Exempeldag 11', mood: '7,5', text: 'Kort promenad i lunchen, solen var framme.' },
		{ day: 'Exempeldag 19', mood: '8,0', text: 'Promenad med en vän på eftermiddagen.' },
		{ day: 'Exempeldag 26', mood: '7,0', text: 'Gick en promenad innan jag skrev det här.' }
	] satisfies ExampleQuote[]
} as const;
