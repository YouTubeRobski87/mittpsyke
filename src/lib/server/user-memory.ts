import type { SupabaseClient } from '@supabase/supabase-js';
import { generateAIText } from '$lib/server/ai/text-generation';

// ---------------------------------------------------------------------------
// Användarminne – korta återkommande teman för kontinuitet mellan samtal.
//
// Viktiga principer:
// - Vi lagrar aldrig hela samtal, bara korta distillerade teman.
// - Fokus på kontinuitet, INTE personlig profilering eller diagnostik.
// - Max 10 minnespunkter per användare.
// - All läsning/skrivning sker per användare via RLS (klienten bär användarens token).
// ---------------------------------------------------------------------------

const MEMORY_TABLE = 'user_memories';

/** Hårt tak på antal minnespunkter per användare. */
export const MAX_USER_MEMORIES = 10;

/** Max längd per minnespunkt (tecken) – håller dem korta och temabaserade. */
const MEMORY_CONTENT_MAX_LENGTH = 240;

/** Kör inte minnesuppdatering förrän användaren skrivit minst så här många turer. */
const MIN_USER_TURNS_FOR_MEMORY = 3;

/** Uppdatera minnet var N:te användartur (3, 6, 9 ...) för att hålla kostnaden nere. */
const MEMORY_REFRESH_INTERVAL = 3;

/** Hur många av de senaste meddelandena som tas med när minnet sammanfattas. */
const MEMORY_CONTEXT_MESSAGES = 16;

export type MemoryHistoryMessage = {
	role: 'user' | 'assistant';
	content: string;
};

export type UserMemory = {
	id: string;
	content: string;
	created_at: string;
};

const MEMORY_SYSTEM_PROMPT = `
Du underhåller ett kort minne för ett empatiskt samtalsstöd på svenska.

Syftet är KONTINUITET mellan samtal – inte analys, inte profilering, inte diagnostik.

Du får en lista med befintliga teman och den senaste delen av ett samtal.
Returnera en uppdaterad, hopslagen lista med korta teman.

Regler:
- Skriv på svenska.
- Max 10 punkter totalt.
- Varje punkt är kort (en mening, gärna under 20 ord).
- Fånga återkommande ämnen, känslor eller saker användaren ofta återkommer till.
- Slå ihop med befintliga teman istället för att duplicera. Behåll det som fortfarande är relevant.
- Skriv neutralt och beskrivande, inte värderande.
- Inga diagnoser, inga antaganden om orsaker, ingen tolkning utöver det användaren själv uttryckt.
- Spara INTE känsliga detaljer som namn, exakta platser, hälsouppgifter eller akut självskade-/krisinnehåll.
- Om inget meningsfullt tema finns: returnera en tom lista.

Svara ENDAST med giltig JSON i formatet:
{"memories": ["tema 1", "tema 2"]}
`.trim();

/**
 * Avgör om minnet ska uppdateras denna tur. Throttlas för att undvika
 * onödiga AI-anrop på varje meddelande.
 */
export function shouldRefreshUserMemories(userTurns: number): boolean {
	return userTurns >= MIN_USER_TURNS_FOR_MEMORY && userTurns % MEMORY_REFRESH_INTERVAL === 0;
}

