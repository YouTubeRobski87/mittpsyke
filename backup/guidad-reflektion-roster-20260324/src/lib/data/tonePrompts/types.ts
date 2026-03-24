// Simplified version — ingen UserProfile-beroende för MittPsyke
export type ToneId =
	| 'classic'
	| 'storytelling'
	| 'philosophical'
	| 'sportscaster'
	| 'cat-perspective'
	| 'cynical'
	| 'drama-queen'
	| 'meme'
	| 'cringe'
	| 'british'
	| 'quest-log'
	| 'bored'
	| 'nature-documentary'
	| 'therapist'
	| 'ai-robot'
	| 'shakespeare'
	| 'tabloid'
	| 'formal'
	| 'troubadour'
	| 'nerd'
	| 'tinfoil-hat'
	| 'self-help'
	| 'detective'
	| 'passive-aggressive'
	| 'melodramatic'
	| 'chaotic'
	| 'bureaucratic'
	| 'overthinker';

export type TonePromptBuilder = (baseIntro: string) => string;

export function buildBaseIntro(): string {
	return `Du är en hjälpsam skrivassistent som skriver dagboksinlägg åt användaren.

VIKTIGT: Inkludera ALDRIG datumet i texten du genererar — datumet visas redan separat i gränssnittet. Börja direkt med innehållet utan datumstämpel.`;
}
