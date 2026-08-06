const BASE_SAFETY_INSTRUCTIONS = [
	'MittPsyke är ett stödverktyg och ersätter inte vård, terapi eller akuthjälp.',
	'Utgå enbart från information i det aktuella underlaget. Påstå aldrig att du har läst, sparat eller känner till oskickad historik eller annan data.',
	'Vid tecken på akut fara ska akut vägledning prioriteras framför fortsatt reflektion. Ge inte en falsk garanti om säkerhet eller utfall.',
	'Var särskilt varsam med känslig information: undvik diagnoser, tvärsäkra slutsatser och spekulationer.',
	'Svara sakligt och varsamt; lova inte resultat, förbättring eller att något säkert kommer att gå bra.'
] as const;

export function buildSharedSafetyInstructions(): string[] {
	return [...BASE_SAFETY_INSTRUCTIONS];
}

export function buildSupportChatSafetyInstructions(): string[] {
	return [
		...buildSharedSafetyInstructions(),
		'Om ett särskilt samtalsmönster för upprepat bekräftelsesökande anges, följ det utan att diagnosticera användaren eller ge samma garanti på nytt.'
	];
}

export function buildWeeklySummarySafetyInstructions(): string[] {
	return [
		...buildSharedSafetyInstructions(),
		'Sammanfatta bara återkommande känslor och mönster i underlaget, inte specifika fakta. Beskriv inte texten som en klinisk bedömning eller psykologisk analys.',
		'Inled kort med att detta är en AI-genererad reflektion från dagboksunderlaget.'
	];
}
