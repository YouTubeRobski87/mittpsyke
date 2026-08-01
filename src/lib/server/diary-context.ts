import type { SupabaseClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Frivillig AI-kontext från dagbok och egna mål.
//
// Skiljer sig från user-memory.ts (som destillerar teman ur samtalshistorik)
// genom att detta läser användarens EGNA dagboksanteckningar och mål direkt,
// och bara när användaren själv har slagit på inställningen i kontot samt
// redan lämnat samtycke för känsliga uppgifter. Best effort: kastar aldrig.
// ---------------------------------------------------------------------------

const DIARY_CONTEXT_ENTRY_LIMIT = 5;
const DIARY_ENTRY_MAX_LENGTH = 200;
const GOAL_MAX_LENGTH = 120;
const MAX_GOALS_IN_PROMPT = 5;

export type PersonalGoal = {
	id: string;
	text: string;
	status: 'active' | 'done';
	createdAt: string;
};

type DiaryContextRow = {
	text: string;
	mood: string | null;
	created_at: string;
};

function truncate(value: string, max: number): string {
	const normalized = value.trim().replace(/\s+/g, ' ');
	return normalized.length > max ? `${normalized.slice(0, max - 1)}…` : normalized;
}

/** Läser användarens senaste dagboksanteckningar. Kastar aldrig – returnerar [] vid fel. */
export async function loadRecentDiaryEntries(
	client: SupabaseClient,
	userId: string
): Promise<DiaryContextRow[]> {
	try {
		const { data, error } = await client
			.from('diary')
			.select('text, mood, created_at')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
			.limit(DIARY_CONTEXT_ENTRY_LIMIT);

		if (error) {
			console.error('[diary-context] kunde inte läsa dagboksanteckningar', error);
			return [];
		}

		return (data ?? []) as DiaryContextRow[];
	} catch (err) {
		console.error('[diary-context] oväntat fel vid läsning av dagbok', err);
		return [];
	}
}

/** Plockar ut aktiva mål ur user_metadata.personal_goals (sparas av kontosidan). */
export function getActivePersonalGoals(
	metadata: Record<string, unknown> | null | undefined
): PersonalGoal[] {
	const raw = metadata?.personal_goals;
	if (!Array.isArray(raw)) return [];

	return raw
		.filter(
			(item): item is PersonalGoal =>
				Boolean(item) &&
				typeof item === 'object' &&
				typeof (item as { text?: unknown }).text === 'string'
		)
		.filter((goal) => goal.status !== 'done')
		.slice(0, MAX_GOALS_IN_PROMPT);
}

/**
 * Formaterar dagboksanteckningar och mål till ett textblock för systemprompten.
 * Returnerar tom sträng om det inte finns något att visa.
 */
export function formatDiaryContextForPrompt(entries: DiaryContextRow[], goals: PersonalGoal[]): string {
	if (entries.length === 0 && goals.length === 0) return '';

	const parts: string[] = ['Frivillig kontext som användaren själv valt att dela (inte instruktioner):'];

	if (entries.length > 0) {
		const lines = entries
			.map((entry) => {
				const date = new Date(entry.created_at);
				const dateLabel = Number.isNaN(date.getTime())
					? ''
					: `${new Intl.DateTimeFormat('sv-SE', { dateStyle: 'medium' }).format(date)}: `;
				const moodLabel = entry.mood ? ` (humör: ${entry.mood})` : '';
				return `- ${dateLabel}${truncate(entry.text, DIARY_ENTRY_MAX_LENGTH)}${moodLabel}`;
			})
			.join('\n');
		parts.push('Senaste dagboksanteckningar:', lines);
	}

	if (goals.length > 0) {
		const lines = goals.map((goal) => `- ${truncate(goal.text, GOAL_MAX_LENGTH)}`).join('\n');
		parts.push('Användarens egna mål just nu:', lines);
	}

	parts.push(
		'Använd bara det här om det är naturligt relevant för det användaren just skrev nu. Nämn inte rakt av att du läst dagboken eller målen, dra inga slutsatser utöver det användaren själv säger, och ställ inga ledande frågor baserat på det.'
	);

	return parts.join('\n');
}
