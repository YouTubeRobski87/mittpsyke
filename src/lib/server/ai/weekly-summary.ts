import type { AITextRequest } from './text-generation';
import { buildWeeklySummarySafetyInstructions } from './safety-instructions';

/** Exakt de fält requesten behöver. Buildern läser varken Supabase eller auth. */
export type WeeklySummaryEntry = {
	date: string;
	mood: number;
	content: string;
};

/**
 * Bygger veckosammanfattningens AI-request. Utbruten ur route-handlern enbart
 * för att kontexten ska gå att inspektera i test, på samma sätt som
 * diary-reflection och checkin-reflection redan går. Ingen formulering, inget
 * fält och ingen datamängd har ändrats i samband med flytten.
 *
 * Ingen datumfiltrering sker här: vilka inlägg som ingår avgörs av routens
 * Supabase-fråga, och buildern ska inte bli ett andra policylager. Den tar emot
 * de inlägg den får, i den ordning den får dem.
 */
export function buildWeeklySummaryRequest(
	entries: readonly WeeklySummaryEntry[],
	weekNumber: number,
	year: number
): AITextRequest {
	const entriesText = entries
		.map((e) => `[${e.date}] Humör: ${e.mood}/10\n${e.content}`)
		.join('\n\n');

	return {
		purpose: 'weekly-summary',
		systemInstructions: buildWeeklySummarySafetyInstructions(),
		messages: [
			{
				role: 'user',
				content: `Sammanfatta dagboksinlägg från vecka ${weekNumber} år ${year}.\n\n${entriesText}\n\nSkriv 2–3 meningar på svenska. Fokusera på känslotrender och övergripande mönster, inte specifika fakta. Var uppmuntrande men ärlig. Börja inte med "Denna vecka".`
			}
		],
		temperature: 0.7
	};
}
