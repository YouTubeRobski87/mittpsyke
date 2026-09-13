// Språkregler för text som MittPsyke själv genererar i Framstegs återblick,
// både den regelbaserade copyn och AI-sammanfattningar.
//
// Texten får bara beskriva observerade samband i användarens egen data. Den
// får aldrig säga vem användaren är, aldrig ställa eller antyda en diagnos och
// aldrig påstå att något orsakar något. Reglerna gäller inte citat ur
// användarens egna inlägg - de visas ordagrant och granskas inte här.

/** Matchar ett ord eller en fras utan att träffa delar av längre ord. */
function phrase(pattern: string): RegExp {
	return new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, 'iu');
}

export type ForbiddenPhraseKind = 'identity' | 'diagnosis' | 'causal';

export const FORBIDDEN_PROGRESS_PHRASES: readonly { kind: ForbiddenPhraseKind; pattern: RegExp }[] = [
	// Påståenden om vem användaren är eller hur hen fungerar som person.
	{ kind: 'identity', pattern: phrase('du är|du verkar vara|du har en tendens|din personlighet|typiskt för dig') },
	// Diagnosord och kliniska slutsatser.
	{
		kind: 'diagnosis',
		pattern: phrase(
			'depression\\w*|deprimerad\\w*|ångestsyndrom\\w*|paniksyndrom\\w*|panikångest|generaliserad ångest|' +
				'utmattningssyndrom\\w*|utbrändhet|utbränd|bipolär\\w*|adhd|autism\\w*|ptsd|ocd|tvångssyndrom\\w*|' +
				'ätstörning\\w*|personlighetsstörning\\w*|borderline|diagnos\\w*|symtom\\w*|sjukdom\\w*|störning\\w*'
		)
	},
	// Orsakspåståenden. Negationen "inte vad som orsakade något" är tillåten och matchas inte.
	{
		kind: 'causal',
		pattern: phrase(
			'på grund av|beror på|berodde på|leder till|ledde till|orsakar att|orsakade att|gör att du|gjorde att du|' +
				'får dig att|fick dig att|hjälper dig|hjälpte dig|förbättrar|förbättrade|botar|lindrar|minskar din|ökar din'
		)
	}
];

/** Första förbjudna formuleringen i texten, eller null när texten håller sig till samband. */
export function findForbiddenProgressPhrase(
	text: string
): { kind: ForbiddenPhraseKind; match: string } | null {
	for (const rule of FORBIDDEN_PROGRESS_PHRASES) {
		const match = text.match(rule.pattern);
		if (match) return { kind: rule.kind, match: match[0] };
	}
	return null;
}

export function isAllowedProgressText(text: string): boolean {
	return findForbiddenProgressPhrase(text) === null;
}
