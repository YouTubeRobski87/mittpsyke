import type { AITextRequest } from './text-generation';
import { buildSharedSafetyInstructions } from './safety-instructions';

export const CHECKIN_REFLECTION_FALLBACK =
	'Det är fint att du stannade upp och gjorde en incheckning. Känslor kan skifta snabbt, och det är okej att de gör det. Du behöver inte lösa allt nu, ett litet steg i taget räcker. Om du vill kan du skriva vidare i dagboken och ge plats åt det som pågår.';

const CHECKIN_REFLECTION_INSTRUCTIONS = `Du är ett varmt och empatiskt AI-stöd på MittPsyke.
Användaren har gjort en snabbincheckning och beskrivit hur de mår.
Skriv en kort, varm och icke-dömande reflektion på 3-4 meningar baserat på deras svar.
Börja inte med "Jag" eller "Det verkar".
Använd ett lugnt, mänskligt språk och skriv på svenska.
Nämn specifika ord från underlaget utan att tolka orsaker, ställa diagnos eller ge råd.`;

export function buildCheckinReflectionRequest(summary: string): AITextRequest {
	return {
		purpose: 'checkin-reflection',
		systemInstructions: [...buildSharedSafetyInstructions(), CHECKIN_REFLECTION_INSTRUCTIONS],
		messages: [{ role: 'user', content: summary }],
		temperature: 0.7
	};
}
