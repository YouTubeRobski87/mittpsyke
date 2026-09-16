// Gemensam avsändare och granskningsstatus för guider och artiklar.
//
// MittPsyke har ingen medicinsk granskare och ingen klinisk redaktion, vilket
// står i den redaktionella metoden. Därför ska ingen sida signalera medicinsk
// faktagranskning - varken i synlig text eller i strukturerad data. Samma namn
// används i sidans text och i JSON-LD, så att schemat aldrig säger mer än det
// läsaren faktiskt ser.

/** Används bara där en människa faktiskt har läst och kvalitetssäkrat texten. */
export const EDITORIAL_REVIEW_STATUS = 'Redaktionellt granskad, ej medicinskt faktagranskad';

/**
 * För innehåll utan verifierad mänsklig granskning. Säger bara det vi vet
 * säkert - att ingen medicinsk faktagranskning har gjorts - och påstår
 * ingen redaktionell granskning.
 */
export const UNVERIFIED_REVIEW_STATUS = 'Ej medicinskt faktagranskad';
export const EDITORIAL_METHOD_HREF = '/redaktionell-metod';
export const EDITORIAL_METHOD_LABEL = 'Redaktionell metod';

/** Personen bakom MittPsyke, den enda namngivna avsändaren. */
export const FOUNDER_NAME = 'Robert Claesson';
export const FOUNDER_HREF = '/om-skaparen';

/**
 * Samlingsnamnet för det redaktionella arbetet. Den redaktionella metoden
 * förklarar att det i nuläget är samma person, så namnet lovar ingen
 * redaktion med flera eller kliniska medarbetare.
 */
export const EDITORIAL_TEAM_NAME = 'MittPsyke-redaktionen';

const SITE_ORIGIN = 'https://mittpsyke.se';

export type AuthorJsonLd =
	| { '@type': 'Person'; name: string; url: string }
	| { '@type': 'Organization'; name: string; url: string };

/**
 * Bara den namngivna grundaren blir en Person i schemat. Allt annat är
 * redaktionen, alltså en Organization - en påhittad person vore en starkare
 * auktoritetssignal än sajten kan bära.
 */
export function buildAuthorJsonLd(name: string): AuthorJsonLd {
	const trimmed = name.trim();
	if (trimmed === FOUNDER_NAME) {
		return { '@type': 'Person', name: FOUNDER_NAME, url: `${SITE_ORIGIN}${FOUNDER_HREF}` };
	}

	return {
		'@type': 'Organization',
		name: normalizeAuthorName(trimmed),
		url: `${SITE_ORIGIN}${EDITORIAL_METHOD_HREF}`
	};
}

/** Skriver äldre stavningar av redaktionsnamnet på samma sätt överallt. */
export function normalizeAuthorName(name: string): string {
	const trimmed = name.trim();
	if (!trimmed || /^mittpsyke([ -]redaktion(en)?)?$/i.test(trimmed)) return EDITORIAL_TEAM_NAME;
	return trimmed;
}