/** Läser användarens minnespunkter. Kastar aldrig – returnerar [] vid fel. */
export async function loadUserMemories(
	client: SupabaseClient,
	userId: string
): Promise<UserMemory[]> {
	try {
		const { data, error } = await client
			.from(MEMORY_TABLE)
			.select('id, content, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(MAX_USER_MEMORIES);

		if (error) {
			console.error('[memory] kunde inte läsa minnen', error);
			return [];
		}

		return (data ?? []) as UserMemory[];
	} catch (err) {
		console.error('[memory] oväntat fel vid läsning av minnen', err);
		return [];
	}
}

/**
 * Formaterar minnen till ett textblock som läggs till i systemprompten.
 * Returnerar tom sträng om det inte finns några minnen.
 */
export function formatMemoriesForPrompt(memories: UserMemory[]): string {
	if (memories.length === 0) return '';

	const lines = memories.map((memory) => `- ${memory.content}`).join('\n');

	return [
		'Bakgrund för kontinuitet (inte för analys eller profilering):',
		'Korta teman från tidigare samtal med samma användare:',
		lines,
		'Använd detta bara om det känns naturligt och relevant. Nämn inte att du minns eller har sparat något, ställ inga ledande frågor utifrån det och dra inga slutsatser utöver det användaren själv säger.'
	].join('\n');
}

function sanitizeMemoryContent(value: unknown): string | null {
	if (typeof value !== 'string') return null;

	const normalized = value.trim().replace(/\s+/g, ' ');
	if (!normalized) return null;

	return normalized.slice(0, MEMORY_CONTENT_MAX_LENGTH);
}

function parseMemoryList(raw: string): string[] {
	let parsed: unknown;

	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}

	if (!parsed || typeof parsed !== 'object') return [];

	const list = (parsed as { memories?: unknown }).memories;
	if (!Array.isArray(list)) return [];

	const seen = new Set<string>();
	const result: string[] = [];

	for (const item of list) {
		const content = sanitizeMemoryContent(item);
		if (!content) continue;

		const key = content.toLowerCase();
		if (seen.has(key)) continue;

		seen.add(key);
		result.push(content);

		if (result.length >= MAX_USER_MEMORIES) break;
	}

	return result;
}

/**
 * Uppdaterar användarens minne utifrån de senaste meddelandena.
 * Best effort: ska aldrig blockera eller bryta chattsvaret. Anropas
 * fire-and-forget från chatt-endpointen.
 */
export async function refreshUserMemories(params: {
	client: SupabaseClient;
	userId: string;
	history: MemoryHistoryMessage[];
}): Promise<void> {
	const { client, userId, history } = params;

	const userTurns = history.filter((message) => message.role === 'user').length;
	if (userTurns < MIN_USER_TURNS_FOR_MEMORY) return;

	const existing = await loadUserMemories(client, userId);
	const existingBlock =
		existing.length > 0
			? existing.map((memory, index) => `${index + 1}. ${memory.content}`).join('\n')
			: '(inga sparade teman ännu)';

	const transcript = history
		.slice(-MEMORY_CONTEXT_MESSAGES)
		.map((message) => `${message.role === 'user' ? 'Användare' : 'Stöd'}: ${message.content}`)
		.join('\n');

	let raw: string;
	try {
		const result = await generateAIText({
			purpose: 'user-memory',
			temperature: 0.2,
			outputFormat: 'json_object',
			systemInstructions: [MEMORY_SYSTEM_PROMPT],
			messages: [
				{
					role: 'user',
					content: `Befintliga teman:\n${existingBlock}\n\nSenaste delen av samtalet:\n${transcript}\n\nReturnera en uppdaterad lista enligt formatet {"memories": ["..."]}.`
				}
			]
		});
		raw = result.text;
	} catch {
		console.error('[memory] AI-anrop för minnessammanfattning misslyckades');
		return;
	}

	const memories = parseMemoryList(raw);
	if (memories.length === 0) return;

	// Ersätt hela uppsättningen – vi lagrar aldrig fler än MAX_USER_MEMORIES korta teman.
	const { error: deleteError } = await client.from(MEMORY_TABLE).delete().eq('user_id', userId);
	if (deleteError) {
		console.error('[memory] kunde inte rensa gamla minnen', deleteError);
		return;
	}

	const rows = memories.map((content) => ({ user_id: userId, content }));
	const { error: insertError } = await client.from(MEMORY_TABLE).insert(rows);
	if (insertError) {
		console.error('[memory] kunde inte spara nya minnen', insertError);
	}
}
