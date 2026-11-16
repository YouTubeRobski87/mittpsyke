export const HELPFUL_REMINDERS_KEY = 'progress_helpful_reminders';
export const HELPFUL_REMINDER_LABELS = {
	walk: 'Promenader',
	family: 'Tid med familjen',
	music: 'Musik',
	rest: 'Vila',
	nature: 'Tid i naturen',
	create: 'Att skapa något',
	talk: 'Att prata med någon'
} as const;

export type HelpfulReminder = keyof typeof HELPFUL_REMINDER_LABELS;
export type HelpfulReminderState = { item_id: HelpfulReminder; active: boolean; revision: number };

export const HELPFUL_REMINDER_OPTIONS = Object.keys(HELPFUL_REMINDER_LABELS) as HelpfulReminder[];

export function isHelpfulReminder(item: unknown): item is HelpfulReminder {
	return typeof item === 'string' && Object.hasOwn(HELPFUL_REMINDER_LABELS, item);
}

function isHelpfulReminderState(row: unknown): row is HelpfulReminderState {
	if (!row || typeof row !== 'object') return false;
	const { item_id, active, revision } = row as Partial<HelpfulReminderState>;
	return isHelpfulReminder(item_id) && typeof active === 'boolean' &&
		typeof revision === 'number' && Number.isSafeInteger(revision) && revision > 0;
}

export function readHelpfulReminderStates(value: unknown): HelpfulReminderState[] {
	if (!Array.isArray(value) || !value.every(isHelpfulReminderState)) throw new Error('Invalid reminder state');
	return value;
}

export function mergeHelpfulReminderStates(
	current: HelpfulReminderState[],
	incoming: HelpfulReminderState[]
): HelpfulReminderState[] {
	const rows = new Map(current.map((row) => [row.item_id, row]));
	for (const row of incoming) {
		if (row.revision > (rows.get(row.item_id)?.revision ?? 0)) rows.set(row.item_id, row);
	}
	return [...rows.values()];
}

export function activeHelpfulReminders(rows: HelpfulReminderState[]): HelpfulReminder[] {
	return HELPFUL_REMINDER_OPTIONS.filter((item) => rows.some((row) => row.item_id === item && row.active));
}