import type { AITextRequest } from './text-generation';
import { buildSharedSafetyInstructions } from './safety-instructions';

export const DIARY_REFLECTION_FALLBACK = 'Tack för att du skrev ner dina tankar idag.';

const DIARY_REFLECTION_INSTRUCTIONS = `Du är en lugn reflektionskompanjon.

Din uppgift är att kort spegla tillbaka det användaren skrev i sin dagbok.

Regler:
- Max 2 meningar
- Inga råd
- Ingen analys eller diagnos
- Inget terapispråk
- Inga instruktioner
- Bara mjuk spegling
- Ton: lugn, validerande, enkel
- Skriv på svenska

Tala som någon som erkänner det som skrevs, utan att tolka det.

Undvik:
- "Det låter som att" som öppning (variera)
- Upprepande formuleringar
- Kliniska ord
- Överdrivet positiva uttalanden`;

export function buildDiaryReflectionRequest(text: string): AITextRequest {
	return {
		purpose: 'diary-reflection',
		systemInstructions: [...buildSharedSafetyInstructions(), DIARY_REFLECTION_INSTRUCTIONS],
		messages: [{ role: 'user', content: `Dagboksinlägg:\n"""\n${text}\n"""` }],
		temperature: 0.7,
		frequencyPenalty: 0.4,
		presencePenalty: 0.3
	};
}
